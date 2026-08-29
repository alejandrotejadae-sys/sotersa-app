import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoCiclo, IconoFlecha, IconoRonda } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, horaEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Rondas y puntos — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaRondas() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const desde = ahoraConDesfase(-24);

  const [puestosR, rondasR] = await Promise.all([
    supabase.from("puestos").select("id, codigo, nombre, puntos_ronda(id,codigo,nombre,orden,activo)").eq("activo", true).order("codigo"),
    supabase.from("rondas").select("id, hora_captura, punto_id, puntos_ronda(nombre,codigo), guardias(nombre), turnos(puestos(codigo,nombre))").gte("hora_captura", desde).order("hora_captura", { ascending: false }).limit(30),
  ]);

  const puestos = puestosR.data ?? [];
  const rondas = rondasR.data ?? [];
  const puntos = puestos.reduce((total, puesto) => total + (puesto.puntos_ronda?.filter((punto) => punto.activo).length ?? 0), 0);

  return (
    <main className="min-h-dvh bg-[#020b18] text-white"><div className="mx-auto min-h-dvh w-full max-w-[760px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-4"><Marca tamano="panel"/><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso/> En línea</span></header>
      <Link href={perfil.rol === "admin" ? "/admin" : "/supervisor"} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4"/></span> Volver al panel</Link>
      <section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoCiclo className="h-6 w-6"/> Control de recorridos</p><h1 className="mt-2 text-3xl font-bold">Rondas y puntos</h1><p className="mt-1 text-sm text-slate-400">Seguimiento de los controles registrados durante las últimas 24 horas.</p></section>
      <section className="mt-5 grid grid-cols-3 gap-3"><Resumen titulo="Puestos" valor={puestos.length}/><Resumen titulo="Puntos QR" valor={puntos}/><Resumen titulo="Registros 24h" valor={rondas.length} normal/></section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="border-b border-[#20374e] px-4 py-4"><h2 className="text-lg font-semibold">Configuración por puesto</h2></div><div className="divide-y divide-[#20374e]">{puestos.length === 0 ? <Vacio texto="No hay puestos configurados."/> : puestos.map((puesto) => {
        const lista = (puesto.puntos_ronda ?? []).filter((punto) => punto.activo).sort((a,b) => a.orden-b.orden);
        return <article key={puesto.id} className="px-4 py-4"><div className="flex items-center justify-between"><div><p className="font-semibold">{puesto.codigo} · {puesto.nombre}</p><p className="mt-1 text-sm text-slate-400">{lista.length} punto(s) activo(s)</p></div><IconoRonda className="h-7 w-7 text-[#0788ff]"/></div>{lista.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{lista.map((punto) => <span key={punto.id} className="rounded-lg border border-[#27425e] bg-[#061426] px-3 py-2 text-xs text-slate-300">{punto.orden}. {punto.nombre}</span>)}</div>}</article>;
      })}</div></section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="flex items-center justify-between border-b border-[#20374e] px-4 py-4"><h2 className="text-lg font-semibold">Actividad reciente</h2><span className="text-xs text-slate-500">Últimas 24 horas</span></div><div className="divide-y divide-[#20374e]">{rondas.length === 0 ? <Vacio texto="Todavía no hay puntos registrados."/> : rondas.map((ronda) => {
        const punto = uno(ronda.puntos_ronda); const guardia = uno(ronda.guardias); const turno = uno(ronda.turnos); const puesto = turno ? uno(turno.puestos) : null;
        return <article key={ronda.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3.5"><span className="grid h-10 w-10 place-items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-300">✓</span><div className="min-w-0"><p className="truncate font-medium">{punto?.nombre ?? "Punto de control"}</p><p className="truncate text-sm text-slate-400">{puesto?.codigo ?? "Puesto"} · {guardia?.nombre ?? "Guardia"}</p></div><time className="text-sm text-slate-400">{horaEcuador(ronda.hora_captura)}</time></article>;
      })}</div></section>
    </div></main>
  );
}

function Resumen({ titulo, valor, normal = false }: { titulo: string; valor: number; normal?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-3 text-center"><p className={`text-2xl font-bold ${normal ? "text-emerald-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function Vacio({ texto }: { texto: string }) { return <p className="px-4 py-8 text-center text-sm text-slate-400">{texto}</p>; }
