"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoPunto = { tipo: "inicial" | "error" | "exito"; mensaje: string };

export async function crearPuntoRonda(_: EstadoPunto, datos: FormData): Promise<EstadoPunto> {
  await exigirPerfil(["admin"]);
  const puestoId = String(datos.get("puesto_id") ?? "");
  const codigo = String(datos.get("codigo") ?? "").trim().toUpperCase().replace(/\s+/g, "-");
  const nombre = String(datos.get("nombre") ?? "").trim().replace(/\s+/g, " ");
  const orden = Number(datos.get("orden"));

  if (!/^[0-9a-f-]{36}$/i.test(puestoId)) return fallo("Selecciona un puesto válido.");
  if (!/^[A-Z0-9_-]{2,30}$/.test(codigo)) return fallo("El código debe tener entre 2 y 30 letras o números.");
  if (nombre.length < 3 || nombre.length > 100) return fallo("Escribe un nombre de 3 a 100 caracteres.");
  if (!Number.isInteger(orden) || orden < 1 || orden > 999) return fallo("El orden debe ser un número entre 1 y 999.");

  const administrador = crearClienteAdministrador();
  const { data: puesto } = await administrador.from("puestos").select("id").eq("id", puestoId).eq("activo", true).maybeSingle();
  if (!puesto) return fallo("El puesto seleccionado ya no está activo.");

  const { error } = await administrador.from("puntos_ronda").insert({ puesto_id: puestoId, codigo, nombre, orden, activo: true });
  if (error?.code === "23505") return fallo("Ese código ya existe en el puesto.");
  if (error) return fallo("No fue posible crear el punto de ronda.");

  revalidatePath("/operacion/rondas");
  revalidatePath("/guardia/ronda");
  return { tipo: "exito", mensaje: `Punto ${codigo} creado. Su QR ya está listo para imprimir.` };
}

function fallo(mensaje: string): EstadoPunto { return { tipo: "error", mensaje }; }
