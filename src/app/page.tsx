import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoCamion, IconoEscudoOk, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Bienvenido — SOTERSA" };

const perfiles = [
  { id: "admin", titulo: "Administrador", detalle: "Acceso completo a todas las funciones y configuración del sistema.", icono: <IconoEscudoOk className="h-7 w-7" />, fondo: "from-blue-500/35 to-blue-700/20", borde: "border-blue-400/35" },
  { id: "supervisor", titulo: "Supervisor", detalle: "Gestión operativa, personal, rondas, puestos y reportes.", icono: <IconoPersona className="h-7 w-7" />, fondo: "from-emerald-500/35 to-emerald-700/20", borde: "border-emerald-400/35" },
  { id: "guardia", titulo: "Agente de seguridad", detalle: "Registro de asistencia, rondas e incidencias en tiempo real.", icono: <IconoTurno className="h-7 w-7" />, fondo: "from-violet-500/35 to-violet-700/20", borde: "border-violet-400/35" },
  { id: "custodia", titulo: "Custodia armada", detalle: "Gestión de servicios de custodia, rutas e incidencias.", icono: <IconoCamion className="h-7 w-7" />, fondo: "from-amber-500/35 to-orange-700/20", borde: "border-amber-400/35" },
  { id: "central", titulo: "Central operativa", detalle: "Monitoreo 24/7, cámaras, alarmas y gestión de eventos.", icono: <IconoCentral className="h-7 w-7" />, fondo: "from-cyan-500/35 to-blue-700/20", borde: "border-cyan-400/35" },
  { id: "cliente", titulo: "Cliente", detalle: "Consulta de servicios, reportes e información general.", icono: <IconoClientes className="h-7 w-7" />, fondo: "from-teal-500/35 to-cyan-700/20", borde: "border-teal-400/35" },
] as const;

export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
    if (perfil?.rol === "admin") redirect("/admin");
  }

  return (
    <main className="min-h-dvh bg-[#010816] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1400px] bg-[radial-gradient(circle_at_50%_-10%,rgba(0,139,255,0.18),transparent_35%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-5 pb-8 pt-[max(1.4rem,env(safe-area-inset-top))] sm:px-7 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-12 lg:py-12">
        <section className="lg:sticky lg:top-12 lg:flex lg:h-[calc(100dvh-6rem)] lg:flex-col lg:justify-center">
          <div className="flex justify-center lg:justify-start"><Marca tamano="grande" /></div>
          <div className="mt-9 text-center lg:text-left"><p className="text-3xl font-light text-slate-200 sm:text-4xl">Bienvenido a</p><h1 className="mt-1 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">SOTERSA</h1><div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[#0788ff] lg:mx-0" /><p className="mt-5 text-base text-slate-400 sm:text-lg">Plataforma integral de seguridad privada</p></div>
          <div className="relative mt-8 hidden min-h-[260px] overflow-hidden rounded-[2rem] border border-[#1d3b58] bg-[#031224] lg:block"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(0,136,255,0.22),transparent_32%),linear-gradient(135deg,rgba(2,13,29,0.2),rgba(2,13,29,0.96))]" /><div className="absolute inset-x-8 bottom-8 rounded-2xl border border-[#244765] bg-[#061629]/90 p-5 backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#49b6ff]">Centro de seguridad</p><p className="mt-2 text-2xl font-bold">Control, trazabilidad y respuesta</p><p className="mt-2 text-sm leading-6 text-slate-400">Cada usuario ingresa con sus propias credenciales y únicamente a las funciones autorizadas para su perfil.</p></div></div>
        </section>

        <section className="mt-10 lg:mt-0 lg:self-center">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-[#49aaff] lg:text-left">Selecciona tu perfil para ingresar</p>
          <div className="mt-5 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-1 xl:grid-cols-2">{perfiles.map((perfil) => <Link key={perfil.id} href={`/acceso?perfil=${perfil.id}`} className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-[#27425e] bg-[#061426]/90 p-4 transition hover:-translate-y-0.5 hover:border-[#0788ff]/70 hover:bg-[#08203a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0788ff]"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border bg-gradient-to-br text-white ${perfil.fondo} ${perfil.borde}`}>{perfil.icono}</span><span className="min-w-0 flex-1"><span className="block text-lg font-bold">{perfil.titulo}</span><span className="mt-1 block text-sm leading-5 text-slate-400">{perfil.detalle}</span></span><span className="text-3xl font-light text-[#0788ff] transition group-hover:translate-x-1">›</span></Link>)}</div>
          <footer className="mt-7 rounded-2xl border border-[#203b55] bg-[#051426]/75 px-4 py-4 text-center"><div className="flex items-center justify-center gap-2 text-sm font-medium text-[#58adff]"><IconoEscudoOk className="h-5 w-5" /> Seguridad <span className="text-slate-600">•</span> Confianza <span className="text-slate-600">•</span> Compromiso</div><p className="mt-2 text-xs text-slate-500">Protegemos lo que más valoras</p></footer>
        </section>
      </div>
    </main>
  );
}

function IconoCentral({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function IconoClientes({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.4-4 2.5-6 6-6s5.6 2 6 6M14 15c3.8-.4 6 1.2 6.5 4.5"/></svg>; }
