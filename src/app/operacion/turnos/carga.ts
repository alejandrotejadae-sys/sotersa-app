"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import {
  fechaDeSerie,
  horaDeFraccion,
  leerCsv,
  leerLibro,
  type Hoja,
} from "@/lib/xlsx";
import type { TipoTurno } from "@/lib/tipos";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import {
  convertirCuadroMensual,
  elegirHojaMensual,
  type TurnoImportado,
} from "./cuadro-mensual";
import { puestosQuePuedeProgramar } from "./permisos";

export type EstadoCarga = {
  tipo: "inicial" | "error" | "vista_previa" | "exito";
  mensaje: string;
  errores?: string[];
  resumen?: {
    creados: number;
    saltados: number;
    filas: number;
    libres?: number;
    bloques?: number;
    ajustes?: number;
    hoja?: string;
  };
};

const ZONA = "-05:00";
const MS_HORA = 3600 * 1000;
const MAX_TURNOS = 1500;

/** Admite el cuadro mensual operativo y la plantilla técnica por filas. */
export async function cargarTurnos(
  _: EstadoCarga,
  formData: FormData,
): Promise<EstadoCarga> {
  const archivo = formData.get("archivo");
  const accion = formData.get("accion") === "validar" ? "validar" : "cargar";
  if (!(archivo instanceof File) || archivo.size === 0)
    return { tipo: "error", mensaje: "Elige un archivo .xlsx o .csv." };
  if (archivo.size > 3 * 1024 * 1024)
    return { tipo: "error", mensaje: "El archivo supera 3 MB." };

  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  let filas: string[][] | null = null;
  let hojaMensual: Hoja | null = null;

  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    if (/\.csv$/i.test(archivo.name)) filas = leerCsv(buffer.toString("utf8"));
    else {
      const hojas = leerLibro(buffer);
      hojaMensual = elegirHojaMensual(hojas);
      if (!hojaMensual) {
        const hoja =
          hojas.find((h) => h.filas.some((f) => f.some(Boolean))) ?? hojas[0];
        if (!hoja)
          return {
            tipo: "error",
            mensaje: "El archivo no tiene hojas con datos.",
          };
        filas = hoja.filas;
      }
    }
  } catch {
    return {
      tipo: "error",
      mensaje:
        "No pude leer el archivo. Guárdalo como .xlsx (Excel) o .csv y vuelve a intentar.",
    };
  }

  const [{ data: guardias }, puestos] = await Promise.all([
    supabase.from("guardias").select("id,nombre,cedula").eq("activo", true),
    puestosQuePuedeProgramar(supabase, perfil),
  ]);

  let nuevos: TurnoImportado[] = [];
  let origen: NonNullable<EstadoCarga["resumen"]> = {
    creados: 0,
    saltados: 0,
    filas: 0,
  };

  if (hojaMensual) {
    const resultado = convertirCuadroMensual(
      hojaMensual,
      guardias ?? [],
      puestos,
    );
    if (resultado.errores.length) {
      return {
        tipo: "error",
        mensaje: `No se cargó nada: encontré ${resultado.errores.length} problema${resultado.errores.length === 1 ? "" : "s"} en la hoja «${resultado.hoja}».`,
        errores: resultado.errores.slice(0, 40),
      };
    }
    nuevos = resultado.turnos;
    origen = {
      creados: 0,
      saltados: 0,
      filas: nuevos.length,
      hoja: resultado.hoja,
      libres: resultado.libres,
      bloques: resultado.bloques,
      ajustes: resultado.ajustes,
    };
  } else {
    filas = (filas ?? []).filter((f) => f.some((c) => String(c ?? "").trim()));
    if (filas.length < 2)
      return {
        tipo: "error",
        mensaje:
          "El archivo no tiene filas de turnos (solo la cabecera o nada).",
      };

    const cab = filas[0].map(normalizar);
    const col = (...nombres: string[]) => {
      for (const n of nombres) {
        const i = cab.findIndex((c) => c === n || c.startsWith(n));
        if (i >= 0) return i;
      }
      return -1;
    };
    const iCedula = col("cedula", "agente", "guardia", "nombre");
    const iPuesto = col("puesto", "codigo");
    const iCliente = col("cliente", "empresa");
    const iFecha = col("fecha", "dia");
    const iInicio = col("inicio", "hora inicio", "entrada", "desde");
    const iFin = col("fin", "hora fin", "salida", "hasta");
    const iTipo = col("tipo", "turno");
    const faltan = (
      [
        ["Cédula", iCedula],
        ["Puesto", iPuesto],
        ["Fecha", iFecha],
        ["Inicio", iInicio],
        ["Fin", iFin],
      ] as [string, number][]
    )
      .filter(([, i]) => i < 0)
      .map(([n]) => n);
    if (faltan.length)
      return {
        tipo: "error",
        mensaje: `No reconozco este formato. Faltan columnas: ${faltan.join(", ")}. Puedes subir el cuadro mensual de SOTERSA o descargar la plantilla técnica.`,
      };

    const porCedula = new Map(
      (guardias ?? [])
        .filter((g) => g.cedula)
        .map((g) => [g.cedula!.replace(/\D/g, ""), g]),
    );
    const porNombre = new Map(
      (guardias ?? []).map((g) => [normalizar(g.nombre), g]),
    );
    const errores: string[] = [];

    for (let r = 1; r < filas.length; r++) {
      const f = filas[r];
      const n = r + 1;
      const celda = (i: number) => (i >= 0 ? String(f[i] ?? "").trim() : "");
      const claveAgente = celda(iCedula);
      const agente =
        porCedula.get(claveAgente.replace(/\D/g, "")) ??
        porNombre.get(normalizar(claveAgente));
      if (!agente) {
        errores.push(
          `Fila ${n}: no encuentro al agente «${claveAgente}» (cédula o nombre exacto, y debe estar activo).`,
        );
        continue;
      }

      const codigo = normalizar(celda(iPuesto)).toUpperCase();
      const cliente = normalizar(celda(iCliente));
      const candidatos = puestos.filter(
        (p) =>
          normalizar(p.codigo).toUpperCase() === codigo &&
          (!cliente ||
            normalizar(p.empresa).includes(cliente) ||
            cliente.includes(normalizar(p.empresa))),
      );
      if (candidatos.length === 0) {
        errores.push(
          `Fila ${n}: no encuentro el puesto «${celda(iPuesto)}»${cliente ? ` de «${celda(iCliente)}»` : ""}${perfil.rol === "supervisor" ? " entre los que supervisas" : ""}.`,
        );
        continue;
      }
      if (candidatos.length > 1) {
        errores.push(
          `Fila ${n}: el puesto ${celda(iPuesto)} existe en ${candidatos.length} clientes; llena la columna Cliente.`,
        );
        continue;
      }
      const puesto = candidatos[0];

      const fecha = interpretarFecha(celda(iFecha));
      if (!fecha) {
        errores.push(
          `Fila ${n}: fecha «${celda(iFecha)}» no válida (usa AAAA-MM-DD o DD/MM/AAAA).`,
        );
        continue;
      }
      const hInicio = interpretarHora(celda(iInicio));
      const hFin = interpretarHora(celda(iFin));
      if (!hInicio || !hFin) {
        errores.push(
          `Fila ${n}: hora «${!hInicio ? celda(iInicio) : celda(iFin)}» no válida (usa HH:MM).`,
        );
        continue;
      }

      const inicio = new Date(`${fecha}T${hInicio}:00${ZONA}`);
      let fin = new Date(`${fecha}T${hFin}:00${ZONA}`);
      if (fin <= inicio) fin = new Date(fin.getTime() + 24 * MS_HORA);
      if (fin.getTime() - inicio.getTime() > 24 * MS_HORA) {
        errores.push(`Fila ${n}: el turno dura más de 24 horas.`);
        continue;
      }
      const tipoTexto = normalizar(celda(iTipo));
      const tipo: TipoTurno =
        tipoTexto.includes("saca") || tipoTexto.includes("franco")
          ? "saca_francos"
          : tipoTexto.includes("superv")
            ? "supervision"
            : tipoTexto.includes("noche")
              ? "fijo_noche"
              : tipoTexto.includes("dia")
                ? "fijo_dia"
                : Number(hInicio.slice(0, 2)) >= 17 ||
                    Number(hInicio.slice(0, 2)) < 5
                  ? "fijo_noche"
                  : "fijo_dia";
      nuevos.push({
        fila: n,
        puesto_id: puesto.id,
        guardia_id: agente.id,
        tipo,
        inicio_programado: inicio.toISOString(),
        fin_programado: fin.toISOString(),
        estado: "programado",
        etiqueta: `${agente.nombre} · ${puesto.empresa} ${puesto.codigo} · ${fecha} ${hInicio}`,
      });
    }

    if (errores.length)
      return {
        tipo: "error",
        mensaje: `No se cargó nada: ${errores.length} fila${errores.length === 1 ? "" : "s"} con error. Corrige y vuelve a subir.`,
        errores: errores.slice(0, 40),
      };
    origen.filas = nuevos.length;
  }

  if (nuevos.length === 0)
    return { tipo: "error", mensaje: "No hay turnos válidos en el archivo." };
  if (nuevos.length > MAX_TURNOS)
    return {
      tipo: "error",
      mensaje: `El archivo genera ${nuevos.length} turnos; el máximo permitido es ${MAX_TURNOS}.`,
    };

  const cruza = (
    a: { inicio_programado: string; fin_programado: string },
    b: { inicio_programado: string; fin_programado: string },
  ) =>
    a.inicio_programado < b.fin_programado &&
    a.fin_programado > b.inicio_programado;
  const crucesInternos: string[] = [];
  for (let i = 0; i < nuevos.length; i++) {
    for (let j = i + 1; j < nuevos.length; j++) {
      if (
        (nuevos[i].guardia_id === nuevos[j].guardia_id ||
          nuevos[i].puesto_id === nuevos[j].puesto_id) &&
        cruza(nuevos[i], nuevos[j])
      ) {
        crucesInternos.push(
          `Filas ${nuevos[i].fila} y ${nuevos[j].fila}: ${nuevos[i].etiqueta} se cruza con ${nuevos[j].etiqueta}.`,
        );
        if (crucesInternos.length >= 40) break;
      }
    }
    if (crucesInternos.length >= 40) break;
  }
  if (crucesInternos.length)
    return {
      tipo: "error",
      mensaje: `No se cargó nada: el archivo contiene ${crucesInternos.length} cruce${crucesInternos.length === 1 ? "" : "s"} de agente o puesto.`,
      errores: crucesInternos,
    };

  const primero = nuevos.map((x) => x.inicio_programado).sort()[0];
  const ultimo = nuevos
    .map((x) => x.fin_programado)
    .sort()
    .at(-1)!;
  const { data: existentes } = await crearClienteAdministrador()
    .from("turnos")
    .select("guardia_id,puesto_id,inicio_programado,fin_programado")
    .neq("estado", "ausente")
    .lt("inicio_programado", ultimo)
    .gt("fin_programado", primero);
  const ocupados: {
    guardia_id: string;
    puesto_id: string;
    inicio_programado: string;
    fin_programado: string;
  }[] = [...(existentes ?? [])];
  const aInsertar: TurnoImportado[] = [];
  const saltados: string[] = [];
  for (const nv of nuevos) {
    const choque = ocupados.find(
      (o) =>
        (o.guardia_id === nv.guardia_id || o.puesto_id === nv.puesto_id) &&
        cruza(o, nv),
    );
    if (choque) {
      saltados.push(`Fila ${nv.fila}: ${nv.etiqueta} ya estaba cubierto.`);
      continue;
    }
    aInsertar.push(nv);
    ocupados.push(nv);
  }

  const resumen = {
    ...origen,
    creados: aInsertar.length,
    saltados: saltados.length,
    filas: nuevos.length,
  };
  const detalleOrigen = origen.hoja ? ` de la hoja «${origen.hoja}»` : "";
  if (accion === "validar") {
    return {
      tipo: "vista_previa",
      mensaje: `Validación lista${detalleOrigen}: ${aInsertar.length} turno${aInsertar.length === 1 ? "" : "s"} por crear${saltados.length ? ` y ${saltados.length} ya cubierto${saltados.length === 1 ? "" : "s"}` : ""}. Aún no se guardó nada.`,
      errores: saltados.slice(0, 40),
      resumen,
    };
  }

  if (aInsertar.length) {
    const { error } = await supabase
      .from("turnos")
      .insert(
        aInsertar.map((t) => ({
          puesto_id: t.puesto_id,
          guardia_id: t.guardia_id,
          tipo: t.tipo,
          inicio_programado: t.inicio_programado,
          fin_programado: t.fin_programado,
          estado: t.estado,
        })),
      );
    if (error)
      return {
        tipo: "error",
        mensaje: "La base de datos rechazó la carga. No se guardó nada.",
        errores: [error.message],
      };
  }

  for (const ruta of [
    "/operacion/turnos",
    "/operacion/dotacion",
    "/admin",
    "/supervisor",
    "/guardia",
    "/portal",
  ])
    revalidatePath(ruta);
  return {
    tipo: "exito",
    mensaje: `${aInsertar.length} turno${aInsertar.length === 1 ? "" : "s"} creado${aInsertar.length === 1 ? "" : "s"}${detalleOrigen}${saltados.length ? ` · ${saltados.length} ya estaban cubiertos y se saltaron` : ""}.`,
    errores: saltados.slice(0, 40),
    resumen,
  };
}

function normalizar(s: string) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function interpretarFecha(v: string): string | null {
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const dmy = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(t);
  if (dmy)
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  if (/^\d{4,6}(\.\d+)?$/.test(t)) return fechaDeSerie(Number(t));
  return null;
}

function interpretarHora(v: string): string | null {
  const t = v.trim();
  const hm = /^(\d{1,2}):(\d{2})/.exec(t);
  if (hm && Number(hm[1]) < 24) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  if (/^0?\.\d+$/.test(t)) return horaDeFraccion(Number(t));
  if (/^\d{1,2}$/.test(t) && Number(t) < 24) return `${t.padStart(2, "0")}:00`;
  const solo = /^(\d{1,2})h$/i.exec(t);
  if (solo && Number(solo[1]) < 24) return `${solo[1].padStart(2, "0")}:00`;
  return null;
}
