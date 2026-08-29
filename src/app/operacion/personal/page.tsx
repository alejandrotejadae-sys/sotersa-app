import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoFlecha, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, uno } from "@/lib/sesion";

export const metadata = { title: "Personal y puestos — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaPersonal() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const desde = ahoraConDesfase(-12);
  const hasta = ahoraConDesfase(16);

  const [guardiasR, puestosR, turnosR] = await Promise.all([
    supabase.from("guardias").select("id, nombre, cedula, credencial, telefono, activo").order("nombre"),
    supabase.from("puestos").select("id, codigo, nombre, activo").eq("activo", true).order("codigo"),
    supabase.from("turnos").select("id, guardia_id, puesto_id, estado, guardias(nombre), puestos(codigo,nombre), aperturas_turno(id)").gte("fin_programado", desde).lte("inicio_programado", hasta),
  ]);

  const guardias = guardiasR.data ?? [];
  const puestos = puestosR.data ?? [];
  const turnos = turnosR.data ?? [];
  const activos = turnos.filter((turno) => (turno.aperturas_turno?.length ?? 0) > 0);
  const asignados = new Map(turnos.map((turno) => [turno.guardia_id, turno]));

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[760px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href={perfil.rol === "admin" ? "/admin" : "/supervisor"} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

        <section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoPersona className="h-6 w-6" /> Gestión operativa</p><h1 className="mt-2 text-3xl font-bold">Personal y puestos</h1><p className="mt-1 text-sm text-slate-400">Asignaciones y estado del servicio en tiempo real.</p></section>

        <section className="mt-5 grid grid-cols-3 gap-3"><Resumen titulo="Personal" valor={guardias.filter((g) => g.activo).length}/><Resumen titulo="En puesto" valor={activos.length} normal/><Resumen titulo="Puestos" valor={puestos.length}/></section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="border-b border-[#20374e] px-4 py-4"><h2 className="text-lg font-semibold">Equipo de seguridad</h2></div><div className="divide-y divide-[#20374e]">{guardias.length === 0 ? <Vacio texto="No hay personal registrado."/> : guardias.map((guardia) => {
          const turno = asignados.get(guardia.id);
          const puesto = turno ? uno(turno.puestos) : null;
          const abierto = turno ? (turno.aperturas_turno?.length ?? 0) > 0 : false;
          return <article key={guardia.id} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3.5"><span className="grid h-12 w-12 place-items-center rounded-full border border-[#38526b] bg-gradient-to-br from-[#244868] to-[#0a1e34] text-xs font-semibold text-[#8ddaff]">{iniciales(guardia.nombre)}</span><div className="min-w-0"><p className="truncate font-semibold">{guardia.nombre}</p><p className="truncate text-sm text-slate-400">{puesto ? `${puesto.codigo} · ${puesto.nombre}` : "Sin puesto asignado"}</p><p className="mt-1 text-xs text-slate-500">Credencial {guardia.credencial ?? "pendiente"}</p></div><span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${abierto ? "bg-emerald-500/12 text-emerald-300" : turno ? "bg-amber-500/12 text-amber-300" : "bg-slate-500/10 text-slate-400"}`}>{abierto ? "En puesto" : turno ? "Programado" : "Disponible"}</span></article>;
        })}</div></section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="flex items-center justify-between border-b border-[#20374e] px-4 py-4"><h2 className="flex items-center gap-2 text-lg font-semibold"><IconoTurno className="h-5 w-5 text-[#0788ff]"/> Puestos activos</h2><span className="text-xs text-slate-500">{puestos.length} registrados</span></div><div className="divide-y divide-[#20374e]">{puestos.map((puesto) => <article key={puesto.id} className="flex items-center justify-between gap-4 px-4 py-3.5"><div><p className="font-medium">{puesto.codigo} · {puesto.nombre}</p><p className="mt-1 text-sm text-slate-400">Cobertura operativa</p></div><span className="flex items-center gap-2 text-sm text-emerald-300"><Pulso /> Activo</span></article>)}</div></section>
      </div>
    </main>
  );
}

function Resumen({ titulo, valor, normal = false }: { titulo: string; valor: number; normal?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-3 text-center"><p className={`text-2xl font-bold ${normal ? "text-emerald-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function Vacio({ texto }: { texto: string }) { return <p className="px-4 py-8 text-center text-sm text-slate-400">{texto}</p>; }
function iniciales(nombre: string) { return nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase(); }
