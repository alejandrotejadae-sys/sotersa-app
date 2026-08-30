import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import {
  IconoAlerta,
  IconoCasa,
  IconoCiclo,
  IconoEscudoOk,
  IconoLista,
  IconoPersona,
  IconoRonda,
  IconoTurno,
  IconoCamion,
} from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, horaEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Panel administrativo — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const { supabase, perfil } = await exigirPerfil(["admin"]);
  const desde = ahoraConDesfase(-24);

  const [guardiasR, puestosR, rondasR, novedadesR, vaciosR] = await Promise.all([
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("puestos").select("id,codigo,nombre,lat,lng", { count: "exact" }).eq("activo", true),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde),
    supabase.from("novedades").select("id, tipo, severidad, hora_captura, estado, puestos(codigo), guardias(nombre)").order("hora_captura", { ascending: false }).limit(4),
    supabase.from("v_puestos_sin_apertura").select("turno_id", { count: "exact", head: true }),
  ]);

  const guardias = guardiasR.count ?? 0;
  const puestos = puestosR.data ?? [];
  const rondas = rondasR.count ?? 0;
  const novedades = novedadesR.data ?? [];
  const alertas = (vaciosR.count ?? 0) + novedades.filter((novedad) => novedad.estado === "registrada").length;
  const nombre = perfil.nombre.split(" ")[0];

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] border-x border-white/[0.04] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-5 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8"><Marca tamano="panel" /><nav className="hidden items-center gap-1 lg:flex"><EnlaceSuperior href="/perfiles" texto="Inicio"/><EnlaceSuperior href="/operacion/personal" texto="Personal"/><EnlaceSuperior href="/operacion/turnos" texto="Turnos"/><EnlaceSuperior href="/operacion/rondas" texto="Rondas"/><EnlaceSuperior href="/operacion/custodias" texto="Custodias"/><EnlaceSuperior href="/operacion/novedades" texto="Novedades"/><EnlaceSuperior href="/operacion/reportes" texto="Reportes"/><EnlaceSuperior href="/operacion/usuarios" texto="Usuarios"/><EnlaceSuperior href="/operacion/clientes" texto="Clientes"/></nav><div className="flex items-center gap-2"><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300"><Pulso /> En línea</span><Link href="/mi-perfil" aria-label="Abrir mi perfil" className="grid h-10 w-10 place-items-center rounded-full border border-[#27425e] bg-[#07172a] text-[#49b6ff]"><IconoPersona className="h-5 w-5" /></Link></div></header>

        <div className="grid grid-cols-1 gap-4 px-4 pb-28 lg:grid-cols-12 lg:px-8 lg:pb-10">
          <section className="px-1 pt-1 lg:col-span-12"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Panel administrativo</p><h1 className="mt-2 text-[2rem] font-bold leading-tight tracking-tight lg:text-4xl">Buenos días, {nombre}</h1><p className="mt-1 text-base text-slate-400">Control ejecutivo y operativo en un solo lugar</p></section>

          <section className="relative overflow-hidden rounded-2xl border border-[#27425e] bg-[radial-gradient(circle_at_82%_35%,rgba(0,125,255,0.14),transparent_38%),linear-gradient(135deg,#07182c,#061326)] p-5 shadow-xl shadow-black/20 lg:col-span-8 lg:min-h-52 lg:p-8">
            <IconoEscudoOk className="absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 text-[#0c3d68]/35" />
            <div className="relative"><p className="text-base text-slate-300">Estado general</p><p className="mt-2 text-3xl font-bold">{alertas ? "Atención operativa" : "Operación bajo control"}</p><span className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${alertas ? "border-red-500/45 bg-red-500/10 text-red-300" : "border-emerald-500/45 bg-emerald-500/10 text-emerald-300"}`}><span className={`h-2.5 w-2.5 rounded-full ${alertas ? "bg-red-400" : "bg-emerald-400"}`} /> {alertas ? `${alertas} alerta(s) requieren atención` : "Todos los servicios activos"}</span></div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:col-span-4">
            <Metrica icono={<IconoPersona className="h-7 w-7" />} titulo="Personal activo" valor={guardias} />
            <Metrica icono={<IconoCiclo className="h-7 w-7" />} titulo="Rondas 24h" valor={rondas} />
            <Metrica icono={<IconoAlerta className="h-7 w-7" />} titulo="Alertas" valor={alertas} emergencia={alertas > 0} />
            <Metrica icono={<Camara className="h-7 w-7" />} titulo="Puestos" valor={puestosR.count ?? 0} />
          </section>

          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-7"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Cobertura geográfica</h2><p className="mt-1 text-xs text-slate-500">Solo puestos con coordenadas registradas</p></div></div><MapaCentral puestos={puestos} /></section>

          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-5"><h2 className="text-lg font-semibold">Acciones rápidas</h2><div className="mt-3 grid grid-cols-2 gap-3"><Accion href="/operacion/rondas" icono={<IconoCiclo className="h-7 w-7" />} texto="Rondas"/><Accion href="/operacion/custodias" icono={<IconoCamion className="h-7 w-7" />} texto="Custodias"/><Accion href="/operacion/novedades" icono={<IconoLista className="h-7 w-7" />} texto="Incidentes"/><Accion icono={<Camara className="h-7 w-7" />} texto="Cámaras · por integrar" pendiente/><Accion href="/operacion/novedades?filtro=emergencias" icono={<IconoAlerta className="h-7 w-7" />} texto="Alertas"/><Accion href="/operacion/turnos" icono={<IconoTurno className="h-7 w-7" />} texto="Turnos"/><Accion href="/operacion/dotacion" icono={<IconoEscudoOk className="h-7 w-7" />} texto="Dotación"/><Accion href="/operacion/reportes" icono={<IconoLista className="h-7 w-7" />} texto="Reportes"/></div></section>

          <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95 lg:col-span-12"><div className="flex items-center justify-between border-b border-[#20374e] px-4 py-3.5"><h2 className="text-lg font-semibold">Actividad reciente</h2><Link href="/operacion/novedades" className="text-sm text-[#0788ff]">Ver todo</Link></div>{novedades.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Todavía no hay actividad registrada.</p> : <div className="grid divide-y divide-[#20374e] lg:grid-cols-2 lg:divide-y-0">{novedades.map((novedad) => <article key={novedad.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-[#20374e] px-4 py-3 lg:border-b lg:odd:border-r"><span className={`grid h-10 w-10 place-items-center rounded-full border ${novedad.severidad === "emergencia" ? "border-red-400 text-red-300" : "border-[#0788ff] text-[#0788ff]"}`}>{novedad.severidad === "emergencia" ? "!" : "✓"}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{novedad.tipo}</p><p className="truncate text-xs text-slate-400">{uno(novedad.puestos)?.codigo ?? uno(novedad.guardias)?.nombre ?? "Central"}</p></div><time className="text-xs text-slate-400">{horaEcuador(novedad.hora_captura)}</time></article>)}</div>}</section>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 lg:hidden mx-auto grid w-full max-w-[540px] grid-cols-5 border-t border-[#27425e] bg-[#031023]/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Navegación del panel administrativo"><Nav href="/perfiles" icono={<IconoCasa className="h-6 w-6" />} texto="Inicio"/><Nav href="/operacion/rondas" icono={<IconoRonda className="h-6 w-6" />} texto="Rondas"/><Nav href="/operacion/personal" icono={<IconoPersona className="h-6 w-6" />} texto="Personal"/><Nav href="/operacion/novedades" icono={<IconoAlerta className="h-6 w-6" />} texto="Alertas"/><Nav href="/operacion/turnos" icono={<IconoTurno className="h-6 w-6" />} texto="Turnos"/></nav>
      </div>
    </main>
  );
}

function Metrica({ icono, titulo, valor, emergencia = false }: { icono: React.ReactNode; titulo: string; valor: number; emergencia?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className={`flex items-center gap-2 ${emergencia ? "text-red-400" : "text-[#0788ff]"}`}>{icono}<span className="text-sm text-slate-300">{titulo}</span></div><p className={`mt-3 text-center text-3xl font-medium ${emergencia ? "text-red-400" : "text-white"}`}>{valor}</p></article>; }
function Accion({ icono, texto, href, pendiente = false }: { icono: React.ReactNode; texto: string; href?: string; pendiente?: boolean }) { const contenido = <><span className={pendiente ? "text-slate-600" : "text-[#0788ff]"}>{icono}</span>{texto}</>; const clase = `flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#061426] p-3 text-center text-sm ${pendiente ? "cursor-not-allowed text-slate-600" : "text-slate-300"}`; return href ? <Link href={href} className={clase}>{contenido}</Link> : <button type="button" disabled={pendiente} className={clase}>{contenido}</button>; }
function Nav({ icono, texto, activo = false, href }: { icono: React.ReactNode; texto: string; activo?: boolean; href?: string }) { const contenido = <>{icono}<span>{texto}</span></>; const clase = `flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] ${activo ? "text-[#0788ff]" : "text-slate-400"}`; return href ? <Link href={href} className={clase}>{contenido}</Link> : <button type="button" className={clase}>{contenido}</button>; }
function MapaCentral({ puestos }: { puestos: { id: string; codigo: string; nombre: string; lat: number | null; lng: number | null }[] }) { const geo = puestos.filter((p): p is typeof p & { lat: number; lng: number } => p.lat != null && p.lng != null); if (!geo.length) return <div className="mt-3 grid h-48 place-items-center rounded-xl border border-dashed border-[#27425e] bg-[#061426] px-6 text-center"><div><p className="font-medium text-slate-300">Sin coordenadas registradas</p><p className="mt-1 text-sm text-slate-500">La app no mostrará ubicaciones de ejemplo.</p></div></div>; const lats = geo.map((p) => p.lat), lngs = geo.map((p) => p.lng); const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs); return <div className="relative mt-3 h-48 overflow-hidden rounded-xl border border-[#27425e] bg-[linear-gradient(35deg,transparent_46%,rgba(32,79,118,0.4)_47%,rgba(32,79,118,0.4)_49%,transparent_50%),radial-gradient(circle_at_55%_55%,#123354,#07182b_62%)] bg-[size:95px_75px,auto]"><div className="absolute inset-0 bg-[linear-gradient(rgba(18,60,96,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(18,60,96,0.25)_1px,transparent_1px)] bg-[size:24px_24px]"/>{geo.map((puesto) => { const left = maxLng === minLng ? 50 : 12 + ((puesto.lng - minLng) / (maxLng - minLng)) * 76; const top = maxLat === minLat ? 50 : 12 + ((maxLat - puesto.lat) / (maxLat - minLat)) * 76; return <a key={puesto.id} href={`https://www.google.com/maps/search/?api=1&query=${puesto.lat},${puesto.lng}`} target="_blank" rel="noreferrer" title={`${puesto.codigo} · ${puesto.nombre}`} className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#67dfff] bg-[#087ff0] shadow-[0_0_18px_rgba(0,127,255,0.7)]" style={{ left: `${left}%`, top: `${top}%` }}><span className="h-2.5 w-2.5 rounded-full bg-white"/></a>; })}<span className="absolute bottom-2 right-2 rounded bg-[#020b18]/80 px-2 py-1 text-[0.65rem] text-slate-400">{geo.length}/{puestos.length} puestos ubicados</span></div>; }
function Camara({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>; }
function EnlaceSuperior({ href, texto, activo = false }: { href: string; texto: string; activo?: boolean }) { return <Link href={href} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activo ? "bg-[#087ff0]/15 text-[#4db6ff]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{texto}</Link>; }
