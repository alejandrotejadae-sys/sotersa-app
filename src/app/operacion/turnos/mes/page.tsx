import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoFlecha, IconoTurno } from "@/app/componentes/iconos";
import { exigirPerfil, uno } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { servicio } from "@/lib/servicios";
import { puestosQuePuedeProgramar } from "../permisos";

export const metadata = { title: "Cuadrante mensual — SOTERSA" };
export const dynamic = "force-dynamic";

const ZONA = "-05:00";
const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * El mes de un vistazo: una fila por puesto, una columna por dia. Cada celda
 * dice cuantos turnos hay contra cuantos necesita la modalidad (24 h = 2,
 * 12 h = 1). Verde completo, ambar parcial, rojo vacio. Es la pantalla para
 * encontrar huecos antes de que lleguen.
 */
export default async function PaginaMes({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor", "operativo"]);
  const params = await searchParams;

  const hoyEc = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const mes = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : hoyEc.slice(0, 7);
  const [anio, numMes] = mes.split("-").map(Number);
  const diasEnMes = new Date(Date.UTC(anio, numMes, 0)).getUTCDate();
  const desde = new Date(`${mes}-01T00:00:00${ZONA}`);
  const hasta = new Date(desde.getTime() + diasEnMes * 86400000);
  const anterior = clave(new Date(Date.UTC(anio, numMes - 2, 1)));
  const siguiente = clave(new Date(Date.UTC(anio, numMes, 1)));

  const puestos = await puestosQuePuedeProgramar(supabase, perfil);
  const ids = puestos.map((p) => p.id);
  const { data: turnos } = ids.length
    ? await supabase.from("turnos").select("id,puesto_id,tipo,estado,inicio_programado,fin_programado,guardias(nombre),aperturas_turno(id)").in("puesto_id", ids).lt("inicio_programado", hasta.toISOString()).gte("fin_programado", desde.toISOString()).neq("estado", "ausente").order("inicio_programado")
    : { data: [] };

  // Cada turno cae en el dia (hora Ecuador) en que empieza.
  const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", day: "2-digit" });
  type Celda = { total: number; abiertos: number; agentes: string[] };
  const celdas = new Map<string, Celda>();
  for (const t of turnos ?? []) {
    const inicio = new Date(t.inicio_programado);
    if (inicio < desde || inicio >= hasta) continue;
    const d = Number(fmtDia.format(inicio));
    const k = `${t.puesto_id}/${d}`;
    const c = celdas.get(k) ?? { total: 0, abiertos: 0, agentes: [] };
    c.total += 1;
    if ((t.aperturas_turno?.length ?? 0) > 0 || t.estado === "abierto" || t.estado === "cerrado") c.abiertos += 1;
    const nombre = uno(t.guardias)?.nombre ?? "";
    c.agentes.push(`${t.tipo === "fijo_noche" ? "N" : t.tipo === "saca_francos" ? "SF" : t.tipo === "supervision" ? "SV" : "D"} ${nombre}`);
    celdas.set(k, c);
  }

  const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const diaSemana = (d: number) => new Date(Date.UTC(anio, numMes - 1, d)).getUTCDay();
  const hoyNum = hoyEc.slice(0, 7) === mes ? Number(hoyEc.slice(8, 10)) : 0;

  const filas = puestos.map((p) => {
    const modalidad = servicio(p.tipo_servicio);
    const esperados = modalidad.requiereRuta ? 0 : modalidad.fijos;
    let huecos = 0;
    const cols = dias.map((d) => {
      const c = celdas.get(`${p.id}/${d}`) ?? { total: 0, abiertos: 0, agentes: [] };
      const domingoLibre = p.tipo_servicio === "punto_12_l_s" && diaSemana(d) === 0;
      const necesita = domingoLibre ? 0 : esperados;
      const tono = necesita === 0 ? (c.total ? "verde" : "gris") : c.total >= necesita ? "verde" : c.total > 0 ? "ambar" : "rojo";
      if (tono === "rojo" || tono === "ambar") huecos += 1;
      return { d, c, tono, necesita };
    });
    return { puesto: p, cols, huecos, esperados };
  });
  const totalTurnos = (turnos ?? []).length;
  const totalHuecos = filas.reduce((s, f) => s + f.huecos, 0);

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/operacion/turnos" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Turnos y asistencia</Link>

        <section className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoTurno className="h-6 w-6" /> Cuadrante</p><h1 className="mt-2 text-3xl font-bold capitalize lg:text-4xl">{nombreMes(mes)}</h1><p className="mt-1 text-sm text-slate-400">{totalTurnos} turnos · {totalHuecos === 0 ? "sin huecos" : `${totalHuecos} día${totalHuecos === 1 ? "" : "s"}-puesto con cobertura incompleta`}{esLector(perfil.rol) ? "" : " · tus puestos"}</p></div>
          <nav className="flex items-center gap-2 text-sm"><Link href={`/operacion/turnos/mes?mes=${anterior}`} className="rounded-xl border border-[#27425e] bg-[#07172a] px-3 py-2 text-slate-300">← {nombreMesCorto(anterior)}</Link><Link href={`/operacion/turnos/mes?mes=${siguiente}`} className="rounded-xl border border-[#27425e] bg-[#07172a] px-3 py-2 text-slate-300">{nombreMesCorto(siguiente)} →</Link></nav>
        </section>

        <p className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500"><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/70" />Completo</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-400/70" />Parcial</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-500/70" />Sin turnos</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-slate-600" />No corresponde</span><span>El número es turnos programados / necesarios. Pasa el cursor para ver quién.</span></p>

        <section className="mt-4 overflow-x-auto rounded-2xl border border-[#27425e] bg-[#07172a]/95">
          {filas.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">No tienes puestos que programar.</p> : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="sticky left-0 z-10 bg-[#07172a] px-3 py-2 text-left font-medium">Puesto</th>
                  {dias.map((d) => <th key={d} className={`min-w-8 px-0.5 py-2 text-center font-medium ${d === hoyNum ? "text-[#8ddaff]" : diaSemana(d) === 0 ? "text-slate-500" : ""}`}><span className="block text-[0.6rem] opacity-70">{DIAS_SEMANA[diaSemana(d)]}</span>{d}</th>)}
                  <th className="px-2 py-2 text-right font-medium">Huecos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20374e]">
                {filas.map((f) => (
                  <tr key={f.puesto.id}>
                    <td className="sticky left-0 z-10 bg-[#07172a] px-3 py-1.5"><p className="whitespace-nowrap font-medium text-white">{f.puesto.empresa} · {f.puesto.codigo}</p><p className="whitespace-nowrap text-[0.65rem] text-slate-500">{f.puesto.nombre} · {f.esperados ? `${f.esperados}/día` : "custodia"}</p></td>
                    {f.cols.map(({ d, c, tono, necesita }) => <td key={d} className={`px-0.5 py-1.5 text-center ${d === hoyNum ? "bg-[#0788ff]/8" : ""}`}><span title={c.agentes.join("\n") || "Sin turnos"} className={`inline-flex h-7 w-7 items-center justify-center rounded-md font-mono ${TONO[tono]}`}>{necesita === 0 && c.total === 0 ? "·" : `${c.total}${necesita ? `/${necesita}` : ""}`}</span></td>)}
                    <td className={`px-2 py-1.5 text-right font-medium ${f.huecos ? "text-amber-300" : "text-emerald-400"}`}>{f.huecos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}

const TONO: Record<string, string> = {
  verde: "bg-emerald-500/20 text-emerald-200",
  ambar: "bg-amber-400/20 text-amber-200",
  rojo: "bg-red-500/20 text-red-200",
  gris: "bg-slate-700/40 text-slate-500",
};

function clave(d: Date) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; }
function nombreMes(mes: string) { const [a, m] = mes.split("-").map(Number); return new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 1))); }
function nombreMesCorto(mes: string) { const [a, m] = mes.split("-").map(Number); return new Intl.DateTimeFormat("es-EC", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 1))); }
