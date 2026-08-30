import Link from "next/link";
import { redirect } from "next/navigation";
import { IconoEscudoOk } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil } from "@/lib/sesion";
import { FormularioCierre } from "./formulario-cierre";

export const metadata = { title: "Cerrar turno — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaCierre() {
  const { supabase, user } = await exigirPerfil(["guardia"]);
  const { data: agente } = await supabase.from("guardias").select("id").eq("perfil_id", user.id).maybeSingle();
  if (!agente) redirect("/guardia");
  const limite = ahoraConDesfase(-6);
  const { data: turnos } = await supabase.from("turnos").select("id,puesto_id,inicio_programado,fin_programado,estado,puestos(codigo,nombre),aperturas_turno(id)").eq("guardia_id", agente.id).gte("fin_programado", limite).neq("estado", "cerrado").order("inicio_programado", { ascending: false }).limit(4);
  const turno = (turnos ?? []).find((item) => (item.aperturas_turno?.length ?? 0) > 0);
  if (!turno) redirect("/guardia");
  const puesto = Array.isArray(turno.puestos) ? turno.puestos[0] : turno.puestos;

  return <main className="min-h-dvh bg-[#020b18] px-4 py-5 text-white"><div className="mx-auto w-full max-w-xl"><Link href="/guardia" className="text-sm font-medium text-azul-400">← Volver al puesto</Link><header className="mt-6 flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-azul-500/40 bg-azul-500/10 text-azul-300"><IconoEscudoOk className="h-7 w-7" /></span><div><p className="text-sm font-medium text-azul-400">{puesto?.codigo ?? "Puesto"}</p><h1 className="mt-1 text-2xl font-bold">Cerrar y entregar turno</h1><p className="mt-1 text-sm text-gris-400">{puesto?.nombre ?? "Servicio asignado"}</p></div></header><section className="tarjeta mt-6 p-5"><p className="mb-5 rounded-xl border border-novedad/35 bg-novedad/10 px-4 py-3 text-sm leading-6 text-amber-100">Revisa el puesto antes de firmar. La entrega quedará registrada con tu identidad y la hora de captura.</p><FormularioCierre turnoId={turno.id} /></section></div></main>;
}
