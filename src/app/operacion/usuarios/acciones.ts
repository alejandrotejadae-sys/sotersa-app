"use server";

import { revalidatePath } from "next/cache";
import { cedulaACorreo, cedulaEsValida, validarPin } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

type RolCreable = "guardia" | "supervisor" | "cliente";

export type EstadoAlta = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  usuario?: string;
  claveTemporal?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function crearCuenta(_: EstadoAlta, formData: FormData): Promise<EstadoAlta> {
  await exigirPerfil(["admin"]);
  const rol = String(formData.get("rol") ?? "") as RolCreable;
  const nombreIngresado = String(formData.get("nombre") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  const correoIngresado = String(formData.get("correo") ?? "").trim().toLowerCase();
  const empresaId = String(formData.get("empresa_id") ?? "");
  const zonaId = String(formData.get("zona_id") ?? "");
  const guardiaId = String(formData.get("guardia_id") ?? "");
  if (!(["guardia", "supervisor", "cliente"] as string[]).includes(rol)) return fallo("Selecciona un rol válido.");

  const administrador = crearClienteAdministrador();
  let nombre = nombreIngresado;
  let correo = correoIngresado;
  let claveTemporal = generarClave();
  let empresa: string | null = null;
  let zona: string | null = null;
  let guardiaVincular: string | null = null;

  if (rol === "guardia") {
    if (!UUID.test(guardiaId)) return fallo("Selecciona un agente de seguridad disponible.");
    const { data: guardia } = await administrador.from("guardias").select("id,nombre,cedula,perfil_id,activo").eq("id", guardiaId).maybeSingle();
    if (!guardia || !guardia.activo || guardia.perfil_id) return fallo("El agente de seguridad seleccionado ya no está disponible.");
    if (!guardia.cedula || !cedulaEsValida(guardia.cedula)) return fallo("El agente de seguridad necesita una cédula ecuatoriana válida antes de crear su acceso.");
    nombre = guardia.nombre;
    correo = cedulaACorreo(guardia.cedula);
    claveTemporal = generarPin(guardia.cedula);
    guardiaVincular = guardia.id;
  } else {
    if (nombre.length < 3) return fallo("Escribe el nombre completo del usuario.");
    if (!CORREO.test(correo)) return fallo("Escribe un correo electrónico válido.");
    if (rol === "cliente") {
      if (!UUID.test(empresaId)) return fallo("Selecciona la empresa del cliente.");
      const { data } = await administrador.from("empresas_cliente").select("id").eq("id", empresaId).eq("activo", true).maybeSingle();
      if (!data) return fallo("La empresa seleccionada ya no está activa.");
      empresa = data.id;
    }
    if (rol === "supervisor") {
      if (!UUID.test(zonaId)) return fallo("Selecciona la zona del supervisor.");
      const { data } = await administrador.from("zonas").select("id").eq("id", zonaId).maybeSingle();
      if (!data) return fallo("La zona seleccionada no existe.");
      zona = data.id;
    }
  }

  const { data: usuarioCreado, error: errorAuth } = await administrador.auth.admin.createUser({
    email: correo,
    password: claveTemporal,
    email_confirm: true,
    user_metadata: { nombre, rol, debe_cambiar_clave: true },
  });
  if (errorAuth || !usuarioCreado.user) return fallo(errorAuth?.message.toLowerCase().includes("registered") ? "Ya existe una cuenta con ese usuario o correo." : "No fue posible crear la cuenta en este momento.");

  const usuarioId = usuarioCreado.user.id;
  const { error: errorPerfil } = await administrador.from("perfiles").insert({ id: usuarioId, rol, nombre, empresa_cliente_id: empresa, zona_id: zona, activo: true });
  if (errorPerfil) {
    await administrador.auth.admin.deleteUser(usuarioId);
    return fallo("La cuenta no pudo vincularse con su perfil operativo.");
  }

  if (guardiaVincular) {
    const { error: errorGuardia } = await administrador.from("guardias").update({ perfil_id: usuarioId }).eq("id", guardiaVincular).is("perfil_id", null);
    if (errorGuardia) {
      await administrador.auth.admin.deleteUser(usuarioId);
      return fallo("No fue posible vincular la cuenta con el agente de seguridad.");
    }
  }

  revalidatePath("/operacion/usuarios");
  revalidatePath("/operacion/personal");
  return { tipo: "exito", mensaje: "Cuenta creada. Entrega estas credenciales únicamente al usuario correspondiente.", usuario: rol === "guardia" ? correo.split("@")[0] : correo, claveTemporal };
}

function fallo(mensaje: string): EstadoAlta { return { tipo: "error", mensaje }; }
function generarClave() { const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; const numeros = new Uint32Array(12); crypto.getRandomValues(numeros); return `Sot!7${[...numeros].map((numero) => alfabeto[numero % alfabeto.length]).join("")}`; }
function generarPin(cedula: string) { for (let intento = 0; intento < 40; intento += 1) { const numero = new Uint32Array(1); crypto.getRandomValues(numero); const pin = String(numero[0] % 1_000_000).padStart(6, "0"); if (validarPin(pin, cedula).valido) return pin; } throw new Error("No fue posible generar un PIN seguro."); }
