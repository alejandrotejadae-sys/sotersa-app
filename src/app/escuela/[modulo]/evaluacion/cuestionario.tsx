"use client";

import Link from "next/link";
import { useActionState } from "react";
import { responderEvaluacion, type ResultadoCuestionario } from "../../acciones";

const INICIAL: ResultadoCuestionario = { tipo: "inicial", mensaje: "" };

export type PreguntaPublica = { id: string; texto: string; opciones: string[] };

/**
 * Cuestionario del modulo. Recibe las preguntas SIN la respuesta correcta:
 * la calificacion ocurre en el servidor y recien entonces vuelve el detalle.
 */
export function Cuestionario({ moduloId, preguntas, minimo }: { moduloId: string; preguntas: PreguntaPublica[]; minimo: number }) {
  const [resultado, accion, pendiente] = useActionState(responderEvaluacion, INICIAL);
  const detalle = new Map((resultado.detalle ?? []).map((d) => [d.id, d]));
  const terminado = resultado.tipo === "exito";

  return (
    <form action={accion} className="mt-6 space-y-5">
      <input type="hidden" name="modulo" value={moduloId} />

      {terminado && (
        <div className={`rounded-2xl border p-4 ${resultado.aprobado ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}>
          <p className={`text-3xl font-bold ${resultado.aprobado ? "text-emerald-300" : "text-amber-300"}`}>{resultado.puntaje} %</p>
          <p className={`mt-1 text-sm ${resultado.aprobado ? "text-emerald-200" : "text-amber-100"}`}>{resultado.mensaje}</p>
        </div>
      )}

      {preguntas.map((p, i) => {
        const d = detalle.get(p.id);
        return (
          <fieldset key={p.id} className="rounded-2xl border border-[#27425e] bg-[#07172a]/90 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Pregunta {i + 1} de {preguntas.length}</legend>
            <p className="mt-1 text-[0.95rem] font-medium leading-6">{p.texto}</p>
            <div className="mt-3 space-y-2">
              {p.opciones.map((op, j) => {
                const esCorrecta = d && j === d.respuesta;
                const esElegida = d && j === d.elegida;
                const clase = !d
                  ? "border-[#27425e] bg-[#041225] has-[:checked]:border-[#0788ff] has-[:checked]:bg-[#0788ff]/10"
                  : esCorrecta
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : esElegida
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-[#27425e] bg-[#041225] opacity-60";
                return (
                  <label key={j} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm leading-6 transition ${clase}`}>
                    <input type="radio" name={`p_${p.id}`} value={j} required disabled={terminado} defaultChecked={d ? j === d.elegida : undefined} className="mt-1.5 h-4 w-4 shrink-0 accent-[#0788ff]" />
                    <span className="flex-1 text-slate-200">{op}</span>
                    {d && esCorrecta && <span className="shrink-0 text-xs font-semibold text-emerald-300">Correcta</span>}
                    {d && esElegida && !esCorrecta && <span className="shrink-0 text-xs font-semibold text-red-300">Tu respuesta</span>}
                  </label>
                );
              })}
            </div>
            {d && <p className={`mt-3 rounded-xl px-3 py-2.5 text-sm leading-6 ${d.correcta ? "bg-emerald-500/10 text-emerald-100" : "bg-amber-500/10 text-amber-100"}`}>{d.explicacion}</p>}
          </fieldset>
        );
      })}

      {resultado.tipo === "error" && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{resultado.mensaje}</p>}

      {terminado ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/escuela/${moduloId}`} className="flex min-h-12 items-center justify-center rounded-xl border border-[#27425e] text-sm font-medium text-slate-200">Volver al módulo</Link>
          {resultado.aprobado ? (
            <Link href="/escuela" className="flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] text-sm font-semibold text-white">Siguiente módulo</Link>
          ) : (
            <a href={`/escuela/${moduloId}/evaluacion`} className="flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] text-sm font-semibold text-white">Intentar de nuevo</a>
          )}
        </div>
      ) : (
        <>
          <button disabled={pendiente} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Calificando…" : "Enviar respuestas"}</button>
          <p className="text-center text-xs text-slate-500">Se aprueba con {minimo} %. Verás la explicación de cada pregunta al enviar.</p>
        </>
      )}
    </form>
  );
}
