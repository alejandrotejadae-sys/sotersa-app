import Link from "next/link";
import { notFound } from "next/navigation";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoEscudoOk, IconoFlecha, IconoLista, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Detalle de custodia — SOTERSA" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

type TurnoCustodia = {
  id: string;
  inicio_programado: string;
  fin_programado: string;
  estado: "programado" | "abierto" | "cerrado" | "ausente";
  guardias: { id: string; nombre: string; telefono: string | null } | { id: string; nombre: string; telefono: string | null }[] | null;
};

type NovedadCustodia = {
  id: string;
  tipo: string;
  severidad: "informativa" | "novedad" | "emergencia";
  estado: "registrada" | "validada" | "notificada" | "cerrada";
  hora_captura: string;
  descripcion: string;
  foto_url: string | null;
  lat: number | null;
  lng: number | null;
  guardias: { nombre: string } | { nombre: string }[] | null;
};

export default async function PaginaDetalleCustodia({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await exigirPerfil(["admin", "supervisor"]);
  const { data: puesto } = await supabase
    .from("puestos")
    .select("id,codigo,nombre,activo,armado,origen,destino,origen_lat,origen_lng,destino_lat,destino_lng,empresas_cliente(nombre)")
    .eq("id", id)
    .eq("tipo_servicio", "custodia_armada")
    .maybeSingle();

  if (!puesto) notFound();

  const [{ data: turnosData }, { data: novedadesData }] = await Promise.all([
    supabase
      .from("turnos")
      .select("id,inicio_programado,fin_programado,estado,guardias(id,nombre,telefono)")
      .eq("puesto_id", id)
      .order("inicio_programado", { ascending: false })
      .limit(20),
    supabase
      .from("novedades")
      .select("id,tipo,severidad,estado,hora_captura,descripcion,foto_url,lat,lng,guardias(nombre)")
      .eq("puesto_id", id)
      .order("hora_captura", { ascending: false })
      .limit(20),
  ]);

  const turnos = (turnosData ?? []) as TurnoCustodia[];
  const novedades = (novedadesData ?? []) as NovedadCustodia[];
  const idsTurnos = turnos.map((turno) => turno.id);
  const { data: aperturasData } = idsTurnos.length
    ? await supabase.from("aperturas_turno").select("turno_id,hora_captura,firma_saliente_url").in("turno_id", idsTurnos)
    : { data: [] as { turno_id: string; hora_captura: string; firma_saliente_url: string | null }[] };
  const aperturas = new Map((aperturasData ?? []).map((apertura) => [apertura.turno_id, apertura]));

  const ahora = Date.now();
  const turnoVigente = turnos.find((turno) => {
    const inicio = new Date(turno.inicio_programado).getTime();
    const fin = new Date(turno.fin_programado).getTime();
    return inicio <= ahora && fin >= ahora && turno.estado !== "ausente" && turno.estado !== "cerrado";
  });
  const proximo = turnos
    .filter((turno) => new Date(turno.inicio_programado).getTime() > ahora && turno.estado === "programado")
    .sort((a, b) => new Date(a.inicio_programado).getTime() - new Date(b.inicio_programado).getTime())[0];
  const agenteActual = turnoVigente ? uno(turnoVigente.guardias) : null;
  const cliente = uno(puesto.empresas_cliente)?.nombre ?? "Cliente no asignado";
  const emergenciasAbiertas = novedades.filter((novedad) => novedad.severidad === "emergencia" && novedad.estado !== "cerrada").length;
  const conEvidencia = novedades.filter((novedad) => Boolean(novedad.foto_url)).length;
  const conGps = novedades.filter((novedad) => novedad.lat != null && novedad.lng != null).length;
  const rutaLista = puesto.origen_lat != null && puesto.origen_lng != null && puesto.destino_lat != null && puesto.destino_lng != null;

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1380px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> Central en línea</span></header>
        <Link href="/operacion/custodias" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver a custodias</Link>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5 lg:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#49b6ff]">{puesto.codigo} · {cliente}</p>
            <h1 className="mt-2 text-3xl font-bold lg:text-4xl">{puesto.nombre}</h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Dato titulo="Origen" valor={puesto.origen ?? "Pendiente"} />
              <Dato titulo="Destino" valor={puesto.destino ?? "Pendiente"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><Etiqueta texto={puesto.activo ? "Servicio activo" : "Servicio inactivo"} normal={puesto.activo} /><Etiqueta texto={puesto.armado ? "Custodia armada" : "Revisar armamento"} normal={puesto.armado} /><Etiqueta texto={rutaLista ? "Ruta georreferenciada" : "Ruta sin coordenadas"} normal={rutaLista} /></div>
          </article>

          <article className={`rounded-2xl border p-5 ${turnoVigente ? "border-emerald-500/30 bg-emerald-500/8" : "border-[#27425e] bg-[#07172a]/95"}`}>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Estado operativo</p>
            <h2 className={`mt-2 text-2xl font-bold ${turnoVigente ? "text-emerald-300" : "text-white"}`}>{turnoVigente ? (turnoVigente.estado === "abierto" ? "Custodia en curso" : "Turno vigente por abrir") : "Sin custodia en curso"}</h2>
            {turnoVigente ? <div className="mt-4"><p className="text-sm text-slate-400">Agente asignado</p><p className="mt-1 text-lg font-semibold">{agenteActual?.nombre ?? "Agente no disponible"}</p><p className="mt-1 text-sm text-slate-400">{fechaHoraEcuador(turnoVigente.inicio_programado)} → {fechaHoraEcuador(turnoVigente.fin_programado)}</p></div> : proximo ? <p className="mt-4 text-sm leading-6 text-slate-400">Próxima asignación: {fechaHoraEcuador(proximo.inicio_programado)} con {uno(proximo.guardias)?.nombre ?? "agente por confirmar"}.</p> : <p className="mt-4 text-sm leading-6 text-slate-400">No existe una asignación vigente ni futura para esta custodia.</p>}
            <Link href="/operacion/turnos" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0788ff]/50 bg-[#0788ff]/10 px-4 text-sm font-semibold text-[#8ddaff]"><IconoTurno className="h-5 w-5" /> Gestionar asignación</Link>
          </article>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Resumen titulo="Turnos registrados" valor={turnos.length} />
          <Resumen titulo="Novedades" valor={novedades.length} />
          <Resumen titulo="Con evidencia" valor={conEvidencia} />
          <Resumen titulo="Emergencias abiertas" valor={emergenciasAbiertas} alerta={emergenciasAbiertas > 0} />
        </section>

        <section className="mt-4 grid items-start gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.15em] text-slate-500">Trazabilidad</p><h2 className="mt-1 text-xl font-semibold">Turnos de custodia</h2></div><IconoPersona className="h-7 w-7 text-[#0788ff]" /></div>
            {turnos.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-[#27425e] p-4 text-sm text-slate-500">Todavía no hay agentes programados para este servicio.</p> : <div className="mt-4 space-y-3">{turnos.slice(0, 8).map((turno) => { const agente = uno(turno.guardias); const apertura = aperturas.get(turno.id); const cerradoConFirma = turno.estado === "cerrado" && Boolean(apertura?.firma_saliente_url); return <div key={turno.id} className="rounded-xl border border-[#27425e] bg-[#041225] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium text-slate-200">{agente?.nombre ?? "Agente no disponible"}</p><p className="mt-1 text-xs text-slate-500">{fechaHoraEcuador(turno.inicio_programado)} → {fechaHoraEcuador(turno.fin_programado)}</p></div><EstadoTurno estado={turno.estado} /></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{apertura ? `Apertura ${fechaHoraEcuador(apertura.hora_captura)}` : "Sin apertura"}</span>{turno.estado === "cerrado" && <span className={cerradoConFirma ? "text-emerald-400" : "text-amber-300"}>{cerradoConFirma ? "Cierre firmado" : "Cierre sin firma vinculada"}</span>}</div></div>; })}</div>}
          </article>

          <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.15em] text-slate-500">Bitácora</p><h2 className="mt-1 text-xl font-semibold">Novedades y evidencias</h2></div><IconoAlerta className="h-7 w-7 text-[#0788ff]" /></div>
            {novedades.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-[#27425e] p-4 text-sm text-slate-500">No hay novedades registradas para esta custodia.</p> : <div className="mt-4 space-y-3">{novedades.slice(0, 10).map((novedad) => <article key={novedad.id} className="rounded-xl border border-[#27425e] bg-[#041225] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-slate-200">{novedad.tipo}</p><p className="mt-1 text-xs text-slate-500">{uno(novedad.guardias)?.nombre ?? "Central"} · {fechaHoraEcuador(novedad.hora_captura)}</p></div><span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${novedad.severidad === "emergencia" ? "bg-red-500/15 text-red-300" : novedad.severidad === "novedad" ? "bg-amber-500/12 text-amber-300" : "bg-blue-500/12 text-blue-300"}`}>{novedad.severidad}</span></div><p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-400">{novedad.descripcion}</p><div className="mt-2 flex flex-wrap gap-2 text-[0.68rem]"><EtiquetaMini texto={novedad.estado} /><EtiquetaMini texto={novedad.foto_url ? "foto" : "sin foto"} normal={Boolean(novedad.foto_url)} /><EtiquetaMini texto={novedad.lat != null && novedad.lng != null ? "GPS" : "sin GPS"} normal={novedad.lat != null && novedad.lng != null} /></div></article>)}</div>}
            <div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href="/operacion/novedades" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/8 px-4 text-sm font-semibold text-[#8ddaff]"><IconoLista className="h-5 w-5" /> Gestionar novedades</Link><Link href="/operacion/reportes" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#041225] px-4 text-sm font-semibold text-slate-300"><IconoEscudoOk className="h-5 w-5 text-[#0788ff]" /> Abrir reportes</Link></div>
          </article>
        </section>

        <section className="mt-4 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5"><h2 className="text-lg font-semibold">Control de evidencia</h2><p className="mt-2 text-sm leading-6 text-slate-400">De {novedades.length} novedades registradas, {conEvidencia} incluyen fotografía y {conGps} incluyen ubicación GPS. La ficha muestra únicamente registros reales almacenados por la operación.</p></section>
      </div>
    </main>
  );
}

function Resumen({ titulo, valor, alerta = false }: { titulo: string; valor: number; alerta?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${alerta ? "text-red-300" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function Dato({ titulo, valor }: { titulo: string; valor: string }) { return <div className="rounded-xl border border-[#27425e] bg-[#041225] p-3"><p className="text-[0.68rem] uppercase tracking-wide text-slate-500">{titulo}</p><p className="mt-1 text-sm font-medium text-slate-200">{valor}</p></div>; }
function Etiqueta({ texto, normal }: { texto: string; normal: boolean }) { return <span className={`rounded-full border px-3 py-1.5 text-xs ${normal ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-300"}`}>{texto}</span>; }
function EtiquetaMini({ texto, normal = false }: { texto: string; normal?: boolean }) { return <span className={`rounded-full px-2 py-1 ${normal ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-500"}`}>{texto}</span>; }
function EstadoTurno({ estado }: { estado: TurnoCustodia["estado"] }) { const clases = estado === "abierto" ? "bg-emerald-500/12 text-emerald-300" : estado === "cerrado" ? "bg-slate-500/10 text-slate-400" : estado === "ausente" ? "bg-red-500/12 text-red-300" : "bg-blue-500/12 text-blue-300"; return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${clases}`}>{estado}</span>; }
