import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

const TIPOS = new Set(["Novedad general", "Acceso no autorizado", "Daño o falla de equipos", "Infraestructura", "Incidente médico", "Relevo de puesto", "Otro"]);
const SEVERIDADES = new Set(["informativa", "novedad", "emergencia"]);
type Peticion = { id?: unknown; tipo?: unknown; creadoEn?: unknown; datos?: Record<string, unknown> };

export async function POST(peticion: Request) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión vencida" }, { status: 401 });
  const formulario = await peticion.formData();
  let operacion: Peticion;
  try { operacion = JSON.parse(String(formulario.get("operacion") ?? "")) as Peticion; } catch { return invalida("Operación inválida"); }
  if (!uuid(operacion.id) || !["ronda", "novedad"].includes(String(operacion.tipo)) || !operacion.datos) return invalida("Operación incompleta");
  const hora = fechaValida(operacion.creadoEn);
  if (!hora) return invalida("Fecha de captura inválida");

  const administrador = crearClienteAdministrador();
  const { data: agente } = await administrador.from("guardias").select("id").eq("perfil_id", user.id).eq("activo", true).maybeSingle();
  if (!agente) return invalida("Cuenta sin agente activo");

  if (operacion.tipo === "ronda") {
    const turnoId = String(operacion.datos.turno_id ?? "");
    const puntoId = String(operacion.datos.punto_id ?? "");
    if (!uuid(turnoId) || !uuid(puntoId)) return invalida("Punto o turno inválido");
    const { data: turno } = await administrador.from("turnos").select("id,puesto_id,guardia_id,inicio_programado,fin_programado").eq("id", turnoId).eq("guardia_id", agente.id).maybeSingle();
    const { data: punto } = await administrador.from("puntos_ronda").select("id,puesto_id,activo").eq("id", puntoId).maybeSingle();
    if (!turno || !punto?.activo || punto.puesto_id !== turno.puesto_id || hora < new Date(turno.inicio_programado) || hora > new Date(turno.fin_programado)) return invalida("La ronda no corresponde al turno");
    const { error } = await administrador.from("rondas").insert({ id: operacion.id, turno_id: turno.id, punto_id: punto.id, guardia_id: agente.id, hora_captura: hora.toISOString(), lat: coordenada(operacion.datos.lat, -90, 90), lng: coordenada(operacion.datos.lng, -180, 180) });
    if (error?.code === "23505") return NextResponse.json({ sincronizado: true }, { status: 409 });
    if (error) return NextResponse.json({ error: "No fue posible sincronizar la ronda" }, { status: 500 });
    return NextResponse.json({ sincronizado: true });
  }

  const tipo = String(operacion.datos.tipo ?? "");
  const severidad = String(operacion.datos.severidad ?? "");
  const descripcion = String(operacion.datos.descripcion ?? "").trim().replace(/\s+/g, " ").slice(0, 1200);
  if (!TIPOS.has(tipo) || !SEVERIDADES.has(severidad) || descripcion.length < 10) return invalida("Datos de novedad inválidos");
  const { data: turno } = await administrador.from("turnos").select("id,puesto_id").eq("guardia_id", agente.id).lte("inicio_programado", hora.toISOString()).gte("fin_programado", hora.toISOString()).order("inicio_programado", { ascending: false }).limit(1).maybeSingle();
  if (!turno) return invalida("No existía un turno activo al capturar la novedad");
  const foto = formulario.get("foto");
  let rutaFoto: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(foto.type) || foto.size > 5 * 1024 * 1024) return invalida("Fotografía inválida");
    const extension = foto.type === "image/png" ? "png" : foto.type === "image/webp" ? "webp" : "jpg";
    const contenedor = "evidencias-novedades";
    await administrador.storage.createBucket(contenedor, { public: false, fileSizeLimit: 15 * 1024 * 1024 }).catch(() => undefined);
    rutaFoto = `${agente.id}/${operacion.id}.${extension}`;
    const { error } = await administrador.storage.from(contenedor).upload(rutaFoto, await foto.arrayBuffer(), { contentType: foto.type, upsert: true });
    if (error) return NextResponse.json({ error: "No fue posible sincronizar la fotografía" }, { status: 500 });
  }
  const { error } = await administrador.from("novedades").insert({ id: operacion.id, puesto_id: turno.puesto_id, turno_id: turno.id, guardia_id: agente.id, tipo, severidad, descripcion, foto_url: rutaFoto, lat: coordenada(operacion.datos.lat, -90, 90), lng: coordenada(operacion.datos.lng, -180, 180), hora_captura: hora.toISOString(), estado: "registrada", visible_cliente: false });
  if (error?.code === "23505") return NextResponse.json({ sincronizado: true }, { status: 409 });
  if (error) return NextResponse.json({ error: "No fue posible sincronizar la novedad" }, { status: 500 });
  return NextResponse.json({ sincronizado: true });
}

function uuid(valor: unknown): valor is string { return typeof valor === "string" && /^[0-9a-f-]{36}$/i.test(valor); }
function fechaValida(valor: unknown) { const fecha = new Date(String(valor)); const ahora = Date.now(); return Number.isFinite(fecha.getTime()) && fecha.getTime() <= ahora + 5 * 60_000 && fecha.getTime() >= ahora - 7 * 86_400_000 ? fecha : null; }
function coordenada(valor: unknown, minimo: number, maximo: number) { const numero = Number(valor); return valor !== null && valor !== "" && Number.isFinite(numero) && numero >= minimo && numero <= maximo ? numero : null; }
function invalida(error: string) { return NextResponse.json({ error }, { status: 400 }); }
