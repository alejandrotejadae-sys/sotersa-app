"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";

const UUID = /^[0-9a-f-]{36}$/i;

function refrescar() {
  revalidatePath("/supervisor");
  revalidatePath("/operacion/novedades");
  revalidatePath("/portal");
  revalidatePath("/admin");
}

/**
 * Atajo del admin: todos los puestos activos que aun no tienen zona pasan a
 * la zona elegida. Con un solo supervisor es la forma rapida de que vea la
 * operacion completa; despues cada puesto se puede mover desde Clientes.
 */
export async function asignarPuestosSinZona(formData: FormData) {
  const zonaId = String(formData.get("zona_id") ?? "");
  if (!UUID.test(zonaId)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: zona } = await supabase.from("zonas").select("id").eq("id", zonaId).maybeSingle();
  if (!zona) return;

  await supabase.from("puestos").update({ zona_id: zona.id }).is("zona_id", null).eq("activo", true);
  revalidatePath("/supervisor");
  revalidatePath("/operacion/clientes");
  revalidatePath("/operacion/personal");
}

/**
 * Ciclo de una novedad: registrada -> validada -> notificada -> cerrada.
 * El guardia la registra; supervision decide si se publica al cliente
 * (validar), deja constancia de la hora en que se le aviso (notificar: es lo
 * que mide el SLA de 15 minutos) y la cierra cuando ya no requiere
 * seguimiento. RLS solo deja actualizar al admin y al supervisor de la zona;
 * el trigger de inmutabilidad protege lo que escribio el guardia.
 */
export async function validarNovedad(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const nota = String(formData.get("nota") ?? "").trim().slice(0, 500);
  if (!UUID.test(id)) return;
  if (decision !== "interna" && decision !== "cliente") return;

  const { supabase, user } = await exigirPerfil(["supervisor", "admin"]);
  const { data: novedad } = await supabase.from("novedades").select("id, estado").eq("id", id).eq("estado", "registrada").maybeSingle();
  if (!novedad) return;

  await supabase
    .from("novedades")
    .update({ estado: "validada", visible_cliente: decision === "cliente", validada_por: user.id, validada_en: new Date().toISOString(), nota_supervisor: nota || null })
    .eq("id", novedad.id);

  refrescar();
}

/** Deja constancia de que el cliente ya fue avisado. El trigger sella notificada_en. */
export async function notificarNovedad(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;

  const { supabase } = await exigirPerfil(["supervisor", "admin"]);
  const { data: novedad } = await supabase.from("novedades").select("id, estado").eq("id", id).eq("estado", "validada").maybeSingle();
  if (!novedad) return;

  await supabase.from("novedades").update({ estado: "notificada" }).eq("id", novedad.id);
  refrescar();
}

/** Cierra el seguimiento. La nota de cierre se agrega a la de supervision, no la reemplaza. */
export async function cerrarNovedad(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const cierre = String(formData.get("cierre") ?? "").trim().slice(0, 500);
  if (!UUID.test(id)) return;

  const { supabase } = await exigirPerfil(["supervisor", "admin"]);
  const { data: novedad } = await supabase.from("novedades").select("id, estado, nota_supervisor").eq("id", id).in("estado", ["validada", "notificada"]).maybeSingle();
  if (!novedad) return;

  const nota = cierre ? [novedad.nota_supervisor, `Cierre: ${cierre}`].filter(Boolean).join(" · ") : novedad.nota_supervisor;
  await supabase.from("novedades").update({ estado: "cerrada", nota_supervisor: nota }).eq("id", novedad.id);
  refrescar();
}
