"use server";

import { revalidatePath } from "next/cache";
import { cedulaACorreo, cedulaEsValida, validarPin } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoRegistroAgente = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  usuario?: string;
  pin?: string;
};

export async function registrarAgente(_: EstadoRegistroAgente, formData: FormData): Promise<EstadoRegistroAgente> {
  await exigirPerfil(["admin"]);

  const nombre = String(formData.get("nombre") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  const cedula = String(formData.get("cedula") ?? "").replace(/\D/g, "").slice(0, 10);
  const telefono = String(formData.get("telefono") ?? "").trim().replace(/[^\d+]/g, "").slice(0, 15) || null;
  const credencial = String(formData.get("credencial") ?? "").trim().slice(0, 40) || null;

  if (nombre.length < 3) return fallo("Escribe el nombre completo del agente.");
  if (!cedulaEsValida(cedula)) return fallo("La cédula ecuatoriana no es válida.");
  if (telefono && telefono.length < 7) return fallo("El teléfono ingresado no es válido.");

  const administrador = crearClienteAdministrador();
  const { data: guardiaExistente } = await administrador
    .from("guardias")
    .select("id,perfil_id,activo")
    .eq("cedula", cedula)
    .maybeSingle();

  if (guardiaExistente?.perfil_id) return fallo("Este agente ya tiene una cuenta de acceso vinculada.");

  const correoInterno = cedulaACorreo(cedula);
  const pin = generarPin(cedula);
  const { data: usuarioCreado, error: errorAuth } = await administrador.auth.admin.createUser({
    email: correoInterno,
    password: pin,
    email_confirm: true,
    user_metadata: { nombre, rol: "guardia", debe_cambiar_clave: true },
  });

  if (errorAuth || !usuarioCreado.user) {
    return fallo(errorAuth?.message.toLowerCase().includes("registered")
      ? "Ya existe una cuenta con esta cédula. Revisa el listado de accesos."
      : "No fue posible crear el acceso en este momento.");
  }

  const usuarioId = usuarioCreado.user.id;
  const { error: errorPerfil } = await administrador.from("perfiles").insert({
    id: usuarioId,
    rol: "guardia",
    nombre,
    telefono,
    activo: true,
  });

  if (errorPerfil) {
    await administrador.auth.admin.deleteUser(usuarioId);
    return fallo("No fue posible crear el perfil operativo del agente.");
  }

  const datosGuardia = { perfil_id: usuarioId, nombre, cedula, telefono, credencial, activo: true };
  const resultadoGuardia = guardiaExistente
    ? await administrador.from("guardias").update(datosGuardia).eq("id", guardiaExistente.id).is("perfil_id", null)
    : await administrador.from("guardias").insert(datosGuardia);

  if (resultadoGuardia.error) {
    await administrador.from("perfiles").delete().eq("id", usuarioId);
    await administrador.auth.admin.deleteUser(usuarioId);
    return fallo("No fue posible registrar al agente en el equipo operativo.");
  }

  revalidatePath("/operacion/personal");
  revalidatePath("/operacion/usuarios");
  revalidatePath("/admin");
  return {
    tipo: "exito",
    mensaje: "Agente y acceso creados. El PIN se muestra una sola vez.",
    usuario: cedula,
    pin,
  };
}

function fallo(mensaje: string): EstadoRegistroAgente { return { tipo: "error", mensaje }; }

function generarPin(cedula: string) {
  for (let intento = 0; intento < 40; intento += 1) {
    const numero = new Uint32Array(1);
    crypto.getRandomValues(numero);
    const pin = String(numero[0] % 1_000_000).padStart(6, "0");
    if (validarPin(pin, cedula).valido) return pin;
  }
  throw new Error("No fue posible generar un PIN seguro.");
}
