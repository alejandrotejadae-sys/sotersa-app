"use client";

import { useActionState, useState } from "react";
import { generarCuadrante, type EstadoCuadrante } from "./cuadrante";

const INICIAL: EstadoCuadrante = { tipo: "inicial", mensaje: "" };

const control = "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300">{etiqueta}{ayuda && <span className="ml-1 text-xs text-slate-500">{ayuda}</span>}{children}</label>;
}

/** Mes siguiente en formato AAAA-MM: lo normal es armar el cuadrante antes de que empiece. */
function mesSiguiente() {
  const hoy = new Date();
  const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function FormularioCuadrante({ puestos }: { puestos: { id: string; codigo: string; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState(generarCuadrante, INICIAL);
  const [modo, setModo] = useState<"mes" | "rango">("mes");
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Puesto">
        <select name="puesto_id" required defaultValue="todos" className={control}>
          <option value="todos">Todos mis puestos</option>
          {puestos.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#27425e] bg-[#041225] p-1 text-sm">
        {(["mes", "rango"] as const).map((m) => <label key={m} className={`flex min-h-10 cursor-pointer items-center justify-center rounded-lg font-medium transition ${modo === m ? "bg-[#0788ff]/20 text-[#8ddaff]" : "text-slate-400"}`}><input type="radio" name="modo" value={m} checked={modo === m} onChange={() => setModo(m)} className="sr-only" />{m === "mes" ? "Mes completo" : "Rango de días"}</label>)}
      </div>

      {modo === "mes" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Mes"><input type="month" name="mes" required defaultValue={mesSiguiente()} className={control} /></Campo>
          <Campo etiqueta="Primer turno" ayuda="hora"><input type="time" name="hora_inicio" defaultValue="07:00" className={control} /></Campo>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Desde"><input type="date" name="desde" required defaultValue={hoy} className={control} /></Campo>
          <Campo etiqueta="Días"><select name="dias" defaultValue="7" className={control}><option value="7">7 días</option><option value="15">15 días</option><option value="30">30 días</option></select></Campo>
          <Campo etiqueta="Primer turno" ayuda="hora"><input type="time" name="hora_inicio" defaultValue="07:00" className={control} /></Campo>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-sm text-slate-300">
        <input type="checkbox" name="rotar" defaultChecked className="mt-0.5 h-5 w-5 shrink-0 accent-[#0788ff]" />
        <span>Rotar día y noche cada semana<span className="mt-0.5 block text-xs text-slate-500">Sin esto, el mismo agente hace noches indefinidamente.</span></span>
      </label>

      {estado.mensaje && (
        <div aria-live="polite" className={`rounded-xl border px-3 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          <p>{estado.mensaje}</p>
          {estado.detalle && estado.detalle.length > 0 && <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs opacity-90">{estado.detalle.map((d, i) => <li key={i}>• {d}</li>)}</ul>}
        </div>
      )}

      <button disabled={pendiente || puestos.length === 0} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Generando…" : modo === "mes" ? "Generar el mes" : "Generar cuadrante"}</button>

      <p className="text-xs leading-relaxed text-slate-500">Usa los agentes fijos asignados a cada puesto en Dotación. No duplica lo ya cubierto ni inventa quién cubre los días libres: el saca francos se asigna a mano o por Excel. Después revisa el mes en la vista de calendario.</p>
    </form>
  );
}
