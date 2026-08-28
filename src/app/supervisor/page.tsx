import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { TarjetaMetrica } from "@/app/componentes/tarjeta-metrica";
import {
  IconoAlerta,
  IconoCiclo,
  IconoEscudoOk,
  IconoLista,
  IconoPersona,
  IconoRonda,
  IconoTurno,
} from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, fechaHoraEcuador, horaEcuador, uno } from "@/lib/sesion";
import { validarNovedad } from "./acciones";

export const metadata = { title: "Supervisión — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaSupervisor() {
  const { supabase, perfil } = await exigirPerfil(["supervisor"]);
  const desde = ahoraConDesfase(-24);
  const hasta = ahoraConDesfase(16);

  const [puestosR, turnosR, novedadesR, rondasR, vaciosR] = await Promise.all([
    supabase.from("puestos").select("id, codigo, nombre, activo").eq("activo", true),
    supabase
      .from("turnos")
      .select("id, estado, puesto_id, inicio_programado, fin_programado, guardias(nombre, telefono), puestos(codigo, nombre), aperturas_turno(id, hora_captura)")
      .gte("fin_programado", desde)
      .lte("inicio_programado", hasta)
      .order("inicio_programado"),
    supabase
      .from("novedades")
      .select("id, tipo, severidad, descripcion, foto_url, hora_captura, puesto_id, estado, puestos(codigo, nombre), guardias(nombre)")
      .eq("estado", "registrada")
      .order("hora_captura", { ascending: false })
      .limit(8),
    supabase.from("rondas").select("id, turno_id, hora_captura").gte("hora_captura", desde),
    supabase
      .from("v_puestos_sin_apertura")
      .select("turno_id, puesto_codigo, puesto_nombre, guardia_nombre, guardia_telefono, inicio_programado, minutos_de_retraso")
      .order("minutos_de_retraso", { ascending: false }),
  ]);

  const puestos = puestosR.data ?? [];
  const turnos = turnosR.data ?? [];
  const novedades = novedadesR.data ?? [];
  const rondas = rondasR.data ?? [];
  const vacios = vaciosR.data ?? [];
  const conApertura = turnos.filter((turno) => (turno.aperturas_turno?.length ?? 0) > 0);
  const cobertura = turnos.length ? Math.round((conApertura.length / turnos.length) * 100) : 100;

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="supervisor" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <section>
          <p className="text-sm font-medium text-azul-400">Supervisor de zona</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Buenos días, {perfil.nombre.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-gris-400">Resumen operativo de las últimas 24 horas</p>
        </section>

        <section className="panel-operativo flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gris-400">Operación de hoy</p>
            <p className="mt-1 text-5xl font-bold text-white">{cobertura}%</p>
            <p className={`mt-2 text-sm font-medium ${vacios.length ? "text-amber-300" : "text-green-300"}`}>
              {vacios.length ? `${vacios.length} puesto(s) requieren atención` : "Todo bajo control"}
            </p>
          </div>
          <IconoEscudoOk className="h-24 w-24 text-azul-500/45" />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaMetrica titulo="Personal" valor={`${conApertura.length}/${turnos.length}`} detalle="con apertura registrada" icono={<IconoPersona className="h-7 w-7" />} tono="normal" />
          <TarjetaMetrica titulo="Puestos" valor={puestos.length} detalle="activos en tu zona" icono={<IconoTurno className="h-7 w-7" />} />
          <TarjetaMetrica titulo="Rondas" valor={rondas.length} detalle="puntos registrados" icono={<IconoCiclo className="h-7 w-7" />} />
          <TarjetaMetrica titulo="Por validar" valor={novedades.length} detalle="novedades pendientes" icono={<IconoAlerta className="h-7 w-7" />} tono={novedades.length ? "emergencia" : "normal"} />
        </section>

        {vacios.length > 0 && (
          <section className="tarjeta filo-emergencia overflow-hidden">
            <div className="border-b border-borde/60 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <IconoAlerta className="h-5 w-5 text-red-300" /> Alertas de puesto sin apertura
              </h2>
            </div>
            <div className="divide-y divide-borde/50">
              {vacios.map((alerta) => (
                <article key={alerta.turno_id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{alerta.puesto_codigo} · {alerta.puesto_nombre}</p>
                    <p className="mt-1 text-sm text-gris-400">{alerta.guardia_nombre} · debía abrir a las {horaEcuador(alerta.inicio_programado)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emergencia/15 px-3 py-1.5 text-sm font-medium text-red-200">{alerta.minutos_de_retraso} min</span>
                    {alerta.guardia_telefono && <a href={`tel:${alerta.guardia_telefono}`} className="rounded-lg border border-borde px-3 py-2 text-sm text-azul-400">Llamar</a>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-white"><IconoLista className="h-5 w-5 text-azul-400" /> Personal y puestos</h2>
            <span className="text-xs text-gris-500">{turnos.length} turnos</span>
          </div>
          {turnos.length === 0 ? <Vacio texto="No hay turnos programados en esta ventana." /> : (
            <div className="divide-y divide-borde/50">
              {turnos.slice(0, 8).map((turno) => {
                const abierto = (turno.aperturas_turno?.length ?? 0) > 0;
                const guardia = uno(turno.guardias);
                const puesto = uno(turno.puestos);
                return (
                  <article key={turno.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
                    <div><p className="font-medium text-white">{guardia?.nombre ?? "Guardia asignado"}</p><p className="text-sm text-gris-500">{puesto?.codigo} · {puesto?.nombre}</p></div>
                    <p className="text-sm text-gris-400">{horaEcuador(turno.inicio_programado)}–{horaEcuador(turno.fin_programado)}</p>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${abierto ? "bg-normal/15 text-green-300" : "bg-gris-700/50 text-gris-300"}`}>{abierto ? "En puesto" : turno.estado}</span>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="tarjeta overflow-hidden">
          <div className="border-b border-borde/60 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-white"><IconoAlerta className="h-5 w-5 text-novedad" /> Novedades por validar</h2>
          </div>
          {novedades.length === 0 ? <Vacio texto="No hay novedades pendientes de validación." /> : (
            <div className="divide-y divide-borde/50">
              {novedades.map((novedad) => (
                <article key={novedad.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-medium text-white">{novedad.tipo}</p><p className="mt-1 text-xs text-gris-500">{uno(novedad.puestos)?.codigo} · {uno(novedad.guardias)?.nombre ?? "Personal"} · {fechaHoraEcuador(novedad.hora_captura)}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${novedad.severidad === "emergencia" ? "bg-emergencia/15 text-red-200" : novedad.severidad === "novedad" ? "bg-novedad/15 text-amber-200" : "bg-azul-500/15 text-azul-300"}`}>{novedad.severidad}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gris-300">{novedad.descripcion}</p>
                  <form action={validarNovedad} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <input type="hidden" name="id" value={novedad.id} />
                    <input name="nota" maxLength={500} placeholder="Nota de supervisión (opcional)" className="min-h-11 rounded-xl border border-borde bg-[#020b18]/70 px-3 text-sm text-white outline-none focus:border-azul-400" />
                    <button name="decision" value="interna" className="min-h-11 rounded-xl border border-borde px-4 text-sm font-medium text-gris-300">Validar interna</button>
                    <button name="decision" value="cliente" className="min-h-11 rounded-xl bg-azul-600 px-4 text-sm font-semibold text-white">Validar y publicar</button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tarjeta p-5">
          <h2 className="flex items-center gap-2 font-semibold text-white"><IconoRonda className="h-5 w-5 text-azul-400" /> Supervisión en tiempo real</h2>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">El mapa se activará cuando existan ubicaciones de puestos y consentimiento LOPDP registrado. Hasta entonces, el tablero usa aperturas, rondas y alertas verificables.</p>
        </section>
      </main>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="px-5 py-8 text-center text-sm text-gris-500">{texto}</p>;
}
