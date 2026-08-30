"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPerfil } from "@/lib/sesion";
import { AVISO_VERSION, resumenAviso } from "@/lib/consentimiento";

export type EstadoConsentimiento = {
  tipo: "inicial" | "error";
  mensaje: string;
};

/**
 * Registra la aceptación.
 *
 * Se guarda junto al texto vigente: si mañana cambia el aviso, esta fila sigue
 * probando qué fue exactamente lo que esta persona leyó y aceptó ese día.
 */
export async function aceptarAviso(
  _: EstadoConsentimiento,
  formData: FormData,
): Promise<EstadoConsentimiento> {
  if (formData.get("confirmo") !== "on") {
    return { tipo: "error", mensaje: "Marca la casilla para continuar." };
  }

  const { supabase, user } = await exigirPerfil(
    ["guardia", "supervisor", "admin", "cliente"],
    { permitirSinConsentimiento: true },
  );

  const { error } = await supabase.from("consentimientos").insert({
    perfil_id: user.id,
    version: AVISO_VERSION,
    resumen_aviso: resumenAviso(),
  });

  // 23505 = ya existe para esta version. Si vuelve a aceptar despues de
  // retirarlo, se levanta el retiro en vez de crear una fila nueva.
  if (error && error.code === "23505") {
    const { error: errorReactivar } = await supabase
      .from("consentimientos")
      .update({ retirado_en: null })
      .eq("perfil_id", user.id)
      .eq("version", AVISO_VERSION);
    if (errorReactivar) {
      return { tipo: "error", mensaje: "No fue posible registrar tu aceptación." };
    }
  } else if (error) {
    return { tipo: "error", mensaje: "No fue posible registrar tu aceptación." };
  }

  revalidatePath("/", "layout");
  redirect("/perfiles");
}

/**
 * Retira el consentimiento.
 *
 * No borra la fila: le pone fecha de retiro. Borrarla eliminaria la prueba de
 * que en su momento si se dio, que es justo lo que hay que poder demostrar.
 */
export async function retirarConsentimiento(): Promise<void> {
  const { supabase, user } = await exigirPerfil(
    ["guardia", "supervisor", "admin", "cliente"],
    { permitirSinConsentimiento: true },
  );

  await supabase
    .from("consentimientos")
    .update({ retirado_en: new Date().toISOString() })
    .eq("perfil_id", user.id)
    .eq("version", AVISO_VERSION)
    .is("retirado_en", null);

  revalidatePath("/", "layout");
  redirect("/consentimiento");
}
