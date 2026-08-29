"use client";

import { useActionState } from "react";
import { asignarAgente, type EstadoDotacion } from "./acciones";

const INICIAL: EstadoDotacion = { tipo: "inicial", mensaje: "" };

/**
 * Asignar un agente a una plaza concreta de un puesto.
 *
 * Va uno por puesto en vez de un formulario global: asi se elige mirando el
 * hueco que se quiere llenar, no buscando el puesto en una lista larga.
 */
export function Asignador({
  puestoId,
  disponibles,
}: {
  puestoId: string;
  disponibles: { id: string; nombre: string; es_relevo: boolean }[];
}) {
  const [estado, accion, pendiente] = useActionState(asignarAgente, INICIAL);

  if (disponibles.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-xs text-slate-500">
        No hay agentes sin plaza fija. Libera a alguien de otro puesto o da de
        alta personal nuevo.
      </p>
    );
  }

  return (
    <form action={accion} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="puesto_id" value={puestoId} />
      <label className="sr-only" htmlFor={`agente-${puestoId}`}>
        Agente de seguridad
      </label>
      <select
        id={`agente-${puestoId}`}
        name="guardia_id"
        required
        defaultValue=""
        className="min-h-11 flex-1 rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]"
      >
        <option value="" disabled>
          Asignar agente…
        </option>
        {disponibles.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
            {a.es_relevo ? " · relevo" : ""}
          </option>
        ))}
      </select>
      <button
        disabled={pendiente}
        className="min-h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pendiente ? "Asignando…" : "Asignar"}
      </button>
      {estado.mensaje && (
        <p
          aria-live="polite"
          className={`w-full text-xs ${
            estado.tipo === "exito" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
