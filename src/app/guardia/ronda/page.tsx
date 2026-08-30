import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoCiclo, IconoFlecha } from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";
import { FormularioRonda } from "./formulario-ronda";

export const metadata = { title: "Ronda activa — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaRondaGuardia() {
  const { supabase, user, perfil } = await exigirPerfil(["guardia", "admin"]);
  const consultaGuardia = supabase.from("guardias").select("id,nombre");
  const { data: guardia } = perfil.rol === "admin"
    ? await consultaGuardia.eq("activo", true).order("nombre").limit(1).maybeSingle()
    : await consultaGuardia.eq("perfil_id", user.id).maybeSingle();

  if (!guardia) redirect("/guardia");
  const ahora = new Date().toISOString();
  const { data: turno } = await supabase.from("turnos").select("id,puesto_id,puestos(codigo,nombre)").eq("guardia_id", guardia.id).lte("inicio_programado", ahora).gte("fin_programado", ahora).order("inicio_programado", { ascending: false }).limit(1).maybeSingle();
  if (!turno) redirect("/guardia");

  const [{ data: puntos }, { data: registros }] = await Promise.all([
    supabase.from("puntos_ronda").select("id,codigo,nombre,token,orden").eq("puesto_id", turno.puesto_id).eq("activo", true).order("orden"),
    supabase.from("rondas").select("punto_id,hora_captura").eq("turno_id", turno.id),
  ]);

  const completados = new Set((registros ?? []).map((registro) => registro.punto_id));
  const lista = puntos ?? [];

  return (
    <main className="min-h-dvh bg-[#020b18] text-white"><div className="mx-auto min-h-dvh w-full max-w-md bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between"><Marca tamano="panel"/><span className="text-xs text-emerald-300">● En línea</span></header>
      <Link href="/guardia" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4"/></span> Volver al puesto</Link>
      <section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoCiclo className="h-6 w-6"/> Ronda activa</p><h1 className="mt-2 text-3xl font-bold">Control de puntos</h1><p className="mt-1 text-sm text-slate-400">{guardia.nombre} · Registra cada código QR al llegar al punto.</p></section>
      <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className="flex items-baseline justify-between"><span className="text-sm text-slate-400">Progreso</span><span className="font-semibold">{completados.size}/{lista.length} puntos</span></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-[#087ff0] to-[#16bceb]" style={{ width: `${lista.length ? Math.round((completados.size/lista.length)*100) : 0}%` }}/></div></section>
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="divide-y divide-[#20374e]">{lista.map((punto) => { const listo = completados.has(punto.id); return <article key={punto.id} className="flex items-center gap-3 px-4 py-3.5"><span className={`grid h-10 w-10 place-items-center rounded-full border ${listo ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-[#27425e] bg-[#061426] text-slate-400"}`}>{listo ? "✓" : punto.orden}</span><div><p className="font-medium">{punto.nombre}</p><p className="text-xs text-slate-400">Código {punto.codigo}</p></div><span className={`ml-auto text-xs ${listo ? "text-emerald-300" : "text-slate-500"}`}>{listo ? "Registrado" : "Pendiente"}</span></article>; })}</div></section>
      <FormularioRonda turnoId={turno.id} guardiaId={guardia.id} puntos={lista} completados={[...completados]} soloLectura={perfil.rol === "admin"}/>
    </div></main>
  );
}
