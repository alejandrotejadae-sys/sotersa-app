import Image from "next/image";
import Link from "next/link";
import {
  IconoAlerta,
  IconoCasa,
  IconoCiclo,
  IconoEscudoOk,
  IconoFlecha,
  IconoPersona,
  IconoTurno,
} from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, uno } from "@/lib/sesion";

export const metadata = { title: "Supervisión — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaSupervisor() {
  const { supabase, perfil } = await exigirPerfil(["supervisor", "admin"]);
  const desde = ahoraConDesfase(-24);
  const hasta = ahoraConDesfase(16);

  const [puestosR, turnosR, novedadesR, rondasR] = await Promise.all([
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase
      .from("turnos")
      .select("id, estado, guardias(nombre), puestos(nombre), aperturas_turno(id)")
      .gte("fin_programado", desde)
      .lte("inicio_programado", hasta)
      .order("inicio_programado"),
    supabase
      .from("novedades")
      .select("id", { count: "exact", head: true })
      .eq("estado", "registrada"),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde),
  ]);

  const turnos = turnosR.data ?? [];
  const enPuesto = turnos.filter((turno) => (turno.aperturas_turno?.length ?? 0) > 0);
  const cobertura = turnos.length ? Math.round((enPuesto.length / turnos.length) * 100) : 100;
  const novedades = novedadesR.count ?? 0;
  const nombre = perfil.nombre.trim().split(" ")[0] || "Alejandro";

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] overflow-hidden border-x border-white/[0.04] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18_0%,#031226_55%,#020b18_100%)] shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-5 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
          <MarcaSupervisor />
          <nav className="hidden items-center gap-1 lg:flex"><EnlaceSuperior href="/supervisor" texto="Inicio" activo/><EnlaceSuperior href="/operacion/personal" texto="Personal"/><EnlaceSuperior href="/operacion/turnos" texto="Turnos"/><EnlaceSuperior href="/operacion/rondas" texto="Rondas"/><EnlaceSuperior href="/operacion/novedades" texto="Novedades"/><EnlaceSuperior href="/operacion/reportes" texto="Reportes"/><EnlaceSuperior href="/admin" texto="Central"/><EnlaceSuperior href="/portal" texto="Clientes"/></nav>
          <Link href="/operacion/novedades" aria-label="Notificaciones" className="relative grid h-12 w-12 place-items-center rounded-full text-white transition hover:bg-white/5">
            <Campana className="h-7 w-7" />
            {novedades > 0 && <span className="absolute right-2 top-1.5 h-3 w-3 rounded-full border-2 border-[#020b18] bg-[#087ff0]" />}
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 px-4 pb-28 lg:grid-cols-12 lg:px-8 lg:pb-10">
          <section className="px-1 pt-1 lg:col-span-12">
            <p className="flex items-center gap-2 text-base font-medium text-[#0788ff]">
              <IconoEscudoOk className="h-6 w-6" /> Supervisor
            </p>
            <h1 className="mt-2 text-[2rem] font-bold leading-tight tracking-tight lg:text-4xl">Buenos días, {nombre}</h1>
            <p className="mt-1 text-base text-slate-400">Resumen operativo de hoy</p>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-[#27425e] bg-[radial-gradient(circle_at_78%_42%,rgba(0,125,255,0.13),transparent_40%),linear-gradient(135deg,#07182c,#061326)] p-5 shadow-xl shadow-black/20 lg:col-span-8 lg:min-h-52 lg:p-8">
            <div className="absolute -right-2 top-3 text-[#0c3d68]/45">
              <IconoEscudoOk className="h-36 w-36" />
            </div>
            <div className="relative flex items-center gap-5">
              <AnilloOperacion porcentaje={cobertura} />
              <div>
                <p className="text-base text-slate-300">Operación de hoy</p>
                <p className="mt-1 text-5xl font-bold leading-none">{cobertura}%</p>
                <p className={`mt-2 text-base font-medium ${cobertura >= 90 ? "text-emerald-400" : "text-red-400"}`}>
                  {cobertura >= 90 ? "bajo control" : "requiere atención"}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:col-span-4">
            <Metrica icono={<IconoPersona className="h-7 w-7" />} titulo="Personal" valor={`${enPuesto.length}/${turnos.length}`} detalle="en servicio" />
            <Metrica icono={<IconoEscudoOk className="h-7 w-7" />} titulo="Puestos" valor={puestosR.count ?? 0} detalle="activos" />
            <Metrica icono={<IconoCiclo className="h-7 w-7" />} titulo="Rondas" valor={rondasR.count ?? 0} detalle="completadas" />
            <Metrica icono={<IconoAlerta className="h-7 w-7" />} titulo="Novedades" valor={novedades} detalle="sin resolver" emergencia={novedades > 0} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#20374e] px-4 py-3.5">
              <h2 className="text-lg font-semibold">Personal y puestos</h2>
              <button type="button" className="flex items-center gap-1 text-sm font-medium text-[#0788ff]">Ver todo <IconoFlecha className="h-4 w-4" /></button>
            </div>
            <div className="divide-y divide-[#20374e]">
              {turnos.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No hay turnos programados para hoy.</p>
              ) : (
                turnos.slice(0, 3).map((turno) => {
                  const guardia = uno(turno.guardias);
                  const puesto = uno(turno.puestos);
                  const abierto = (turno.aperturas_turno?.length ?? 0) > 0;
                  return (
                    <article key={turno.id} className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 px-4 py-3">
                      <Avatar nombre={guardia?.nombre ?? "Guardia"} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{guardia?.nombre ?? "Guardia asignado"}</p>
                        <p className="truncate text-sm text-slate-400">{puesto?.nombre ?? "Puesto pendiente"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`whitespace-nowrap text-sm ${abierto ? "text-emerald-400" : "text-red-400"}`}>
                          ● {abierto ? "En puesto" : "Pendiente"}
                        </span>
                        <IconoFlecha className="h-5 w-5 text-slate-500" />
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-5">
            <h2 className="text-lg font-semibold">Acciones rápidas</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Accion href="/operacion/personal" icono={<IconoPersona className="h-7 w-7" />} texto="Ver personal" />
              <Accion href="/operacion/turnos" icono={<IconoTurno className="h-7 w-7" />} texto="Asignar puesto" />
              <Accion href="/operacion/rondas" icono={<IconoCiclo className="h-7 w-7" />} texto="Crear ronda" />
              <Accion href="/operacion/novedades" icono={<IconoAlerta className="h-7 w-7" />} texto="Ver novedades" />
              <Accion href="/operacion/reportes" icono={<IconoCiclo className="h-7 w-7" />} texto="Ver reportes" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-12">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Supervisión en tiempo real</h2>
              <button type="button" className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#0788ff]">Ver mapa <IconoFlecha className="h-4 w-4" /></button>
            </div>
            <MapaOperativo />
          </section>
        </div>

        <nav aria-label="Navegación del supervisor" className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[540px] grid-cols-5 border-t border-[#27425e] bg-[#031023]/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
          <Navegacion icono={<IconoCasa className="h-6 w-6" />} texto="Inicio" activo />
          <Navegacion href="/operacion/personal" icono={<IconoPersona className="h-6 w-6" />} texto="Personal" />
          <Navegacion href="/operacion/rondas" icono={<IconoCiclo className="h-6 w-6" />} texto="Rondas" />
          <Navegacion href="/operacion/novedades" icono={<IconoAlerta className="h-6 w-6" />} texto="Novedades" />
          <Navegacion href="/operacion/turnos" icono={<IconoTurno className="h-6 w-6" />} texto="Turnos" />
        </nav>
      </div>
    </main>
  );
}

function MarcaSupervisor() {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/logo-sotersa.png" alt="SOTERSA" width={42} height={50} className="h-12 w-auto object-contain" priority />
      <div>
        <p className="text-[1.15rem] font-semibold tracking-[0.16em] text-[#19b9f2]">SOTERSA</p>
        <p className="mt-0.5 text-[0.55rem] tracking-[0.2em] text-slate-400">SEGURIDAD ESTRATÉGICA</p>
      </div>
    </div>
  );
}

function AnilloOperacion({ porcentaje }: { porcentaje: number }) {
  const progreso = Math.max(0, Math.min(100, porcentaje));
  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r="48" fill="none" stroke="#183957" strokeWidth="11" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="url(#supervisor-ring)" strokeWidth="11" strokeLinecap="round" pathLength="100" strokeDasharray={`${progreso} 100`} />
        <defs><linearGradient id="supervisor-ring"><stop stopColor="#067cff" /><stop offset="1" stopColor="#1dd6ef" /></linearGradient></defs>
      </svg>
      <IconoEscudoOk className="h-11 w-11 text-[#087ff0]" />
    </div>
  );
}

function Metrica({ icono, titulo, valor, detalle, emergencia = false }: { icono: React.ReactNode; titulo: string; valor: string | number; detalle: string; emergencia?: boolean }) {
  return (
    <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 shadow-lg shadow-black/10">
      <div className={`flex items-center gap-2 ${emergencia ? "text-red-400" : "text-[#0788ff]"}`}>{icono}<span className="text-sm text-slate-300">{titulo}</span></div>
      <p className={`mt-3 text-center text-3xl font-medium ${emergencia ? "text-red-400" : "text-white"}`}>{valor}</p>
      <p className="mt-1 text-center text-sm text-slate-400">{detalle}</p>
    </article>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  const iniciales = nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
  return <span className="grid h-11 w-11 place-items-center rounded-full border border-[#38526b] bg-gradient-to-br from-[#244868] to-[#0a1e34] text-xs font-semibold text-[#8ddaff]">{iniciales}</span>;
}

function Accion({ icono, texto, href }: { icono: React.ReactNode; texto: string; href?: string }) {
  const contenido = <><span className="text-[#0788ff]">{icono}</span>{texto}</>;
  const clase = "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#061426] px-2 py-3 text-center text-sm text-slate-300 transition active:scale-[0.98]";
  return href ? <Link href={href} className={clase}>{contenido}</Link> : <button type="button" className={clase}>{contenido}</button>;
}

function MapaOperativo() {
  return (
    <div className="relative mt-3 h-44 overflow-hidden rounded-xl border border-[#27425e] bg-[linear-gradient(32deg,transparent_46%,rgba(32,79,118,0.4)_47%,rgba(32,79,118,0.4)_49%,transparent_50%),linear-gradient(148deg,transparent_47%,rgba(32,79,118,0.32)_48%,rgba(32,79,118,0.32)_50%,transparent_51%),radial-gradient(circle_at_55%_55%,#123354,#07182b_62%)] bg-[size:90px_70px,120px_85px,auto]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,60,96,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(18,60,96,0.25)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white">Quito</span>
      <Pin className="left-[27%] top-[46%]" />
      <Pin className="left-[63%] top-[58%]" activo />
      <Pin className="left-[79%] top-[21%]" />
    </div>
  );
}

function Pin({ className, activo = false }: { className: string; activo?: boolean }) {
  return <span className={`absolute grid h-9 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[50%_50%_50%_0] border-2 border-white bg-[#087ff0] shadow-[0_0_18px_rgba(0,127,255,0.7)] [transform:rotate(-45deg)] ${className}`}><span className={`h-2.5 w-2.5 rounded-full bg-white [transform:rotate(45deg)] ${activo ? "ring-4 ring-cyan-300/40" : ""}`} /></span>;
}

function Navegacion({ icono, texto, activo = false, href }: { icono: React.ReactNode; texto: string; activo?: boolean; href?: string }) {
  const contenido = <>{icono}<span>{texto}</span></>;
  const clase = `flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] ${activo ? "text-[#0788ff]" : "text-slate-400"}`;
  return href ? <Link href={href} className={clase}>{contenido}</Link> : <button type="button" className={clase}>{contenido}</button>;
}

function Campana({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}

function EnlaceSuperior({ href, texto, activo = false }: { href: string; texto: string; activo?: boolean }) {
  return <Link href={href} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activo ? "bg-[#087ff0]/15 text-[#4db6ff]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{texto}</Link>;
}
