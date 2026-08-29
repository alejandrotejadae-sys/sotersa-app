"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import type { TipoTurno } from "@/lib/tipos";

export type EstadoProgramacion = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
};

const TIPOS: TipoTurno[] = ["fijo_dia", "fijo_noche", "saca_francos", "supervision"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FECHA_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export async function programarTurno(_: EstadoProgramacion, formData: FormData): Promise<EstadoProgramacion> {
  const guardiaId = String(formData.get("guardia_id") ?? "");
  const puestoId = String(formData.get("puesto_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "") as TipoTurno;
  const inicioLocal = String(formData.get("inicio") ?? "");
  const finLocal = String(formData.get("fin") ?? "");

  if (!UUID.test(guardiaId) || !UUID.test(puestoId) || !TIPOS.includes(tipo) || !FECHA_LOCAL.test(inicioLocal) || !FECHA_LOCAL.test(finLocal)) {
    return { tipo: "error", mensaje: "Completa correctamente todos los campos." };
  }

  const inicio = new Date(`${inicioLocal}:00-05:00`);
  const fin = new Date(`${finLocal}:00-05:00`);
  const duracion = fin.getTime() - inicio.getTime();
  if (!Number.isFinite(duracion) || duracion <= 0) return { tipo: "error", mensaje: "La hora de finalización debe ser posterior al inicio." };
  if (duracion > 24 * 60 * 60 * 1000) return { tipo: "error", mensaje: "Un turno no puede superar 24 horas." };

  const { supabase } = await exigirPerfil(["admin"]);
  const [guardiaR, puestoR] = await Promise.all([
    supabase.from("guardias").select("id,nombre").eq("id", guardiaId).eq("activo", true).maybeSingle(),
    supabase.from("puestos").select("id,codigo,nombre").eq("id", puestoId).eq("activo", true).maybeSingle(),
  ]);

  if (!guardiaR.data || !puestoR.data) return { tipo: "error", mensaje: "El guardia o el puesto ya no están activos." };

  const { data: cruces, error: errorCruces } = await supabase
    .from("turnos")
    .select("id,guardia_id,puesto_id")
    .lt("inicio_programado", fin.toISOString())
    .gt("fin_programado", inicio.toISOString())
    .or(`guardia_id.eq.${guardiaId},puesto_id.eq.${puestoId}`)
    .neq("estado", "ausente")
    .limit(2);

  if (errorCruces) return { tipo: "error", mensaje: "No fue posible comprobar la disponibilidad. Intenta nuevamente." };
  if (cruces?.some((turno) => turno.guardia_id === guardiaId)) return { tipo: "error", mensaje: `${guardiaR.data.nombre} ya tiene un turno en ese horario.` };
  if (cruces?.some((turno) => turno.puesto_id === puestoId)) return { tipo: "error", mensaje: `${puestoR.data.codigo} ya tiene cobertura asignada en ese horario.` };

  const { error } = await supabase.from("turnos").insert({
    guardia_id: guardiaId,
    puesto_id: puestoId,
    tipo,
    inicio_programado: inicio.toISOString(),
    fin_programado: fin.toISOString(),
    estado: "programado",
  });

  if (error) return { tipo: "error", mensaje: "No fue posible guardar el turno. Revisa los datos e intenta nuevamente." };

  revalidatePath("/operacion/turnos");
  revalidatePath("/operacion/personal");
  revalidatePath("/admin");
  revalidatePath("/supervisor");
  return { tipo: "exito", mensaje: `Turno asignado a ${guardiaR.data.nombre} en ${puestoR.data.codigo}.` };
}
