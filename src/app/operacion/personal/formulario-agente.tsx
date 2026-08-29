"use client";

import { useActionState, useState } from "react";
import { registrarAgente, type EstadoRegistroAgente } from "./acciones";

const INICIAL: EstadoRegistroAgente = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#0788ff]";

export function FormularioAgente() {
  const [estado, accion, pendiente] = useActionState(registrarAgente, INICIAL);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!estado.usuario || !estado.pin) return;
    await navigator.clipboard.writeText(`Usuario: ${estado.usuario}\nPIN temporal: ${estado.pin}`);
    setCopiado(true);
  }

  if (estado.tipo === "exito") {
    return <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4">
      <h3 className="font-semibold text-emerald-300">Agente creado correctamente</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{estado.mensaje}</p>
      <div className="mt-4 space-y-2 rounded-xl bg-[#020b18] p-3 font-mono text-sm">
        <p><span className="text-slate-500">Usuario:</span> {estado.usuario}</p>
        <p><span className="text-slate-500">PIN:</span> {estado.pin}</p>
      </div>
      <button type="button" onClick={copiar} className="mt-3 min-h-11 w-full rounded-xl bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-200">{copiado ? "Credenciales copiadas" : "Copiar credenciales"}</button>
      <button type="button" onClick={() => window.location.reload()} className="mt-2 min-h-11 w-full rounded-xl border border-[#27425e] px-4 text-sm font-semibold text-slate-300">Registrar otro agente</button>
    </div>;
  }

  return <form action={accion} className="grid gap-4 sm:grid-cols-2">
    <Campo etiqueta="Nombre completo"><input name="nombre" required minLength={3} maxLength={100} className={control} placeholder="Nombre y apellidos" /></Campo>
    <Campo etiqueta="Cédula"><input name="cedula" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className={control} placeholder="10 dígitos" /></Campo>
    <Campo etiqueta="Teléfono (opcional)"><input name="telefono" inputMode="tel" maxLength={15} className={control} placeholder="0990000000" /></Campo>
    <Campo etiqueta="Credencial (opcional)"><input name="credencial" maxLength={40} className={control} placeholder="Código interno" /></Campo>
    {estado.mensaje && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200 sm:col-span-2">{estado.mensaje}</p>}
    <p className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-xs leading-5 text-slate-400 sm:col-span-2">Se creará su ficha operativa y su acceso. El sistema generará un PIN seguro de seis números y lo mostrará una sola vez.</p>
    <button disabled={pendiente} className="min-h-12 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 disabled:opacity-50 sm:col-span-2">{pendiente ? "Creando agente y acceso..." : "Crear agente y acceso"}</button>
  </form>;
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }
