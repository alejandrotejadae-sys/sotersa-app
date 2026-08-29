import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoAlerta, IconoFlecha } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FormularioReporte } from "./formulario-reporte";

export const metadata = { title: "Reportar novedad — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaReportar({ searchParams }: { searchParams: Promise<{ severidad?: string }> }) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
  if (!perfil || !["guardia", "admin"].includes(perfil.rol)) redirect("/perfiles");
  const parametros = await searchParams;
  const severidadInicial = parametros.severidad === "emergencia" ? "emergencia" : "novedad";
  return <main className="min-h-dvh bg-[#020b18] text-white"><div className="mx-auto min-h-dvh w-full max-w-md bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]"><header className="flex items-center justify-between"><Marca tamano="panel"/><span className="text-xs text-emerald-300">● En línea</span></header><Link href="/guardia?desde=perfiles" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4"/></span> Volver al puesto</Link><section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoAlerta className="h-6 w-6"/> Bitácora operativa</p><h1 className="mt-2 text-3xl font-bold">Reportar novedad</h1><p className="mt-1 text-sm leading-6 text-slate-400">El registro se enviará con fecha, hora, evidencia y ubicación disponibles.</p></section><FormularioReporte soloLectura={perfil.rol === "admin"} severidadInicial={severidadInicial} /></div></main>;
}
