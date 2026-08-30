import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoEscudoOk, IconoFlecha } from "@/app/componentes/iconos";
import { FormularioTurno } from "@/app/operacion/turnos/formulario-turno";
import { exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Custodia armada — SOTERSA" };
export const dynamic = "force-dynamic";

type Custodia = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  armado: boolean;
  origen: string | null;
  destino: string | null;
  origen_lat: number | null;
  origen_lng: number | null;
  destino_lat: number | null;
  destino_lng: number | null;
  empresas_cliente: { nombre: string } | { nombre: string }[] | null;
};

type TurnoCustodia = {
  id: string;
  puesto_id: string;
  inicio_programado: string;
  fin_programado: string;
  estado: string;
  guardias: { nombre: string } | { nombre: string }[] | null;
  puestos: { codigo: string; nombre: string } | { codigo: string; nombre: string }[] | null;
};

export default async function PaginaCustodias() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const { data, error } = await supabase
    .from("puestos")
    .select("id,codigo,nombre,activo,armado,origen,destino,origen_lat,origen_lng,destino_lat,destino_lng,empresas_cliente(nombre)")
    .eq("tipo_servicio", "custodia_armada")
    .order("activo", { ascending: false })
    .order("codigo");

  const custodias = (data ?? []) as Custodia[];
  const activas = custodias.filter((custodia) => custodia.activo);
  const listas = activas.filter(rutaCompleta);
  const pendientes = activas.filter((custodia) => !rutaCompleta(custodia));

  const idsActivos = activas.map((custodia) => custodia.id);
  const ahora = new Date().toISOString();
  const [guardiasR, turnosR] = await Promise.all([
    perfil.rol === "admin"
      ? supabase.from("guardias").select("id,nombre").eq("activo", true).order("nombre")
      : Promise.resolve({ data: [], error: null }),
    idsActivos.length > 0
      ? supabase
          .from("turnos")
          .select("id,puesto_id,inicio_programado,fin_programado,estado,guardias(nombre),puestos(codigo,nombre)")
          .in("puesto_id", idsActivos)
          .gte("fin_programado", ahora)
          .neq("estado", "ausente")
          .order("inicio_programado")
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const turnos = (turnosR.data ?? []) as TurnoCustodia[];
  const enCurso = turnos.filter((turno) => turno.inicio_programado <= ahora && turno.fin_programado >= ahora && turno.estado !== "cerrado");

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/admin" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

        <section className="mt-5">
          <p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Operación especializada</p>
          <h1 className="mt-2 text-3xl font-bold lg:text-4xl">Custodia armada</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">Control de rutas, agentes y turnos de custodia usando la misma trazabilidad operativa de SOTERSA. La pantalla del agente se habilita automáticamente cuando su turno de custodia está vigente.</p>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Resumen titulo="Rutas registradas" valor={custodias.length} />
          <Resumen titulo="Activas" valor={activas.length} normal />
          <Resumen titulo="En curso" valor={enCurso.length} normal={enCurso.length > 0} />
          <Resumen titulo="Listas para mapa" valor={listas.length} normal={listas.length > 0} />
          <Resumen titulo="Datos pendientes" valor={pendientes.length} alerta={pendientes.length > 0} />
        </section>

        {perfil.rol === "admin" && activas.length > 0 && (
          <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
            <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:p-5">
              <h2 className="text-lg font-semibold">Asignar agente a custodia</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">La asignación usa el control de turnos existente, evita cruces de horario y activa automáticamente el módulo móvil de custodia para el agente durante el servicio.</p>
              <div className="mt-4"><FormularioTurno guardias={guardiasR.data ?? []} puestos={activas.map(({ id, codigo, nombre }) => ({ id, codigo, nombre }))} /></div>
            </article>

            <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Próximas asignaciones</h2><Link href="/operacion/turnos" className="text-sm font-medium text-[#65c8ff]">Ver turnos</Link></div>
              {turnosR.error ? <p className="mt-4 text-sm text-red-300">No fue posible consultar la programación.</p> : turnos.length === 0 ? <p className="mt-4 text-sm leading-6 text-slate-500">Todavía no hay turnos vigentes o próximos para las custodias activas.</p> : <div className="mt-4 space-y-2">{turnos.slice(0, 6).map((turno) => <TurnoResumen key={turno.id} turno={turno} ahora={ahora} />)}</div>}
            </article>
          </section>
        )}

        {perfil.rol === "supervisor" && turnos.length > 0 && (
          <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:p-5"><h2 className="text-lg font-semibold">Custodias programadas</h2><div className="mt-4 grid gap-2 lg:grid-cols-2">{turnos.map((turno) => <TurnoResumen key={turno.id} turno={turno} ahora={ahora} />)}</div></section>
        )}

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm text-red-200">No fue posible consultar las custodias. Revisa la conexión o los permisos del usuario.</p>
        ) : custodias.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-dashed border-[#27425e] bg-[#07172a]/80 px-5 py-12 text-center">
            <h2 className="font-semibold text-slate-200">Todavía no hay custodias registradas</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Crea el servicio desde Clientes y servicios seleccionando la modalidad Custodia armada. La ruta aparecerá aquí automáticamente.</p>
            <Link href="/operacion/clientes" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-5 text-sm font-semibold text-white">Ir a Clientes y servicios</Link>
          </section>
        ) : (
          <section className="mt-5 grid items-start gap-4 lg:grid-cols-2">
            {custodias.map((custodia) => {
              const completa = rutaCompleta(custodia);
              const cliente = nombreEmpresa(custodia.empresas_cliente);
              const turnosRuta = turnos.filter((turno) => turno.puesto_id === custodia.id);
              const turnoActual = turnosRuta.find((turno) => turno.inicio_programado <= ahora && turno.fin_programado >= ahora && turno.estado !== "cerrado");
              return (
                <article key={custodia.id} className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95 shadow-xl shadow-black/15">
                  <div className="flex items-start justify-between gap-4 border-b border-[#20374e] px-4 py-4">
                    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#49b6ff]">{custodia.codigo}</p><h2 className="mt-1 truncate text-lg font-semibold">{custodia.nombre}</h2><p className="mt-1 truncate text-sm text-slate-400">{cliente}</p></div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${turnoActual ? "bg-emerald-500/12 text-emerald-300" : custodia.activo ? "bg-[#0788ff]/12 text-[#8ddaff]" : "bg-slate-500/10 text-slate-400"}`}>{turnoActual ? "En curso" : custodia.activo ? "Activa" : "Inactiva"}</span>
                  </div>

                  <div className="p-4">
                    <div className="custodia-mapa relative h-48 overflow-hidden rounded-xl border border-[#27425e]">
                      <div className="custodia-ruta" aria-hidden><span className="custodia-trayecto"/><span className="custodia-punto custodia-punto-origen"/><span className="custodia-punto custodia-punto-destino"/><span className="custodia-camion">◆</span></div>
                      <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2 text-[0.68rem]"><span className="rounded-lg bg-[#020b18]/85 px-2 py-1.5 text-slate-300">Origen · {custodia.origen ?? "pendiente"}</span><span className="rounded-lg bg-[#020b18]/85 px-2 py-1.5 text-right text-slate-300">Destino · {custodia.destino ?? "pendiente"}</span></div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Dato titulo="Servicio" valor={custodia.armado ? "Armado" : "Revisar configuración"} alerta={!custodia.armado} />
                      <Dato titulo="Georreferencia" valor={completa ? "Completa" : "Pendiente"} alerta={!completa} />
                    </div>

                    {turnoActual && <p className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-xs leading-5 text-emerald-200">Agente en servicio: {uno(turnoActual.guardias)?.nombre ?? "Asignado"}. Finaliza {fechaHoraEcuador(turnoActual.fin_programado)}.</p>}
                    {!turnoActual && turnosRuta[0] && <p className="mt-3 rounded-xl border border-[#0788ff]/25 bg-[#0788ff]/8 px-3 py-2.5 text-xs leading-5 text-[#8ddaff]">Próxima salida: {fechaHoraEcuador(turnosRuta[0].inicio_programado)} · {uno(turnosRuta[0].guardias)?.nombre ?? "Agente asignado"}.</p>}
                    {!completa && <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs leading-5 text-amber-200">Faltan coordenadas de origen o destino. La ruta se mantiene visible para control administrativo, pero no se considera lista para seguimiento geográfico.</p>}

                    {completa && <a href={`https://www.google.com/maps/dir/?api=1&origin=${custodia.origen_lat},${custodia.origen_lng}&destination=${custodia.destino_lat},${custodia.destino_lng}`} target="_blank" rel="noreferrer" className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-[#0788ff]/50 bg-[#0788ff]/10 px-4 text-sm font-semibold text-[#8ddaff]">Abrir ruta en Google Maps</a>}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function rutaCompleta(custodia: Custodia) {
  return Boolean(custodia.origen && custodia.destino && custodia.origen_lat != null && custodia.origen_lng != null && custodia.destino_lat != null && custodia.destino_lng != null);
}

function nombreEmpresa(valor: Custodia["empresas_cliente"]) {
  if (Array.isArray(valor)) return valor[0]?.nombre ?? "Cliente no asignado";
  return valor?.nombre ?? "Cliente no asignado";
}

function TurnoResumen({ turno, ahora }: { turno: TurnoCustodia; ahora: string }) {
  const guardia = uno(turno.guardias);
  const puesto = uno(turno.puestos);
  const actual = turno.inicio_programado <= ahora && turno.fin_programado >= ahora && turno.estado !== "cerrado";
  return <div className="rounded-xl border border-[#27425e] bg-[#041225] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{puesto?.codigo ?? "Custodia"} · {guardia?.nombre ?? "Agente"}</p><p className="mt-1 text-xs text-slate-500">{fechaHoraEcuador(turno.inicio_programado)} → {fechaHoraEcuador(turno.fin_programado)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] ${actual ? "bg-emerald-500/12 text-emerald-300" : "bg-[#0788ff]/12 text-[#8ddaff]"}`}>{actual ? "En curso" : "Programado"}</span></div></div>;
}

function Resumen({ titulo, valor, normal = false, alerta = false }: { titulo: string; valor: number; normal?: boolean; alerta?: boolean }) {
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${alerta ? "text-amber-300" : normal ? "text-emerald-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>;
}

function Dato({ titulo, valor, alerta = false }: { titulo: string; valor: string; alerta?: boolean }) {
  return <div className="rounded-xl border border-[#27425e] bg-[#041225] p-3"><p className="text-[0.7rem] uppercase tracking-wide text-slate-500">{titulo}</p><p className={`mt-1 text-sm font-medium ${alerta ? "text-amber-300" : "text-slate-200"}`}>{valor}</p></div>;
}
