import Link from "next/link";
import { MapaPuestos } from "@/app/componentes/mapa-puestos";
import {
  IconoAlerta, IconoCamion, IconoCiclo, IconoEscudoOk, IconoFlecha,
  IconoLista, IconoMapa, IconoPersona, IconoTurno,
} from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, horaEcuador, uno } from "@/lib/sesion";
import { puedeEditar } from "@/lib/roles";

export const metadata = { title: "Panel administrativo — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const { supabase, perfil } = await exigirPerfil(["admin", "operativo"]);
  const ahora = new Date().toISOString();
  const desde24h = ahoraConDesfase(-24);

  const [clientesR, guardiasR, custodiasR, supervisoresR, usuariosR, alertasR, puestosR, turnosR, rondasR] = await Promise.all([
    supabase.from("empresas_cliente").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true).eq("tipo_servicio", "custodia_armada"),
    supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("activo", true).eq("rol", "supervisor"),
    supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("novedades").select("id,tipo,severidad,hora_captura,puestos(codigo,nombre,empresas_cliente(nombre)),guardias(nombre)", { count: "exact" }).eq("estado", "registrada").order("hora_captura", { ascending: false }).limit(5),
    supabase.from("puestos").select("id,codigo,nombre,lat,lng,activo,empresas_cliente(nombre)").eq("activo", true).order("codigo"),
    supabase.from("turnos").select("id", { count: "exact", head: true }).lte("inicio_programado", ahora).gte("fin_programado", ahora).neq("estado", "ausente"),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde24h),
  ]);

  const nombre = perfil.nombre.split(" ")[0];
  const administra = puedeEditar(perfil.rol);
  const alertas = alertasR.data ?? [];
  const puntos = (puestosR.data ?? []).filter((p) => p.lat != null && p.lng != null).map((p) => ({
    id: p.id, lat: p.lat as number, lng: p.lng as number,
    cliente: uno(p.empresas_cliente)?.nombre ?? "Cliente SOTERSA",
    codigo: p.codigo, puesto: p.nombre, activo: p.activo,
  }));
  const puestosActivos = puestosR.data?.length ?? 0;
  const turnosActivos = turnosR.count ?? 0;
  const cobertura = puestosActivos ? Math.min(100, Math.round((turnosActivos / puestosActivos) * 100)) : 0;
  const sinUbicar = Math.max(0, puestosActivos - puntos.length);

  return (
    <main className="sot-admin-page min-h-dvh text-white">
      <div className="mx-auto w-full max-w-[1560px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="sot-eyebrow"><IconoEscudoOk className="h-4 w-4" /> Centro de control</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Buenos días, {nombre}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Visión general de la operación SOTERSA en tiempo real.</p></div>
          <div className="flex items-center gap-2"><Link href="/operacion/novedades" className="sot-boton-secundario"><IconoAlerta className="h-4 w-4" /> {alertasR.count ?? 0} alertas</Link><Link href="/central" className="sot-boton-primario">Abrir central <IconoFlecha className="h-4 w-4" /></Link></div>
        </header>

        <section aria-label="Resumen de la operación" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Resumen titulo="Clientes activos" valor={clientesR.count ?? 0} detalle="cartera operativa" icono={<IconoPersona className="h-5 w-5" />} />
          <Resumen titulo="Agentes" valor={guardiasR.count ?? 0} detalle="personal activo" icono={<IconoEscudoOk className="h-5 w-5" />} />
          <Resumen titulo="Turnos ahora" valor={turnosActivos} detalle={`${cobertura}% de puestos`} icono={<IconoTurno className="h-5 w-5" />} normal={turnosActivos > 0} />
          <Resumen titulo="Rondas 24 h" valor={rondasR.count ?? 0} detalle="puntos registrados" icono={<IconoCiclo className="h-5 w-5" />} />
          <Resumen titulo="Custodias" valor={custodiasR.count ?? 0} detalle="servicios activos" icono={<IconoCamion className="h-5 w-5" />} />
          <Resumen titulo="Alertas" valor={alertasR.count ?? 0} detalle="por validar" icono={<IconoAlerta className="h-5 w-5" />} alerta={(alertasR.count ?? 0) > 0} />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.75fr)]">
          <section className="sot-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#173651] px-4 py-4 sm:px-5"><div><h2 className="flex items-center gap-2 font-semibold"><IconoMapa className="h-5 w-5 text-azul-300" /> Operación en territorio</h2><p className="mt-1 text-xs text-slate-500">{puntos.length} puestos ubicados{sinUbicar ? ` · ${sinUbicar} pendientes de coordenadas` : ""}</p></div><Link href="/operacion/clientes" className="text-sm font-semibold text-azul-300">Gestionar puestos →</Link></div>
            <MapaPuestos puntos={puntos} alto="h-[19rem] sm:h-[25rem] xl:h-[30rem]" />
          </section>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <section className="sot-card p-5">
              <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Estado de la operación</p><p className="mt-1 text-xs text-slate-500">Actividad actual sobre puestos activos</p></div><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">En línea</span></div>
              <div className="mt-5 flex items-center gap-5"><Anillo valor={cobertura} /><div className="min-w-0 flex-1 space-y-3 text-sm"><DatoOperacion etiqueta="Puestos activos" valor={puestosActivos} /><DatoOperacion etiqueta="Turnos ahora" valor={turnosActivos} /><DatoOperacion etiqueta="Supervisores" valor={supervisoresR.count ?? 0} /><DatoOperacion etiqueta="Usuarios" valor={usuariosR.count ?? 0} /></div></div>
              <Link href="/central" className="sot-boton-primario mt-5 w-full">Ver monitoreo operativo <IconoFlecha className="h-4 w-4" /></Link>
            </section>

            <section className="sot-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#173651] px-5 py-4"><h2 className="flex items-center gap-2 font-semibold"><IconoAlerta className="h-5 w-5 text-azul-300" /> Alertas recientes</h2><Link href="/operacion/novedades" className="text-xs font-semibold text-azul-300">Ver todas</Link></div>
              {alertas.length === 0 ? <div className="px-5 py-8 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-300"><IconoEscudoOk className="h-6 w-6" /></span><p className="mt-3 text-sm font-medium text-slate-200">Operación sin alertas pendientes</p><p className="mt-1 text-xs text-slate-500">Las nuevas novedades aparecerán aquí.</p></div> : <div className="divide-y divide-[#173651]">{alertas.map((alerta) => <Alerta key={alerta.id} alerta={alerta} />)}</div>}
            </section>
          </div>
        </div>

        <section className="mt-5">
          <div className="flex items-end justify-between gap-4"><div><p className="sot-eyebrow">Accesos rápidos</p><h2 className="mt-2 text-xl font-semibold">Gestiona la operación</h2></div><span className="hidden text-xs text-slate-500 sm:block">Todas las funciones existentes siguen disponibles</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <Acceso href="/operacion/clientes" texto="Clientes" icono={<IconoPersona className="h-6 w-6" />} /><Acceso href="/operacion/personal" texto="Agentes" icono={<IconoEscudoOk className="h-6 w-6" />} /><Acceso href="/operacion/turnos" texto="Turnos" icono={<IconoTurno className="h-6 w-6" />} /><Acceso href="/operacion/rondas" texto="Rondas" icono={<IconoCiclo className="h-6 w-6" />} /><Acceso href="/operacion/custodias" texto="Custodias" icono={<IconoCamion className="h-6 w-6" />} /><Acceso href="/operacion/novedades" texto="Novedades" icono={<IconoAlerta className="h-6 w-6" />} /><Acceso href="/operacion/reportes" texto="Reportes" icono={<IconoLista className="h-6 w-6" />} />{administra ? <Acceso href="/admin/ver-como" texto="Ver como" icono={<IconoPersona className="h-6 w-6" />} /> : <Acceso href="/central" texto="Central" icono={<IconoMapa className="h-6 w-6" />} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function Resumen({ titulo, valor, detalle, icono, normal = false, alerta = false }: { titulo: string; valor: number; detalle: string; icono: React.ReactNode; normal?: boolean; alerta?: boolean }) { const tono = alerta ? "text-red-300 bg-red-500/10" : normal ? "text-emerald-300 bg-emerald-500/10" : "text-azul-300 bg-azul-500/10"; return <article className="sot-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-400">{titulo}</p><p className={`mt-2 text-3xl font-bold tracking-tight ${alerta ? "text-red-300" : "text-white"}`}>{valor}</p></div><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tono}`}>{icono}</span></div><p className="mt-2 text-[0.68rem] text-slate-500">{detalle}</p></article>; }
function Acceso({ href, texto, icono }: { href: string; texto: string; icono: React.ReactNode }) { return <Link href={href} className="sot-card group flex min-h-24 flex-col items-center justify-center gap-2 px-3 text-center text-sm font-medium text-slate-300 transition hover:-translate-y-0.5 hover:border-azul-500/60 hover:text-white"><span className="text-azul-300 transition group-hover:scale-110">{icono}</span>{texto}</Link>; }
function DatoOperacion({ etiqueta, valor }: { etiqueta: string; valor: number }) { return <div className="flex items-center justify-between gap-3"><span className="text-slate-400">{etiqueta}</span><strong className="text-white">{valor}</strong></div>; }
function Anillo({ valor }: { valor: number }) { return <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#25b9eb ${valor * 3.6}deg, #15344e 0deg)` }}><div className="grid h-[5.25rem] w-[5.25rem] place-items-center rounded-full bg-[#07182b]"><div className="text-center"><strong className="block text-2xl text-white">{valor}%</strong><span className="text-[0.6rem] uppercase tracking-wider text-slate-500">actividad</span></div></div></div>; }

