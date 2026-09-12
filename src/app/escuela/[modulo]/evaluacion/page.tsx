import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/sesion";
import { modulo } from "@/lib/formacion";
import { MarcoEscuela, TONO } from "../../ui";
import { Cuestionario } from "./cuestionario";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ modulo: string }> }) {
  const m = modulo((await params).modulo);
  return { title: `Evaluación · ${m?.titulo ?? "Módulo"} — Escuela SOTERSA` };
}

export default async function PaginaEvaluacion({ params }: { params: Promise<{ modulo: string }> }) {
  const m = modulo((await params).modulo);
  if (!m) notFound();
  await exigirPerfil(["guardia", "supervisor", "admin", "cliente"]);
  const t = TONO[m.color];

  // Al navegador solo van pregunta y opciones. La clave queda en el servidor.
  const preguntas = m.evaluacion.preguntas.map((p) => ({ id: p.id, texto: p.texto, opciones: p.opciones }));

  return (
    <MarcoEscuela volver={{ href: `/escuela/${m.id}`, texto: m.titulo }}>
      <header className="mt-6">
        <p className={`font-mono text-xs tracking-widest ${t.texto}`}>{m.codigo} · Evaluación</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{m.titulo}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{preguntas.length} preguntas. Elige una opción en cada una. No hay tiempo límite y puedes repetirla; queda tu mejor resultado.</p>
      </header>
      <Cuestionario moduloId={m.id} preguntas={preguntas} minimo={m.evaluacion.minimoAprobar} />
    </MarcoEscuela>
  );
}
