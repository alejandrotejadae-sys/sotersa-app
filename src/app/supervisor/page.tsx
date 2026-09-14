import Image from "next/image";
import Link from "next/link";
import { IconoAlerta, IconoCasa, IconoCiclo, IconoEscudoOk, IconoFlecha, IconoLibro, IconoPersona, IconoTelefono, IconoTurno } from "@/app/componentes/iconos";
import { MapaPuestos } from "@/app/componentes/mapa-puestos";
import { exigirPerfil, fechaHoraEcuador, horaEcuador } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { ES_ALARMA, type EstadoPuesto } from "@/lib/estado-puestos";
import { resumenDeZona, type FiltroSupervision, type NovedadZona, type PuestoZona, type TurnoHoy } from "./datos";
import { SelectorSupervisor } from "./selector-supervisor";
import { asignarPuestosSinSupervisor, cerrarNovedad, notificarNovedad, validarNovedad } from "./acciones";
import { puedeEditar } from "@/lib/roles";

export const metadata = { title: "Supervisión — SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Panel del supervisor. Responde en orden: que esta mal ahora, como estan mis
 * puestos, que novedades esperan mi decision, quien esta de turno hoy.
 */
export default async function PaginaSupervisor({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  const { supabase, perfil } = await exigirPerfil(["supervisor", "admin", "operativo"]);
  const params = await searchParams;
  const lector = esLector(perfil.rol);
  const puedeDecidir = perfil.rol !== "operativo";

  let supervisores: { id: string; nombre: string }[] = [];
  let filtro: FiltroSupervision;
  let actual = "todos";
  if (lector) {
    supervisores = (await supabase.from("perfiles").select("id,nombre").eq("rol", "supervisor").eq("activo", true).order("nombre")).data ?? [];
    const pedido = params.de ?? "todos";
    if (pedido === "sin-supervisor") { filtro = { tipo: "sin-supervisor" }; actual = "sin-supervisor"; }
    else if (supervisores.some((s) => s.id === pedido)) { filtro = { tipo: "supervisor", id: pedido }; actual = pedido; }
    else filtro = { tipo: "todos" };
  } else {
    filtro = { tipo: "supervisor", id: perfil.id };
  }

  const r = await resumenDeZona(filtro);
  // Solo para el admin mirando a un supervisor: cuantos puestos activos no tiene nadie.
  let sinSupervisor = 0;
  if (lector && filtro.tipo === "supervisor") {
    const [{ count: total }, { data: asignados }] = await Promise.all([
      supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true),
      supabase.from("supervision_puestos").select("puesto_id,puestos!inner(activo)").eq("puestos.activo", true),
    ]);
    sinSupervisor = Math.max(0, (total ?? 0) - new Set((asignados ?? []).map((a) => a.puesto_id)).size);
  }
  const ahoraIso = new Date().toISOString();
  const nombre = perfil.nombre.trim().split(" ")[0] || "Supervisor";
  const enApp = r.puestos.filter((p) => p.estado !== "sin_programar" && p.estado !== "sin_turno_hoy");
  const cubiertos = enApp.filter((p) => ES_ALARMA[p.estado] !== "rojo").length;
  const cobertura = enApp.length ? Math.round((cubiertos / enApp.length) * 100) : null;
  const rojos = r.puestos.filter((p) => ES_ALARMA[p.estado] === "rojo");
  const ambar = r.puestos.filter((p) => ES_ALARMA[p.estado] === "ambar");
  const emergencias = [...r.pendientes, ...r.abiertas].filter((n) => n.severidad === "emergencia");
  const enPuesto = r.turnosHoy.filter((t) => t.situacion === "en_puesto").length;
  const ubicados = r.puestos.filter((p) => p.lat != null && p.lng != null);
  const zonaNombre = filtro.tipo === "supervisor" ? (lector ? supervisores.find((s) => s.id === filtro.id)?.nombre ?? "supervisor" : "mis puestos") : filtro.tipo === "sin-supervisor" ? "puestos sin supervisor" : "todos los puestos";

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1440px] overflow-hidden border-x border-white/[0.04] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18_0%,#031226_55%,#020b18_100%)] shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-5 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
          <MarcaSupervisor />
          <nav className="hidden items-center gap-1 lg:flex">
            <EnlaceSuperior href="/supervisor" texto="Inicio" activo />
            <EnlaceSuperior href="/operacion/personal" texto="Personal" />
            <EnlaceSuperior href="/operacion/turnos" texto="Turnos" />
            <EnlaceSuperior href="/operacion/rondas" texto="Rondas" />
            <EnlaceSuperior href="/operacion/novedades" texto="Novedades" />
            <EnlaceSuperior href="/operacion/reportes" texto="Reportes" />
            <EnlaceSuperior href="/escuela" texto="Escuela" />
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/operacion/novedades?filtro=pendientes" aria-label="Novedades pendientes" className="relative grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/5"><Campana className="h-6 w-6" />{r.pendientes.length > 0 && <span className="absolute right-1.5 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#087ff0] px-1 text-[0.65rem] font-semibold">{r.pendientes.length}</span>}</Link>
            <Link href="/mi-perfil" aria-label="Abrir mi perfil" className="grid h-11 w-11 place-items-center rounded-full border border-[#27425e] bg-[#07172a] text-[#49b6ff]"><IconoPersona className="h-5 w-5" /></Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 px-4 pb-28 lg:grid-cols-12 lg:px-8 lg:pb-10">
          {lector && <div className="lg:col-span-12"><Link href="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Panel administrativo</Link><div className="mt-3"><SelectorSupervisor supervisores={supervisores} actual={actual} /></div>{filtro.tipo === "supervisor" && puedeEditar(perfil.rol) && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#0788ff]/35 bg-[#0788ff]/8 px-4 py-3 text-sm">
              <p className="text-slate-200">{sinSupervisor > 0 ? <>Hay <strong>{sinSupervisor}</strong> puesto{sinSupervisor === 1 ? "" : "s"} activo{sinSupervisor === 1 ? "" : "s"} que nadie supervisa.</> : <>Todos los puestos activos tienen supervisor.</>} Los puestos de <strong>{zonaNombre}</strong> se ajustan uno a uno en <Link href={`/operacion/usuarios/${filtro.id}`} className="font-semibold text-[#8ddaff]">su ficha de usuario</Link>.</p>
              {sinSupervisor > 0 && <form action={asignarPuestosSinSupervisor}><input type="hidden" name="supervisor_id" value={filtro.id} /><button className="min-h-10 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white transition active:scale-[0.98]">Asignar {sinSupervisor === 1 ? "ese puesto" : `los ${sinSupervisor} puestos`} a {zonaNombre}</button></form>}
            </div>
          )}</div>}

          <section className="px-1 pt-1 lg:col-span-12">
            <p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Supervisor · {zonaNombre}</p>
            <h1 className="mt-2 text-[2rem] font-bold leading-tight tracking-tight lg:text-4xl">{saludo()}, {nombre}</h1>
            <p className="mt-1 text-base text-slate-400">Resumen operativo · {fechaHoraEcuador(ahoraIso)}</p>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-[#27425e] bg-[radial-gradient(circle_at_78%_42%,rgba(0,125,255,0.13),transparent_40%),linear-gradient(135deg,#07182c,#061326)] p-5 shadow-xl shadow-black/20 lg:col-span-8 lg:min-h-52 lg:p-8">
            <div className="absolute -right-2 top-3 text-[#0c3d68]/45"><IconoEscudoOk className="h-36 w-36" /></div>
            <div className="relative flex items-center gap-5">
              <AnilloOperacion porcentaje={cobertura ?? 0} />
              <div>
                <p className="text-base text-slate-300">Puestos cubiertos ahora</p>
                <p className="mt-1 text-5xl font-bold leading-none">{cobertura == null ? "—" : `${cobertura}%`}</p>
                <p className={`mt-2 text-base font-medium ${rojos.length ? "text-red-400" : ambar.length ? "text-amber-300" : cobertura == null ? "text-slate-400" : "text-emerald-400"}`}>
                  {cobertura == null ? "sin turnos cargados en la app" : rojos.length ? `${rojos.length} puesto${rojos.length === 1 ? "" : "s"} requiere${rojos.length === 1 ? "" : "n"} acción` : ambar.length ? `${ambar.length} sin ronda reciente` : "bajo control"}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:col-span-4">
            <Metrica icono={<IconoPersona className="h-7 w-7" />} titulo="En puesto" valor={`${enPuesto}/${r.turnosHoy.length}`} detalle="turnos de hoy" />
            <Metrica icono={<IconoEscudoOk className="h-7 w-7" />} titulo="Puestos" valor={r.puestos.length} detalle={`${enApp.length} con turno`} />
            <Metrica icono={<IconoCiclo className="h-7 w-7" />} titulo="Rondas" valor={r.rondasHoy} detalle="últimas 24 h" />
            <Metrica icono={<IconoAlerta className="h-7 w-7" />} titulo="Por validar" valor={r.pendientes.length} detalle="novedades" emergencia={r.pendientes.length > 0} />
          </section>

          {(rojos.length > 0 || ambar.length > 0 || emergencias.length > 0) && (
            <section className="rounded-2xl border border-red-500/35 bg-red-500/[0.06] p-4 lg:col-span-12">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-red-200"><IconoAlerta className="h-5 w-5" /> Requiere acción ahora</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {emergencias.map((n) => <li key={n.id} className="rounded-xl border border-red-500/30 bg-[#2a0b0b]/60 px-3 py-2.5 text-sm"><p className="font-medium text-red-100">Emergencia · {n.tipo}</p><p className="text-xs text-red-200/80">{n.empresa} {n.puesto} · {fechaHoraEcuador(n.hora_captura)} · {n.estado === "registrada" ? "sin validar" : n.estado}</p></li>)}
                {rojos.map((p) => <li key={p.id} className="rounded-xl border border-red-500/30 bg-[#2a0b0b]/60 px-3 py-2.5 text-sm"><p className="font-medium text-red-100">{ESTADOS[p.estado].texto} · {p.empresa} {p.codigo}</p><p className="text-xs text-red-200/80">{p.agente ? `${p.agente.nombre} · turno ${horaEcuador(p.inicioTurno)}` : p.proximoTurno ? `Próximo turno ${fechaHoraEcuador(p.proximoTurno)}` : "Sin turno asignado"}</p>{p.agente?.telefono && <a href={`tel:${limpiar(p.agente.telefono)}`} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#8ddaff]"><IconoTelefono className="h-3.5 w-3.5" /> Llamar al agente</a>}</li>)}
                {ambar.map((p) => <li key={p.id} className="rounded-xl border border-amber-400/30 bg-[#2a1f06]/60 px-3 py-2.5 text-sm"><p className="font-medium text-amber-100">Sin ronda reciente · {p.empresa} {p.codigo}</p><p className="text-xs text-amber-200/80">{p.agente?.nombre} · última ronda {p.ultimaRonda ? horaEcuador(p.ultimaRonda) : "ninguna en este turno"}</p>{p.agente?.telefono && <a href={`tel:${limpiar(p.agente.telefono)}`} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#8ddaff]"><IconoTelefono className="h-3.5 w-3.5" /> Llamar al agente</a>}</li>)}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#20374e] px-4 py-3.5"><h2 className="text-lg font-semibold">{filtro.tipo === "supervisor" && lector ? `Puestos de ${zonaNombre}` : filtro.tipo === "supervisor" ? "Mis puestos" : `${zonaNombre[0].toUpperCase()}${zonaNombre.slice(1)}`}</h2><span className="text-xs text-slate-500">Actualizado {horaEcuador(ahoraIso)}</span></div>
            {r.puestos.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">{filtro.tipo === "supervisor" ? (lector ? "Este supervisor todavía no tiene puestos asignados. Usa el botón de arriba o su ficha en Usuarios y permisos." : "Todavía no tienes puestos asignados. Pide a la administración que te los asigne.") : filtro.tipo === "sin-supervisor" ? "Todos los puestos activos tienen supervisor." : "No hay puestos activos."}</p> : (
              <div className="divide-y divide-[#20374e]">{r.puestos.map((p) => <FilaPuesto key={p.id} puesto={p} />)}</div>
            )}
          </section>

          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Mapa</h2><span className="text-xs text-slate-500">{ubicados.length} de {r.puestos.length} ubicados</span></div>
            <div className="mt-3">{ubicados.length ? <MapaPuestos alto="h-72" puntos={ubicados.map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, cliente: p.empresa, codigo: p.codigo, puesto: p.nombre, activo: true, color: COLOR_PIN[ES_ALARMA[p.estado]], detalle: `${ESTADOS[p.estado].texto}${p.agente ? ` · ${p.agente.nombre}` : ""}` }))} /> : <p className="rounded-xl border border-[#27425e] bg-[#041225] px-4 py-8 text-center text-sm text-slate-500">Los puestos aún no tienen coordenadas. Se cargan en Clientes → editar puesto → enlace de Google Maps.</p>}</div>
            <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />Cubierto</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-300" />Sin ronda</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-400" />Sin abrir / sin cobertura</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />Sin turno</span></p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#20374e] px-4 py-3.5"><h2 className="text-lg font-semibold">Novedades por validar <span className="text-sm font-normal text-slate-500">· {r.pendientes.length}</span></h2><Link href="/operacion/novedades" className="flex items-center gap-1 text-sm font-medium text-[#0788ff]">Todas <IconoFlecha className="h-4 w-4" /></Link></div>
            {r.pendientes.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Nada pendiente. Todo lo reportado ya tiene decisión.</p> : (
              <div className="divide-y divide-[#20374e]">{r.pendientes.map((n) => <TarjetaNovedad key={n.id} novedad={n} puedeDecidir={puedeDecidir} />)}</div>
            )}
            {r.abiertas.length > 0 && (
              <details className="border-t border-[#20374e]">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-300">En seguimiento · {r.abiertas.length} (notificar al cliente o cerrar)</summary>
                <div className="divide-y divide-[#20374e] border-t border-[#20374e]">{r.abiertas.map((n) => <TarjetaNovedad key={n.id} novedad={n} puedeDecidir={puedeDecidir} />)}</div>
              </details>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-[#20374e] px-4 py-3.5"><h2 className="text-lg font-semibold">Turnos de hoy <span className="text-sm font-normal text-slate-500">· {r.turnosHoy.length}</span></h2><Link href="/operacion/turnos" className="flex items-center gap-1 text-sm font-medium text-[#0788ff]">Cuadrante <IconoFlecha className="h-4 w-4" /></Link></div>
            {r.turnosHoy.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No hay turnos cargados para hoy en estos puestos.</p> : (
              <div className="max-h-[32rem] divide-y divide-[#20374e] overflow-y-auto">{r.turnosHoy.map((t) => <FilaTurno key={t.id} turno={t} />)}</div>
            )}
          </section>

          <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:col-span-12">
            <h2 className="text-lg font-semibold">Accesos</h2>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              <Accion href="/operacion/personal" icono={<IconoPersona className="h-7 w-7" />} texto="Personal" />
              <Accion href="/operacion/turnos" icono={<IconoTurno className="h-7 w-7" />} texto="Turnos" />
              <Accion href="/operacion/rondas" icono={<IconoCiclo className="h-7 w-7" />} texto="Rondas" />
              <Accion href="/operacion/novedades" icono={<IconoAlerta className="h-7 w-7" />} texto="Novedades" />
              <Accion href="/operacion/reportes" icono={<IconoCiclo className="h-7 w-7" />} texto="Reportes" />
              <Accion href="/escuela/avance" icono={<IconoLibro className="h-7 w-7" />} texto="Escuela" />
            </div>
          </section>
        </div>

        <nav aria-label="Navegación del supervisor" className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[540px] grid-cols-5 border-t border-[#27425e] bg-[#031023]/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
          <Navegacion href="/supervisor" icono={<IconoCasa className="h-6 w-6" />} texto="Inicio" activo />
          <Navegacion href="/operacion/personal" icono={<IconoPersona className="h-6 w-6" />} texto="Personal" />
          <Navegacion href="/operacion/rondas" icono={<IconoCiclo className="h-6 w-6" />} texto="Rondas" />
          <Navegacion href="/operacion/novedades" icono={<IconoAlerta className="h-6 w-6" />} texto="Novedades" />
          <Navegacion href="/operacion/turnos" icono={<IconoTurno className="h-6 w-6" />} texto="Turnos" />
        </nav>
      </div>
    </main>
  );
}

const ESTADOS: Record<EstadoPuesto, { texto: string; clase: string }> = {
  cubierto: { texto: "Cubierto", clase: "bg-emerald-500/15 text-emerald-300" },
  por_cerrar: { texto: "Relevo pronto", clase: "bg-emerald-500/15 text-emerald-300" },
  sin_ronda: { texto: "Sin ronda reciente", clase: "bg-amber-400/15 text-amber-200" },
  sin_apertura: { texto: "Turno sin abrir", clase: "bg-red-500/15 text-red-200" },
  sin_cobertura: { texto: "Sin cobertura", clase: "bg-red-500/15 text-red-200" },
  sin_turno_hoy: { texto: "Fuera de horario", clase: "bg-white/[0.06] text-slate-300" },
  sin_programar: { texto: "Sin turnos en la app", clase: "bg-white/[0.06] text-slate-300" },
};
const COLOR_PIN = { verde: "#34d399", ambar: "#fcd34d", rojo: "#f87171", gris: "#94a3b8" } as const;
const SEVERIDAD = { emergencia: { texto: "Emergencia", clase: "bg-red-500/15 text-red-200" }, novedad: { texto: "Novedad", clase: "bg-amber-400/15 text-amber-200" }, informativa: { texto: "Informativa", clase: "bg-[#0788ff]/15 text-[#8ddaff]" } } as const;
const SITUACION: Record<TurnoHoy["situacion"], { texto: string; clase: string }> = {
  en_puesto: { texto: "En puesto", clase: "text-emerald-400" },
  cerrado: { texto: "Cerrado", clase: "text-slate-400" },
  programado: { texto: "Programado", clase: "text-slate-300" },
  sin_apertura: { texto: "Sin abrir", clase: "text-red-400" },
  sin_abrir: { texto: "No se abrió", clase: "text-red-400" },
};

function limpiar(telefono: string) { return telefono.replace(/[^\d+]/g, ""); }

function FilaPuesto({ puesto: p }: { puesto: PuestoZona }) {
  const e = ESTADOS[p.estado];
  return (
    <article className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{p.empresa} · {p.codigo}</p><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.clase}`}>{e.texto}</span></div>
        <p className="mt-0.5 truncate text-sm text-slate-400">{p.nombre}{p.supervisores.length ? ` · supervisa ${p.supervisores.join(", ")}` : " · sin supervisor"}</p>
        {p.agente ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
            <Link href={p.agente.id ? `/operacion/personal/${p.agente.id}` : "/operacion/personal"} className="font-medium text-[#8ddaff]">{p.agente.nombre}</Link>
            <span className="text-xs text-slate-500">turno {horaEcuador(p.inicioTurno)}–{horaEcuador(p.finTurno)} · apertura {p.apertura ? horaEcuador(p.apertura) : "pendiente"} · {p.tienePuntosRonda ? (p.ultimaRonda ? `última ronda ${horaEcuador(p.ultimaRonda)} (${p.rondasEnTurno})` : "sin rondas aún") : "sin puntos QR"}</span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">{p.estado === "sin_programar" ? "Genera el cuadrante en Turnos para supervisarlo desde aquí." : p.proximoTurno ? `Próximo turno ${fechaHoraEcuador(p.proximoTurno)}.` : "Sin turno asignado ahora."}</p>
        )}
      </div>
      {p.agente?.telefono && <a href={`tel:${limpiar(p.agente.telefono)}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/10 px-3.5 text-sm font-semibold text-[#8ddaff]"><IconoTelefono className="h-4 w-4" /> Llamar</a>}
    </article>
  );
}

function FilaTurno({ turno: t }: { turno: TurnoHoy }) {
  const s = SITUACION[t.situacion];
  return (
    <article className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 px-4 py-3">
      <Avatar nombre={t.agente?.nombre ?? "Agente"} />
      <div className="min-w-0">
        {t.agente ? <Link href={t.agente.id ? `/operacion/personal/${t.agente.id}` : "/operacion/personal"} className="block truncate font-medium text-white">{t.agente.nombre}</Link> : <p className="truncate font-medium">Sin agente asignado</p>}
        <p className="truncate text-xs text-slate-400">{t.empresa} · {t.puesto}</p>
        <p className="text-xs text-slate-500">{horaEcuador(t.inicio)}–{horaEcuador(t.fin)}{t.apertura ? ` · abrió ${horaEcuador(t.apertura)}` : ""}{t.rondas ? ` · ${t.rondas} ronda${t.rondas === 1 ? "" : "s"}` : ""}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`whitespace-nowrap text-xs font-medium ${s.clase}`}>● {s.texto}</span>
        {t.agente?.telefono && (t.situacion === "sin_apertura" || t.situacion === "programado") && <a href={`tel:${limpiar(t.agente.telefono)}`} className="text-xs font-semibold text-[#8ddaff]">Llamar</a>}
      </div>
    </article>
  );
}

function TarjetaNovedad({ novedad: n, puedeDecidir }: { novedad: NovedadZona; puedeDecidir: boolean }) {
  const sev = SEVERIDAD[n.severidad];
  const control = "w-full resize-none rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#0788ff]";
  return (
    <article className={`px-4 py-4 ${n.severidad === "emergencia" ? "bg-red-500/[0.05]" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-medium">{n.tipo} <span className={`ml-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${sev.clase}`}>{sev.texto}</span></p><p className="mt-1 text-xs text-slate-500">{n.empresa} {n.puesto} · {fechaHoraEcuador(n.hora_captura)}{n.agente ? ` · ${n.agente}` : ""}</p></div>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300">{n.estado === "registrada" ? "Por validar" : n.estado === "validada" ? (n.visible_cliente ? "Publicada · sin notificar" : "Interna") : n.estado === "notificada" ? "Cliente notificado" : n.estado}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{n.descripcion}</p>
      {n.nota_supervisor && <p className="mt-2 rounded-xl border border-[#0788ff]/20 bg-[#0788ff]/8 px-3 py-2 text-xs text-[#b9e6ff]"><strong>Supervisión:</strong> {n.nota_supervisor}</p>}
      {puedeDecidir && n.estado === "registrada" && (
        <form action={validarNovedad} className="mt-3 border-t border-[#20374e] pt-3">
          <input type="hidden" name="id" value={n.id} />
          <textarea name="nota" maxLength={500} rows={2} placeholder="Nota de supervisión (opcional): qué se hizo, qué sigue…" className={control} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button name="decision" value="interna" className="min-h-10 rounded-xl border border-[#38526b] bg-[#0a1a2e] px-3 text-xs font-medium text-slate-200 transition active:scale-[0.98]">Validar interna</button>
            <button name="decision" value="cliente" className="min-h-10 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-3 text-xs font-semibold text-white transition active:scale-[0.98]">Validar y publicar</button>
          </div>
        </form>
      )}
      {puedeDecidir && n.estado !== "registrada" && (
        <div className="mt-3 grid gap-2 border-t border-[#20374e] pt-3 sm:grid-cols-2">
          {n.estado === "validada" && <form action={notificarNovedad}><input type="hidden" name="id" value={n.id} /><button className="min-h-10 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-200 transition active:scale-[0.98]">Cliente notificado ✓</button></form>}
          <form action={cerrarNovedad} className={`flex gap-2 ${n.estado === "validada" ? "" : "sm:col-span-2"}`}><input type="hidden" name="id" value={n.id} /><input name="cierre" maxLength={500} placeholder="Nota de cierre (opcional)" className="min-h-10 min-w-0 flex-1 rounded-xl border border-[#27425e] bg-[#041225] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#0788ff]" /><button className="min-h-10 shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-200 transition active:scale-[0.98]">Cerrar</button></form>
        </div>
      )}
    </article>
  );
}

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("es-EC", { hour: "numeric", hour12: false, timeZone: "America/Guayaquil" }).format(new Date()));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

function MarcaSupervisor() {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/logo-sotersa.png" alt="SOTERSA" width={42} height={50} className="h-12 w-auto object-contain" priority />
      <div><p className="text-[1.15rem] font-semibold tracking-[0.16em] text-[#19b9f2]">SOTERSA</p><p className="mt-0.5 text-[0.55rem] tracking-[0.2em] text-slate-400">SEGURIDAD ESTRATÉGICA</p></div>
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

function Accion({ icono, texto, href }: { icono: React.ReactNode; texto: string; href: string }) {
  return <Link href={href} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#061426] px-2 py-3 text-center text-sm text-slate-300 transition active:scale-[0.98]"><span className="text-[#0788ff]">{icono}</span>{texto}</Link>;
}

function Navegacion({ icono, texto, activo = false, href }: { icono: React.ReactNode; texto: string; activo?: boolean; href: string }) {
  return <Link href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] ${activo ? "text-[#0788ff]" : "text-slate-400"}`}>{icono}<span>{texto}</span></Link>;
}

function Campana({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}

function EnlaceSuperior({ href, texto, activo = false }: { href: string; texto: string; activo?: boolean }) {
  return <Link href={href} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activo ? "bg-[#087ff0]/15 text-[#4db6ff]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{texto}</Link>;
}
