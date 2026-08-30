"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { esTipoServicio, servicio } from "@/lib/servicios";

export type EstadoCliente = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function refrescar() {
  for (const ruta of [
    "/operacion/clientes",
    "/operacion/dotacion",
    "/operacion/turnos",
    "/operacion/usuarios",
    "/operacion/custodias",
    "/guardia/custodia",
    "/admin",
  ]) {
    revalidatePath(ruta);
  }
}

const texto = (fd: FormData, campo: string, max: number) =>
  String(fd.get(campo) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function coordenada(fd: FormData, campo: string, min: number, max: number): number | null | "invalida" {
  const valor = String(fd.get(campo) ?? "").trim().replace(",", ".");
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= min && numero <= max ? numero : "invalida";
}

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
  revalidatePath("/operacion/custodias");
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
  const armado = formData.get("puesto_armado") === "on";

  if (!esTipoServicio(tipo)) return "Selecciona el tipo de servicio.";
  const modalidad = servicio(tipo);
  if (modalidad.requiereRuta && (!origen || !destino)) return "Una custodia armada necesita origen y destino.";

  const origenLat = coordenada(formData, "puesto_origen_lat", -90, 90);
  const origenLng = coordenada(formData, "puesto_origen_lng", -180, 180);
  const destinoLat = coordenada(formData, "puesto_destino_lat", -90, 90);
  const destinoLng = coordenada(formData, "puesto_destino_lng", -180, 180);
  if ([origenLat, origenLng, destinoLat, destinoLng].includes("invalida")) return "Revisa las coordenadas: latitud entre -90 y 90, longitud entre -180 y 180.";
  const coordenadasEscritas = [origenLat, origenLng, destinoLat, destinoLng].filter((valor) => valor !== null).length;
  if (modalidad.requiereRuta && coordenadasEscritas !== 0 && coordenadasEscritas !== 4) return "Para georreferenciar la custodia completa las cuatro coordenadas, o déjalas todas vacías.";

  if (!/^[A-Z0-9-]{2,16}$/.test(codigo)) return "El código del puesto usa letras, números y guiones (ej. P-01).";
  if (nombre.length < 3) return "El nombre del puesto es obligatorio.";

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
    origen_lat: modalidad.requiereRuta && typeof origenLat === "number" ? origenLat : null,
    origen_lng: modalidad.requiereRuta && typeof origenLng === "number" ? origenLng : null,
    destino_lat: modalidad.requiereRuta && typeof destinoLat === "number" ? destinoLat : null,
    destino_lng: modalidad.requiereRuta && typeof destinoLng === "number" ? destinoLng : null,
    activo: true,
  });

  if (error) {
    if (error.code === "23505") return `Ese cliente ya tiene un puesto ${codigo}.`;
    return "No fue posible crear el puesto.";
  }
  return null;
}
