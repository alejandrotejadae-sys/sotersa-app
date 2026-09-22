"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { exigirPerfil } from "@/lib/sesion";
import { servicio } from "@/lib/servicios";
import type { TipoTurno } from "@/lib/tipos";
import { puestosQuePuedeProgramar, type PuestoProgramable } from "./permisos";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoCuadrante = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  detalle?: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MES = /^\d{4}-\d{2}$/;

/** Ecuador no usa horario de verano: el desfase es fijo. */
const ZONA = "-05:00";
const MS_DIA = 24 * 60 * 60 * 1000;
const MS_HORA = 60 * 60 * 1000;

/**
 * Genera el cuadrante de uno o de todos los puestos, por mes completo o por
 * rango de dias.
 *
 * Por qué existe: un puesto de 24 h necesita 2 turnos diarios. Doce puestos
 * durante un mes son cerca de 700 turnos. Cargarlos uno por uno no lo hace
 * nadie, y un cuadrante que no se carga deja la app vacía.
 *
 * Lo que NO hace, a propósito:
 *   - No inventa quién cubre los días libres. Eso es trabajo del saca francos
 *     y depende de quién libra esa semana; se asigna a mano o por Excel.
 *   - No pisa turnos que ya existan. Si un día ya está cubierto, lo salta y lo
 *     informa, en vez de duplicar la cobertura.
 */
export async function generarCuadrante(_: EstadoCuadrante, formData: FormData): Promise<EstadoCuadrante> {
  const puestoId = String(formData.get("puesto_id") ?? "");
  const modo = String(formData.get("modo") ?? "mes");
  const mes = String(formData.get("mes") ?? "");
  const desdeRango = String(formData.get("desde") ?? "");
  const diasRango = Number(formData.get("dias") ?? 0);
  const horaInicio = String(formData.get("hora_inicio") ?? "07:00");
  const rotarSemanal = formData.get("rotar") === "on";

  if (puestoId !== "todos" && !UUID.test(puestoId)) return err("Selecciona el puesto.");
  if (!/^\d{2}:\d{2}$/.test(horaInicio)) return err("Revisa la hora de inicio.");

  let desde: string;
  let dias: number;
  if (modo === "mes") {
    if (!MES.test(mes)) return err("Selecciona el mes.");
    const [a, m] = mes.split("-").map(Number);
    desde = `${mes}-01`;
    dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  } else {
    if (!FECHA.test(desdeRango)) return err("Selecciona la fecha de inicio.");
    if (!Number.isInteger(diasRango) || diasRango < 1 || diasRango > 31) return err("Los días van de 1 a 31.");
    desde = desdeRango;
    dias = diasRango;
  }

  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const programables = await puestosQuePuedeProgramar(supabase, perfil);
  const objetivo = puestoId === "todos" ? programables.filter((p) => p.tipo_servicio !== "custodia_armada") : programables.filter((p) => p.id === puestoId);
  if (objetivo.length === 0) return err(puestoId === "todos" ? "No tienes puestos que programar." : perfil.rol === "supervisor" ? "Ese puesto no está entre los que supervisas." : "Ese puesto ya no está activo.");

  let totalCreados = 0;
  const detalle: string[] = [];
  for (const puesto of objetivo) {
    const r = await generarParaPuesto(supabase, puesto, desde, dias, horaInicio, rotarSemanal);
    totalCreados += r.creados;
    detalle.push(`${puesto.empresa} ${puesto.codigo}: ${r.mensaje}`);
  }

  for (const ruta of ["/operacion/turnos", "/operacion/turnos/mes", "/operacion/dotacion", "/admin", "/supervisor", "/guardia", "/portal"]) revalidatePath(ruta);

  const titulo = modo === "mes" ? nombreMes(mes) : `${dias} días desde ${desde}`;
  if (totalCreados === 0) return { tipo: "error", mensaje: `No se creó ningún turno para ${titulo}.`, detalle };
  return { tipo: "exito", mensaje: `${totalCreados} turnos creados para ${titulo}${objetivo.length > 1 ? ` en ${objetivo.length} puestos` : ""}.`, detalle: objetivo.length > 1 ? detalle : [] };
}

type Nuevo = { puesto_id: string; guardia_id: string; tipo: TipoTurno; inicio_programado: string; fin_programado: string; estado: "abierto" };

