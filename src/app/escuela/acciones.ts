"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { claveLeccion, leccion, modulo } from "@/lib/formacion";

const ROLES = ["guardia", "supervisor", "admin", "cliente"] as const;

export type ResultadoCuestionario = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  puntaje?: number;
  aprobado?: boolean;
  /** Por pregunta: si acerto y la explicacion. Solo se devuelve al terminar. */
  detalle?: { id: string; correcta: boolean; elegida: number; respuesta: number; explicacion: string }[];
};

/** Marca una leccion como leida. Repetirla no duplica ni cambia la fecha. */
export async function completarLeccion(formData: FormData) {
  const moduloId = String(formData.get("modulo") ?? "");
  const leccionId = String(formData.get("leccion") ?? "");
  if (!leccion(moduloId, leccionId)) return;

  const { supabase, user } = await exigirPerfil([...ROLES]);
  const { error } = await supabase.from("formacion_progreso").insert({ perfil_id: user.id, leccion_id: claveLeccion(moduloId, leccionId) });
  // 23505: ya estaba completada. No es un error para quien lee dos veces.
  if (error && error.code !== "23505") return;

  revalidatePath("/escuela");
  revalidatePath(`/escuela/${moduloId}`);
  revalidatePath(`/escuela/${moduloId}/${leccionId}`);
}

/**
 * Califica la evaluacion en el servidor. Las respuestas correctas nunca
 * viajan al navegador antes de responder: el cuestionario solo recibe
 * preguntas y opciones.
 */
export async function responderEvaluacion(_: ResultadoCuestionario, formData: FormData): Promise<ResultadoCuestionario> {
  const moduloId = String(formData.get("modulo") ?? "");
  const m = modulo(moduloId);
  if (!m) return { tipo: "error", mensaje: "Módulo no encontrado." };

  const respuestas: Record<string, number> = {};
  for (const p of m.evaluacion.preguntas) {
    const valor = Number(formData.get(`p_${p.id}`));
    if (!Number.isInteger(valor) || valor < 0 || valor >= p.opciones.length) return { tipo: "error", mensaje: "Responde todas las preguntas antes de enviar." };
    respuestas[p.id] = valor;
  }

  const detalle = m.evaluacion.preguntas.map((p) => ({ id: p.id, correcta: respuestas[p.id] === p.correcta, elegida: respuestas[p.id], respuesta: p.correcta, explicacion: p.explicacion }));
  const aciertos = detalle.filter((d) => d.correcta).length;
  const puntaje = Math.round((aciertos / m.evaluacion.preguntas.length) * 100);
  const aprobado = puntaje >= m.evaluacion.minimoAprobar;

  const { supabase, user } = await exigirPerfil([...ROLES]);
  const { error } = await supabase.from("formacion_evaluaciones").insert({ perfil_id: user.id, modulo_id: m.id, puntaje, aprobado, respuestas });
  // Si la tabla aun no existe, igual se devuelve el resultado: la persona
  // aprende lo mismo; solo no queda registrado.
  const registrado = !error;

  revalidatePath("/escuela");
  revalidatePath(`/escuela/${m.id}`);
  revalidatePath("/escuela/avance");

  return {
    tipo: "exito",
    mensaje: aprobado
      ? `Aprobado con ${puntaje} %. ${registrado ? "Queda registrado en tu ficha." : ""}`
      : `Obtuviste ${puntaje} %; se necesita ${m.evaluacion.minimoAprobar} %. Revisa las explicaciones y vuelve a intentarlo.`,
    puntaje,
    aprobado,
    detalle,
  };
}
