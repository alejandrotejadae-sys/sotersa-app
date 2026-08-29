import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoCiclo, IconoEscudoOk, IconoFlecha, IconoLista, IconoPersona, IconoRonda } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";
import { BotonExportar } from "./boton-exportar";

export const metadata = { title: "Reportes operativos — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaReportes() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const desde30 = ahoraConDesfase(-30 * 24);
  const hasta = new Date().toISOString();

  const [turnosR, rondasR, novedadesR, slaR, guardiasR, puestosR] = await Promise.all([
    supabase.from("turnos").select("id,estado,inicio_programado,aperturas_turno(id)").gte("inicio_programado", desde30).lte("inicio_programado", hasta),
    supabase.from("rondas").select("id,hora_captura,turnos(puestos(id,codigo,nombre))").gte("hora_captura", desde30).order("hora_captura", { ascending: false }).limit(500),
    supabase.from("novedades").select("id,tipo,severidad,estado,hora_captura,visible_cliente,puestos(id,codigo,nombre)").gte("hora_captura", desde30).order("hora_captura", { ascending: false }).limit(500),
    supabase.from("v_sla_novedades").select("id,cumple_sla,minutos_aviso,hora_captura").gte("hora_captura", desde30),
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true),
  ]);

  const turnos = turnosR.data ?? [];
  const rondas = rondasR.data ?? [];
  const novedades = novedadesR.data ?? [];
  const sla = slaR.data ?? [];
  const conApertura = turnos.filter((turno) => (turno.aperturas_turno?.length ?? 0) > 0).length;
  const cobertura = turnos.length ? Math.round((conApertura / turnos.length) * 100) : 100;
  const medidos = sla.filter((registro) => registro.cumple_sla !== null);
  const slaCumplido = medidos.length ? Math.round((medidos.filter((registro) => registro.cumple_sla).length / medidos.length) * 100) : 100;
  const emergencias = novedades.filter((novedad) => novedad.severidad === "emergencia").length;
  const dias = construirDias();
  const actividad = dias.map((dia) => ({
    ...dia,
    rondas: rondas.filter((ronda) => claveDia(ronda.hora_captura) === dia.clave).length,
    novedades: novedades.filter((novedad) => claveDia(novedad.hora_captura) === dia.clave).length,
  }));
  const maxActividad = Math.max(1, ...actividad.flatMap((dia) => [dia.rondas, dia.novedades]));
  const severidades = [
    { etiqueta: "Informativas", valor: novedades.filter((novedad) => novedad.severidad === "informativa").length, tono: "bg-[#0788ff]" },
    { etiqueta: "Novedades", valor: novedades.filter((novedad) => novedad.severidad === "novedad").length, tono: "bg-amber-400" },
    { etiqueta: "Emergencias", valor: emergencias, tono: "bg-red-500" },
  ];
  const rendimiento = rendimientoPorPuesto(rondas);
  const filas = [
    ...rondas.map((ronda) => { const turno = uno(ronda.turnos); const puesto = turno ? uno(turno.puestos) : null; return { fecha: fechaHoraEcuador(ronda.hora_captura), categoria: "Ronda", puesto: puesto?.codigo ?? "Sin puesto", detalle: "Punto de control registrado", estado: "Completada" }; }),
    ...novedades.map((novedad) => { const puesto = uno(novedad.puestos); return { fecha: fechaHoraEcuador(novedad.hora_captura), categoria: "Novedad", puesto: puesto?.codigo ?? "Sin puesto", detalle: novedad.tipo, estado: novedad.estado }; }),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <main className="min-h-dvh bg-[#020b18] text-white"><div className="mx-auto min-h-dvh w-full max-w-[1440px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
      <Link href={perfil.rol === "admin" ? "/admin" : "/supervisor"} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

      <section className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoLista className="h-6 w-6" /> Inteligencia operativa</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Reportes y estadísticas</h1><p className="mt-1 text-sm text-slate-400">Indicadores calculados con la operación de los últimos 30 días.</p></div><BotonExportar filas={filas} /></section>

      {(turnosR.error || rondasR.error || novedadesR.error || slaR.error) && <p className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm text-red-200">Algunos indicadores no pudieron cargarse. Actualiza la pantalla para intentarlo nuevamente.</p>}

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6"><Metrica titulo="Cobertura" valor={`${cobertura}%`} detalle={`${conApertura}/${turnos.length} aperturas`} icono={<IconoEscudoOk className="h-6 w-6" />} normal={cobertura >= 90} /><Metrica titulo="SLA" valor={`${slaCumplido}%`} detalle={`${medidos.length} avisos medidos`} icono={<IconoCiclo className="h-6 w-6" />} normal={slaCumplido >= 90} /><Metrica titulo="Rondas" valor={rondas.length} detalle="últimos 30 días" icono={<IconoRonda className="h-6 w-6" />} /><Metrica titulo="Novedades" valor={novedades.length} detalle="reportes registrados" icono={<IconoLista className="h-6 w-6" />} /><Metrica titulo="Emergencias" valor={emergencias} detalle="requieren atención" icono={<IconoAlerta className="h-6 w-6" />} emergencia={emergencias > 0} /><Metrica titulo="Operación" valor={`${guardiasR.count ?? 0}/${puestosR.count ?? 0}`} detalle="agentes / puestos" icono={<IconoPersona className="h-6 w-6" />} /></section>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-8"><CabeceraGrafico titulo="Actividad de los últimos 7 días" detalle="Rondas y novedades por día" /><div className="mt-6 grid h-64 grid-cols-7 items-end gap-2 sm:gap-4">{actividad.map((dia) => <div key={dia.clave} className="flex h-full min-w-0 flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><Barra valor={dia.rondas} max={maxActividad} tono="bg-gradient-to-t from-[#086fe5] to-[#23c8f2]" etiqueta={`${dia.rondas} rondas`} /><Barra valor={dia.novedades} max={maxActividad} tono="bg-gradient-to-t from-amber-600 to-amber-300" etiqueta={`${dia.novedades} novedades`} /></div><p className="mt-3 truncate text-center text-[0.65rem] text-slate-500 sm:text-xs">{dia.etiqueta}</p></div>)}</div><div className="mt-4 flex justify-center gap-5 text-xs text-slate-400"><Leyenda tono="bg-[#0788ff]" texto="Rondas" /><Leyenda tono="bg-amber-400" texto="Novedades" /></div></section>

        <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-4"><CabeceraGrafico titulo="Cumplimiento" detalle="Indicadores de 30 días" /><div className="mt-7 flex items-center justify-around gap-4"><Anillo porcentaje={cobertura} etiqueta="Cobertura" /><Anillo porcentaje={slaCumplido} etiqueta="SLA" /></div><div className="mt-7 rounded-xl bg-[#041225] p-3 text-sm text-slate-400"><p className="flex items-center justify-between"><span>Turnos evaluados</span><strong className="text-white">{turnos.length}</strong></p><p className="mt-2 flex items-center justify-between"><span>Avisos medidos</span><strong className="text-white">{medidos.length}</strong></p></div></section>

        <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-5"><CabeceraGrafico titulo="Severidad de novedades" detalle="Distribución de reportes" /><div className="mt-6 space-y-5">{severidades.map((item) => <BarraHorizontal key={item.etiqueta} {...item} total={Math.max(1, novedades.length)} />)}</div>{novedades.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">Sin novedades registradas en el periodo.</p>}</section>

        <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-7"><CabeceraGrafico titulo="Rondas por puesto" detalle="Puestos con mayor actividad" /><div className="mt-5 space-y-3">{rendimiento.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Todavía no hay rondas asociadas a puestos.</p> : rendimiento.map((puesto, indice) => <div key={puesto.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3"><span className="text-sm text-slate-500">{indice + 1}</span><div className="min-w-0"><div className="flex justify-between gap-3 text-sm"><span className="truncate">{puesto.codigo} · {puesto.nombre}</span><span className="text-slate-400">{puesto.total}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#13283d]"><div className="h-full rounded-full bg-gradient-to-r from-[#087ff0] to-[#23d3ec]" style={{ width: `${Math.max(4, (puesto.total / rendimiento[0].total) * 100)}%` }} /></div></div><IconoFlecha className="h-4 w-4 text-slate-600" /></div>)}</div></section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className="flex items-start gap-3"><IconoEscudoOk className="mt-0.5 h-6 w-6 shrink-0 text-[#0788ff]" /><div><h2 className="font-semibold">Lectura del reporte</h2><p className="mt-1 text-sm leading-6 text-slate-400">La cobertura compara turnos programados con aperturas registradas. El SLA mide si las novedades fueron notificadas dentro del tiempo comprometido. Los datos se filtran automáticamente según el acceso del administrador o la zona del supervisor.</p></div></div></section>
    </div></main>
  );
}

function Metrica({ titulo, valor, detalle, icono, normal = false, emergencia = false }: { titulo: string; valor: string | number; detalle: string; icono: React.ReactNode; normal?: boolean; emergencia?: boolean }) { const tono = emergencia ? "text-red-400" : normal ? "text-emerald-400" : "text-[#49b6ff]"; return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className={`flex items-center gap-2 ${tono}`}>{icono}<span className="text-sm text-slate-300">{titulo}</span></div><p className={`mt-3 text-3xl font-bold ${emergencia ? "text-red-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-500">{detalle}</p></article>; }
function CabeceraGrafico({ titulo, detalle }: { titulo: string; detalle: string }) { return <div><h2 className="font-semibold">{titulo}</h2><p className="mt-1 text-xs text-slate-500">{detalle}</p></div>; }
function Barra({ valor, max, tono, etiqueta }: { valor: number; max: number; tono: string; etiqueta: string }) { return <div title={etiqueta} aria-label={etiqueta} className={`min-h-1 w-3 rounded-t-md sm:w-5 ${tono}`} style={{ height: `${Math.max(valor ? 8 : 2, (valor / max) * 100)}%` }} />; }
function Leyenda({ tono, texto }: { tono: string; texto: string }) { return <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${tono}`} />{texto}</span>; }
function Anillo({ porcentaje, etiqueta }: { porcentaje: number; etiqueta: string }) { const valor = Math.max(0, Math.min(100, porcentaje)); return <div className="text-center"><div className="grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(#16c7ea ${valor}%, #17324b 0)` }}><div className="grid h-[5.35rem] w-[5.35rem] place-items-center rounded-full bg-[#07172a]"><span className="text-2xl font-bold">{valor}%</span></div></div><p className="mt-3 text-xs text-slate-400">{etiqueta}</p></div>; }
function BarraHorizontal({ etiqueta, valor, total, tono }: { etiqueta: string; valor: number; total: number; tono: string }) { return <div><div className="flex justify-between text-sm"><span className="text-slate-300">{etiqueta}</span><span className="font-medium">{valor}</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#13283d]"><div className={`h-full rounded-full ${tono}`} style={{ width: `${(valor / total) * 100}%` }} /></div></div>; }
function construirDias() { const hoy = new Date(); return Array.from({ length: 7 }, (_, indice) => { const fecha = new Date(hoy.getTime() - (6 - indice) * 24 * 60 * 60 * 1000); return { clave: claveDia(fecha.toISOString()), etiqueta: new Intl.DateTimeFormat("es-EC", { weekday: "short", timeZone: "America/Guayaquil" }).format(fecha).replace(".", "") }; }); }
function claveDia(fecha: string) { return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Guayaquil" }).format(new Date(fecha)); }
function rendimientoPorPuesto(rondas: { turnos: { puestos: { id: string; codigo: string; nombre: string } | { id: string; codigo: string; nombre: string }[] | null } | { puestos: { id: string; codigo: string; nombre: string } | { id: string; codigo: string; nombre: string }[] | null }[] | null }[]) { const mapa = new Map<string, { id: string; codigo: string; nombre: string; total: number }>(); for (const ronda of rondas) { const turno = uno(ronda.turnos); const puesto = turno ? uno(turno.puestos) : null; if (!puesto) continue; const actual = mapa.get(puesto.id); mapa.set(puesto.id, actual ? { ...actual, total: actual.total + 1 } : { ...puesto, total: 1 }); } return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, 6); }
