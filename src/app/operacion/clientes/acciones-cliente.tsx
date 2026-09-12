"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { actualizarCliente, cambiarEstadoCliente, type EstadoCliente } from "./acciones";

const INICIAL: EstadoCliente = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-11 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

type Empresa = {
  id: string;
  nombre: string;
  ruc: string | null;
  direccion: string | null;
  contacto_nombre: string | null;
  contacto_correo: string | null;
  contacto_telefono: string | null;
  activo: boolean;
};

type Panel = "editar" | null;
export type CuentaCliente = { id: string; nombre: string; activo: boolean };

/**
 * Acciones sobre un cliente que ya existe, dentro de su tarjeta. Solo un
 * panel abierto a la vez: la tarjeta es angosta y dos formularios apilados
 * se confunden con los datos del cliente.
 */
export function AccionesCliente({ empresa, cuentas }: { empresa: Empresa; cuentas: CuentaCliente[] }) {
  const [panel, setPanel] = useState<Panel>(null);
  const alternar = (p: Panel) => setPanel((actual) => (actual === p ? null : p));

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Boton activo={panel === "editar"} onClick={() => alternar("editar")}>Editar datos</Boton>
        {empresa.activo && (
          <Link href="/operacion/usuarios?rol=cliente" className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition ${cuentas.length === 0 ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-[#27425e] bg-[#041225] text-slate-300"}`}>
            {cuentas.length === 0 ? "Crear acceso en Usuarios y permisos" : "Gestionar accesos"}
          </Link>
        )}
        <form action={cambiarEstadoCliente} className="ml-auto">
          <input type="hidden" name="empresa_id" value={empresa.id} />
          <input type="hidden" name="activar" value={empresa.activo ? "0" : "1"} />
          <BotonEstado activo={empresa.activo} />
        </form>
      </div>

      {panel === "editar" && <FormularioEditar empresa={empresa} alCerrar={() => setPanel(null)} />}

      {cuentas.length > 0 && (
        <ul className="mt-3 space-y-2">
          {cuentas.map((cuenta) => <Cuenta key={cuenta.id} cuenta={cuenta} />)}
        </ul>
      )}
    </div>
  );
}

function FormularioEditar({ empresa, alCerrar }: { empresa: Empresa; alCerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState(actualizarCliente, INICIAL);

  return (
    <form action={accion} className="mt-3 space-y-3 rounded-xl border border-[#27425e] bg-[#041225] p-3">
      <input type="hidden" name="empresa_id" value={empresa.id} />
      <Campo etiqueta="Nombre"><input name="nombre" required maxLength={120} defaultValue={empresa.nombre} className={control} /></Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="RUC" ayuda="13 dígitos"><input name="ruc" inputMode="numeric" maxLength={13} defaultValue={empresa.ruc ?? ""} className={control} /></Campo>
        <Campo etiqueta="Teléfono"><input name="contacto_telefono" maxLength={40} inputMode="tel" defaultValue={empresa.contacto_telefono ?? ""} className={control} /></Campo>
      </div>
      <Campo etiqueta="Dirección"><input name="direccion" maxLength={200} defaultValue={empresa.direccion ?? ""} className={control} /></Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Persona de contacto"><input name="contacto_nombre" maxLength={120} defaultValue={empresa.contacto_nombre ?? ""} className={control} /></Campo>
        <Campo etiqueta="Correo"><input name="contacto_correo" type="email" maxLength={120} defaultValue={empresa.contacto_correo ?? ""} className={control} /></Campo>
      </div>
      <Aviso estado={estado} />
      <div className="flex gap-2">
        <button disabled={pendiente} className="min-h-11 flex-1 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando…" : "Guardar cambios"}</button>
        <button type="button" onClick={alCerrar} className="min-h-11 rounded-xl border border-[#27425e] px-4 text-sm text-slate-300">Cerrar</button>
      </div>
    </form>
  );
}

/**
 * Las cuentas del portal de este cliente. Solo se muestran: crear, editar,
 * restablecer clave y bloquear viven en Usuarios y permisos, unico lugar
 * autorizado para eso.
 */
function Cuenta({ cuenta }: { cuenta: CuentaCliente }) {
  return (
    <li>
      <Link href={`/operacion/usuarios/${cuenta.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5 transition hover:bg-[#0b2035]">
        <div className="min-w-0"><p className="truncate text-sm text-slate-200">{cuenta.nombre}</p><p className="text-xs text-slate-500">Acceso al portal{cuenta.activo ? "" : " · bloqueado"}</p></div>
        <span className="shrink-0 text-xs font-medium text-[#8ddaff]">Ver cuenta →</span>
      </Link>
    </li>
  );
}

function Boton({ children, onClick, activo, destacado = false }: { children: React.ReactNode; onClick: () => void; activo: boolean; destacado?: boolean }) {
  const base = "min-h-10 rounded-full border px-4 text-sm font-medium transition";
  const clase = activo
    ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]"
    : destacado
      ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
      : "border-[#27425e] bg-[#041225] text-slate-300";
  return <button type="button" aria-pressed={activo} onClick={onClick} className={`${base} ${clase}`}>{children}</button>;
}

function BotonEstado({ activo }: { activo: boolean }) {
  return (
    <button
      // Desactivar cierra puestos y bloquea accesos: pide confirmacion. Reactivar no.
      onClick={(e) => { if (activo && !window.confirm("¿Desactivar este cliente? Se cerrarán sus puestos, sus agentes quedarán sin plaza y sus accesos al portal se bloquearán. El historial se conserva.")) e.preventDefault(); }}
      className={`min-h-10 rounded-full border px-4 text-sm font-medium ${activo ? "border-red-500/30 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"}`}
    >
      {activo ? "Desactivar" : "Reactivar cliente"}
    </button>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300">{etiqueta}{ayuda && <span className="ml-1 text-xs font-normal text-slate-500">{ayuda}</span>}{children}</label>;
}

function Aviso({ estado }: { estado: EstadoCliente }) {
  if (!estado.mensaje) return null;
  return <p aria-live="polite" className={`rounded-xl border px-3 py-2.5 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>;
}
