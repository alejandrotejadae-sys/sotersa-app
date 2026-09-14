"use client";

import { useActionState, useRef, useState } from "react";
import { cargarTurnos, type EstadoCarga } from "./carga";

const INICIAL: EstadoCarga = { tipo: "inicial", mensaje: "" };

export function FormularioCarga() {
  const [nombre, setNombre] = useState("");
  const formulario = useRef<HTMLFormElement>(null);
  // Tras una carga exitosa se limpia el archivo elegido, para no volver a subir el mismo por error.
  const [estado, accion, pendiente] = useActionState(async (previo: EstadoCarga, datos: FormData) => { const r = await cargarTurnos(previo, datos); if (r.tipo === "exito") { formulario.current?.reset(); setNombre(""); } return r; }, INICIAL);

  return (
    <form ref={formulario} action={accion} className="space-y-3">
      <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0788ff]/65 bg-[#0788ff]/8 px-4 text-center text-sm font-semibold text-[#8ddaff]">
        {nombre || "Elegir archivo .xlsx o .csv"}
        <input name="archivo" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" required onChange={(e) => setNombre(e.target.files?.[0]?.name ?? "")} className="sr-only" />
      </label>
      <p className="text-xs leading-5 text-slate-500">Columnas: <span className="text-slate-300">Cédula · Puesto · Cliente · Fecha · Inicio · Fin · Tipo</span>. <a href="/plantilla-turnos.xlsx" download className="font-medium text-[#8ddaff]">Descargar plantilla</a>. Si una fila tiene error no se carga nada y te digo cuál.</p>
      {estado.mensaje && (
        <div aria-live="polite" className={`rounded-xl border px-3 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          <p>{estado.mensaje}</p>
          {estado.errores && estado.errores.length > 0 && <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs opacity-90">{estado.errores.map((e, i) => <li key={i}>• {e}</li>)}</ul>}
        </div>
      )}
      <button disabled={pendiente || !nombre} className="min-h-12 w-full rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/12 px-4 text-sm font-semibold text-[#65c8ff] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">{pendiente ? "Leyendo y validando…" : "Cargar turnos del archivo"}</button>
    </form>
  );
}
