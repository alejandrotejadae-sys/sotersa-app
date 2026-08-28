import type { ReactNode } from "react";
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
import { ahoraConDesfase, exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Central operativa — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const { supabase, perfil } = await exigirPerfil(["admin"]);
  const desde = ahoraConDesfase(-24);

  const [guardiasR, puestosR, turnosR, rondasR, novedadesR, vaciosR, clientesR] = await Promise.all([
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("turnos").select("id", { count: "exact", head: true }).eq("estado", "abierto"),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde),
    supabase
      .from("novedades")
      .select("id, tipo, severidad, descripcion, hora_captura, estado, puestos(codigo, nombre), guardias(nombre)")
      .order("hora_captura", { ascending: false })
      .limit(8),
    supabase.from("v_puestos_sin_apertura").select("turno_id", { count: "exact", head: true }),
    supabase.from("empresas_cliente").select("id", { count: "exact", head: true }).eq("activo", true),
  ]);

  const guardias = guardiasR.count ?? 0;
  const puestos = puestosR.count ?? 0;
  const turnos = turnosR.count ?? 0;
  const rondas = rondasR.count ?? 0;
  const alertas = (vaciosR.count ?? 0) + (novedadesR.data ?? []).filter((n) => n.estado === "registrada").length;

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="admin" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gris-400">Buenos días, <span className="text-azul-400">{perfil.nombre.split(" ")[0]}</span></p>
            <h1 className="mt-1 text-3xl font-bold text-white">Operación general</h1>
          </div>
          <span className="w-fit rounded-full border border-normal/30 bg-normal/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-green-300">Central operativa · en línea</span>
        </div>

        <section className="panel-operativo flex items-center justify-between gap-6 p-6 sm:p-8">
          <div><p className="text-xl text-gris-200">Operación general</p><p className="mt-2 text-3xl font-bold text-azul-400 sm:text-4xl">{alertas ? "Atención operativa" : "Todo bajo control"}</p><p className="mt-2 text-sm text-gris-400">Datos en tiempo real desde Supabase</p></div>
          <IconoEscudoOk className="h-24 w-24 shrink-0 text-azul-500/45 sm:h-32 sm:w-32" />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaMetrica titulo="Personal activo" valor={guardias} detalle="guardias habilitados" icono={<IconoPersona className="h-7 w-7" />} />
          <TarjetaMetrica titulo="Turnos abiertos" valor={turnos} detalle={`${puestos} puestos activos`} icono={<IconoCiclo className="h-7 w-7" />} tono="normal" />
          <TarjetaMetrica titulo="Alertas" valor={alertas} detalle="requieren revisión" icono={<IconoAlerta className="h-7 w-7" />} tono={alertas ? "emergencia" : "normal"} />
          <TarjetaMetrica titulo="Rondas 24 h" valor={rondas} detalle="puntos registrados" icono={<IconoRonda className="h-7 w-7" />} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AccesoRapido icono={<IconoPersona className="h-6 w-6" />} titulo="Personal" detalle={`${guardias} habilitados`} />
          <AccesoRapido icono={<IconoTurno className="h-6 w-6" />} titulo="Puestos" detalle={`${puestos} configurados`} />
          <AccesoRapido icono={<IconoCiclo className="h-6 w-6" />} titulo="Rondas" detalle="Seguimiento 24 h" />
          <AccesoRapido icono={<IconoLista className="h-6 w-6" />} titulo="Clientes" detalle={`${clientesR.count ?? 0} activos`} />
        </section>

        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="font-semibold text-white">Actividad reciente</h2><span className="text-xs text-gris-500">Últimos registros</span></div>
          {(novedadesR.data ?? []).length === 0 ? <p className="px-5 py-8 text-center text-sm text-gris-500">Todavía no hay actividad registrada.</p> : (
            <div className="divide-y divide-borde/50">
              {(novedadesR.data ?? []).map((novedad) => (
                <article key={novedad.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className={`h-3 w-3 rounded-full ${novedad.severidad === "emergencia" ? "bg-emergencia" : novedad.severidad === "novedad" ? "bg-novedad" : "bg-azul-500"}`} />
                  <div><p className="font-medium text-white">{novedad.tipo}</p><p className="mt-0.5 text-sm text-gris-500">{uno(novedad.puestos)?.codigo} · {uno(novedad.guardias)?.nombre ?? "Sistema"}</p></div>
                  <div className="text-left sm:text-right"><p className="text-sm text-gris-300">{fechaHoraEcuador(novedad.hora_captura)}</p><p className="mt-0.5 text-xs text-gris-500">{novedad.estado}</p></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-semibold text-white">Operación geográfica</h2>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">El mapa de Quito se habilitará con ubicaciones reales de los puestos. No se dibujan posiciones ficticias ni se expone GPS de personal sin consentimiento LOPDP.</p>
        </section>
      </main>
    </div>
  );
}

function AccesoRapido({ icono, titulo, detalle }: { icono: ReactNode; titulo: string; detalle: string }) {
  return <article className="tarjeta flex items-center gap-3 p-4"><span className="text-azul-400">{icono}</span><div><p className="font-medium text-white">{titulo}</p><p className="text-xs text-gris-500">{detalle}</p></div></article>;
}
