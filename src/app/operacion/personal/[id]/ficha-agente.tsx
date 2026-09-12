"use client";

import { useActionState, useState } from "react";
import { alternarRelevo, asignarAgente, liberarAgente, type EstadoDotacion } from "../../dotacion/acciones";
import { actualizarAgente, cambiarEstadoAgente, restablecerPin, type EstadoFicha } from "./acciones";

const INICIAL: EstadoFicha = { tipo: "inicial", mensaje: "" };
const INICIAL_DOTACION: EstadoDotacion = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-11 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff] disabled:opacity-50";

export type AgenteFicha = {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  credencial: string | null;
  activo: boolean;
  es_relevo: boolean;
  puesto_habitual_id: string | null;
  tieneCuenta: boolean;
};

/** Datos editables de la ficha. Solo el admin ve esto; el supervisor consulta. */
export function EditorAgente({ agente }: { agente: AgenteFicha }) {
  const [estado, accion, pendiente] = useActionState(actualizarAgente, INICIAL);

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="guardia_id" value={agente.id} />
      <Campo etiqueta="Nombre completo"><input name="nombre" required minLength={3} maxLength={100} defaultValue={agente.nombre} className={control} /></Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Cédula" ayuda={agente.tieneCuenta ? "es su usuario · no se cambia" : "10 dígitos"}>
          <input name="cedula" inputMode="numeric" maxLength={10} defaultValue={agente.cedula ?? ""} readOnly={agente.tieneCuenta} disabled={agente.tieneCuenta} className={control} />
          {agente.tieneCuenta && <input type="hidden" name="cedula" value={agente.cedula ?? ""} />}
        </Campo>
        <Campo etiqueta="Teléfono"><input name="telefono" inputMode="tel" maxLength={15} defaultValue={agente.telefono ?? ""} className={control} /></Campo>
      </div>
      <Campo etiqueta="Credencial" ayuda="código interno o carné"><input name="credencial" maxLength={40} defaultValue={agente.credencial ?? ""} className={control} /></Campo>
      <Aviso estado={estado} />
      <button disabled={pendiente} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando…" : "Guardar ficha"}</button>
    </form>
  );
}

