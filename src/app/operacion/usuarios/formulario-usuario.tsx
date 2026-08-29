"use client";

import { useActionState, useState } from "react";
import { crearCuenta, type EstadoAlta } from "./acciones";

const INICIAL: EstadoAlta = { tipo: "inicial", mensaje: "" };

export function FormularioUsuario({ empresas, zonas, guardias }: { empresas: { id: string; nombre: string }[]; zonas: { id: string; nombre: string }[]; guardias: { id: string; nombre: string; cedula: string | null }[] }) {
  const [estado, accion, pendiente] = useActionState(crearCuenta, INICIAL);
  const [rol, setRol] = useState<"cliente" | "supervisor" | "guardia">("cliente");
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!estado.usuario || !estado.claveTemporal) return;
    await navigator.clipboard.writeText(`Usuario: ${estado.usuario}\nContraseña temporal: ${estado.claveTemporal}`);
    setCopiado(true);
  }

  if (estado.tipo === "exito") return <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4"><h3 className="font-semibold text-emerald-300">Cuenta creada correctamente</h3><p className="mt-2 text-sm leading-6 text-slate-300">{estado.mensaje}</p><div className="mt-4 space-y-2 rounded-xl bg-[#020b18] p-3 font-mono text-sm"><p><span className="text-slate-500">Usuario:</span> {estado.usuario}</p><p><span className="text-slate-500">Clave:</span> {estado.claveTemporal}</p></div><button type="button" onClick={copiar} className="mt-3 min-h-11 w-full rounded-xl bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-200">{copiado ? "Credenciales copiadas" : "Copiar credenciales"}</button></div>;

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Tipo de usuario"><select name="rol" value={rol} onChange={(evento) => setRol(evento.target.value as typeof rol)} className={control}><option value="cliente">Cliente</option><option value="supervisor">Supervisor</option><option value="guardia">Guardia</option></select></Campo>
      {rol !== "guardia" && <><Campo etiqueta="Nombre completo"><input name="nombre" required minLength={3} maxLength={100} className={control} placeholder="Nombre del usuario" /></Campo><Campo etiqueta="Correo electrónico"><input name="correo" type="email" required className={control} placeholder="usuario@sotersa.com" /></Campo></>}
      {rol === "cliente" && <Campo etiqueta="Empresa"><select name="empresa_id" required defaultValue="" className={control}><option value="" disabled>Selecciona una empresa</option>{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>)}</select></Campo>}
      {rol === "supervisor" && <Campo etiqueta="Zona asignada"><select name="zona_id" required defaultValue="" className={control}><option value="" disabled>Selecciona una zona</option>{zonas.map((zona) => <option key={zona.id} value={zona.id}>{zona.nombre}</option>)}</select></Campo>}
      {rol === "guardia" && <Campo etiqueta="Guardia sin acceso"><select name="guardia_id" required defaultValue="" className={control}><option value="" disabled>Selecciona un guardia</option>{guardias.map((guardia) => <option key={guardia.id} value={guardia.id}>{guardia.nombre}{guardia.cedula ? ` · ${guardia.cedula}` : " · cédula pendiente"}</option>)}</select></Campo>}
      {estado.mensaje && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">{estado.mensaje}</p>}
      <p className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-xs leading-5 text-slate-400">La contraseña se genera automáticamente y se muestra una sola vez después de crear la cuenta.</p>
      <button disabled={pendiente} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 disabled:opacity-50">{pendiente ? "Creando acceso..." : "Crear cuenta"}</button>
    </form>
  );
}

const control = "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }
