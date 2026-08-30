import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoCiclo, IconoEscudoOk, IconoLista, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, horaEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Central operativa — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaCentral() {
  const { supabase } = await exigirPerfil(["admin"]);
  const desde = ahoraConDesfase(-24);
  const ahora = new Date().toISOString();

  const [guardiasR, puestosR, rondasR, novedadesR, turnosR, vaciosR] = await Promise.all([
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde),
    supabase.from("novedades").select("id,tipo,severidad,hora_captura,estado,puestos(codigo),guardias(nombre)").order("hora_captura", { ascending: false }).limit(8),
    supabase.from("turnos").select("id", { count: "exact", head: true }).lte("inicio_programado", ahora).gte("fin_programado", ahora).neq("estado", "ausente"),
    supabase.from("v_puestos_sin_apertura").select("turno_id", { count: "exact", head: true }),
  ]);

  const novedades = novedadesR.data ?? [];
  const alertas = (vaciosR.count ?? 0) + novedades.filter((n) => n.estado === "registrada").length;

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><div className="flex items-center gap-2"><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span><Link href="/admin" className="rounded-xl border border-[#27425e] bg-[#07172a] px-3 py-2 text-sm text-[#8ddaff]">Panel admin</Link></div></header>

        <section className="mt-7"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Central operativa</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Monitoreo de la operación</h1><p className="mt-2 text-sm text-slate-400">Vista en tiempo real para revisar cobertura, rondas, turnos y alertas.</p></section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metrica titulo="Personal" valor={guardiasR.count ?? 0} icono={<IconoPersona className="h-6 w-6" />} />
          <Metrica titulo="Puestos" valor={puestosR.count ?? 0} icono={<IconoEscudoOk className="h-6 w-6" />} />
          <Metrica titulo="Turnos activos" valor={turnosR.count ?? 0} icono={<IconoTurno className="h-6 w-6" />} />
          <Metrica titulo="Rondas 24h" valor={rondasR.count ?? 0} icono={<IconoCiclo className="h-6 w-6" />} />
          <Metrica titulo="Alertas" valor={alertas} icono={<IconoAlerta className="h-6 w-6" />} emergencia={alertas > 0} />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><h2 className="text-lg font-semibold">Control rápido</h2><div className="mt-4 grid grid-cols-2 gap-3"><Accion href="/operacion/turnos" texto="Turnos"/><Accion href="/operacion/rondas" texto="Rondas"/><Accion href="/operacion/novedades" texto="Incidentes"/><Accion href="/operacion/custodias" texto="Custodias"/><Accion href="/operacion/personal" texto="Personal"/><Accion href="/operacion/reportes" texto="Reportes"/></div></section>

          <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="flex items-center justify-between border-b border-[#20374e] px-4 py-4"><h2 className="flex items-center gap-2 text-lg font-semibold"><IconoLista className="h-5 w-5 text-[#0788ff]"/> Actividad reciente</h2><Link href="/operacion/novedades" className="text-sm text-[#0788ff]">Ver todo</Link></div><div className="divide-y divide-[#20374e]">{novedades.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Todavía no hay actividad registrada.</p> : novedades.map((novedad) => <article key={novedad.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3.5"><span className={`grid h-10 w-10 place-items-center rounded-full border ${novedad.severidad === "emergencia" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-[#0788ff]/40 bg-[#0788ff]/10 text-[#49b6ff]"}`}>{novedad.severidad === "emergencia" ? "!" : "✓"}</span><div className="min-w-0"><p className="truncate font-medium">{novedad.tipo}</p><p className="truncate text-sm text-slate-400">{uno(novedad.puestos)?.codigo ?? uno(novedad.guardias)?.nombre ?? "Central"}</p></div><time className="text-xs text-slate-400">{horaEcuador(novedad.hora_captura)}</time></article>)}</div></section>
        </div>
      </div>
    </main>
  );
}

function Metrica({ titulo, valor, icono, emergencia = false }: { titulo: string; valor: number; icono: React.ReactNode; emergencia?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className={`flex items-center gap-2 ${emergencia ? "text-red-400" : "text-[#0788ff]"}`}>{icono}<span className="text-sm text-slate-300">{titulo}</span></div><p className={`mt-3 text-3xl font-bold ${emergencia ? "text-red-400" : "text-white"}`}>{valor}</p></article>; }
function Accion({ href, texto }: { href: string; texto: string }) { return <Link href={href} className="grid min-h-20 place-items-center rounded-xl border border-[#27425e] bg-[#061426] px-3 text-center text-sm font-medium text-slate-300 transition hover:border-[#0788ff]/60 hover:text-white">{texto}</Link>; }
