"use client";

import { useActionState } from "react";
import { generarCuadrante, type EstadoCuadrante } from "./cuadrante";

const INICIAL: EstadoCuadrante = { tipo: "inicial", mensaje: "" };

const control =
  "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {etiqueta}
      {ayuda && <span className="ml-1 text-xs text-slate-500">{ayuda}</span>}
      {children}
    </label>
  );
}

export function FormularioCuadrante({
  puestos,
}: {
  puestos: { id: string; codigo: string; nombre: string }[];
}) {
  const [estado, accion, pendiente] = useActionState(generarCuadrante, INICIAL);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Puesto">
        <select name="puesto_id" required defaultValue="" className={control}>
          <option value="" disabled>
            Selecciona un puesto
          </option>
          {puestos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Desde">
          <input
            type="date"
            name="desde"
            required
            defaultValue={hoy}
            className={control}
          />
        </Campo>
        <Campo etiqueta="Días">
          <select name="dias" defaultValue="7" className={control}>
            <option value="7">7 días</option>
            <option value="15">15 días</option>
            <option value="30">30 días</option>
          </select>
        </Campo>
        <Campo etiqueta="Primer turno" ayuda="hora">
          <input
            type="time"
            name="hora_inicio"
            defaultValue="07:00"
            className={control}
          />
        </Campo>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-sm text-slate-300">
        <input
          type="checkbox"
          name="rotar"
          defaultChecked
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#0788ff]"
        />
        <span>
          Rotar día y noche cada semana
          <span className="mt-0.5 block text-xs text-slate-500">
            Sin esto, el mismo agente hace noches indefinidamente.
          </span>
        </span>
      </label>

      {estado.mensaje && (
        <p
          aria-live="polite"
          className={`rounded-xl border px-3 py-3 text-sm ${
            estado.tipo === "exito"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {estado.mensaje}
        </p>
      )}

      <button
        disabled={pendiente || puestos.length === 0}
        className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pendiente ? "Generando…" : "Generar cuadrante"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Usa los agentes fijos asignados al puesto en Dotación. No duplica lo ya
        cubierto ni inventa quién cubre los días libres: el saca francos se
        asigna aparte.
      </p>
    </form>
  );
}
