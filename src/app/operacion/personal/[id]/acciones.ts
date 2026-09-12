"use server";

import { revalidatePath } from "next/cache";
import { cedulaEsValida } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoFicha = { tipo: "inicial" | "error" | "exito"; mensaje: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refrescar(id: string) {
  for (const ruta of [`/operacion/personal/${id}`, "/operacion/personal", "/operacion/dotacion", "/operacion/usuarios", "/operacion/turnos", "/admin"]) {
    revalidatePath(ruta);
  }
}

const texto = (fd: FormData, campo: string, max: number) => String(fd.get(campo) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/**
 * Datos de la ficha: nombre, telefono, credencial y cedula.
 *
 * La cedula es el usuario de la app (va dentro del correo interno), asi que
 * solo se puede cambiar mientras el agente no tenga cuenta. Con cuenta, se
 * bloquea aqui y en el formulario: cambiarla dejaria al agente sin poder
 * entrar con el usuario que ya conoce.
 */
export async function actualizarAgente(_: EstadoFicha, formData: FormData): Promise<EstadoFicha> {
  const id = String(formData.get("guardia_id") ?? "");
  const nombre = texto(formData, "nombre", 100);
  const cedula = String(formData.get("cedula") ?? "").replace(/\D/g, "").slice(0, 10);
  const telefono = String(formData.get("telefono") ?? "").trim().replace(/[^\d+]/g, "").slice(0, 15);
  const credencial = texto(formData, "credencial", 40);

  if (!UUID.test(id)) return fallo("Agente no identificado.");
  if (nombre.length < 3) return fallo("Escribe el nombre completo del agente.");
  if (cedula && !cedulaEsValida(cedula)) return fallo("La cédula ecuatoriana no es válida.");
  if (telefono && telefono.length < 7) return fallo("El teléfono ingresado no es válido.");

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: actual } = await supabase.from("guardias").select("id,cedula,perfil_id").eq("id", id).maybeSingle();
  if (!actual) return fallo("Ese agente ya no existe.");
  if (actual.perfil_id && cedula !== (actual.cedula ?? "")) return fallo("La cédula es el usuario de acceso y no se cambia con la cuenta creada.");

  if (cedula && cedula !== actual.cedula) {
    const { data: otro } = await supabase.from("guardias").select("id").eq("cedula", cedula).neq("id", id).maybeSingle();
    if (otro) return fallo("Ya hay otro agente con esa cédula.");
  }

  const { error } = await supabase
    .from("guardias")
    .update({ nombre, cedula: cedula || null, telefono: telefono || null, credencial: credencial || null })
    .eq("id", id);
  if (error) return fallo("No fue posible guardar la ficha.");

  // El perfil de acceso lleva su propia copia del nombre y telefono (es lo
  // que se ve en la app del agente). Se mantienen iguales.
  if (actual.perfil_id) {
    await crearClienteAdministrador().from("perfiles").update({ nombre, telefono: telefono || null }).eq("id", actual.perfil_id);
  }

  refrescar(id);
  return { tipo: "exito", mensaje: "Ficha actualizada." };
}

/**
 * Baja o reingreso. No se borra: sus turnos, rondas y novedades son historial
 * del servicio. Al dar de baja se le quita la plaza, se marca inactivo y su
 * cuenta queda bloqueada aunque conozca la clave.
 */
export async function cambiarEstadoAgente(formData: FormData) {
  const id = String(formData.get("guardia_id") ?? "");
  const activar = formData.get("activar") === "1";
  if (!UUID.test(id)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: agente } = await supabase.from("guardias").select("id,perfil_id").eq("id", id).maybeSingle();
  if (!agente) return;

  await supabase
    .from("guardias")
    .update(activar ? { activo: true } : { activo: false, puesto_habitual_id: null, es_relevo: false })
    .eq("id", id);

  if (agente.perfil_id) {
    const administrador = crearClienteAdministrador();
    await administrador.from("perfiles").update({ activo: activar }).eq("id", agente.perfil_id);
    await administrador.auth.admin.updateUserById(agente.perfil_id, { ban_duration: activar ? "none" : "876000h" });
  }

  refrescar(id);
}

function fallo(mensaje: string): EstadoFicha { return { tipo: "error", mensaje }; }

