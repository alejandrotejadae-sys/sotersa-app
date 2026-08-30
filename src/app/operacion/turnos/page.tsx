import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoEscudoOk, IconoFlecha, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador, horaEcuador, uno } from "@/lib/sesion";
import { FormularioTurno } from "./formulario-turno";
import { FormularioCuadrante } from "./formulario-cuadrante";

export const metadata = { title: "Turnos y asistencia — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaTurnos() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const hoy = fechaEcuador();
  const inicioHoy = new Date(`${hoy}T00:00:00-05:00`);
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
  const finPeriodo = new Date(inicioHoy.getTime() + 8 * 24 * 60 * 60 * 1000);

  const [guardiasR, puestosR, turnosR, vaciosR] = await Promise.all([
    supabase.from("guardias").select("id,nombre").eq("activo", true).order("nombre"),
    supabase.from("puestos").select("id,codigo,nombre").eq("activo", true).order("codigo"),
    supabase.from("turnos").select("id,tipo,inicio_programado,fin_programado,estado,guardias(nombre),puestos(codigo,nombre),aperturas_turno(id,hora_captura,checklist,observacion)").lt("inicio_programado", finPeriodo.toISOString()).gt("fin_programado", inicioHoy.toISOString()).order("inicio_programado"),
    supabase.from("v_puestos_sin_apertura").select("turno_id,puesto_codigo,puesto_nombre,guardia_nombre,minutos_de_retraso").order("minutos_de_retraso", { ascending: false }),
  ]);

  const guardias = guardiasR.data ?? [];
  const puestos = puestosR.data ?? [];
  const turnos = turnosR.data ?? [];
  const vacios = vaciosR.data ?? [];
  const turnosHoy = turnos.filter((turno) => new Date(turno.inicio_programado) < finHoy && new Date(turno.fin_programado) > inicioHoy);
  const abiertos = turnosHoy.filter((turno) => (turno.aperturas_turno?.length ?? 0) > 0);
  const pendientes = turnosHoy.filter((turno) => turno.estado === "programado" && (turno.aperturas_turno?.length ?? 0) === 0);

  return (
    <main className="min-h-dvh bg-[#020b18] text-white"><div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
      <Link href={perfil.rol === "admin" ? "/admin" : "/supervisor"} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

      <section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoTurno className="h-6 w-6" /> Gestión operativa</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Turnos y asistencia</h1><p className="mt-1 text-sm text-slate-400">Programación, cobertura y aperturas de puesto en tiempo real.</p></section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Resumen titulo="Programados hoy" valor={turnosHoy.length} /><Resumen titulo="En puesto" valor={abiertos.length} normal /><Resumen titulo="Pendientes" valor={pendientes.length} alerta={pendientes.length > 0} /><Resumen titulo="Alertas de apertura" valor={vacios.length} emergencia={vacios.length > 0} /></section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        {perfil.rol === "admin" ? <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:sticky lg:top-5"><div className="mb-4 flex items-center gap-3 border-b border-[#20374e] pb-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0788ff]/12 text-[#49b6ff]"><IconoTurno className="h-6 w-6" /></span><div><h2 className="font-semibold">Programar turno</h2><p className="text-xs text-slate-500">La disponibilidad se valida antes de guardar.</p></div></div><FormularioTurno guardias={guardias} puestos={puestos} /><div className="mt-5 border-t border-[#20374e] pt-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0788ff]/12 text-[#49b6ff]"><IconoTurno className="h-6 w-6" /></span><div><h2 className="font-semibold">Generar cuadrante</h2><p className="text-xs text-slate-500">Varios días de una vez, con los fijos del puesto.</p></div></div><FormularioCuadrante puestos={puestos} /></div></section> : <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5"><IconoEscudoOk className="h-8 w-8 text-[#0788ff]" /><h2 className="mt-3 font-semibold">Vista de supervisión</h2><p className="mt-2 text-sm leading-6 text-slate-400">Puedes revisar la cobertura y la asistencia. La programación de turnos está reservada para el administrador.</p></section>}

        <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="flex items-center justify-between border-b border-[#20374e] px-4 py-4"><h2 className="font-semibold">Cobertura de hoy</h2><span className="text-xs text-slate-500">{hoy}</span></div><div className="divide-y divide-[#20374e]">{turnosHoy.length === 0 ? <Vacio texto="No hay turnos programados para hoy." /> : turnosHoy.map((turno) => <FilaTurno key={turno.id} turno={turno} />)}</div></section>
      </div>

      {vacios.length > 0 && <section className="mt-5 overflow-hidden rounded-2xl border border-red-500/35 bg-red-500/8"><div className="flex items-center gap-2 border-b border-red-500/20 px-4 py-4 text-red-300"><IconoAlerta className="h-5 w-5" /><h2 className="font-semibold">Puestos sin apertura</h2></div><div className="grid divide-y divide-red-500/15 lg:grid-cols-2 lg:divide-y-0">{vacios.map((vacio) => <article key={vacio.turno_id} className="flex items-center justify-between gap-4 border-red-500/15 px-4 py-3.5 lg:border-b lg:odd:border-r"><div><p className="font-medium">{vacio.puesto_codigo} · {vacio.puesto_nombre}</p><p className="mt-1 text-sm text-slate-400">{vacio.guardia_nombre}</p></div><span className="shrink-0 rounded-full bg-red-500/12 px-3 py-1.5 text-xs font-medium text-red-300">{Math.round(vacio.minutos_de_retraso)} min</span></article>)}</div></section>}

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="flex items-center justify-between border-b border-[#20374e] px-4 py-4"><h2 className="font-semibold">Próximos 7 días</h2><span className="text-xs text-slate-500">{turnos.length} asignaciones</span></div><div className="grid divide-y divide-[#20374e] lg:grid-cols-2 lg:divide-y-0">{turnos.length === 0 ? <Vacio texto="No existen asignaciones próximas." /> : turnos.map((turno) => <FilaProxima key={turno.id} turno={turno} />)}</div></section>
    </div></main>
  );
}

type TurnoVista = { id: string; tipo: string; inicio_programado: string; fin_programado: string; estado: string; guardias: { nombre: string } | { nombre: string }[] | null; puestos: { codigo: string; nombre: string } | { codigo: string; nombre: string }[] | null; aperturas_turno: { id: string; hora_captura: string; checklist: unknown; observacion: string | null }[] | null };

function FilaTurno({ turno }: { turno: TurnoVista }) { const guardia = uno(turno.guardias); const puesto = uno(turno.puestos); const apertura = turno.aperturas_turno?.[0]; const verificados = apertura ? Object.values((apertura.checklist ?? {}) as Record<string, boolean>).filter(Boolean).length : 0; return <article className="grid grid-cols-[2.7rem_1fr_auto] items-center gap-3 px-4 py-3.5"><span className={`grid h-11 w-11 place-items-center rounded-full border ${apertura ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300" : "border-amber-500/35 bg-amber-500/10 text-amber-300"}`}>{apertura ? "✓" : "○"}</span><div className="min-w-0"><p className="truncate font-medium">{guardia?.nombre ?? "Agente de seguridad"}</p><p className="truncate text-sm text-slate-400">{puesto ? `${puesto.codigo} · ${puesto.nombre}` : "Puesto"}</p><p className="mt-1 text-xs text-slate-500">{horaEcuador(turno.inicio_programado)}–{horaEcuador(turno.fin_programado)}{apertura ? ` · ${verificados}/4 equipos` : " · sin apertura"}</p></div><EstadoTurno abierto={Boolean(apertura)} estado={turno.estado} /></article>; }
function FilaProxima({ turno }: { turno: TurnoVista }) { const guardia = uno(turno.guardias); const puesto = uno(turno.puestos); return <article className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-[#20374e] px-4 py-3.5 lg:border-b lg:odd:border-r"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#27425e] bg-[#061426] text-[#49b6ff]"><IconoPersona className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate font-medium">{guardia?.nombre ?? "Agente de seguridad"}</p><p className="truncate text-sm text-slate-400">{puesto?.codigo ?? "Puesto"} · {etiquetaTipo(turno.tipo)}</p></div><time className="text-right text-xs leading-5 text-slate-400">{fechaHoraEcuador(turno.inicio_programado)}</time></article>; }
function EstadoTurno({ abierto, estado }: { abierto: boolean; estado: string }) { const texto = abierto ? "En puesto" : estado === "ausente" ? "Ausente" : estado === "cerrado" ? "Cerrado" : "Programado"; const clase = abierto ? "bg-emerald-500/12 text-emerald-300" : estado === "ausente" ? "bg-red-500/12 text-red-300" : "bg-slate-500/10 text-slate-300"; return <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${clase}`}>{texto}</span>; }
function Resumen({ titulo, valor, normal = false, alerta = false, emergencia = false }: { titulo: string; valor: number; normal?: boolean; alerta?: boolean; emergencia?: boolean }) { const color = emergencia ? "text-red-400" : alerta ? "text-amber-300" : normal ? "text-emerald-400" : "text-white"; return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${color}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function Vacio({ texto }: { texto: string }) { return <p className="col-span-full px-4 py-8 text-center text-sm text-slate-400">{texto}</p>; }
function fechaEcuador() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function etiquetaTipo(tipo: string) { return ({ fijo_dia: "Fijo día", fijo_noche: "Fijo noche", saca_francos: "Saca francos", supervision: "Supervisión" } as Record<string, string>)[tipo] ?? tipo; }
