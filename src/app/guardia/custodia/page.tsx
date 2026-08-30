import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca, Pulso } from "@/app/componentes/marca";
import { EstadoConexion } from "@/app/componentes/estado-conexion";
import { IconoCamion, IconoEscudoOk, IconoFlecha, IconoMapa, IconoMensaje, IconoPersona, IconoRonda, IconoTelefono } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { uno } from "@/lib/sesion";

export const metadata = { title: "Custodia armada — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaCustodia() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: perfil } = await supabase.from("perfiles").select("nombre,rol").eq("id", user.id).maybeSingle();
  if (!perfil || !["guardia", "admin"].includes(perfil.rol)) redirect("/perfiles");
  const { data: agente } = perfil.rol === "admin"
    ? await supabase.from("guardias").select("id,nombre").eq("activo", true).order("nombre").limit(1).maybeSingle()
    : await supabase.from("guardias").select("id,nombre").eq("perfil_id", user.id).maybeSingle();
  if (!agente) redirect("/guardia");
  const ahora = new Date().toISOString();
  const { data: turno } = await supabase.from("turnos").select("id,inicio_programado,fin_programado,estado,puestos(codigo,nombre,tipo_servicio,origen,destino,origen_lat,origen_lng,destino_lat,destino_lng,contactos_puesto(tipo,nombre,telefono))").eq("guardia_id", agente.id).lte("inicio_programado", ahora).gte("fin_programado", ahora).order("inicio_programado", { ascending: false }).limit(1).maybeSingle();
  const puesto = turno ? uno(turno.puestos) : null;
  if (!turno || !puesto || puesto.tipo_servicio !== "custodia_armada") {
    return <main className="min-h-dvh bg-[#020b18] px-4 py-6 text-white"><div className="mx-auto max-w-xl"><Marca tamano="panel"/><section className="tarjeta mt-8 p-6 text-center"><IconoCamion className="mx-auto h-12 w-12 text-azul-300"/><h1 className="mt-4 text-xl font-bold">Sin custodia activa</h1><p className="mt-2 text-sm leading-6 text-gris-400">Esta pantalla se habilita únicamente cuando existe un turno vigente de custodia armada con origen y destino configurados.</p><Link href="/guardia" className="boton-primario mt-5 grid min-h-13 place-items-center rounded-xl font-semibold">Volver a mi puesto</Link></section></div></main>;
  }
  const central = puesto.contactos_puesto?.find((contacto) => contacto.tipo === "central_monitoreo");
  const enlaceMapa = construirMapa(puesto.origen, puesto.destino, puesto.origen_lat, puesto.origen_lng, puesto.destino_lat, puesto.destino_lng);
  const inicio = hora(turno.inicio_programado);
  const fin = hora(turno.fin_programado);

  return <><header className="sticky top-0 z-10 border-b border-azul-900/60 bg-[#020b18]/92 backdrop-blur-xl"><div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 pb-3 pt-4 md:max-w-4xl md:px-6"><Link href="/guardia" aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-xl border border-borde bg-superficie text-gris-200"><span className="rotate-180"><IconoFlecha className="h-5 w-5"/></span></Link><Marca tamano="panel"/><EstadoConexion/></div></header>
  <main className="guardia-render mx-auto flex w-full max-w-md flex-1 flex-col gap-3.5 px-4 pb-6 pt-4 md:max-w-4xl md:px-6"><header><p className="text-xs font-semibold uppercase tracking-[0.18em] text-azul-400">{puesto.codigo} · Operaciones especiales</p><h1 className="mt-1 text-[1.8rem] font-bold tracking-tight text-white">Custodia armada</h1></header>
  <section className="panel-operativo p-4"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-azul-400/50 bg-azul-500/10 text-azul-300"><IconoEscudoOk className="h-8 w-8"/></span><div><div className="flex items-center gap-2"><Pulso/><p className="text-xs font-semibold uppercase tracking-wider text-green-300">Turno {turno.estado}</p></div><h2 className="mt-1 text-2xl font-bold">{puesto.nombre}</h2><p className="mt-1 text-sm text-gris-400">{inicio}–{fin} · datos del turno activo</p></div></div></section>
  <section className="tarjeta custodia-mapa relative min-h-[250px] overflow-hidden p-4"><div className="relative z-[1] flex items-center justify-between"><span className="inline-flex items-center gap-2 rounded-lg border border-normal/40 bg-[#06182a]/90 px-3 py-2 text-xs font-medium text-green-300"><IconoEscudoOk className="h-4 w-4"/> Ruta asignada</span>{enlaceMapa && <a href={enlaceMapa} target="_blank" rel="noreferrer" aria-label="Abrir ruta en mapas" className="grid h-10 w-10 place-items-center rounded-xl border border-azul-500/50 bg-[#06182a]/90 text-azul-300"><IconoMapa className="h-5 w-5"/></a>}</div><div className="custodia-ruta" aria-hidden><span className="custodia-punto custodia-punto-origen"/><span className="custodia-trayecto"/><span className="custodia-punto custodia-punto-destino"/><span className="custodia-camion"><IconoCamion className="h-7 w-7"/></span></div><div className="absolute inset-x-4 bottom-4 z-[1] grid grid-cols-2 gap-5 text-xs text-gris-200"><div><p className="text-gris-500">Origen</p><p className="mt-1 font-semibold">{puesto.origen}</p></div><div className="text-right"><p className="text-gris-500">Destino</p><p className="mt-1 font-semibold">{puesto.destino}</p></div></div></section>
  <div className="grid gap-3 sm:grid-cols-2"><section className="tarjeta p-4"><p className="text-xs uppercase tracking-wider text-gris-500">Línea de tiempo real</p><ol className="mt-4 space-y-3"><Paso titulo="Inicio programado" valor={inicio} hecho/><Paso titulo="Operación en curso" valor={hora(ahora)}/><Paso titulo="Fin programado" valor={fin} pendiente/></ol></section><section className="tarjeta p-4"><p className="text-xs uppercase tracking-wider text-gris-500">Central operativa</p>{central ? <a href={`tel:${central.telefono.replace(/[^+\d]/g, "")}`} className="mt-4 flex items-center gap-3 rounded-xl border border-azul-500/35 bg-azul-500/8 p-3"><IconoTelefono className="h-6 w-6 text-azul-300"/><div><p className="font-semibold">{central.nombre || "Central de monitoreo"}</p><p className="mt-1 text-sm text-azul-300">{central.telefono}</p></div></a> : <p className="mt-4 rounded-xl border border-novedad/35 bg-novedad/10 p-3 text-sm text-amber-100">Operaciones debe configurar el contacto de Central para este servicio.</p>}<p className="mt-4 text-xs leading-5 text-gris-500">Los vehículos y placas no se muestran hasta que estén registrados; la app no utilizará datos de ejemplo.</p></section></div>
  <section className="tarjeta flex items-center gap-3 p-4"><span className="grid h-14 w-14 place-items-center rounded-full border border-azul-600/60 bg-azul-500/10 text-azul-300"><IconoPersona className="h-7 w-7"/></span><div className="min-w-0 flex-1"><p className="text-xs text-gris-500">Agente asignado</p><h2 className="truncate font-semibold">{agente.nombre}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-green-300"><Pulso/> Turno activo</p></div><Link href="/guardia/reportar" className="grid h-11 w-11 place-items-center rounded-xl border border-azul-500/50 text-azul-300"><IconoMensaje className="h-5 w-5"/></Link></section>
  <Link href="/guardia/reportar" className="boton-primario flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"><IconoRonda className="h-5 w-5"/> Registrar novedad de custodia</Link></main></>;
}

function Paso({ titulo, valor, hecho = false, pendiente = false }: { titulo: string; valor: string; hecho?: boolean; pendiente?: boolean }) { return <li className={`flex items-start gap-2 ${pendiente ? "opacity-55" : ""}`}><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-superficie ${hecho ? "bg-normal ring-normal" : "bg-azul-400 ring-azul-500"}`}/><span className="min-w-0 flex-1 text-xs text-gris-200">{titulo}</span><time className="font-mono text-[0.65rem] text-gris-500">{valor}</time></li>; }
function hora(fecha: string | null) { return fecha ? new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Guayaquil" }).format(new Date(fecha)) : "—"; }
function construirMapa(origen: string | null, destino: string | null, olat: number | null, olng: number | null, dlat: number | null, dlng: number | null) { const a = olat != null && olng != null ? `${olat},${olng}` : origen; const b = dlat != null && dlng != null ? `${dlat},${dlng}` : destino; return a && b ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(a)}&destination=${encodeURIComponent(b)}` : null; }
