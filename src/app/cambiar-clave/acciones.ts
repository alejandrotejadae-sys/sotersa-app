"use server";

import { revalidatePath } from "next/cache";
import { validarPin } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";

export type EstadoClave = { tipo: "inicial" | "error" | "exito"; mensaje: string };

export async function cambiarClave(_: EstadoClave, formData: FormData): Promise<EstadoClave> {
  const clave = String(formData.get("clave") ?? "");
  const confirmacion = String(formData.get("confirmacion") ?? "");
  if (clave !== confirmacion) return { tipo: "error", mensaje: "Las contraseñas no coinciden." };

  const { supabase, user, perfil } = await exigirPerfil(["admin", "supervisor", "cliente", "guardia"], { permitirClaveTemporal: true });
  if (perfil.rol === "guardia") {
    const { data: guardia } = await supabase.from("guardias").select("cedula").eq("perfil_id", user.id).maybeSingle();
    const resultado = validarPin(clave, guardia?.cedula ?? undefined);
    if (!resultado.valido) return { tipo: "error", mensaje: resultado.motivo };
  } else {
    const motivo = validarClaveCorporativa(clave);
    if (motivo) return { tipo: "error", mensaje: motivo };
  }

  const { error } = await supabase.auth.updateUser({ password: clave, data: { ...user.user_metadata, debe_cambiar_clave: false } });
  if (error) return { tipo: "error", mensaje: "No fue posible actualizar la contraseña. Intenta nuevamente." };
  revalidatePath("/", "layout");
  return { tipo: "exito", mensaje: "Tu nueva contraseña quedó guardada correctamente." };
}

function validarClaveCorporativa(clave: string) {
  if (clave.length < 12) return "La contraseña debe tener al menos 12 caracteres.";
  if (!/[A-Z]/.test(clave)) return "Incluye al menos una letra mayúscula.";
  if (!/[a-z]/.test(clave)) return "Incluye al menos una letra minúscula.";
  if (!/\d/.test(clave)) return "Incluye al menos un número.";
  if (!/[^A-Za-z0-9]/.test(clave)) return "Incluye al menos un símbolo.";
  return null;
}