async function generarParaPuesto(supabase: SupabaseClient, puesto: PuestoProgramable, desde: string, dias: number, horaInicio: string, rotarSemanal: boolean): Promise<{ creados: number; mensaje: string }> {
  const modalidad = servicio(puesto.tipo_servicio);
  if (modalidad.requiereRuta) return { creados: 0, mensaje: "las custodias se programan a mano, por ruta." };

  const { data: agentes } = await supabase.from("guardias").select("id,nombre").eq("puesto_habitual_id", puesto.id).eq("activo", true).order("nombre");
  if (!agentes || agentes.length === 0) return { creados: 0, mensaje: "sin agentes fijos asignados (Dotación)." };
  if (agentes.length < modalidad.fijos) return { creados: 0, mensaje: `necesita ${modalidad.fijos} fijos y tiene ${agentes.length} (Dotación).` };

  const nuevos: Nuevo[] = [];
  const inicioBase = new Date(`${desde}T${horaInicio}:00${ZONA}`);
  if (Number.isNaN(inicioBase.getTime())) return { creados: 0, mensaje: "fecha u hora inválida." };
  let saltadosDomingo = 0;

  for (let d = 0; d < dias; d++) {
    const arranque = new Date(inicioBase.getTime() + d * MS_DIA);
    if (puesto.tipo_servicio === "punto_12_l_s") {
      const diaEc = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Guayaquil" }).format(arranque);
      if (diaEc === "Sun") { saltadosDomingo++; continue; }
    }
    const semana = Math.floor(d / 7);
    const desplazamiento = rotarSemanal ? semana % agentes.length : 0;
    if (modalidad.fijos >= 2) {
      for (let franja = 0; franja < 2; franja++) {
        const agente = agentes[(franja + desplazamiento) % agentes.length];
        const inicio = new Date(arranque.getTime() + franja * 12 * MS_HORA);
        nuevos.push({ puesto_id: puesto.id, guardia_id: agente.id, tipo: franja === 0 ? "fijo_dia" : "fijo_noche", inicio_programado: inicio.toISOString(), fin_programado: new Date(inicio.getTime() + 12 * MS_HORA).toISOString(), estado: "abierto" });
      }
    } else {
      const agente = agentes[desplazamiento % agentes.length];
      nuevos.push({ puesto_id: puesto.id, guardia_id: agente.id, tipo: puesto.tipo_servicio === "punto_12_nocturno" ? "fijo_noche" : "fijo_dia", inicio_programado: arranque.toISOString(), fin_programado: new Date(arranque.getTime() + modalidad.horas * MS_HORA).toISOString(), estado: "abierto" });
    }
  }
  if (nuevos.length === 0) return { creados: 0, mensaje: "no hay días que programar en ese rango." };

  // El cruce se comprueba con la llave de servicio: un supervisor solo ve los
  // turnos de sus puestos, pero el agente puede tener turno en un puesto de
  // otro supervisor. Sin esto se podria programar dos veces a la misma persona.
  const primero = nuevos[0].inicio_programado;
  const ultimo = nuevos[nuevos.length - 1].fin_programado;
  const { data: existentes } = await crearClienteAdministrador().from("turnos").select("guardia_id,puesto_id,inicio_programado,fin_programado").neq("estado", "ausente").lt("inicio_programado", ultimo).gt("fin_programado", primero);
  const choca = (n: Nuevo) => (existentes ?? []).some((e) => (e.guardia_id === n.guardia_id || e.puesto_id === n.puesto_id) && e.inicio_programado < n.fin_programado && e.fin_programado > n.inicio_programado);
  const aInsertar = nuevos.filter((n) => !choca(n));
  const saltados = nuevos.length - aInsertar.length;
  if (aInsertar.length === 0) return { creados: 0, mensaje: `los ${nuevos.length} turnos ya estaban cubiertos.` };

  const { error } = await supabase.from("turnos").insert(aInsertar);
  if (error) return { creados: 0, mensaje: "la base de datos rechazó el cuadrante." };

  const notas: string[] = [];
  if (saltados > 0) notas.push(`${saltados} ya estaban cubiertos`);
  if (saltadosDomingo > 0) notas.push(`${saltadosDomingo} domingos sin cobertura`);
  if (modalidad.requiereRelevo) notas.push("falta el saca francos para los días libres");
  return { creados: aInsertar.length, mensaje: `${aInsertar.length} turnos creados${notas.length ? ` · ${notas.join(" · ")}` : ""}.` };
}

function nombreMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 1)));
}

function err(mensaje: string): EstadoCuadrante {
  return { tipo: "error", mensaje };
}
