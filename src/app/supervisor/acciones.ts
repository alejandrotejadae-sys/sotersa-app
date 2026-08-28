"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";

export async function validarNovedad(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const nota = String(formData.get("nota") ?? "").trim().slice(0, 500);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  if (decision !== "interna" && decision !== "cliente") return;

  const { supabase, user } = await exigirPerfil(["supervisor", "admin"]);
  const { data: novedad } = await supabase
    .from("novedades")
    .select("id, estado")
    .eq("id", id)
    .eq("estado", "registrada")
    .maybeSingle();

  if (!novedad) return;

  await supabase
    .from("novedades")
    .update({
      estado: "validada",
      visible_cliente: decision === "cliente",
      validada_por: user.id,
      validada_en: new Date().toISOString(),
      nota_supervisor: nota || null,
    })
    .eq("id", novedad.id);

  revalidatePath("/supervisor");
  revalidatePath("/portal");
}
