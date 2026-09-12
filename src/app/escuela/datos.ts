import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MODULOS, claveLeccion } from "@/lib/formacion";

export type ResultadoEvaluacion = { puntaje: number; aprobado: boolean; respondido_en: string; intentos: number };

export type Avance = {
  completadas: Set<string>;
  /** Mejor resultado por modulo, con el numero de intentos. */
  evaluaciones: Map<string, ResultadoEvaluacion>;
  /** Si las tablas todavia no existen, la escuela funciona sin registrar. */
  disponible: boolean;
};

/**
 * Avance de una persona. Se lee con el cliente de la sesion: las politicas
 * dejan ver lo propio, y a admin y supervisor lo de todos.
 */
export async function avanceDe(supabase: SupabaseClient, perfilId: string): Promise<Avance> {
  const [progresoR, evaluacionesR] = await Promise.all([
    supabase.from("formacion_progreso").select("leccion_id").eq("perfil_id", perfilId),
    supabase.from("formacion_evaluaciones").select("modulo_id,puntaje,aprobado,respondido_en").eq("perfil_id", perfilId).order("respondido_en", { ascending: false }),
  ]);
  const disponible = progresoR.error?.code !== "PGRST205" && evaluacionesR.error?.code !== "PGRST205";

  const evaluaciones = new Map<string, ResultadoEvaluacion>();
  for (const e of evaluacionesR.data ?? []) {
    const actual = evaluaciones.get(e.modulo_id);
    if (!actual) evaluaciones.set(e.modulo_id, { puntaje: e.puntaje, aprobado: e.aprobado, respondido_en: e.respondido_en, intentos: 1 });
    else {
      actual.intentos += 1;
      if (e.puntaje > actual.puntaje) { actual.puntaje = e.puntaje; actual.aprobado = e.aprobado; actual.respondido_en = e.respondido_en; }
    }
  }
  return { completadas: new Set((progresoR.data ?? []).map((p) => p.leccion_id)), evaluaciones, disponible };
}

export function resumenModulo(avance: Avance, moduloId: string) {
  const m = MODULOS.find((x) => x.id === moduloId);
  if (!m) return { hechas: 0, total: 0, porcentaje: 0, evaluacion: null as ResultadoEvaluacion | null, completo: false };
  const hechas = m.lecciones.filter((l) => avance.completadas.has(claveLeccion(m.id, l.id))).length;
  const evaluacion = avance.evaluaciones.get(m.id) ?? null;
  return { hechas, total: m.lecciones.length, porcentaje: Math.round((hechas / m.lecciones.length) * 100), evaluacion, completo: hechas === m.lecciones.length && Boolean(evaluacion?.aprobado) };
}
