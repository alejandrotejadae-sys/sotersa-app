import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoEscudoOk, IconoFlecha, IconoLista, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Reporte de custodias — SOTERSA" };
export const dynamic = "force-dynamic";

type PuestoCustodia = {
  id: string;
  codigo: string;
  nombre: string;
  origen: string | null;
  destino: string | null;
  empresas_cliente: { nombre: string } | { nombre: string }[] | null;
};

type TurnoReporte = {
  id: string;
  puesto_id: string;
  inicio_programado: string;
  fin_programado: string;
  estado: string;
  guardias: { nombre: string } | { nombre: string }[] | null;
};

type NovedadReporte = {
  id: string;
  puesto_id: string | null;
  severidad: string;
  estado: string;
  foto_url: string | null;
  lat: number | null;
  lng: number | null;
};

type AperturaReporte = {
  turno_id: string;
  hora_captura: string;
  firma_saliente_url: string | null;
};

export default async function PaginaReporteCustodias() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const desde = ahoraConDesfase(-30 * 24);
  const hasta = new Date().toISOString();

  const { data: puestosData, error: puestosError } = await supabase
    .from("puestos")
    .select("id,codigo,nombre,origen,destino,empresas_cliente(nombre)")
    .eq("tipo_servicio", "custodia_armada")
    .order("codigo");

  const puestos = (puestosData ?? []) as PuestoCustodia[];
  const idsPuestos = puestos.map((puesto) => puesto.id);

  const [turnosR, novedadesR] = await Promise.all([
    idsPuestos.length
      ? supabase
          .from("turnos")
          .select("id,puesto_id,inicio_programado,fin_programado,estado,guardias(nombre)")
          .in("puesto_id", idsPuestos)
          .gte("inicio_programado", desde)
          .lte("inicio_programado", hasta)
          .order("inicio_programado", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    idsPuestos.length
      ? supabase
          .from("novedades")
          .select("id,puesto_id,severidad,estado,foto_url,lat,lng")
          .in("puesto_id", idsPuestos)
          .gte("hora_captura", desde)
          .lte("hora_captura", hasta)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const turnos = (turnosR.data ?? []) as TurnoReporte[];
  const novedades = (novedadesR.data ?? []) as NovedadReporte[];
  const idsTurnos = turnos.map((turno) => turno.id);
  const aperturasR = idsTurnos.length
    ? await supabase.from("aperturas_turno").select("turno_id,hora_captura,firma_saliente_url").in("turno_id", idsTurnos)
    : { data: [] as AperturaReporte[], error: null };
  const aperturas = (aperturasR.data ?? []) as AperturaReporte[];
  const aperturaPorTurno = new Map(aperturas.map((apertura) => [apertura.turno_id, apertura]));
  const puestoPorId = new Map(puestos.map((puesto) => [puesto.id, puesto]));

  const abiertos = turnos.filter((turno) => turno.estado === "abierto").length;
  const cerrados = turnos.filter((turno) => turno.estado === "cerrado").length;
  const conApertura = turnos.filter((turno) => aperturaPorTurno.has(turno.id)).length;
  const conFirma = turnos.filter((turno) => Boolean(aperturaPorTurno.get(turno.id)?.firma_saliente_url)).length;
  const emergencias = novedades.filter((novedad) => novedad.severidad === "emergencia" && novedad.estado !== "cerrada").length;
  const evidencias = novedades.filter((novedad) => novedad.foto_url || (novedad.lat != null && novedad.lng != null)).length;
  const coberturaApertura = turnos.length ? Math.round((conApertura / turnos.length) * 100) : 100;
  const cierreFirmado = cerrados ? Math.round((conFirma / cerrados) * 100) : 100;

  const error = puestosError || turnosR.error || novedadesR.error || aperturasR.error;

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/operacion/custodias" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver a custodias</Link>

        <section className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoLista className="h-6 w-6" /> Inteligencia de custodia</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Reporte de custodias armadas</h1><p className="mt-1 text-sm text-slate-400">Trazabilidad consolidada de los últimos 30 días: asignación, apertura, cierre, incidencias y evidencia.</p></div>
          <Link href="/operacion/reportes" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#27425e] bg-[#07172a] px-4 text-sm font-semibold text-slate-300">Reportes generales</Link>
        </section>

        {error && <p className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm text-red-200">Algunos datos de custodia no pudieron cargarse. Actualiza la pantalla antes de usar el reporte como cierre operativo.</p>}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Metrica titulo="Servicios" valor={puestos.length} detalle="rutas registradas" icono={<IconoEscudoOk className="h-6 w-6" />} />
          <Metrica titulo="Turnos" valor={turnos.length} detalle="últimos 30 días" icono={<IconoTurno className="h-6 w-6" />} />
          <Metrica titulo="En curso" valor={abiertos} detalle="turnos abiertos" icono={<IconoPersona className="h-6 w-6" />} normal={abiertos > 0} />
          <Metrica titulo="Apertura" valor={`${coberturaApertura}%`} detalle={`${conApertura}/${turnos.length} con registro`} icono={<IconoEscudoOk className="h-6 w-6" />} normal={coberturaApertura >= 90} />
          <Metrica titulo="Cierre firmado" valor={`${cierreFirmado}%`} detalle={`${conFirma}/${cerrados} cierres`} icono={<IconoLista className="h-6 w-6" />} normal={cierreFirmado >= 90} />
          <Metrica titulo="Emergencias" valor={emergencias} detalle={`${evidencias} evidencias`} icono={<IconoAlerta className="h-6 w-6" />} emergencia={emergencias > 0} />
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95">
          <div className="border-b border-[#20374e] px-4 py-4"><h2 className="text-lg font-semibold">Trazabilidad por turno</h2><p className="mt-1 text-xs text-slate-500">Los registros provienen de Turnos, Aperturas y Novedades existentes; no se generan estados simulados.</p></div>
          {turnos.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-500">No hay turnos de custodia dentro del periodo.</p> : <div className="divide-y divide-[#20374e]">{turnos.slice(0, 100).map((turno) => {
            const puesto = puestoPorId.get(turno.puesto_id);
            const apertura = aperturaPorTurno.get(turno.id);
            const guardia = uno(turno.guardias)?.nombre ?? "Agente no disponible";
            const novedadesTurno = novedades.filter((novedad) => novedad.puesto_id === turno.puesto_id);
            const evidenciaTurno = novedadesTurno.filter((novedad) => novedad.foto_url || (novedad.lat != null && novedad.lng != null)).length;
            return <article key={turno.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.25fr_1fr_1fr_0.8fr_auto] lg:items-center"><div className="min-w-0"><p className="truncate font-medium">{puesto?.codigo ?? "Custodia"} · {puesto?.nombre ?? "Servicio"}</p><p className="mt-1 truncate text-xs text-slate-500">{uno(puesto?.empresas_cliente)?.nombre ?? "Cliente no asignado"} · {puesto?.origen ?? "Origen pendiente"} → {puesto?.destino ?? "Destino pendiente"}</p></div><div><p className="text-sm text-slate-300">{guardia}</p><p className="mt-1 text-xs text-slate-500">{fechaHoraEcuador(turno.inicio_programado)}</p></div><div className="text-xs text-slate-400"><p>{apertura ? `Apertura: ${fechaHoraEcuador(apertura.hora_captura)}` : "Sin apertura registrada"}</p><p className="mt-1">{turno.estado === "cerrado" ? (apertura?.firma_saliente_url ? "Cierre firmado" : "Cierre sin firma vinculada") : `Estado: ${turno.estado}`}</p></div><div className="text-xs text-slate-400"><p>{novedadesTurno.length} novedades</p><p className="mt-1">{evidenciaTurno} con evidencia</p></div>{puesto && <Link href={`/operacion/custodias/${puesto.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#0788ff]/40 bg-[#0788ff]/8 px-3 text-xs font-semibold text-[#8ddaff]">Abrir ficha</Link>}</article>;
          })}</div>}
        </section>

        <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5"><h2 className="font-semibold">Criterio de control</h2><p className="mt-2 text-sm leading-6 text-slate-400">La apertura confirma inicio operativo. El cierre firmado se obtiene de la evidencia asociada al turno cerrado. Las emergencias abiertas requieren revisión antes del cierre administrativo del servicio.</p></section>
      </div>
    </main>
  );
}

function Metrica({ titulo, valor, detalle, icono, normal = false, emergencia = false }: { titulo: string; valor: string | number; detalle: string; icono: React.ReactNode; normal?: boolean; emergencia?: boolean }) {
  const tono = emergencia ? "text-red-400" : normal ? "text-emerald-400" : "text-[#49b6ff]";
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className={`flex items-center gap-2 ${tono}`}>{icono}<span className="text-sm text-slate-300">{titulo}</span></div><p className={`mt-3 text-3xl font-bold ${emergencia ? "text-red-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-500">{detalle}</p></article>;
}