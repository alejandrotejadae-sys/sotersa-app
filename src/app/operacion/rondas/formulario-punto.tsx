"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearPuntoRonda, type EstadoPunto } from "./acciones";

type Puesto = { id: string; codigo: string; nombre: string };
const INICIAL: EstadoPunto = { tipo: "inicial", mensaje: "" };

export function FormularioPunto({ puestos }: { puestos: Puesto[] }) {
  const [estado, accion, pendiente] = useActionState(crearPuntoRonda, INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.tipo === "exito") formulario.current?.reset(); }, [estado]);

  return <form ref={formulario} action={accion} className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_.7fr_1.4fr_.45fr_auto] lg:items-end">
    <label className="block text-sm text-slate-300">Puesto<select name="puesto_id" required defaultValue="" className="mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-3 text-white outline-none focus:border-[#0788ff]"><option value="" disabled>Seleccionar</option>{puestos.map((puesto) => <option key={puesto.id} value={puesto.id}>{puesto.codigo} · {puesto.nombre}</option>)}</select></label>
    <label className="block text-sm text-slate-300">Código<input name="codigo" required minLength={2} maxLength={30} placeholder="P01" className="mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-3 uppercase text-white outline-none focus:border-[#0788ff]" /></label>
    <label className="block text-sm text-slate-300">Nombre del punto<input name="nombre" required minLength={3} maxLength={100} placeholder="Acceso principal" className="mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-3 text-white outline-none focus:border-[#0788ff]" /></label>
    <label className="block text-sm text-slate-300">Orden<input name="orden" type="number" required min={1} max={999} defaultValue={1} className="mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-3 text-white outline-none focus:border-[#0788ff]" /></label>
    <button disabled={pendiente || puestos.length === 0} className="boton-primario min-h-12 rounded-xl px-5 font-semibold text-white disabled:opacity-50">{pendiente ? "Creando…" : "Crear punto"}</button>
    {estado.mensaje && <p role="status" className={`md:col-span-2 lg:col-span-5 rounded-xl border px-4 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
  </form>;
}
