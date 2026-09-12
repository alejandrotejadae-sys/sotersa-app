"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { esTipoServicio, servicio } from "@/lib/servicios";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

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

// --- Edicion, estado y accesos ------------------------------------------------
//
// Todo lo de abajo trabaja sobre clientes que YA existen. Las altas estan
// arriba; esto es lo que hace falta despues: completar datos que se cargaron
// en blanco, cerrar un contrato sin borrar su historial, y darle acceso al
// portal a quien lo firmo.

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Corrige los datos de contacto y facturacion de un cliente existente. */
export async function actualizarCliente(_: EstadoCliente, formData: FormData): Promise<EstadoCliente> {
  const id = String(formData.get("empresa_id") ?? "");
  const nombre = texto(formData, "nombre", 120);
  const ruc = texto(formData, "ruc", 13).replace(/\D/g, "");
  const direccion = texto(formData, "direccion", 200);
  const contactoNombre = texto(formData, "contacto_nombre", 120);
  const contactoCorreo = texto(formData, "contacto_correo", 120).toLowerCase();
  const contactoTelefono = texto(formData, "contacto_telefono", 40);

  if (!UUID.test(id)) return { tipo: "error", mensaje: "Cliente no identificado." };
  if (nombre.length < 3) return { tipo: "error", mensaje: "El nombre del cliente es obligatorio." };
  if (ruc && ruc.length !== 13) return { tipo: "error", mensaje: "El RUC ecuatoriano tiene 13 dígitos." };
  if (contactoCorreo && !CORREO.test(contactoCorreo)) return { tipo: "error", mensaje: "El correo de contacto no es válido." };

  const { supabase } = await exigirPerfil(["admin"]);

  // Mismo cuidado que en el alta: dos fichas con el mismo nombre parten el
  // historial. Aqui se excluye la propia.
  const { data: repetido } = await supabase.from("empresas_cliente").select("id").ilike("nombre", nombre).neq("id", id).maybeSingle();
  if (repetido) return { tipo: "error", mensaje: `Ya existe otro cliente llamado «${nombre}».` };

  const { error } = await supabase
    .from("empresas_cliente")
    .update({ nombre, ruc: ruc || null, direccion: direccion || null, contacto_nombre: contactoNombre || null, contacto_correo: contactoCorreo || null, contacto_telefono: contactoTelefono || null })
    .eq("id", id);
  if (error) return { tipo: "error", mensaje: "No fue posible guardar los cambios." };

  refrescar();
  revalidatePath("/portal");
  return { tipo: "exito", mensaje: `Datos de «${nombre}» actualizados.` };
}

/**
 * Cierra o reabre un contrato. Nunca se borra: las novedades, rondas y turnos
 * de ese cliente son evidencia y tienen que seguir existiendo.
 *
 * Al desactivar se cierran tambien sus puestos y se bloquean sus cuentas del
 * portal. Al reactivar se desbloquean las cuentas, pero los puestos quedan
 * como estaban: el contrato nuevo no siempre cubre los mismos puntos, y es
 * mejor que el admin reabra uno por uno los que correspondan.
 */
export async function cambiarEstadoCliente(formData: FormData) {
  const id = String(formData.get("empresa_id") ?? "");
  const activar = formData.get("activar") === "1";
  if (!UUID.test(id)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: empresa } = await supabase.from("empresas_cliente").select("id").eq("id", id).maybeSingle();
  if (!empresa) return;

  await supabase.from("empresas_cliente").update({ activo: activar }).eq("id", id);

  if (!activar) {
    const { data: puestos } = await supabase.from("puestos").select("id").eq("empresa_cliente_id", id).eq("activo", true);
    const idsPuestos = (puestos ?? []).map((p) => p.id);
    if (idsPuestos.length > 0) {
      await supabase.from("puestos").update({ activo: false }).in("id", idsPuestos);
      // Los agentes de esos puestos vuelven a "sin plaza" para que dotacion
      // los muestre disponibles y no queden colgados de un puesto cerrado.
      await supabase.from("guardias").update({ puesto_habitual_id: null }).in("puesto_habitual_id", idsPuestos);
    }
  }

  // Las cuentas del portal siguen la suerte del contrato. Un cliente cesante
  // no debe poder entrar a ver nada, ni siquiera su propio historial.
  const { data: cuentas } = await supabase.from("perfiles").select("id").eq("rol", "cliente").eq("empresa_cliente_id", id);
  if (cuentas && cuentas.length > 0) {
    await supabase.from("perfiles").update({ activo: activar }).in("id", cuentas.map((c) => c.id));
    const administrador = crearClienteAdministrador();
    await Promise.all(cuentas.map((c) => administrador.auth.admin.updateUserById(c.id, { ban_duration: activar ? "none" : "876000h" })));
  }

  refrescar();
  revalidatePath("/portal");
}

