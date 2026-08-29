import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoAlerta, IconoEscudoOk, IconoFlecha, IconoLista } from "@/app/componentes/iconos";
import { validarNovedad } from "@/app/supervisor/acciones";
import { exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";
import { firmarEvidencias } from "@/lib/evidencias";

export const metadata = { title: "Novedades y alertas — SOTERSA" };
export const dynamic = "force-dynamic";

type Filtro = "todas" | "pendientes" | "emergencias" | "resueltas";

export default async function PaginaNovedades({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const params = await searchParams;
  const filtro: Filtro = ["pendientes", "emergencias", "resueltas"].includes(params.filtro ?? "")
    ? (params.filtro as Filtro)
    : "todas";

  const { data, error } = await supabase
    .from("novedades")
    .select("id,tipo,severidad,descripcion,foto_url,lat,lng,hora_captura,estado,visible_cliente,nota_supervisor,validada_en,notificada_en,puestos(codigo,nombre),guardias(nombre)")
    .order("hora_captura", { ascending: false })
    .limit(100);

  const novedades = data ?? [];
  // El contenedor de evidencias es privado: el enlace se firma aqui y caduca.
  const evidencias = await firmarEvidencias(novedades.map((n) => n.foto_url));
  const pendientes = novedades.filter((novedad) => novedad.estado === "registrada").length;
  const emergencias = novedades.filter((novedad) => novedad.severidad === "emergencia" && novedad.estado !== "cerrada").length;
  const publicadas = novedades.filter((novedad) => novedad.visible_cliente).length;
  const resueltas = novedades.filter((novedad) => novedad.estado === "cerrada").length;
  const visibles = novedades.filter((novedad) => {
    if (filtro === "pendientes") return novedad.estado === "registrada";
    if (filtro === "emergencias") return novedad.severidad === "emergencia" && novedad.estado !== "cerrada";
    if (filtro === "resueltas") return novedad.estado === "cerrada";
    return true;
  });

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Marca tamano="panel" />
          <span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span>
        </header>

        <Link href={perfil.rol === "admin" ? "/admin" : "/supervisor"} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

        <section className="mt-5">
          <p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoAlerta className="h-6 w-6" /> Central de seguimiento</p>
          <h1 className="mt-2 text-3xl font-bold lg:text-4xl">Novedades y alertas</h1>
          <p className="mt-1 text-sm text-slate-400">Valida cada reporte y decide qué información se publica al cliente.</p>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Resumen titulo="Pendientes" valor={pendientes} tono={pendientes ? "alerta" : "normal"} />
          <Resumen titulo="Emergencias" valor={emergencias} tono={emergencias ? "emergencia" : "normal"} />
          <Resumen titulo="Visibles al cliente" valor={publicadas} />
          <Resumen titulo="Cerradas" valor={resueltas} tono="normal" />
        </section>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filtros de novedades">
          <FiltroEnlace filtro="todas" actual={filtro} texto="Todas" />
          <FiltroEnlace filtro="pendientes" actual={filtro} texto="Pendientes" />
          <FiltroEnlace filtro="emergencias" actual={filtro} texto="Emergencias" />
          <FiltroEnlace filtro="resueltas" actual={filtro} texto="Cerradas" />
        </nav>

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm text-red-200">No fue posible cargar las novedades. Intenta nuevamente.</p>
        ) : visibles.length === 0 ? (
          <section className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-8 text-center">
            <div><IconoEscudoOk className="mx-auto h-12 w-12 text-emerald-400" /><h2 className="mt-3 text-lg font-semibold">No hay registros en esta categoría</h2><p className="mt-1 text-sm text-slate-400">La operación se encuentra al día.</p></div>
          </section>
        ) : (
          <section className="mt-5 grid items-start gap-4 lg:grid-cols-2">
            {visibles.map((novedad) => {
              const puesto = uno(novedad.puestos);
              const guardia = uno(novedad.guardias);
              const pendiente = novedad.estado === "registrada";
              return (
                <article key={novedad.id} className={`overflow-hidden rounded-2xl border bg-[#07172a]/95 ${novedad.severidad === "emergencia" ? "border-red-500/45" : "border-[#27425e]"}`}>
                  <div className="flex items-start justify-between gap-4 border-b border-[#20374e] px-4 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${novedad.severidad === "emergencia" ? "border-red-500/45 bg-red-500/10 text-red-300" : "border-[#0788ff]/40 bg-[#0788ff]/10 text-[#49b6ff]"}`}>
                        {novedad.severidad === "emergencia" ? "!" : <IconoLista className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0"><h2 className="truncate font-semibold">{novedad.tipo}</h2><p className="mt-1 truncate text-sm text-slate-400">{puesto ? `${puesto.codigo} · ${puesto.nombre}` : "Puesto sin identificar"}</p></div>
                    </div>
                    <Estado estado={novedad.estado} />
                  </div>

                  <div className="px-4 py-4">
                    <p className="text-sm leading-6 text-slate-300">{novedad.descripcion}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#041225] p-3 text-xs text-slate-400">
                      <Dato etiqueta="Reportado por" valor={guardia?.nombre ?? "Sin registro"} />
                      <Dato etiqueta="Fecha y hora" valor={fechaHoraEcuador(novedad.hora_captura)} />
                      <Dato etiqueta="Visibilidad" valor={novedad.visible_cliente ? "Cliente autorizado" : "Uso interno"} />
                      <Dato etiqueta="Ubicación" valor={novedad.lat != null && novedad.lng != null ? "GPS registrado" : "Sin coordenadas"} />
                    </div>

                    {novedad.nota_supervisor && <p className="mt-3 rounded-xl border border-[#0788ff]/20 bg-[#0788ff]/8 px-3 py-3 text-sm text-[#b9e6ff]"><strong>Nota de supervisión:</strong> {novedad.nota_supervisor}</p>}
                    {novedad.foto_url && evidencias.get(novedad.foto_url) && <a href={evidencias.get(novedad.foto_url)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#49b6ff]">Ver evidencia fotográfica <IconoFlecha className="h-4 w-4" /></a>}

                    {pendiente && (
                      <form action={validarNovedad} className="mt-4 border-t border-[#20374e] pt-4">
                        <input type="hidden" name="id" value={novedad.id} />
                        <label className="text-xs font-medium text-slate-300" htmlFor={`nota-${novedad.id}`}>Observación de supervisión</label>
                        <textarea id={`nota-${novedad.id}`} name="nota" maxLength={500} rows={2} placeholder="Agrega una nota opcional..." className="mt-2 w-full resize-none rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#0788ff]" />
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <button name="decision" value="interna" className="min-h-11 rounded-xl border border-[#38526b] bg-[#0a1a2e] px-3 text-sm font-medium text-slate-200 transition active:scale-[0.98]">Validar interna</button>
                          <button name="decision" value="cliente" className="min-h-11 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition active:scale-[0.98]">Validar y publicar</button>
                        </div>
                      </form>
                    )}
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

function Resumen({ titulo, valor, tono = "azul" }: { titulo: string; valor: number; tono?: "azul" | "normal" | "alerta" | "emergencia" }) {
  const color = tono === "emergencia" ? "text-red-400" : tono === "alerta" ? "text-amber-300" : tono === "normal" ? "text-emerald-400" : "text-white";
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${color}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>;
}

function FiltroEnlace({ filtro, actual, texto }: { filtro: Filtro; actual: Filtro; texto: string }) {
  const activo = filtro === actual;
  return <Link href={filtro === "todas" ? "/operacion/novedades" : `/operacion/novedades?filtro=${filtro}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${activo ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]" : "border-[#27425e] bg-[#07172a] text-slate-400"}`}>{texto}</Link>;
}

function Estado({ estado }: { estado: string }) {
  const estilos: Record<string, string> = { registrada: "bg-amber-500/12 text-amber-300", validada: "bg-blue-500/12 text-blue-300", notificada: "bg-cyan-500/12 text-cyan-300", cerrada: "bg-emerald-500/12 text-emerald-300" };
  const etiquetas: Record<string, string> = { registrada: "Pendiente", validada: "Validada", notificada: "Notificada", cerrada: "Cerrada" };
  return <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${estilos[estado] ?? "bg-slate-500/10 text-slate-300"}`}>{etiquetas[estado] ?? estado}</span>;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <div><p className="text-slate-500">{etiqueta}</p><p className="mt-1 truncate text-slate-200">{valor}</p></div>;
}
