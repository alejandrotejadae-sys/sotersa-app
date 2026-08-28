import "server-only";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { RolUsuario } from "@/lib/tipos";

export async function exigirPerfil(roles: RolUsuario[]) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol, nombre, empresa_cliente_id, zona_id")
    .eq("id", user.id)
    .single();

  if (!perfil || !roles.includes(perfil.rol as RolUsuario)) redirect("/");

  return { supabase, user, perfil };
}

export function horaEcuador(fecha: string | null | undefined) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guayaquil",
  }).format(new Date(fecha));
}

export function fechaHoraEcuador(fecha: string | null | undefined) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guayaquil",
  }).format(new Date(fecha));
}

/** Mantiene el reloj del servidor fuera del render puro de React. */
export function ahoraConDesfase(horas: number) {
  return new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();
}

/** Supabase tipa las relaciones como objeto o arreglo según la inferencia. */
export function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}
