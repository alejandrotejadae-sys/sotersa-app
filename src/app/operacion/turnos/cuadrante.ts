"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { servicio } from "@/lib/servicios";
import type { TipoTurno } from "@/lib/tipos";

export type EstadoCuadrante = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Ecuador no usa horario de verano: el desfase es fijo. */
const ZONA = "-05:00";

/**
 * Genera el cuadrante de un puesto para varios días de una sola vez.
 *
 * Por qué existe: un puesto de 24 h necesita 2 turnos diarios. Doce puestos
 * durante un mes son cerca de 700 turnos. Cargarlos uno por uno no lo hace
 * nadie, y un cuadrante que no se carga deja la app vacía — que es
 * exactamente donde estaba.
 *
 * Lo que NO hace, a propósito:
 *   - No inventa quién cubre los días libres. Eso es trabajo del saca francos
 *     y depende de quién libra esa semana; se asigna a mano.
 *   - No pisa turnos que ya existan. Si un día ya está cubierto, lo salta y lo
 *     informa, en vez de duplicar la cobertura.
 */
export async function generarCuadrante(
  _: EstadoCuadrante,
  formData: FormData,
): Promise<EstadoCuadrante> {
  const puestoId = String(formData.get("puesto_id") ?? "");
  const desde = String(formData.get("desde") ?? "");
  const dias = Number(formData.get("dias") ?? 0);
  const horaInicio = String(formData.get("hora_inicio") ?? "07:00");
  const rotarSemanal = formData.get("rotar") === "on";

  if (!UUID.test(puestoId)) return err("Selecciona el puesto.");
  if (!FECHA.test(desde)) return err("Selecciona la fecha de inicio.");
  if (!Number.isInteger(dias) || dias < 1 || dias > 31) {
    return err("Los días van de 1 a 31.");
  }
  if (!/^\d{2}:\d{2}$/.test(horaInicio)) return err("Revisa la hora de inicio.");

  const { supabase } = await exigirPerfil(["admin"]);

  const { data: puesto } = await supabase
    .from("puestos")
    .select("id,codigo,nombre,tipo_servicio,empresa_cliente_id")
    .eq("id", puestoId)
    .eq("activo", true)
    .maybeSingle();
  if (!puesto) return err("Ese puesto ya no está activo.");

  const modalidad = servicio(puesto.tipo_servicio);

  // Los fijos del puesto. Sin ellos no hay a quién programar.
  const { data: agentes } = await supabase
    .from("guardias")
    .select("id,nombre")
    .eq("puesto_habitual_id", puestoId)
    .eq("activo", true)
    .order("nombre");

  if (!agentes || agentes.length === 0) {
    return err(
      `${puesto.codigo} no tiene agentes asignados. Asígnalos primero en Dotación.`,
    );
  }
  if (agentes.length < modalidad.fijos) {
    return err(
      `${puesto.codigo} necesita ${modalidad.fijos} agente(s) fijo(s) y tiene ${agentes.length}. Complétalo en Dotación.`,
    );
  }

  // --- Armar los turnos ------------------------------------------------------
  type Nuevo = {
    puesto_id: string;
    guardia_id: string;
    tipo: TipoTurno;
    inicio_programado: string;
    fin_programado: string;
    estado: "programado";
  };

  const nuevos: Nuevo[] = [];
  const inicioBase = new Date(`${desde}T${horaInicio}:00${ZONA}`);
  if (Number.isNaN(inicioBase.getTime())) return err("Fecha u hora inválida.");

  const MS_DIA = 24 * 60 * 60 * 1000;
  const MS_HORA = 60 * 60 * 1000;
  let saltadosDomingo = 0;

  for (let d = 0; d < dias; d++) {
    const arranque = new Date(inicioBase.getTime() + d * MS_DIA);

    // Lunes a sábado: el domingo no se cubre.
    if (puesto.tipo_servicio === "punto_12_l_s") {
      // getDay() sobre la hora local del servidor no sirve: se calcula el día
      // en Ecuador, que es el que importa para el cuadrante.
      const diaEc = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "America/Guayaquil",
      }).format(arranque);
      if (diaEc === "Sun") {
        saltadosDomingo++;
        continue;
      }
    }

    // Quién va esa semana. Con rotación, los dos fijos intercambian día y
    // noche cada semana; sin ella, cada uno mantiene su franja.
    const semana = Math.floor(d / 7);
    const desplazamiento = rotarSemanal ? semana % agentes.length : 0;

    if (modalidad.fijos >= 2) {
      // 24 h = dos turnos de 12 h que se relevan.
      for (let franja = 0; franja < 2; franja++) {
        const agente = agentes[(franja + desplazamiento) % agentes.length];
        const inicio = new Date(arranque.getTime() + franja * 12 * MS_HORA);
        nuevos.push({
          puesto_id: puestoId,
          guardia_id: agente.id,
          tipo: franja === 0 ? "fijo_dia" : "fijo_noche",
          inicio_programado: inicio.toISOString(),
          fin_programado: new Date(inicio.getTime() + 12 * MS_HORA).toISOString(),
          estado: "programado",
        });
      }
    } else {
      const agente = agentes[desplazamiento % agentes.length];
      nuevos.push({
        puesto_id: puestoId,
        guardia_id: agente.id,
        tipo: puesto.tipo_servicio === "punto_12_nocturno" ? "fijo_noche" : "fijo_dia",
        inicio_programado: arranque.toISOString(),
        fin_programado: new Date(
          arranque.getTime() + modalidad.horas * MS_HORA,
        ).toISOString(),
        estado: "programado",
      });
    }
  }

  if (nuevos.length === 0) return err("No hay días que programar en ese rango.");

  // --- No duplicar lo que ya existe -----------------------------------------
  const primero = nuevos[0].inicio_programado;
  const ultimo = nuevos[nuevos.length - 1].fin_programado;

  const { data: existentes } = await supabase
    .from("turnos")
    .select("guardia_id,inicio_programado,fin_programado")
    .neq("estado", "ausente")
    .lt("inicio_programado", ultimo)
    .gt("fin_programado", primero);

  const choca = (n: Nuevo) =>
    (existentes ?? []).some(
      (e) =>
        e.guardia_id === n.guardia_id &&
        e.inicio_programado < n.fin_programado &&
        e.fin_programado > n.inicio_programado,
    );

  const aInsertar = nuevos.filter((n) => !choca(n));
  const saltados = nuevos.length - aInsertar.length;

  if (aInsertar.length === 0) {
    return err(
      `Esos ${nuevos.length} turnos ya estaban cubiertos. No se duplicó nada.`,
    );
  }

  const { error } = await supabase.from("turnos").insert(aInsertar);
  if (error) {
    return err("No fue posible guardar el cuadrante. Revisa los datos.");
  }

  for (const ruta of [
    "/operacion/turnos",
    "/operacion/dotacion",
    "/admin",
    "/supervisor",
    "/guardia",
  ]) {
    revalidatePath(ruta);
  }

  const notas: string[] = [];
  if (saltados > 0) notas.push(`${saltados} ya estaban cubiertos`);
  if (saltadosDomingo > 0) notas.push(`${saltadosDomingo} domingos sin cobertura`);
  if (modalidad.requiereRelevo) {
    notas.push("falta asignar el saca francos para los días libres");
  }

  return {
    tipo: "exito",
    mensaje:
      `${aInsertar.length} turnos creados en ${puesto.codigo}` +
      (notas.length ? ` · ${notas.join(" · ")}.` : "."),
  };
}

function err(mensaje: string): EstadoCuadrante {
  return { tipo: "error", mensaje };
}