/** Cierra o reabre un puesto concreto sin tocar al cliente. */
export async function cambiarEstadoPuesto(formData: FormData) {
  const id = String(formData.get("puesto_id") ?? "");
  const activar = formData.get("activar") === "1";
  if (!UUID.test(id)) return;

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: puesto } = await supabase.from("puestos").select("id,empresa_cliente_id").eq("id", id).maybeSingle();
  if (!puesto) return;

  // No se reabre un puesto de un cliente cerrado: primero se reactiva el cliente.
  if (activar) {
    const { data: empresa } = await supabase.from("empresas_cliente").select("activo").eq("id", puesto.empresa_cliente_id).maybeSingle();
    if (!empresa?.activo) return;
  }

  await supabase.from("puestos").update({ activo: activar }).eq("id", id);
  if (!activar) await supabase.from("guardias").update({ puesto_habitual_id: null }).eq("puesto_habitual_id", id);

  refrescar();
  revalidatePath("/operacion/rondas");
  revalidatePath("/portal");
}


/**
 * Edita un puesto existente: modalidad, nombre, direccion, ruta y arma.
 *
 * Cambiar la modalidad cambia las plazas (un 24 h son dos fijos, un 12 h uno).
 * Si el puesto queda con mas agentes que plazas no se bloquea: dotacion lo
 * muestra en rojo y el admin decide a quien mueve. Bloquear aqui obligaria a
 * liberar gente antes de poder corregir un dato.
 */
export async function actualizarPuesto(_: EstadoCliente, formData: FormData): Promise<EstadoCliente> {
  const id = String(formData.get("puesto_id") ?? "");
  const codigo = texto(formData, "puesto_codigo", 16).toUpperCase();
  const nombre = texto(formData, "puesto_nombre", 120);
  const direccion = texto(formData, "puesto_direccion", 200);
  const tipo = String(formData.get("puesto_tipo_servicio") ?? "");
  const origen = texto(formData, "puesto_origen", 200);
  const destino = texto(formData, "puesto_destino", 200);
  const armado = formData.get("puesto_armado") === "on";
  const enlaceMaps = texto(formData, "puesto_google_maps", 500);
  const zonaId = String(formData.get("puesto_zona_id") ?? "");

  if (!UUID.test(id)) return { tipo: "error", mensaje: "Puesto no identificado." };
  if (zonaId && !UUID.test(zonaId)) return { tipo: "error", mensaje: "Zona no válida." };
  if (!esTipoServicio(tipo)) return { tipo: "error", mensaje: "Selecciona el tipo de servicio." };
  const modalidad = servicio(tipo);
  if (modalidad.requiereRuta && (!origen || !destino)) return { tipo: "error", mensaje: "Una custodia armada necesita origen y destino." };
  if (!/^[A-Z0-9-]{2,16}$/.test(codigo)) return { tipo: "error", mensaje: "El código del puesto usa letras, números y guiones (ej. P-01)." };
  if (nombre.length < 3) return { tipo: "error", mensaje: "El nombre del puesto es obligatorio." };

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: puesto } = await supabase.from("puestos").select("id,empresa_cliente_id").eq("id", id).maybeSingle();
  if (!puesto) return { tipo: "error", mensaje: "Ese puesto ya no existe." };

  // Las coordenadas solo se tocan si se pega un enlace nuevo. Un campo vacio
  // significa "dejar las que estan", no "borrarlas".
  let coordenadas: { lat: number; lng: number } | null = null;
  if (enlaceMaps) {
    coordenadas = await coordenadasGoogleMaps(enlaceMaps);
    if (!coordenadas) return { tipo: "error", mensaje: "No pude obtener las coordenadas del enlace de Google Maps." };
  }

  const { error } = await supabase
    .from("puestos")
    .update({
      codigo,
      nombre,
      direccion: direccion || null,
      cobertura_horas: modalidad.horas,
      tipo_servicio: tipo,
      armado: armado || tipo === "custodia_armada",
      origen: modalidad.requiereRuta ? origen : null,
      destino: modalidad.requiereRuta ? destino : null,
      zona_id: zonaId || null,
      ...(coordenadas ? { lat: coordenadas.lat, lng: coordenadas.lng } : {}),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { tipo: "error", mensaje: `Ese cliente ya tiene otro puesto ${codigo}.` };
    return { tipo: "error", mensaje: "No fue posible guardar el puesto." };
  }

  refrescar();
  revalidatePath("/operacion/rondas");
  revalidatePath("/operacion/custodias");
  revalidatePath("/guardia");
  revalidatePath("/supervisor");
  return { tipo: "exito", mensaje: `Puesto ${codigo} actualizado.` };
}
