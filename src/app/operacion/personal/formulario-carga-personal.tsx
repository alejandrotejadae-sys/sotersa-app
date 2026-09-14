"use client";

import { useActionState, useRef, useState } from "react";
import { cargarPersonal, type EstadoCargaPersonal } from "./carga";

const INICIAL: EstadoCargaPersonal = { tipo: "inicial", mensaje: "" };

export function FormularioCargaPersonal() {
  const [nombre, setNombre] = useState("");
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, pendiente] = useActionState(async (previo: EstadoCargaPersonal, datos: FormData) => { const r = await cargarPersonal(previo, datos); if (r.tipo === "exito") { formulario.current?.reset(); setNombre(""); } return r; }, INICIAL);

  return (
    <form ref={formulario} action={accion} className="space-y-3">
      <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0788ff]/65 bg-[#0788ff]/8 px-4 text-center text-sm font-semibold text-[#8ddaff]">
        {nombre || "Elegir archivo .xlsx o .csv"}
        <input name="archivo" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" required onChange={(e) => setNombre(e.target.files?.[0]?.name ?? "")} className="sr-only" />
      </label>
      <p className="text-xs leading-5 text-slate-500">Columnas: <span className="text-slate-300">Cédula · Nombre · Teléfono · Credencial · Cliente · Puesto · Relevo · Estado</span>. <a href="/plantilla-personal.xlsx" download className="font-medium text-[#8ddaff]">Descargar plantilla</a>. La cédula es la llave: si ya existe se actualiza la ficha, si no se crea. Si una fila tiene error no se carga nada.</p>
      {estado.mensaje && (
        <div aria-live="polite" className={`rounded-xl border px-3 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          <p>{estado.mensaje}</p>
          {estado.errores && estado.errores.length > 0 && <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs opacity-90">{estado.errores.map((e, i) => <li key={i}>• {e}</li>)}</ul>}
          {estado.avisos && estado.avisos.length > 0 && <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-amber-200">{estado.avisos.map((e, i) => <li key={i}>• {e}</li>)}</ul>}
        </div>
      )}
      <button disabled={pendiente || !nombre} className="min-h-12 w-full rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/12 px-4 text-sm font-semibold text-[#65c8ff] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">{pendiente ? "Leyendo y validando…" : "Cargar listado de personal"}</button>
    </form>
  );
}