type AlertaVista = { id: string; tipo: string; severidad: string; hora_captura: string; puestos: { codigo: string; nombre: string; empresas_cliente: { nombre: string } | { nombre: string }[] | null } | { codigo: string; nombre: string; empresas_cliente: { nombre: string } | { nombre: string }[] | null }[] | null; guardias: { nombre: string } | { nombre: string }[] | null };
function Alerta({ alerta }: { alerta: AlertaVista }) { const puesto = uno(alerta.puestos); const cliente = uno(puesto?.empresas_cliente); const guardia = uno(alerta.guardias); const emergencia = alerta.severidad === "emergencia"; return <Link href="/operacion/novedades" className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"><span className={`grid h-10 w-10 place-items-center rounded-xl ${emergencia ? "bg-red-500/12 text-red-300" : "bg-amber-500/12 text-amber-200"}`}><IconoAlerta className="h-5 w-5" /></span><span className="min-w-0"><strong className="block truncate text-sm font-medium text-white">{alerta.tipo}</strong><span className="block truncate text-xs text-slate-500">{cliente?.nombre ?? puesto?.codigo ?? guardia?.nombre ?? "Central"}</span></span><time className="text-[0.68rem] text-slate-500">{horaEcuador(alerta.hora_captura)}</time></Link>; }
