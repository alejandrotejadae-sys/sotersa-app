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

function refrescarSupervision() {
  revalidatePath("/supervisor");
  revalidatePath("/operacion/clientes");
  revalidatePath("/operacion/usuarios");
  revalidatePath("/portal");
}

/**
 * Atajo del admin: todos los puestos activos que nadie supervisa pasan al
 * supervisor elegido. Con un solo supervisor es la forma rapida de que vea la
 * operacion completa; despues se ajusta puesto por puesto en su ficha.
 */
export async function asignarPuestosSinSupervisor(formData: FormData) {
  const supervisorId = String(formData.get("supervisor_id") ?? "");
  if (!UUID.test(supervisorId)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: supervisor } = await supabase.from("perfiles").select("id").eq("id", supervisorId).eq("rol", "supervisor").eq("activo", true).maybeSingle();
  if (!supervisor) return;

  const [{ data: puestos }, { data: asignados }] = await Promise.all([
    supabase.from("puestos").select("id").eq("activo", true),
    supabase.from("supervision_puestos").select("puesto_id"),
  ]);
  const conSupervisor = new Set((asignados ?? []).map((a) => a.puesto_id));
  const filas = (puestos ?? []).filter((p) => !conSupervisor.has(p.id)).map((p) => ({ supervisor_id: supervisor.id, puesto_id: p.id }));
  if (filas.length) await supabase.from("supervision_puestos").insert(filas);
  refrescarSupervision();
}

/** Ficha del supervisor: la lista completa de puestos que supervisa (los marcados reemplazan a los anteriores). */
export async function guardarPuestosDeSupervisor(formData: FormData) {
  const supervisorId = String(formData.get("supervisor_id") ?? "");
  const puestos = formData.getAll("puesto_id").map(String).filter((id) => UUID.test(id));
  if (!UUID.test(supervisorId)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: supervisor } = await supabase.from("perfiles").select("id").eq("id", supervisorId).eq("rol", "supervisor").maybeSingle();
  if (!supervisor) return;

  await supabase.from("supervision_puestos").delete().eq("supervisor_id", supervisor.id);
  if (puestos.length) await supabase.from("supervision_puestos").insert(puestos.map((puesto_id) => ({ supervisor_id: supervisor.id, puesto_id })));
  refrescarSupervision();
  revalidatePath(`/operacion/usuarios/${supervisor.id}`);
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
