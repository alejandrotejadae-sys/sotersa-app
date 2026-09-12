"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { CONTENEDOR_DOCUMENTOS, TAMANO_MAXIMO, TIPOS_DOCUMENTO, carpetaCliente, carpetaGeneral, nombreDeArchivo } from "@/lib/documentos";

export type EstadoDocumento = { tipo: "inicial" | "error" | "exito"; mensaje: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refrescar() {
  revalidatePath("/operacion/clientes");
  revalidatePath("/portal/documentos");
}

/** Sube un documento habilitante: general (todos los clientes) o de un cliente. */
export async function subirDocumento(_: EstadoDocumento, formData: FormData): Promise<EstadoDocumento> {
  const titulo = String(formData.get("titulo") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const ambito = String(formData.get("ambito") ?? "general");
  const empresaId = String(formData.get("empresa_id") ?? "");
  const archivo = formData.get("archivo");

  if (titulo.length < 3) return { tipo: "error", mensaje: "Escribe el título del documento (ej. Permiso de funcionamiento 2026)." };
  if (!(archivo instanceof File) || archivo.size === 0) return { tipo: "error", mensaje: "Selecciona el archivo." };
  const extension = TIPOS_DOCUMENTO.get(archivo.type);
  if (!extension) return { tipo: "error", mensaje: "Solo se aceptan PDF, JPG o PNG." };
  if (archivo.size > TAMANO_MAXIMO) return { tipo: "error", mensaje: "El archivo supera los 3,5 MB. Comprime el PDF o divide el documento." };
  if (ambito === "cliente" && !UUID.test(empresaId)) return { tipo: "error", mensaje: "Selecciona el cliente." };

  const { supabase } = await exigirPerfil(["admin"]);
  if (ambito === "cliente") {
    const { data } = await supabase.from("empresas_cliente").select("id").eq("id", empresaId).maybeSingle();
    if (!data) return { tipo: "error", mensaje: "Ese cliente no existe." };
  }

  const carpeta = ambito === "cliente" ? carpetaCliente(empresaId) : carpetaGeneral();
  const ruta = `${carpeta}/${nombreDeArchivo(titulo, extension)}`;
  const administrador = crearClienteAdministrador();
  const { data: contenedor } = await administrador.storage.getBucket(CONTENEDOR_DOCUMENTOS);
  if (!contenedor) await administrador.storage.createBucket(CONTENEDOR_DOCUMENTOS, { public: false, allowedMimeTypes: [...TIPOS_DOCUMENTO.keys()], fileSizeLimit: TAMANO_MAXIMO });

  // upsert: subir "Permiso de funcionamiento" de nuevo reemplaza al anterior,
  // que es lo que se quiere cuando se renueva un documento.
  const { error } = await administrador.storage.from(CONTENEDOR_DOCUMENTOS).upload(ruta, await archivo.arrayBuffer(), { contentType: archivo.type, upsert: true, cacheControl: "3600" });
  if (error) return { tipo: "error", mensaje: "No fue posible guardar el documento." };

  refrescar();
  return { tipo: "exito", mensaje: `«${titulo}» publicado ${ambito === "cliente" ? "para ese cliente" : "para todos los clientes"}.` };
}

/** Retira un documento. Los enlaces firmados que ya se entregaron caducan solos. */
export async function eliminarDocumento(formData: FormData) {
  const ruta = String(formData.get("ruta") ?? "");
  // Solo rutas dentro de las dos carpetas conocidas, sin saltos de directorio.
  if (!/^(general|cliente\/[0-9a-f-]{36})\/[^/]+$/.test(ruta) || ruta.includes("..")) return;
  await exigirPerfil(["admin"]);
  await crearClienteAdministrador().storage.from(CONTENEDOR_DOCUMENTOS).remove([ruta]);
  refrescar();
}
