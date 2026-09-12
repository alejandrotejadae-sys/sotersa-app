import Link from "next/link";
import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { IconoFlecha } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { resumenMensual } from "../datos";
import { BotonImprimir } from "./boton-imprimir";

export const metadata = { title: "Reporte mensual — SOTERSA" };
export const dynamic = "force-dynamic";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/**
 * Reporte de un mes para el directorio o la asamblea del cliente. Se imprime
 * desde el navegador (Guardar como PDF): mismo mecanismo que los reportes del
 * admin, sin dependencias nuevas.
 */
export default async function PaginaReporte({ searchParams }: { searchParams: Promise<{ empresa?: string; mes?: string }> }) {
  const { perfil } = await exigirPerfil(["cliente", "admin", "operativo"]);
  const params = await searchParams;
  const lector = esLector(perfil.rol);
  const empresaId = perfil.empresa_cliente_id ?? (lector && /^[0-9a-f-]{36}$/i.test(params.empresa ?? "") ? params.empresa! : null);

  // Mes en hora de Ecuador; por defecto el mes anterior completo.
  const hoy = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  const opciones = Array.from({ length: 6 }, (_, i) => { const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1)); return { anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 }; });
  const pedido = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? { anio: Number(params.mes!.slice(0, 4)), mes: Number(params.mes!.slice(5, 7)) } : null;
  const elegido = pedido && opciones.some((o) => o.anio === pedido.anio && o.mes === pedido.mes) ? pedido : opciones[1] ?? opciones[0];
  const clave = (o: { anio: number; mes: number }) => `${o.anio}-${String(o.mes).padStart(2, "0")}`;
  const sufijoEmpresa = lector && empresaId ? `&empresa=${empresaId}` : "";

  const empresa = empresaId ? (await crearClienteAdministrador().from("empresas_cliente").select("nombre,direccion").eq("id", empresaId).maybeSingle()).data : null;
  const r = empresaId ? await resumenMensual(empresaId, elegido.anio, elegido.mes) : { puestos: [], totales: { turnosPlanificados: 0, turnosCubiertos: 0, turnosConRonda: 0, rondasRegistradas: 0, aperturasPuntuales: 0, aperturasTotales: 0 }, novedades: [], sla: { medidos: 0, cumplidos: 0, puntaje: 100 } };
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");
  const titulo = `${MESES[elegido.mes - 1][0].toUpperCase()}${MESES[elegido.mes - 1].slice(1)} ${elegido.anio}`;

  return (
    <div className="min-h-dvh pb-12">
      <div className="no-imprimir"><CabeceraPanel rol="cliente" nombre={perfil.nombre} /></div>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-6">
        <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
          <Link href={`/portal${lector && empresaId ? `?empresa=${empresaId}` : ""}`} className="inline-flex items-center gap-1 text-sm font-medium text-azul-400"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Mi servicio</Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-1.5">{opciones.map((o) => <Link key={clave(o)} href={`/portal/reporte?mes=${clave(o)}${sufijoEmpresa}`} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${o.anio === elegido.anio && o.mes === elegido.mes ? "border-azul-500 bg-azul-500/15 text-azul-200" : "border-borde/60 text-gris-300"}`}>{MESES[o.mes - 1].slice(0, 3)} {String(o.anio).slice(2)}</Link>)}</nav>
            <BotonImprimir />
          </div>
        </div>

        <article className="zona-impresion tarjeta p-6 sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-borde/60 pb-5">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-azul-400">SOTERSA · Seguridad estratégica</p><h1 className="mt-2 text-2xl font-bold text-white">Reporte de servicio · {titulo}</h1><p className="mt-1 text-sm text-gris-400">{empresa?.nombre ?? "Cuenta corporativa"}{empresa?.direccion ? ` · ${empresa.direccion}` : ""}</p></div>
            <p className="text-xs text-gris-500">Generado {fechaHoraEcuador(new Date().toISOString())}</p>
          </header>

          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Cifra titulo="Turnos cubiertos" valor={pct(r.totales.turnosCubiertos, r.totales.turnosPlanificados)} detalle={`${r.totales.turnosCubiertos} de ${r.totales.turnosPlanificados}`} />
            <Cifra titulo="Turnos con ronda" valor={pct(r.totales.turnosConRonda, r.totales.turnosCubiertos)} detalle={`${r.totales.rondasRegistradas} rondas`} />
            <Cifra titulo="Apertura puntual" valor={pct(r.totales.aperturasPuntuales, r.totales.aperturasTotales)} detalle="dentro de 15 min" />
            <Cifra titulo="SLA de aviso" valor={`${r.sla.puntaje} %`} detalle={r.sla.medidos ? `${r.sla.cumplidos} de ${r.sla.medidos} avisos` : "sin avisos que medir"} />
          </section>

          <section className="mt-7">
            <h2 className="font-semibold text-white">Cobertura por puesto</h2>
            {r.puestos.length === 0 ? <p className="mt-2 text-sm text-gris-500">Sin puestos activos.</p> : (
              <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b border-borde/60 text-left text-xs text-gris-500"><th className="py-2 pr-3 font-medium">Puesto</th><th className="py-2 pr-3 font-medium">Modalidad</th><th className="py-2 pr-3 text-right font-medium">Turnos</th><th className="py-2 pr-3 text-right font-medium">Cubiertos</th><th className="py-2 pr-3 text-right font-medium">Rondas</th><th className="py-2 text-right font-medium">Puntualidad</th></tr></thead>
                <tbody className="divide-y divide-borde/40">{r.puestos.map((p) => <tr key={p.id}><td className="py-2.5 pr-3 text-white">{p.codigo} · {p.nombre}</td><td className="py-2.5 pr-3 text-gris-300">{p.servicio}</td><td className="py-2.5 pr-3 text-right text-gris-300">{p.turnosPlanificados}</td><td className="py-2.5 pr-3 text-right text-gris-300">{p.turnosCubiertos} ({pct(p.turnosCubiertos, p.turnosPlanificados)})</td><td className="py-2.5 pr-3 text-right text-gris-300">{p.rondasRegistradas}</td><td className="py-2.5 text-right text-gris-300">{pct(p.aperturasPuntuales, p.aperturasTotales)}</td></tr>)}</tbody>
              </table></div>
            )}
          </section>

          <section className="mt-7">
            <h2 className="font-semibold text-white">Novedades del mes <span className="text-sm font-normal text-gris-500">· {r.novedades.length}</span></h2>
            {r.novedades.length === 0 ? <p className="mt-2 text-sm text-gris-500">No se publicaron novedades para tu empresa en este mes.</p> : (
              <div className="mt-3 divide-y divide-borde/40">
                {r.novedades.map((n) => (
                  <div key={n.id} className="py-3 text-sm">
                    <p className="text-white"><span className="text-gris-500">{fechaHoraEcuador(n.hora_captura)} · {n.puesto} · </span>{n.tipo} <span className={`ml-1 rounded-full px-2 py-0.5 text-[0.7rem] ${n.severidad === "emergencia" ? "bg-red-500/15 text-red-200" : n.severidad === "novedad" ? "bg-amber-400/15 text-amber-200" : "bg-azul-500/15 text-azul-200"}`}>{n.severidad}</span></p>
                    <p className="mt-1 text-gris-300">{n.descripcion}</p>
                    {n.nota_supervisor && <p className="mt-1 text-gris-400"><strong>Supervisión:</strong> {n.nota_supervisor}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="mt-8 border-t border-borde/60 pt-4 text-xs leading-5 text-gris-500">Turno cubierto: el agente abrió el puesto desde la app con checklist y hora. Apertura puntual: dentro de los 15 minutos del inicio programado. SLA: novedades y emergencias notificadas al cliente en 15 minutos o menos desde su registro. Los registros son inmutables: ni el agente ni SOTERSA pueden editarlos después de guardados.</footer>
        </article>
      </main>
    </div>
  );
}

function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return <div className="rounded-xl border border-borde/60 px-4 py-3"><p className="text-xs text-gris-500">{titulo}</p><p className="mt-1 text-2xl font-bold text-white">{valor}</p><p className="text-xs text-gris-500">{detalle}</p></div>;
}
