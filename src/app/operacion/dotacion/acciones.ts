"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";

export type EstadoDotacion = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refrescar() {
  for (const ruta of [
    "/operacion/dotacion",
    "/operacion/personal",
    "/operacion/turnos",
    "/operacion/clientes",
    "/admin",
    "/supervisor",
  ]) {
    revalidatePath(ruta);
  }
}

/**
 * Fija el puesto habitual de un agente.
 *
 * "Habitual" no es lo mismo que "asignado hoy": el turno concreto vive en la
 * tabla de turnos y puede caer en otro puesto. Esto es la plaza a la que
 * pertenece, que es lo que el cuadrante usa como punto de partida.
 */
export async function asignarAgente(
  _: EstadoDotacion,
  formData: FormData,
): Promise<EstadoDotacion> {
  const guardiaId = String(formData.get("guardia_id") ?? "");
  const puestoId = String(formData.get("puesto_id") ?? "");
  if (!UUID.test(guardiaId) || !UUID.test(puestoId)) {
    return { tipo: "error", mensaje: "Selecciona un agente de seguridad." };
  }

  const { supabase } = await exigirPerfil(["admin"]);
  const [agenteR, puestoR] = await Promise.all([
    supabase
      .from("guardias")
      .select("id,nombre")
      .eq("id", guardiaId)
      .eq("activo", true)
      .maybeSingle(),
    supabase
      .from("puestos")
      .select("id,codigo")
      .eq("id", puestoId)
      .eq("activo", true)
      .maybeSingle(),
  ]);

  if (!agenteR.data || !puestoR.data) {
    return { tipo: "error", mensaje: "El agente o el puesto ya no están activos." };
  }

  // Asignar a un puesto deja de ser relevo: un saca francos no tiene plaza fija.
  const { error } = await supabase
    .from("guardias")
    .update({ puesto_habitual_id: puestoId, es_relevo: false })
    .eq("id", guardiaId);

  if (error) {
    return { tipo: "error", mensaje: "No fue posible asignar al agente." };
  }

  refrescar();
  return {
    tipo: "exito",
    mensaje: `${agenteR.data.nombre} asignado a ${puestoR.data.codigo}.`,
  };
}

/** Quita la plaza fija. No borra nada: el agente sigue en la nómina. */
export async function liberarAgente(formData: FormData): Promise<void> {
  const guardiaId = String(formData.get("guardia_id") ?? "");
  if (!UUID.test(guardiaId)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  await supabase
    .from("guardias")
    .update({ puesto_habitual_id: null })
    .eq("id", guardiaId);
  refrescar();
}

/**
 * Marca o desmarca a alguien como relevo (saca francos / saca vacaciones).
 * Al marcarlo se le quita la plaza fija: cubre varios puestos, no uno.
 */
export async function alternarRelevo(formData: FormData): Promise<void> {
  const guardiaId = String(formData.get("guardia_id") ?? "");
  const activar = formData.get("activar") === "1";
  if (!UUID.test(guardiaId)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  await supabase
    .from("guardias")
    .update(
      activar
        ? { es_relevo: true, puesto_habitual_id: null }
        : { es_relevo: false },
    )
    .eq("id", guardiaId);
  refrescar();
}
