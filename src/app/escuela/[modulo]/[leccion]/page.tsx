import Link from "next/link";
import { notFound } from "next/navigation";
import { IconoFlecha } from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";
import { claveLeccion, leccion, type Recurso } from "@/lib/formacion";
import { avanceDe } from "../../datos";
import { completarLeccion } from "../../acciones";
import { MarcoEscuela, TONO } from "../../ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ modulo: string; leccion: string }> }) {
  const p = await params;
  const l = leccion(p.modulo, p.leccion);
  return { title: `${l?.leccion.titulo ?? "Lección"} — Escuela SOTERSA` };
}

export default async function PaginaLeccion({ params }: { params: Promise<{ modulo: string; leccion: string }> }) {
  const p = await params;
  const datos = leccion(p.modulo, p.leccion);
  if (!datos) notFound();
  const { modulo: m, leccion: l, indice, siguiente, anterior } = datos;

  const { supabase, user, perfil } = await exigirPerfil(["guardia", "supervisor", "admin", "cliente"]);
  const avance = await avanceDe(supabase, user.id);
  const hecha = avance.completadas.has(claveLeccion(m.id, l.id));
  const t = TONO[m.color];
  const videos = l.recursos.filter((r) => r.youtubeId);
  const otros = l.recursos.filter((r) => !r.youtubeId);

  return (
    <MarcoEscuela volver={{ href: `/escuela/${m.id}`, texto: m.titulo }}>
      <header className="mt-6">
        <p className={`font-mono text-xs tracking-widest ${t.texto}`}>{m.codigo} · Lección {indice + 1} de {m.lecciones.length} · {l.minutos} min</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{l.titulo}</h1>
        <p className="mt-3 rounded-xl border border-[#27425e] bg-[#041225] px-4 py-3 text-sm text-slate-300"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Objetivo · </span>{l.objetivo}</p>
      </header>

      <article className="mt-6 space-y-6">
        {l.secciones.map((s, i) => (
          <section key={i}>
            {s.titulo && <h2 className="text-lg font-semibold">{s.titulo}</h2>}
            {s.parrafos?.map((texto, j) => <p key={j} className="mt-2 text-[0.95rem] leading-7 text-slate-300">{texto}</p>)}
            {s.lista && (
              <ul className="mt-3 space-y-2">
                {s.lista.map((item, j) => <li key={j} className="flex gap-3 text-[0.95rem] leading-6 text-slate-300"><span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.barra}`} />{item}</li>)}
              </ul>
            )}
            {s.destacado && <p className={`mt-4 rounded-2xl border ${t.borde} ${t.fondo} px-4 py-4 text-base font-medium leading-7`}>{s.destacado}</p>}
            {s.enSotersa && <p className="mt-3 rounded-xl border border-dashed border-[#27425e] px-4 py-3 text-sm leading-6 text-slate-400"><span className="font-semibold text-[#8ddaff]">En SOTERSA · </span>{s.enSotersa}</p>}
          </section>
        ))}
      </article>

      {videos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Videos</h2>
          <div className="mt-3 space-y-5">
            {videos.map((r) => (
              <figure key={r.url}>
                <div className="overflow-hidden rounded-2xl border border-[#27425e] bg-black">
                  <iframe className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${r.youtubeId}`} title={r.titulo} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                </div>
                <figcaption className="mt-2 text-sm"><a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#8ddaff]">{r.titulo}</a><span className="text-slate-500"> · {r.fuente}</span>{r.nota && <span className="block text-xs text-slate-500">{r.nota}</span>}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {otros.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Para leer y consultar</h2>
          <ul className="mt-3 space-y-2">{otros.map((r) => <li key={r.url}><EnlaceRecurso recurso={r} /></li>)}</ul>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-[#27425e] bg-[#041225] p-4">
        {perfil.rol === "cliente" ? (
          <p className="text-sm text-slate-400">Vista de consulta: el avance se registra solo para el personal de SOTERSA.</p>
        ) : hecha ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20">✓</span> Lección completada</p>
        ) : (
          <form action={completarLeccion}>
            <input type="hidden" name="modulo" value={m.id} />
            <input type="hidden" name="leccion" value={l.id} />
            <button className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] text-sm font-semibold text-white">Marcar como completada</button>
            <p className="mt-2 text-center text-xs text-slate-500">Márcala cuando hayas leído el contenido y visto los videos.</p>
          </form>
        )}
      </section>

      <nav className="mt-4 grid grid-cols-2 gap-3">
        {anterior ? <Link href={`/escuela/${m.id}/${anterior.id}`} className="flex min-h-12 items-center gap-2 rounded-xl border border-[#27425e] px-4 text-sm text-slate-300"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span><span className="truncate">{anterior.titulo}</span></Link> : <span />}
        {siguiente ? <Link href={`/escuela/${m.id}/${siguiente.id}`} className="flex min-h-12 items-center justify-end gap-2 rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/10 px-4 text-right text-sm font-medium text-[#8ddaff]"><span className="truncate">{siguiente.titulo}</span><IconoFlecha className="h-4 w-4 shrink-0" /></Link> : <Link href={`/escuela/${m.id}/evaluacion`} className="flex min-h-12 items-center justify-end gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-200">Rendir evaluación <IconoFlecha className="h-4 w-4" /></Link>}
      </nav>
    </MarcoEscuela>
  );
}

function EnlaceRecurso({ recurso }: { recurso: Recurso }) {
  const icono = recurso.tipo === "documento" ? "PDF" : "WEB";
  return (
    <a href={recurso.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-[#27425e] bg-[#07172a]/80 px-3 py-3 transition hover:bg-[#08203a]">
      <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-[#0b2035] font-mono text-[0.65rem] font-bold text-[#8ddaff]">{icono}</span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">{recurso.titulo}</span><span className="block text-xs text-slate-500">{recurso.fuente}{recurso.nota ? ` · ${recurso.nota}` : ""}</span></span>
      <IconoFlecha className="h-4 w-4 shrink-0 text-slate-500" />
    </a>
  );
}
