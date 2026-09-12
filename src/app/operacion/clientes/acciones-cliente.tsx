"use client";

import { useActionState, useState } from "react";
import { actualizarCliente, cambiarEstadoCliente, crearAccesoCliente, restablecerClaveCliente, type EstadoAcceso, type EstadoCliente } from "./acciones";

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

type Panel = "editar" | "acceso" | null;
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
          <Boton activo={panel === "acceso"} onClick={() => alternar("acceso")} destacado={cuentas.length === 0}>
            {cuentas.length === 0 ? "Crear acceso al portal" : "Agregar otro acceso"}
          </Boton>
        )}
        <form action={cambiarEstadoCliente} className="ml-auto">
          <input type="hidden" name="empresa_id" value={empresa.id} />
          <input type="hidden" name="activar" value={empresa.activo ? "0" : "1"} />
          <BotonEstado activo={empresa.activo} />
        </form>
      </div>

      {panel === "editar" && <FormularioEditar empresa={empresa} alCerrar={() => setPanel(null)} />}
      {panel === "acceso" && <FormularioAcceso empresa={empresa} />}

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

function FormularioAcceso({ empresa }: { empresa: Empresa }) {
  const [estado, accion, pendiente] = useActionState(crearAccesoCliente, INICIAL as EstadoAcceso);
  const [copiado, setCopiado] = useState(false);

  // Con la cuenta creada, el formulario ya no sirve: lo que importa ahora es
  // que las credenciales se vean grandes y se puedan copiar de un toque.
  if (estado.tipo === "exito" && estado.usuario && estado.claveTemporal) {
    const texto = `Acceso al portal SOTERSA\nUsuario: ${estado.usuario}\nClave temporal: ${estado.claveTemporal}\nIngresa en ${typeof window === "undefined" ? "" : window.location.origin}/acceso y cambia la clave al entrar.`;
    return (
      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm text-emerald-200">{estado.mensaje}</p>
        <dl className="mt-3 space-y-2 font-mono text-sm">
          <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">Usuario</dt><dd className="text-white">{estado.usuario}</dd></div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">Clave temporal</dt><dd className="text-white">{estado.claveTemporal}</dd></div>
        </dl>
        <button
          type="button"
          onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); } catch { setCopiado(false); } }}
          className="mt-3 min-h-11 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100"
        >
          {copiado ? "Copiado — pégalo en el correo o WhatsApp" : "Copiar credenciales para enviar"}
        </button>
        <p className="mt-2 text-xs text-emerald-200/70">La clave no vuelve a mostrarse. Si se pierde, crea otro acceso.</p>
      </div>
    );
  }

  return (
    <form action={accion} className="mt-3 space-y-3 rounded-xl border border-[#0788ff]/30 bg-[#0788ff]/5 p-3">
      <input type="hidden" name="empresa_id" value={empresa.id} />
      <p className="text-xs leading-5 text-slate-400">La cuenta entra al portal y solo ve los puestos y novedades de {empresa.nombre}. El cliente cambia la clave en su primer ingreso.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombre de quien ingresa"><input name="nombre" required maxLength={100} defaultValue={empresa.contacto_nombre ?? ""} className={control} /></Campo>
        <Campo etiqueta="Correo (será el usuario)"><input name="correo" type="email" required maxLength={120} defaultValue={empresa.contacto_correo ?? ""} className={control} /></Campo>
      </div>
      <Campo etiqueta="Clave temporal" ayuda="opcional · si la dejas vacía se genera una segura">
        <input name="clave_temporal" minLength={8} maxLength={64} autoComplete="off" placeholder="mínimo 8 caracteres" className={control} />
      </Campo>
      <Aviso estado={estado} />
      <button disabled={pendiente} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Creando…" : "Crear acceso"}</button>
    </form>
  );
}

/**
 * Una cuenta del portal, con su restablecimiento de clave. La app no manda
 * correos: si la clave se perdio antes de enviarla, aqui se genera otra.
 */
function Cuenta({ cuenta }: { cuenta: CuentaCliente }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, pendiente] = useActionState(restablecerClaveCliente, INICIAL as EstadoAcceso);

  if (estado.tipo === "exito" && estado.usuario && estado.claveTemporal) {
    return <li><Credenciales mensaje={estado.mensaje} usuario={estado.usuario} clave={estado.claveTemporal} /></li>;
  }

  return (
    <li className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm text-slate-200">{cuenta.nombre}</p><p className="text-xs text-slate-500">Acceso al portal{cuenta.activo ? "" : " · bloqueado"}</p></div>
        {cuenta.activo && <button type="button" onClick={() => setAbierto((v) => !v)} className="min-h-9 shrink-0 rounded-full border border-[#27425e] px-3 text-xs text-slate-300">{abierto ? "Cancelar" : "Restablecer clave"}</button>}
      </div>
      {abierto && (
        <form action={accion} className="mt-3 space-y-2">
          <input type="hidden" name="perfil_id" value={cuenta.id} />
          <input name="clave_temporal" minLength={8} maxLength={64} autoComplete="off" placeholder="Clave temporal (opcional, mínimo 8)" className={control.replace("mt-2 ", "")} />
          <Aviso estado={estado} />
          <button disabled={pendiente} onClick={(e) => { if (!window.confirm("¿Restablecer la clave? La actual dejará de funcionar.")) e.preventDefault(); }} className="min-h-10 w-full rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/10 px-4 text-sm font-semibold text-[#8ddaff] disabled:opacity-50">{pendiente ? "Generando…" : "Generar clave nueva"}</button>
        </form>
      )}
    </li>
  );
}

function Credenciales({ mensaje, usuario, clave }: { mensaje: string; usuario: string; clave: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Acceso al portal SOTERSA
Usuario: ${usuario}
Clave temporal: ${clave}
Ingresa en ${typeof window === "undefined" ? "" : window.location.origin}/acceso y cambia la clave al entrar.`;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <p className="text-sm text-emerald-200">{mensaje}</p>
      <dl className="mt-3 space-y-2 font-mono text-sm">
        <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">Usuario</dt><dd className="text-white">{usuario}</dd></div>
        <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">Clave temporal</dt><dd className="text-white">{clave}</dd></div>
      </dl>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); } catch { setCopiado(false); } }} className="mt-3 min-h-11 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100">
        {copiado ? "Copiado — pégalo en el correo o WhatsApp" : "Copiar credenciales para enviar"}
      </button>
      <p className="mt-2 text-xs text-emerald-200/70">La clave no vuelve a mostrarse. Si se pierde, restablécela de nuevo.</p>
    </div>
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
