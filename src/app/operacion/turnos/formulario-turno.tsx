"use client";

import { useActionState, useEffect, useRef } from "react";
import { programarTurno, type EstadoProgramacion } from "./acciones";

const INICIAL: EstadoProgramacion = { tipo: "inicial", mensaje: "" };

export function FormularioTurno({ guardias, puestos }: { guardias: { id: string; nombre: string }[]; puestos: { id: string; codigo: string; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState(programarTurno, INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.tipo === "exito") formulario.current?.reset(); }, [estado]);

  return (
    <form ref={formulario} action={accion} className="space-y-4">
      <Campo etiqueta="Guardia"><select name="guardia_id" required defaultValue="" className={control}><option value="" disabled>Selecciona un guardia</option>{guardias.map((guardia) => <option key={guardia.id} value={guardia.id}>{guardia.nombre}</option>)}</select></Campo>
      <Campo etiqueta="Puesto"><select name="puesto_id" required defaultValue="" className={control}><option value="" disabled>Selecciona un puesto</option>{puestos.map((puesto) => <option key={puesto.id} value={puesto.id}>{puesto.codigo} · {puesto.nombre}</option>)}</select></Campo>
      <Campo etiqueta="Tipo de turno"><select name="tipo" required defaultValue="fijo_dia" className={control}><option value="fijo_dia">Fijo día</option><option value="fijo_noche">Fijo noche</option><option value="saca_francos">Saca francos</option><option value="supervision">Supervisión</option></select></Campo>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Campo etiqueta="Inicio"><input type="datetime-local" name="inicio" required className={control} /></Campo><Campo etiqueta="Finalización"><input type="datetime-local" name="fin" required className={control} /></Campo></div>
      {estado.mensaje && <p aria-live="polite" className={`rounded-xl border px-3 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
      <button disabled={pendiente || guardias.length === 0 || puestos.length === 0} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">{pendiente ? "Comprobando disponibilidad..." : "Programar turno"}</button>
    </form>
  );
}

const control = "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }
