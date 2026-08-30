"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { esTipoServicio, servicio } from "@/lib/servicios";

export type EstadoCliente = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOSTS_MAPS = new Set(["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"]);

function refrescar() {
  for (const ruta of [
    "/operacion/clientes",
    "/operacion/dotacion",
    "/operacion/turnos",
    "/operacion/usuarios",
    "/operacion/rondas",
    "/admin",
  ]) {
    revalidatePath(ruta);
  }
}

const texto = (fd: FormData, campo: string, max: number) =>
  String(fd.get(campo) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

export async function crearCliente(
  _: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  const nombre = texto(formData, "nombre", 120);
  const ruc = texto(formData, "ruc", 13).replace(/\D/g, "");
  const direccion = texto(formData, "direccion", 200);
  const contactoNombre = texto(formData, "contacto_nombre", 120);
  const contactoCorreo = texto(formData, "contacto_correo", 120).toLowerCase();
  const contactoTelefono = texto(formData, "contacto_telefono", 40);

  if (nombre.length < 3) return { tipo: "error", mensaje: "El nombre del cliente es obligatorio." };
  if (ruc && ruc.length !== 13) return { tipo: "error", mensaje: "El RUC ecuatoriano tiene 13 dígitos." };
  if (contactoCorreo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactoCorreo)) return { tipo: "error", mensaje: "El correo de contacto no es válido." };

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: repetido } = await supabase.from("empresas_cliente").select("id").ilike("nombre", nombre).maybeSingle();
  if (repetido) return { tipo: "error", mensaje: `Ya existe un cliente llamado «${nombre}».` };

  const { data: empresa, error } = await supabase
    .from("empresas_cliente")
    .insert({ nombre, ruc: ruc || null, direccion: direccion || null, contacto_nombre: contactoNombre || null, contacto_correo: contactoCorreo || null, contacto_telefono: contactoTelefono || null, activo: true })
    .select("id,nombre")
    .single();

  if (error || !empresa) return { tipo: "error", mensaje: "No fue posible crear el cliente." };

  const codigoPuesto = texto(formData, "puesto_codigo", 16).toUpperCase();
  if (codigoPuesto) {
    const fallo = await insertarPuesto(supabase, empresa.id, formData);
    if (fallo) {
      refrescar();
      return { tipo: "error", mensaje: `Cliente «${empresa.nombre}» creado, pero el puesto no: ${fallo}` };
    }
    refrescar();
    return { tipo: "exito", mensaje: `Cliente «${empresa.nombre}» creado con el puesto ${codigoPuesto}.` };
  }

  refrescar();
  return { tipo: "exito", mensaje: `Cliente «${empresa.nombre}» creado. Agrégale al menos un puesto.` };
}

export async function agregarPuesto(
  _: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  const empresaId = String(formData.get("empresa_cliente_id") ?? "");
  if (!UUID.test(empresaId)) return { tipo: "error", mensaje: "Selecciona el cliente." };

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: empresa } = await supabase.from("empresas_cliente").select("id,nombre").eq("id", empresaId).maybeSingle();
  if (!empresa) return { tipo: "error", mensaje: "Ese cliente ya no existe." };

  const fallo = await insertarPuesto(supabase, empresaId, formData);
  if (fallo) return { tipo: "error", mensaje: fallo };

  refrescar();
  return { tipo: "exito", mensaje: `Puesto agregado a ${empresa.nombre}.` };
}

export async function guardarContactoPuesto(_: EstadoCliente, formData: FormData): Promise<EstadoCliente> {
  const puestoId = String(formData.get("puesto_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const nombre = texto(formData, "contacto_nombre", 120);
  const telefono = texto(formData, "contacto_telefono", 40);
  const tipos = new Set(["central_monitoreo", "administracion_cliente", "supervisor_zona", "jefe_operaciones"]);
  if (!UUID.test(puestoId)) return { tipo: "error", mensaje: "Selecciona el puesto." };
  if (!tipos.has(tipo)) return { tipo: "error", mensaje: "Selecciona el tipo de contacto." };
  if (telefono.replace(/\D/g, "").length < 7) return { tipo: "error", mensaje: "Escribe un teléfono válido." };
  const { supabase } = await exigirPerfil(["admin"]);
  const { data: puesto } = await supabase.from("puestos").select("id,codigo").eq("id", puestoId).eq("activo", true).maybeSingle();
  if (!puesto) return { tipo: "error", mensaje: "El puesto seleccionado ya no está activo." };
  const { error } = await supabase.from("contactos_puesto").upsert({ puesto_id: puestoId, tipo, nombre: nombre || null, telefono }, { onConflict: "puesto_id,tipo" });
  if (error) return { tipo: "error", mensaje: "No fue posible guardar el contacto." };
  revalidatePath("/operacion/clientes");
  revalidatePath("/guardia");
  revalidatePath("/guardia/custodia");
  return { tipo: "exito", mensaje: `Contacto actualizado para ${puesto.codigo}.` };
}

type ClienteSupabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

async function insertarPuesto(
  supabase: ClienteSupabase,
  empresaId: string,
  formData: FormData,
): Promise<string | null> {
  const codigo = texto(formData, "puesto_codigo", 16).toUpperCase();
  const nombre = texto(formData, "puesto_nombre", 120);
  const direccion = texto(formData, "puesto_direccion", 200);
  const tipo = String(formData.get("puesto_tipo_servicio") ?? "");
  const origen = texto(formData, "puesto_origen", 200);
  const destino = texto(formData, "puesto_destino", 200);
  const enlaceMaps = texto(formData, "puesto_google_maps", 500);
  const armado = formData.get("puesto_armado") === "on";

  if (!esTipoServicio(tipo)) return "Selecciona el tipo de servicio.";
  const modalidad = servicio(tipo);
  if (modalidad.requiereRuta && (!origen || !destino)) return "Una custodia armada necesita origen y destino.";
  if (!/^[A-Z0-9-]{2,16}$/.test(codigo)) return "El código del puesto usa letras, números y guiones (ej. P-01).";
  if (nombre.length < 3) return "El nombre del puesto es obligatorio.";

  let coordenadas: { lat: number; lng: number } | null = null;
  if (enlaceMaps) {
    coordenadas = await coordenadasGoogleMaps(enlaceMaps);
    if (!coordenadas) return "No pude obtener las coordenadas del enlace de Google Maps. Verifica que sea un enlace compartido válido del punto.";
  }

  const { error } = await supabase.from("puestos").insert({
    empresa_cliente_id: empresaId,
    codigo,
    nombre,
    direccion: direccion || null,
    cobertura_horas: modalidad.horas,
    tipo_servicio: tipo,
    armado: armado || tipo === "custodia_armada",
    origen: modalidad.requiereRuta ? origen : null,
    destino: modalidad.requiereRuta ? destino : null,
    lat: coordenadas?.lat ?? null,
    lng: coordenadas?.lng ?? null,
    activo: true,
  });

  if (error) {
    if (error.code === "23505") return `Ese cliente ya tiene un puesto ${codigo}.`;
    return "No fue posible crear el puesto.";
  }
  return null;
}

async function coordenadasGoogleMaps(valor: string): Promise<{ lat: number; lng: number } | null> {
  let url: URL;
  try { url = new URL(valor); } catch { return null; }
  if (url.protocol !== "https:" || !HOSTS_MAPS.has(url.hostname.toLowerCase())) return null;

  let final = url.toString();
  if (url.hostname === "maps.app.goo.gl" || url.hostname === "goo.gl") {
    try {
      const respuesta = await fetch(final, { method: "GET", redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(7000) });
      final = respuesta.url || final;
    } catch { return null; }
  }

  return extraerCoordenadas(final);
}

function extraerCoordenadas(valor: string): { lat: number; lng: number } | null {
  const decodificado = decodeURIComponent(valor);
  const patrones = [
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    /[?&](?:q|query|ll)=(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  ];

  for (const patron of patrones) {
    const coincidencia = decodificado.match(patron);
    if (!coincidencia) continue;
    const lat = Number(coincidencia[1]);
    const lng = Number(coincidencia[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}
