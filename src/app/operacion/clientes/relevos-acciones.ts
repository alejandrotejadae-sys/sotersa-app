"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";

export type EstadoRelevo = { tipo: "inicial" | "error" | "exito"; mensaje: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refrescar() {
  for (const ruta of ["/operacion/clientes", "/operacion/dotacion", "/operacion/personal", "/operacion/turnos", "/portal/agentes"]) revalidatePath(ruta);
}

/**
 * Asigna un saca francos a un puesto. El mismo relevo puede cubrir varios
 * puestos de distintos clientes: es una relacion muchos a muchos, no una
 * plaza. Si el agente aun no estaba marcado como relevo, se marca (y pierde
 * su plaza fija, porque no puede ser fijo y relevo a la vez).
 */
export async function asignarRelevo(_: EstadoRelevo, formData: FormData): Promise<EstadoRelevo> {
  const puestoId = String(formData.get("puesto_id") ?? "");
  const guardiaId = String(formData.get("guardia_id") ?? "");
  if (!UUID.test(puestoId) || !UUID.test(guardiaId)) return { tipo: "error", mensaje: "Selecciona el agente." };

  const { supabase } = await exigirPerfil(["admin"]);
  const [{ data: puesto }, { data: guardia }] = await Promise.all([
    supabase.from("puestos").select("id,codigo").eq("id", puestoId).eq("activo", true).maybeSingle(),
    supabase.from("guardias").select("id,nombre,es_relevo,puesto_habitual_id").eq("id", guardiaId).eq("activo", true).maybeSingle(),
  ]);
  if (!puesto || !guardia) return { tipo: "error", mensaje: "El puesto o el agente ya no están activos." };

  if (!guardia.es_relevo) {
    const { error } = await supabase.from("guardias").update({ es_relevo: true, puesto_habitual_id: null }).eq("id", guardia.id);
    if (error) return { tipo: "error", mensaje: "No pude marcar al agente como relevo." };
  }
  const { error } = await supabase.from("relevos_puesto").upsert({ puesto_id: puesto.id, guardia_id: guardia.id }, { onConflict: "puesto_id,guardia_id" });
  if (error) return { tipo: "error", mensaje: "No fue posible guardar el saca francos." };

  refrescar();
  return { tipo: "exito", mensaje: `${guardia.nombre} cubre los francos de ${puesto.codigo}${guardia.puesto_habitual_id ? " (dejó su plaza fija)" : ""}.` };
}

export async function quitarRelevo(formData: FormData): Promise<void> {
  const puestoId = String(formData.get("puesto_id") ?? "");
  const guardiaId = String(formData.get("guardia_id") ?? "");
  if (!UUID.test(puestoId) || !UUID.test(guardiaId)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  await supabase.from("relevos_puesto").delete().eq("puesto_id", puestoId).eq("guardia_id", guardiaId);
  refrescar();
}
