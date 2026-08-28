import { redirect } from "next/navigation";
import type { RolUsuario } from "./tipos";
import { crearClienteServidor } from "./supabase/servidor";

export async function exigirRol(rol: RolUsuario) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(rol === "guardia" ? "/ingreso" : "/acceso");
  const { data: perfil } = await supabase.from("perfiles").select("id, nombre, rol, empresa_cliente_id, zona_id").eq("id", user.id).single();
  if (perfil?.rol !== rol) redirect("/");
  return { supabase, user, perfil };
}
