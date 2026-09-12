"use server";

import { revalidatePath } from "next/cache";
import { cedulaACorreo, cedulaEsValida, validarPin } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoFicha = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  usuario?: string;
  pin?: string;
};

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

/**
 * Nuevo PIN temporal. Para cuando el agente lo olvido o cuando se entrego
 * uno y nunca lo cambio. Sale una sola vez y obliga a cambiarlo al entrar.
 * Si el agente no tenia cuenta, se la crea aqui mismo.
 */
export async function restablecerPin(_: EstadoFicha, formData: FormData): Promise<EstadoFicha> {
  const id = String(formData.get("guardia_id") ?? "");
  if (!UUID.test(id)) return fallo("Agente no identificado.");

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: agente } = await supabase.from("guardias").select("id,nombre,cedula,telefono,perfil_id,activo").eq("id", id).maybeSingle();
  if (!agente) return fallo("Ese agente ya no existe.");
  if (!agente.activo) return fallo("El agente está dado de baja. Reactívalo antes de darle acceso.");
  if (!agente.cedula || !cedulaEsValida(agente.cedula)) return fallo("El agente necesita una cédula válida: es su usuario de acceso.");

  const pin = generarPin(agente.cedula);
  const administrador = crearClienteAdministrador();

  if (agente.perfil_id) {
    const { error } = await administrador.auth.admin.updateUserById(agente.perfil_id, {
      password: pin,
      user_metadata: { nombre: agente.nombre, rol: "guardia", debe_cambiar_clave: true },
    });
    if (error) return fallo("No fue posible restablecer el PIN.");
    refrescar(id);
    return { tipo: "exito", mensaje: "PIN restablecido. Entrégalo solo al agente; deberá cambiarlo al entrar.", usuario: agente.cedula, pin };
  }

  // Sin cuenta todavia: misma alta que en el registro de personal.
  const { data: creado, error: errorAuth } = await administrador.auth.admin.createUser({
    email: cedulaACorreo(agente.cedula),
    password: pin,
    email_confirm: true,
    app_metadata: { rol: "guardia" },
    user_metadata: { nombre: agente.nombre, rol: "guardia", debe_cambiar_clave: true },
  });
  if (errorAuth || !creado.user) return fallo(errorAuth?.message.toLowerCase().includes("registered") ? "Ya existe una cuenta con esa cédula que no está vinculada a esta ficha." : "No fue posible crear el acceso.");

  const { error: errorPerfil } = await administrador.from("perfiles").upsert({ id: creado.user.id, rol: "guardia", nombre: agente.nombre, telefono: agente.telefono, activo: true }, { onConflict: "id" });
  if (errorPerfil) {
    await administrador.auth.admin.deleteUser(creado.user.id);
    return fallo("No fue posible crear el perfil del agente.");
  }
  const { error: errorVinculo } = await administrador.from("guardias").update({ perfil_id: creado.user.id }).eq("id", id).is("perfil_id", null);
  if (errorVinculo) {
    await administrador.auth.admin.deleteUser(creado.user.id);
    return fallo("No fue posible vincular la cuenta con la ficha.");
  }

  refrescar(id);
  return { tipo: "exito", mensaje: "Acceso creado. Entrégalo solo al agente; deberá cambiar el PIN al entrar.", usuario: agente.cedula, pin };
}

function fallo(mensaje: string): EstadoFicha { return { tipo: "error", mensaje }; }

function generarPin(cedula: string) {
  for (let intento = 0; intento < 40; intento += 1) {
    const numero = new Uint32Array(1);
    crypto.getRandomValues(numero);
    const pin = String(numero[0] % 1_000_000).padStart(6, "0");
    if (validarPin(pin, cedula).valido) return pin;
  }
  throw new Error("No fue posible generar un PIN seguro.");
}
