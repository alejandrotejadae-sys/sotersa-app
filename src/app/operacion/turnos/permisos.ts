import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uno } from "@/lib/sesion";

export type PuestoProgramable = { id: string; codigo: string; nombre: string; empresa: string; tipo_servicio: string | null };

/**
 * Que puestos puede programar quien esta conectado. El admin, todos los
 * activos; el supervisor, solo los que tiene asignados en supervision_puestos.
 * La base lo vuelve a exigir por RLS al insertar: esto es para que la
 * pantalla ofrezca solo lo que va a funcionar y el error, si lo hay, sea claro.
 */
export async function puestosQuePuedeProgramar(supabase: SupabaseClient, perfil: { id: string; rol: string }): Promise<PuestoProgramable[]> {
  let ids: string[] | null = null;
  if (perfil.rol === "supervisor") {
    const { data } = await supabase.from("supervision_puestos").select("puesto_id").eq("supervisor_id", perfil.id);
    ids = (data ?? []).map((s) => s.puesto_id);
    if (ids.length === 0) return [];
  }
  let consulta = supabase.from("puestos").select("id,codigo,nombre,tipo_servicio,empresas_cliente(nombre)").eq("activo", true).order("codigo");
  if (ids) consulta = consulta.in("id", ids);
  const { data } = await consulta;
  return (data ?? []).map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, tipo_servicio: p.tipo_servicio, empresa: uno(p.empresas_cliente)?.nombre ?? "" }));
}
