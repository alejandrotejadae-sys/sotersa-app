import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoCamion, IconoEscudoOk, IconoLista, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";

export const metadata = { title: "Panel administrativo — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const { supabase, perfil } = await exigirPerfil(["admin"]);

  const [clientesR, guardiasR, custodiasR, supervisoresR, usuariosR, alertasR] = await Promise.all([
    supabase.from("empresas_cliente").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true).eq("tipo_servicio", "custodia_armada"),
    supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("activo", true).eq("rol", "supervisor"),
    supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("novedades").select("id", { count: "exact", head: true }).eq("estado", "registrada"),
  ]);

  const nombre = perfil.nombre.split(" ")[0];

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><div className="flex items-center gap-2"><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span><Link href="/mi-perfil" className="grid h-10 w-10 place-items-center rounded-full border border-[#27425e] bg-[#07172a] text-[#49b6ff]" aria-label="Mi perfil"><IconoPersona className="h-5 w-5"/></Link></div></header>

        <section className="mt-7"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Panel administrativo</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Buenos días, {nombre}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Desde aquí administras toda la plataforma y entras a cada área para revisar o modificar su configuración.</p></section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Resumen titulo="Clientes" valor={clientesR.count ?? 0}/><Resumen titulo="Guardias" valor={guardiasR.count ?? 0}/><Resumen titulo="Custodias" valor={custodiasR.count ?? 0}/><Resumen titulo="Supervisores" valor={supervisoresR.count ?? 0}/><Resumen titulo="Usuarios" valor={usuariosR.count ?? 0}/><Resumen titulo="Alertas" valor={alertasR.count ?? 0} alerta={(alertasR.count ?? 0) > 0}/>
        </section>

        <section className="mt-7"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">Áreas de gestión</h2><p className="mt-1 text-sm text-slate-500">Selecciona el módulo que quieres revisar.</p></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Modulo href="/operacion/clientes" titulo="Clientes" detalle="Empresas, puestos, servicios y contactos operativos." icono={<IconoPersona className="h-7 w-7"/>}/>
            <Modulo href="/operacion/personal" titulo="Guardias" detalle="Personal activo, fichas, credenciales y asignaciones." icono={<IconoEscudoOk className="h-7 w-7"/>}/>
            <Modulo href="/operacion/custodias" titulo="Custodias" detalle="Servicios armados, rutas, agentes y trazabilidad." icono={<IconoCamion className="h-7 w-7"/>}/>
            <Modulo href="/supervisor" titulo="Supervisión" detalle="Vista de supervisión, novedades, cobertura y control operativo." icono={<IconoAlerta className="h-7 w-7"/>}/>
            <Modulo href="/central" titulo="Panel central" detalle="Monitoreo diario de turnos, rondas, incidentes y alertas." icono={<IconoLista className="h-7 w-7"/>}/>
            <Modulo href="/operacion/usuarios" titulo="Usuarios y accesos" detalle="Credenciales, perfiles y control de acceso al sistema." icono={<IconoPersona className="h-7 w-7"/>}/>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:p-5"><h2 className="text-lg font-semibold">Operación y configuración</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"><Acceso href="/operacion/turnos" texto="Turnos" icono={<IconoTurno className="h-5 w-5"/>}/><Acceso href="/operacion/rondas" texto="Rondas" icono={<IconoEscudoOk className="h-5 w-5"/>}/><Acceso href="/operacion/novedades" texto="Novedades" icono={<IconoAlerta className="h-5 w-5"/>}/><Acceso href="/operacion/dotacion" texto="Dotación" icono={<IconoEscudoOk className="h-5 w-5"/>}/><Acceso href="/operacion/reportes" texto="Reportes" icono={<IconoLista className="h-5 w-5"/>}/><Acceso href="/configuracion/dispositivo" texto="Configuración" icono={<IconoEscudoOk className="h-5 w-5"/>}/></div></section>
      </div>
    </main>
  );
}

function Resumen({ titulo, valor, alerta = false }: { titulo: string; valor: number; alerta?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${alerta ? "text-red-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function Modulo({ href, titulo, detalle, icono }: { href: string; titulo: string; detalle: string; icono: React.ReactNode }) { return <Link href={href} className="group rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5 transition hover:-translate-y-0.5 hover:border-[#0788ff]/65 hover:bg-[#08203a]"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0788ff]/12 text-[#49b6ff]">{icono}</span><div><h3 className="text-lg font-semibold">{titulo}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{detalle}</p><span className="mt-3 inline-block text-sm font-medium text-[#0788ff]">Abrir módulo →</span></div></div></Link>; }
function Acceso({ href, texto, icono }: { href: string; texto: string; icono: React.ReactNode }) { return <Link href={href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#061426] px-3 text-center text-sm text-slate-300 transition hover:border-[#0788ff]/60 hover:text-white"><span className="text-[#0788ff]">{icono}</span>{texto}</Link>; }
