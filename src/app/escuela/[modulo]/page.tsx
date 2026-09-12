import Link from "next/link";
import { notFound } from "next/navigation";
import { IconoFlecha } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import { claveLeccion, modulo } from "@/lib/formacion";
import { avanceDe, resumenModulo } from "../datos";
import { Barra, Etiqueta, MarcoEscuela, TONO } from "../ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ modulo: string }> }) {
  const m = modulo((await params).modulo);
  return { title: `${m?.titulo ?? "Módulo"} — Escuela SOTERSA` };
}

export default async function PaginaModulo({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo: moduloId } = await params;
  const m = modulo(moduloId);
  if (!m) notFound();

  const { supabase, user, perfil } = await exigirPerfil(["guardia", "supervisor", "admin", "cliente"]);
  const avance = await avanceDe(supabase, user.id);
  const r = resumenModulo(avance, m.id);
  const t = TONO[m.color];
  const esCliente = perfil.rol === "cliente";
  const siguientePendiente = m.lecciones.find((l) => !avance.completadas.has(claveLeccion(m.id, l.id)));

  return (
    <MarcoEscuela volver={{ href: "/escuela", texto: "Escuela de Formación" }}>
      <header className="mt-6">
        <p className={`font-mono text-xs tracking-widest ${t.texto}`}>{m.codigo}</p>
        <h1 className="mt-1 text-3xl font-bold">{m.titulo}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{m.resumen}</p>
        <p className="mt-2 text-xs text-slate-500">{m.paraQuien}</p>
      </header>

      {!esCliente && (
        <section className={`mt-5 rounded-2xl border ${t.borde} ${t.fondo} p-4`}>
          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{r.hechas} de {r.total} lecciones</span>{r.evaluacion && <Etiqueta tono={r.evaluacion.aprobado ? "verde" : "ambar"}>{r.evaluacion.aprobado ? `Evaluación aprobada · ${r.evaluacion.puntaje} %` : `Evaluación ${r.evaluacion.puntaje} % · ${r.evaluacion.intentos} intento${r.evaluacion.intentos === 1 ? "" : "s"}`}</Etiqueta>}</div>
          <div className="mt-3"><Barra porcentaje={r.porcentaje} tono={m.color} /></div>
          {siguientePendiente && <Link href={`/escuela/${m.id}/${siguientePendiente.id}`} className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] text-sm font-semibold text-white">{r.hechas === 0 ? "Empezar" : "Continuar"}: {siguientePendiente.titulo} <IconoFlecha className="h-4 w-4" /></Link>}
        </section>
      )}

      <ol className="mt-6 space-y-3">
        {m.lecciones.map((l, i) => {
          const hecha = avance.completadas.has(claveLeccion(m.id, l.id));
          return (
            <li key={l.id}>
              <Link href={`/escuela/${m.id}/${l.id}`} className="flex items-center gap-4 rounded-2xl border border-[#27425e] bg-[#07172a]/90 p-4 transition hover:bg-[#08203a]">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-bold ${hecha ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : `${t.borde} ${t.fondo} ${t.texto}`}`}>{hecha ? "✓" : i + 1}</span>
                <span className="min-w-0 flex-1"><span className="block font-semibold">{l.titulo}</span><span className="mt-0.5 block text-xs text-slate-500">{l.minutos} min · {l.recursos.filter((x) => x.tipo === "video").length > 0 ? `${l.recursos.filter((x) => x.tipo === "video").length} video${l.recursos.filter((x) => x.tipo === "video").length === 1 ? "" : "s"}` : "lectura"}</span></span>
                <IconoFlecha className="h-4 w-4 shrink-0 text-slate-500" />
              </Link>
            </li>
          );
        })}
      </ol>

      <section className="mt-6 rounded-2xl border border-[#27425e] bg-[#041225] p-4">
        <h2 className="font-semibold">Evaluación del módulo</h2>
        <p className="mt-1 text-sm text-slate-400">{m.evaluacion.preguntas.length} preguntas de opción múltiple. Se aprueba con {m.evaluacion.minimoAprobar} %. Puedes repetirla las veces que necesites; queda el mejor resultado.</p>
        {r.evaluacion && <p className="mt-2 text-xs text-slate-500">Último intento: {fechaHoraEcuador(r.evaluacion.respondido_en)}</p>}
        <Link href={`/escuela/${m.id}/evaluacion`} className={`mt-4 flex min-h-12 items-center justify-center rounded-xl border text-sm font-semibold ${r.hechas === r.total || esCliente ? "border-[#0788ff]/40 bg-[#0788ff]/10 text-[#8ddaff]" : "border-[#27425e] text-slate-400"}`}>
          {r.evaluacion?.aprobado ? "Volver a rendir" : r.hechas === r.total || esCliente ? "Rendir evaluación" : `Rendir evaluación (te faltan ${r.total - r.hechas} lecciones)`}
        </Link>
      </section>
    </MarcoEscuela>
  );
}
