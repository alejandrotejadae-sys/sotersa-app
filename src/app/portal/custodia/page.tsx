import Link from "next/link";
import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { IconoCamion, IconoFlecha } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { custodiasDeEmpresa } from "../agentes/datos";
import { iniciales } from "../agentes/ui";

export const metadata = { title: "Custodia armada — SOTERSA" };
export const dynamic = "force-dynamic";

/** Custodias armadas del cliente: ruta, agentes asignados y traslados recientes. */
export default async function PaginaCustodiaCliente({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { perfil } = await exigirPerfil(["cliente", "admin", "operativo"]);
  const params = await searchParams;
  const empresaId = perfil.empresa_cliente_id ?? (esLector(perfil.rol) && /^[0-9a-f-]{36}$/i.test(params.empresa ?? "") ? params.empresa! : null);
  const custodias = empresaId ? await custodiasDeEmpresa(empresaId) : [];
  const enCurso = custodias.reduce((n, c) => n + c.traslados.filter((t) => t.estado === "abierto").length, 0);
  const volver = esLector(perfil.rol) ? { href: `/portal${empresaId ? `?empresa=${empresaId}` : ""}`, texto: "Volver al portal" } : { href: "/perfiles", texto: "Menú principal" };

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="cliente" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <Link href={volver.href} className="inline-flex items-center gap-1 self-start text-sm font-medium text-azul-400"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> {volver.texto}</Link>

        <section>
          <p className="flex items-center gap-2 text-sm font-medium text-azul-400"><IconoCamion className="h-5 w-5" /> Tu servicio</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Custodia armada</h1>
          <p className="mt-1 text-sm text-gris-400">Rutas contratadas, agentes asignados y traslados de los últimos 30 días.</p>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Metrica titulo="Servicios" valor={custodias.length} />
          <Metrica titulo="En curso ahora" valor={enCurso} normal />
          <Metrica titulo="Agentes" valor={new Set(custodias.flatMap((c) => c.agentes.map((a) => a.id))).size} />
        </section>

        {custodias.length === 0 ? (
          <section className="tarjeta px-5 py-10 text-center text-sm text-gris-400">Tu contrato no incluye servicios de custodia armada por ahora. Si necesitas un traslado, comunícate con la central operativa de SOTERSA.</section>
        ) : custodias.map((c) => (
          <section key={c.id} className="tarjeta overflow-hidden">
            <div className="border-b border-borde/60 px-5 py-4">
              <p className="font-mono text-xs tracking-widest text-azul-400">{c.codigo} <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 font-sans text-[0.6rem] tracking-normal text-amber-300">ARMADO</span></p>
              <h2 className="mt-1 text-lg font-semibold text-white">{c.nombre}</h2>
              {c.origen && c.destino && <p className="mt-1 text-sm text-gris-300">{c.origen} <span className="text-azul-400">→</span> {c.destino}</p>}
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gris-500">Agentes asignados</h3>
                {c.agentes.length === 0 ? <p className="mt-2 text-sm text-gris-500">SOTERSA asigna el equipo para cada traslado.</p> : (
                  <ul className="mt-2 space-y-2">
                    {c.agentes.map((a) => (
                      <li key={a.id}>
                        <Link href={`/portal/agentes/${a.id}${esLector(perfil.rol) ? `?empresa=${empresaId}` : ""}`} className="flex items-center gap-3 rounded-xl border border-borde/60 bg-white/[0.03] px-3 py-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-azul-500/40 bg-azul-500/10 text-xs font-semibold text-azul-300">{iniciales(a.nombre)}</span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm text-white">{a.nombre}</span><span className="block text-xs text-gris-500">Credencial {a.credencial ?? "pendiente"}</span></span>
                          <IconoFlecha className="h-4 w-4 text-gris-500" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {c.contactos.filter((k) => k.tipo !== "administracion_cliente").length > 0 && (
                  <>
                    <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-gris-500">Comunicación</h3>
                    <ul className="mt-2 space-y-2">
                      {c.contactos.filter((k) => k.tipo !== "administracion_cliente").map((k) => (
                        <li key={k.tipo} className="flex items-center justify-between gap-3 rounded-xl border border-borde/60 bg-white/[0.03] px-3 py-2.5 text-sm">
                          <span className="text-white">{etiquetaContacto(k.tipo)}</span>
                          <a href={`tel:${k.telefono.replace(/[^\d+]/g, "")}`} className="rounded-full border border-azul-500/40 bg-azul-500/10 px-3 py-1.5 text-xs font-semibold text-azul-300">{k.telefono}</a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gris-500">Traslados recientes</h3>
                {c.traslados.length === 0 ? <p className="mt-2 text-sm text-gris-500">Sin traslados en los últimos 30 días.</p> : (
                  <ul className="mt-2 divide-y divide-borde/50">
                    {c.traslados.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <div className="min-w-0"><p className="truncate text-white">{t.agente ?? "Agente por confirmar"}</p><p className="text-xs text-gris-500">{fechaHoraEcuador(t.inicio)} → {fechaHoraEcuador(t.fin)}</p></div>
                        <EstadoTraslado estado={t.estado} abierto={t.abierto} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

function EstadoTraslado({ estado, abierto }: { estado: string; abierto: boolean }) {
  const [texto, clase] = estado === "abierto" || (abierto && estado === "programado") ? ["En curso", "bg-normal/15 text-green-300"] : estado === "cerrado" ? ["Cumplido", "bg-azul-500/15 text-azul-300"] : estado === "ausente" ? ["No realizado", "bg-emergencia/15 text-red-300"] : ["Programado", "bg-slate-500/10 text-gris-400"];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${clase}`}>{texto}</span>;
}
function Metrica({ titulo, valor, normal = false }: { titulo: string; valor: number; normal?: boolean }) {
  return <article className="panel-operativo p-3 text-center"><p className={`text-2xl font-bold ${normal ? "text-green-300" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-gris-400">{titulo}</p></article>;
}
function etiquetaContacto(tipo: string) {
  return ({ central_monitoreo: "Central de monitoreo 24/7", supervisor_zona: "Supervisor de zona", jefe_operaciones: "Jefe de operaciones" } as Record<string, string>)[tipo] ?? tipo;
}
