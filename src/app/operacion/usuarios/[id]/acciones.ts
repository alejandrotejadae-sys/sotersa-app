"use server";

import { revalidatePath } from "next/cache";
import { validarPin } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

/**
 * Acciones sobre una cuenta existente. Este es el UNICO lugar de la app donde
 * se edita un perfil de acceso, se restablece una clave o se bloquea una
 * cuenta. Clientes y Agentes solo muestran el estado y enlazan aqui.
 */
export type EstadoUsuario = { tipo: "inicial" | "error" | "exito"; mensaje: string; usuario?: string; claveTemporal?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const texto = (fd: FormData, campo: string, max: number) => String(fd.get(campo) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function refrescar(id: string) {
  for (const ruta of [`/operacion/usuarios/${id}`, "/operacion/usuarios", "/operacion/personal", "/operacion/clientes", "/admin"]) revalidatePath(ruta);
}

/** Nombre, telefono y, segun el rol, empresa o zona. El rol no se cambia aqui. */
export async function actualizarUsuario(_: EstadoUsuario, formData: FormData): Promise<EstadoUsuario> {
  const id = String(formData.get("perfil_id") ?? "");
  const nombre = texto(formData, "nombre", 100);
  const telefono = String(formData.get("telefono") ?? "").trim().replace(/[^\d+ ]/g, "").slice(0, 20);
  const empresaId = String(formData.get("empresa_id") ?? "");
  const zonaId = String(formData.get("zona_id") ?? "");

  if (!UUID.test(id)) return { tipo: "error", mensaje: "Cuenta no identificada." };
  if (nombre.length < 3) return { tipo: "error", mensaje: "Escribe el nombre completo." };

  const { supabase, user } = await exigirPerfil(["admin"]);
  const { data: perfil } = await supabase.from("perfiles").select("id,rol,empresa_cliente_id,zona_id").eq("id", id).maybeSingle();
  if (!perfil) return { tipo: "error", mensaje: "Esa cuenta no existe." };

  const cambios: Record<string, unknown> = { nombre, telefono: telefono || null };
  if (perfil.rol === "cliente") {
    if (!UUID.test(empresaId)) return { tipo: "error", mensaje: "Selecciona la empresa del cliente." };
    const { data: empresa } = await supabase.from("empresas_cliente").select("id").eq("id", empresaId).maybeSingle();
    if (!empresa) return { tipo: "error", mensaje: "Esa empresa no existe." };
    cambios.empresa_cliente_id = empresaId;
  }
  if (perfil.rol === "supervisor") {
    if (!UUID.test(zonaId)) return { tipo: "error", mensaje: "Selecciona la zona del supervisor." };
    const { data: zona } = await supabase.from("zonas").select("id").eq("id", zonaId).maybeSingle();
    if (!zona) return { tipo: "error", mensaje: "Esa zona no existe." };
    cambios.zona_id = zonaId;
  }

  const administrador = crearClienteAdministrador();
  const { error } = await administrador.from("perfiles").update(cambios).eq("id", id);
  if (error) return { tipo: "error", mensaje: "No fue posible guardar los cambios." };

  // La copia en Auth (nombre en user_metadata, empresa/zona en app_metadata)
  // se mantiene igual para que la sesion del usuario refleje el cambio.
  const { data: auth } = await administrador.auth.admin.getUserById(id);
  await administrador.auth.admin.updateUserById(id, {
    user_metadata: { ...(auth?.user?.user_metadata ?? {}), nombre },
    app_metadata: { ...(auth?.user?.app_metadata ?? {}), ...(perfil.rol === "cliente" ? { empresa_cliente_id: empresaId } : {}), ...(perfil.rol === "supervisor" ? { zona_id: zonaId } : {}) },
  });
  // El agente lleva nombre y telefono tambien en su ficha operativa.
  if (perfil.rol === "guardia") await administrador.from("guardias").update({ nombre, telefono: telefono || null }).eq("perfil_id", id);

  refrescar(id);
  if (id === user.id) revalidatePath("/", "layout");
  return { tipo: "exito", mensaje: "Cuenta actualizada." };
}

/**
 * Clave temporal nueva. Para agentes es un PIN de seis numeros (validado
 * contra su cedula); para los demas, una clave de al menos 8 caracteres.
 * Siempre obliga a cambiarla al entrar. La anterior deja de servir ya.
 */
export async function restablecerClave(_: EstadoUsuario, formData: FormData): Promise<EstadoUsuario> {
  const id = String(formData.get("perfil_id") ?? "");
  const elegida = String(formData.get("clave_temporal") ?? "").trim();
  if (!UUID.test(id)) return { tipo: "error", mensaje: "Cuenta no identificada." };

  const { supabase, user } = await exigirPerfil(["admin"]);
  if (id === user.id) return { tipo: "error", mensaje: "Tu propia clave la cambias desde Mi perfil, no desde aquí." };
  const { data: perfil } = await supabase.from("perfiles").select("id,rol,nombre,activo").eq("id", id).maybeSingle();
  if (!perfil) return { tipo: "error", mensaje: "Esa cuenta no existe." };
  if (!perfil.activo) return { tipo: "error", mensaje: "La cuenta está bloqueada. Desbloquéala antes de restablecer la clave." };

  const administrador = crearClienteAdministrador();
  const { data: auth } = await administrador.auth.admin.getUserById(id);
  const correo = auth?.user?.email ?? "";

  let clave: string;
  let usuario = correo;
  if (perfil.rol === "guardia") {
    const { data: guardia } = await administrador.from("guardias").select("cedula").eq("perfil_id", id).maybeSingle();
    const cedula = guardia?.cedula ?? correo.split("@")[0];
    usuario = cedula;
    if (elegida) {
      const v = validarPin(elegida, cedula);
      if (!v.valido) return { tipo: "error", mensaje: v.motivo };
      clave = elegida;
    } else clave = generarPin(cedula);
  } else {
    if (elegida && elegida.length < 8) return { tipo: "error", mensaje: "La clave temporal necesita al menos 8 caracteres." };
    clave = elegida || generarClave();
  }

  const { error } = await administrador.auth.admin.updateUserById(id, { password: clave, user_metadata: { ...(auth?.user?.user_metadata ?? {}), debe_cambiar_clave: true } });
  if (error) return { tipo: "error", mensaje: "No fue posible restablecer la clave." };

  refrescar(id);
  return { tipo: "exito", mensaje: `Clave restablecida para ${perfil.nombre}. Entrégala solo a esa persona; deberá cambiarla al entrar.`, usuario, claveTemporal: clave };
}

/**
 * Bloquear o desbloquear. Bloquear no borra nada: la cuenta deja de poder
 * entrar aunque conozca la clave, y su perfil queda inactivo. Un agente
 * bloqueado sigue en la nomina; eso se decide en su ficha, no aqui.
 */
export async function cambiarEstadoUsuario(formData: FormData) {
  const id = String(formData.get("perfil_id") ?? "");
  const activar = formData.get("activar") === "1";
  if (!UUID.test(id)) return;

  const { supabase, user } = await exigirPerfil(["admin"]);
  if (id === user.id) return; // Nadie se bloquea a si mismo por accidente.
  const { data: perfil } = await supabase.from("perfiles").select("id").eq("id", id).maybeSingle();
  if (!perfil) return;

  const administrador = crearClienteAdministrador();
  await administrador.from("perfiles").update({ activo: activar }).eq("id", id);
  await administrador.auth.admin.updateUserById(id, { ban_duration: activar ? "none" : "876000h" });
  refrescar(id);
}

function generarClave() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const numeros = new Uint32Array(10);
  crypto.getRandomValues(numeros);
  return `Sot!${[...numeros].map((n) => alfabeto[n % alfabeto.length]).join("")}`;
}

function generarPin(cedula: string) {
  for (let intento = 0; intento < 40; intento += 1) {
    const numero = new Uint32Array(1);
    crypto.getRandomValues(numero);
    const pin = String(numero[0] % 1_000_000).padStart(6, "0");
    if (validarPin(pin, cedula).valido) return pin;
  }
  throw new Error("No fue posible generar un PIN seguro.");
}
