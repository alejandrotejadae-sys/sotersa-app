"use client";

import { useActionState } from "react";
import { asignarRelevo, quitarRelevo, type EstadoRelevo } from "./relevos-acciones";

const INICIAL: EstadoRelevo = { tipo: "inicial", mensaje: "" };

export type Relevo = { id: string; nombre: string };

/**
 * Saca francos de un puesto: quien cubre los dias libres de los fijos. Van
 * debajo de los agentes asignados porque son parte de la dotacion del
 * punto, pero no ocupan plaza y pueden repetirse en varios clientes.
 */
export function RelevosPuesto({ puestoId, codigo, asignados, candidatos, soloLectura }: { puestoId: string; codigo: string; asignados: Relevo[]; candidatos: { id: string; nombre: string; es_relevo: boolean }[]; soloLectura: boolean }) {
  const [estado, accion, pendiente] = useActionState(asignarRelevo, INICIAL);
  const ya = new Set(asignados.map((r) => r.id));
  const relevos = candidatos.filter((c) => c.es_relevo && !ya.has(c.id));
  const otros = candidatos.filter((c) => !c.es_relevo && !ya.has(c.id));

  return (
    <div className="mt-3 border-t border-dashed border-[#20374e] pt-3">
      <p className="text-xs font-medium text-slate-400">Saca francos <span className="ml-2 text-slate-500">{asignados.length === 0 ? "· sin asignar" : `· ${asignados.length}`}</span></p>
      {asignados.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {asignados.map((r) => (
            <li key={r.id}>
              <form action={quitarRelevo} className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/8 py-1 pl-3 pr-1 text-xs text-cyan-100">
                <input type="hidden" name="puesto_id" value={puestoId} />
                <input type="hidden" name="guardia_id" value={r.id} />
                {r.nombre}
                {!soloLectura && <button title="Quitar de este puesto" aria-label={`Quitar a ${r.nombre} como saca francos de ${codigo}`} className="grid h-6 w-6 place-items-center rounded-full text-cyan-300/70 hover:bg-red-500/15 hover:text-red-300">×</button>}
              </form>
            </li>
          ))}
        </ul>
      )}
      {!soloLectura && (
        <form action={accion} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="puesto_id" value={puestoId} />
          <select name="guardia_id" required defaultValue="" className="min-h-10 flex-1 rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]">
            <option value="" disabled>Asignar saca francos…</option>
            {relevos.length > 0 && <optgroup label="Relevos">{relevos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</optgroup>}
            {otros.length > 0 && <optgroup label="Otros agentes (se marcarán como relevo)">{otros.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</optgroup>}
          </select>
          <button disabled={pendiente || (relevos.length === 0 && otros.length === 0)} className="min-h-10 shrink-0 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-200 disabled:opacity-50">{pendiente ? "Asignando…" : "Asignar"}</button>
          {estado.mensaje && <p aria-live="polite" className={`w-full text-xs ${estado.tipo === "exito" ? "text-emerald-300" : "text-red-300"}`}>{estado.mensaje}</p>}
        </form>
      )}
    </div>
  );
}
