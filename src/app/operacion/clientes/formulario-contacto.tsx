"use client";

import { useActionState } from "react";
import { guardarContactoPuesto, type EstadoCliente } from "./acciones";

const INICIAL: EstadoCliente = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

export function FormularioContacto({ puestos }: { puestos: { id: string; codigo: string; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState(guardarContactoPuesto, INICIAL);
  return <form action={accion} className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
    <Campo etiqueta="Puesto"><select name="puesto_id" required defaultValue="" className={control}><option value="" disabled>Seleccionar puesto</option>{puestos.map((puesto) => <option key={puesto.id} value={puesto.id}>{puesto.codigo} · {puesto.nombre}</option>)}</select></Campo>
    <Campo etiqueta="Responsabilidad"><select name="tipo" defaultValue="supervisor_zona" className={control}><option value="central_monitoreo">Central de monitoreo</option><option value="supervisor_zona">Supervisor de zona</option><option value="jefe_operaciones">Jefe de operaciones</option><option value="administracion_cliente">Administración cliente</option></select></Campo>
    <Campo etiqueta="Nombre"><input name="contacto_nombre" maxLength={120} placeholder="Nombre o área" className={control}/></Campo>
    <Campo etiqueta="Teléfono"><input name="contacto_telefono" required maxLength={40} inputMode="tel" placeholder="099 000 0000" className={control}/></Campo>
    <button disabled={pendiente || puestos.length === 0} className="boton-primario min-h-12 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando…" : "Guardar"}</button>
    {estado.mensaje && <p role="status" className={`md:col-span-2 lg:col-span-5 rounded-xl border px-4 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
  </form>;
}
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm text-slate-300">{etiqueta}{children}</label>; }