/** Plaza fija, relevo y baja: lo que decide donde y si trabaja. */
export function PlazaAgente({ agente, puestos, puestoActual }: { agente: AgenteFicha; puestos: { id: string; codigo: string; nombre: string; cliente: string }[]; puestoActual: string | null }) {
  const [eligiendo, setEligiendo] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#27425e] bg-[#041225] p-3">
        <p className="text-xs text-slate-500">Plaza fija</p>
        <p className="mt-1 font-medium">{agente.es_relevo ? "Relevo · cubre los días libres de varios puestos" : puestoActual ?? "Sin plaza asignada"}</p>
        {agente.activo && (
          <div className="mt-3 flex flex-wrap gap-2">
            {agente.puesto_habitual_id && (
              <form action={liberarAgente}>
                <input type="hidden" name="guardia_id" value={agente.id} />
                <button className="min-h-9 rounded-full border border-[#27425e] px-3 text-xs text-slate-300">Quitar de la plaza</button>
              </form>
            )}
            <button type="button" onClick={() => setEligiendo((v) => !v)} className={`min-h-9 rounded-full border px-3 text-xs ${eligiendo ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]" : "border-[#27425e] text-slate-300"}`}>
              {agente.puesto_habitual_id ? "Cambiar de puesto" : "Asignar a un puesto"}
            </button>
            <form action={alternarRelevo}>
              <input type="hidden" name="guardia_id" value={agente.id} />
              <input type="hidden" name="activar" value={agente.es_relevo ? "0" : "1"} />
              <button className={`min-h-9 rounded-full border px-3 text-xs ${agente.es_relevo ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-[#27425e] text-slate-300"}`}>
                {agente.es_relevo ? "Dejar de ser relevo" : "Marcar como relevo"}
              </button>
            </form>
          </div>
        )}
        {eligiendo && <SelectorPuesto guardiaId={agente.id} puestos={puestos} />}
      </div>

      <form action={cambiarEstadoAgente} className="rounded-xl border border-[#27425e] bg-[#041225] p-3">
        <input type="hidden" name="guardia_id" value={agente.id} />
        <input type="hidden" name="activar" value={agente.activo ? "0" : "1"} />
        <p className="text-xs text-slate-500">Estado en la nómina</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="font-medium">{agente.activo ? "Activo" : "Dado de baja"}</p>
          <button
            onClick={(e) => { if (agente.activo && !window.confirm(`¿Dar de baja a ${agente.nombre}? Perderá su plaza y su acceso a la app quedará bloqueado. El historial se conserva.`)) e.preventDefault(); }}
            className={`min-h-9 rounded-full border px-3 text-xs ${agente.activo ? "border-red-500/30 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"}`}
          >
            {agente.activo ? "Dar de baja" : "Reingresar"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Asignar a un puesto desde la ficha: el agente es fijo y se elige el puesto. */
function SelectorPuesto({ guardiaId, puestos }: { guardiaId: string; puestos: { id: string; codigo: string; nombre: string; cliente: string }[] }) {
  const [estado, accion, pendiente] = useActionState(asignarAgente, INICIAL_DOTACION);
  return (
    <form action={accion} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="guardia_id" value={guardiaId} />
      <select name="puesto_id" required defaultValue="" className="min-h-11 flex-1 rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]">
        <option value="" disabled>Elige el puesto…</option>
        {puestos.map((p) => <option key={p.id} value={p.id}>{p.cliente} · {p.codigo} {p.nombre}</option>)}
      </select>
      <button disabled={pendiente} className="min-h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Asignando…" : "Asignar"}</button>
      {estado.mensaje && <p aria-live="polite" className={`w-full text-xs ${estado.tipo === "exito" ? "text-emerald-300" : "text-red-300"}`}>{estado.mensaje}</p>}
    </form>
  );
}

/** Acceso a la app: crear o restablecer el PIN. Solo admin. */
export function AccesoAgente({ agente }: { agente: AgenteFicha }) {
  const [estado, accion, pendiente] = useActionState(restablecerPin, INICIAL);
  const [copiado, setCopiado] = useState(false);

  if (estado.tipo === "exito" && estado.usuario && estado.pin) {
    const texto = `Acceso a la app SOTERSA\nUsuario: ${estado.usuario}\nPIN temporal: ${estado.pin}\nAl entrar te pedirá un PIN nuevo.`;
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm text-emerald-200">{estado.mensaje}</p>
        <dl className="mt-3 space-y-2 font-mono text-sm">
          <div className="flex justify-between rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">Usuario</dt><dd className="text-white">{estado.usuario}</dd></div>
          <div className="flex justify-between rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">PIN temporal</dt><dd className="text-white">{estado.pin}</dd></div>
        </dl>
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); } catch { setCopiado(false); } }} className="mt-3 min-h-11 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100">
          {copiado ? "Copiado" : "Copiar credenciales"}
        </button>
        <p className="mt-2 text-xs text-emerald-200/70">El PIN no vuelve a mostrarse.</p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="guardia_id" value={agente.id} />
      <p className="text-xs leading-5 text-slate-400">
        {agente.tieneCuenta
          ? "Genera un PIN temporal nuevo. Sirve si lo olvidó o si nunca cambió el que se le entregó. El anterior deja de funcionar al instante."
          : "Este agente todavía no tiene acceso a la app. Se creará su cuenta con la cédula como usuario y un PIN temporal."}
      </p>
      <Aviso estado={estado} />
      <button
        disabled={pendiente || !agente.activo || !agente.cedula}
        onClick={(e) => { if (agente.tieneCuenta && !window.confirm("¿Restablecer el PIN? El actual dejará de funcionar.")) e.preventDefault(); }}
        className="min-h-11 w-full rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/10 px-4 text-sm font-semibold text-[#8ddaff] disabled:opacity-50"
      >
        {pendiente ? "Generando…" : agente.tieneCuenta ? "Restablecer PIN" : "Crear acceso"}
      </button>
      {!agente.cedula && <p className="text-xs text-amber-300">Primero registra su cédula en la ficha.</p>}
    </form>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300">{etiqueta}{ayuda && <span className="ml-1 text-xs font-normal text-slate-500">{ayuda}</span>}{children}</label>;
}

function Aviso({ estado }: { estado: EstadoFicha }) {
  if (!estado.mensaje) return null;
  return <p aria-live="polite" className={`rounded-xl border px-3 py-2.5 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>;
}
