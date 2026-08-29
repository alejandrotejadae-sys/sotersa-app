"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoPerfil = { tipo: "inicial" | "error" | "exito"; mensaje: string; avatarUrl?: string };

const TIPOS_IMAGEN = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function guardarPerfil(_: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const { user, perfil } = await exigirPerfil(["admin", "supervisor", "cliente", "guardia"]);
  const nombre = String(formData.get("nombre") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  const telefono = String(formData.get("telefono") ?? "").trim().replace(/[^\d+() -]/g, "").slice(0, 24);
  const foto = formData.get("foto");
  if (nombre.length < 3) return { tipo: "error", mensaje: "Escribe tu nombre completo." };
  if (telefono && telefono.replace(/\D/g, "").length < 7) return { tipo: "error", mensaje: "Revisa el número de teléfono." };

  const administrador = crearClienteAdministrador();
  let avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  if (foto instanceof File && foto.size > 0) {
    const extension = TIPOS_IMAGEN.get(foto.type);
    if (!extension) return { tipo: "error", mensaje: "La foto debe ser JPG, PNG o WebP." };
    if (foto.size > 3 * 1024 * 1024) return { tipo: "error", mensaje: "La fotografía no puede superar 3 MB." };
    const contenedor = "avatares-perfil";
    const { error: errorContenedor } = await administrador.storage.getBucket(contenedor);
    if (errorContenedor) {
      const { error: errorCreacion } = await administrador.storage.createBucket(contenedor, { public: false, allowedMimeTypes: [...TIPOS_IMAGEN.keys()], fileSizeLimit: 3 * 1024 * 1024 });
      if (errorCreacion && !errorCreacion.message.toLowerCase().includes("already")) return { tipo: "error", mensaje: "No fue posible preparar el almacenamiento de fotografías." };
    }
    const ruta = `${user.id}/perfil-${Date.now()}.${extension}`;
    const { error: errorFoto } = await administrador.storage.from(contenedor).upload(ruta, await foto.arrayBuffer(), { contentType: foto.type, upsert: false, cacheControl: "3600" });
    if (errorFoto) return { tipo: "error", mensaje: "No fue posible subir la fotografía. Intenta nuevamente." };
    // Contenedor privado: se guarda la ruta y el enlace se firma al mostrarlo.
    // Ver src/lib/avatares.ts.
    avatarUrl = ruta;
    const anterior = typeof user.user_metadata?.avatar_path === "string" ? user.user_metadata.avatar_path : null;
    if (anterior?.startsWith(`${user.id}/`)) await administrador.storage.from(contenedor).remove([anterior]);
    await administrador.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, avatar_url: avatarUrl, avatar_path: ruta, nombre } });
  } else {
    await administrador.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, nombre } });
  }

  const { error } = await administrador.from("perfiles").update({ nombre, telefono: telefono || null }).eq("id", user.id);
  if (error) return { tipo: "error", mensaje: "No fue posible actualizar tus datos." };
  if (perfil.rol === "guardia") await administrador.from("guardias").update({ nombre, telefono: telefono || null }).eq("perfil_id", user.id);
  ["/mi-perfil", "/perfiles", "/guardia", "/admin", "/supervisor"].forEach((ruta) => revalidatePath(ruta));
  return { tipo: "exito", mensaje: "Perfil actualizado correctamente.", avatarUrl };
}
