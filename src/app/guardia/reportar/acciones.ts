"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoReporte = { tipo: "inicial" | "error" | "exito"; mensaje: string };

const TIPOS = new Set(["Novedad general", "Acceso no autorizado", "Daño o falla de equipos", "Infraestructura", "Incidente médico", "Relevo de puesto", "Otro"]);
const SEVERIDADES = new Set(["informativa", "novedad", "emergencia"]);
const IMAGENES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function registrarNovedad(_: EstadoReporte, formData: FormData): Promise<EstadoReporte> {
  const { user } = await exigirPerfil(["guardia"]);
  const tipo = String(formData.get("tipo") ?? "");
  const severidad = String(formData.get("severidad") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim().replace(/\s+/g, " ").slice(0, 1200);
  const lat = numeroCoordenada(formData.get("lat"), -90, 90);
  const lng = numeroCoordenada(formData.get("lng"), -180, 180);
  const foto = formData.get("foto");
  if (!TIPOS.has(tipo) || !SEVERIDADES.has(severidad)) return fallo("Selecciona el tipo y la prioridad del reporte.");
  if (descripcion.length < 10) return fallo("Describe la novedad con al menos 10 caracteres.");

  const administrador = crearClienteAdministrador();
  const { data: agente } = await administrador.from("guardias").select("id").eq("perfil_id", user.id).eq("activo", true).maybeSingle();
  if (!agente) return fallo("Tu cuenta no está vinculada con un agente de seguridad activo.");
  const ahora = new Date();
  const { data: turno } = await administrador.from("turnos").select("id,puesto_id").eq("guardia_id", agente.id).lte("inicio_programado", ahora.toISOString()).gte("fin_programado", ahora.toISOString()).order("inicio_programado", { ascending: false }).limit(1).maybeSingle();
  if (!turno) return fallo("Necesitas un turno activo para registrar una novedad.");

  let fotoUrl: string | null = null;
  let rutaFoto: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    const extension = IMAGENES.get(foto.type);
    if (!extension) return fallo("La evidencia debe ser JPG, PNG o WebP.");
    if (foto.size > 5 * 1024 * 1024) return fallo("La fotografía no puede superar 5 MB.");
    const contenedor = "evidencias-novedades";
    const { error: sinContenedor } = await administrador.storage.getBucket(contenedor);
    if (sinContenedor) {
      // PRIVADO a proposito: son fotos del interior de instalaciones de
      // clientes. Publico dejaria cada evidencia accesible para siempre a
      // cualquiera que tenga el enlace, sin pasar por la app.
      const { error } = await administrador.storage.createBucket(contenedor, { public: false, allowedMimeTypes: [...IMAGENES.keys()], fileSizeLimit: 15 * 1024 * 1024 });
      if (error && !error.message.toLowerCase().includes("already")) return fallo("No fue posible preparar el almacenamiento de evidencias.");
    }
    rutaFoto = `${agente.id}/${ahora.getTime()}.${extension}`;
    const { error } = await administrador.storage.from(contenedor).upload(rutaFoto, await foto.arrayBuffer(), { contentType: foto.type, cacheControl: "3600" });
    if (error) return fallo("No fue posible subir la fotografía.");
    // Se guarda la RUTA dentro del contenedor, no una URL: el contenedor es
    // privado y el enlace se firma al mostrarlo, con caducidad de una hora.
    // Ver src/lib/evidencias.ts.
    fotoUrl = rutaFoto;
  }

  const { error } = await administrador.from("novedades").insert({ puesto_id: turno.puesto_id, turno_id: turno.id, guardia_id: agente.id, tipo, severidad, descripcion, foto_url: fotoUrl, lat, lng, hora_captura: ahora.toISOString(), estado: "registrada", visible_cliente: false });
  if (error) {
    if (rutaFoto) await administrador.storage.from("evidencias-novedades").remove([rutaFoto]);
    return fallo("No fue posible guardar la novedad. Intenta nuevamente.");
  }
  ["/guardia", "/guardia/reportar", "/operacion/novedades", "/admin", "/supervisor"].forEach((ruta) => revalidatePath(ruta));
  return { tipo: "exito", mensaje: "Novedad enviada a supervisión y central operativa." };
}

function numeroCoordenada(valor: FormDataEntryValue | null, minimo: number, maximo: number) { const numero = Number(valor); return valor && Number.isFinite(numero) && numero >= minimo && numero <= maximo ? numero : null; }
function fallo(mensaje: string): EstadoReporte { return { tipo: "error", mensaje }; }
