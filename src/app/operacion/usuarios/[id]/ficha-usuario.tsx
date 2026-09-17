"use client";

import { useActionState, useState } from "react";
import { actualizarUsuario, cambiarEstadoUsuario, restablecerClave, type EstadoUsuario } from "./acciones";

const INICIAL: EstadoUsuario = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-11 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff] disabled:opacity-50";

export type Cuenta = {
  id: string;
  rol: "admin" | "supervisor" | "guardia" | "cliente";
  nombre: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
  empresa_cliente_id: string | null;
  zona_id: string | null;
  esPropia: boolean;
};

export function EditorUsuario({ cuenta, empresas, zonas }: { cuenta: Cuenta; empresas: { id: string; nombre: string }[]; zonas: { id: string; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState(actualizarUsuario, INICIAL);
  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="perfil_id" value={cuenta.id} />
      <Campo etiqueta="Nombre completo"><input name="nombre" required minLength={3} maxLength={100} defaultValue={cuenta.nombre} className={control} /></Campo>
      {cuenta.rol === "cliente" && <Campo etiqueta="Correo de ingreso"><input name="correo" type="email" required maxLength={160} defaultValue={cuenta.correo} autoComplete="email" className={control} /></Campo>}
      <Campo etiqueta="Teléfono" ayuda="opcional"><input name="telefono" inputMode="tel" maxLength={20} defaultValue={cuenta.telefono ?? ""} className={control} /></Campo>
      {cuenta.rol === "cliente" && (
        <Campo etiqueta="Empresa">
          <select name="empresa_id" required defaultValue={cuenta.empresa_cliente_id ?? ""} className={control}>
            <option value="" disabled>Selecciona la empresa</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Campo>
      )}
      {cuenta.rol === "supervisor" && (
        <Campo etiqueta="Zona (opcional, solo referencia)">
          <select name="zona_id" defaultValue={cuenta.zona_id ?? ""} className={control}>
            <option value="">Sin zona</option>
            {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
        </Campo>
      )}
      <Aviso estado={estado} />
      <button disabled={pendiente} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando…" : "Guardar cambios"}</button>
    </form>
  );
}

export function ClaveUsuario({ cuenta, usuarioIngreso }: { cuenta: Cuenta; usuarioIngreso: string }) {
  const [estado, accion, pendiente] = useActionState(restablecerClave, INICIAL);
  const [copiado, setCopiado] = useState(false);
  const esAgente = cuenta.rol === "guardia";

  if (estado.tipo === "exito" && estado.usuario && estado.claveTemporal) {
    const destino = cuenta.rol === "cliente" ? "por la opción Cliente" : esAgente ? "con tu cédula" : "con tu correo";
    const texto = `Acceso a la app SOTERSA\nUsuario: ${estado.usuario}\n${esAgente ? "PIN" : "Clave"} temporal: ${estado.claveTemporal}\nIngresa en ${typeof window === "undefined" ? "" : window.location.origin}/acceso ${destino}; te pedirá crear ${esAgente ? "tu PIN propio" : "una clave nueva"} la primera vez.`;
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm text-emerald-200">{estado.mensaje}</p>
        <dl className="mt-3 space-y-2 font-mono text-sm">
          <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">Usuario</dt><dd className="text-white">{estado.usuario}</dd></div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#041225] px-3 py-2"><dt className="text-slate-400">{esAgente ? "PIN" : "Clave"} temporal</dt><dd className="text-white">{estado.claveTemporal}</dd></div>
        </dl>
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); } catch { setCopiado(false); } }} className="mt-3 min-h-11 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100">
          {copiado ? "Copiado — pégalo en WhatsApp o correo" : "Copiar credenciales para enviar"}
        </button>
        <p className="mt-2 text-xs text-emerald-200/70">No vuelve a mostrarse. Si se pierde, restablécela de nuevo.</p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="perfil_id" value={cuenta.id} />
      <p className="text-xs leading-5 text-slate-400">Usuario de ingreso: <span className="font-mono text-slate-200">{usuarioIngreso}</span>. Genera {esAgente ? "un PIN" : "una clave"} temporal nuevo; {esAgente ? "el" : "la"} actual deja de funcionar al instante y la persona deberá cambiarl{esAgente ? "o" : "a"} al entrar.</p>
      <Campo etiqueta={esAgente ? "PIN temporal" : "Clave temporal"} ayuda={esAgente ? "opcional · 6 números; vacío = se genera uno" : "opcional · mínimo 8; vacío = se genera una"}>
        <input name="clave_temporal" inputMode={esAgente ? "numeric" : "text"} maxLength={esAgente ? 6 : 64} autoComplete="off" disabled={cuenta.esPropia || !cuenta.activo} className={control} />
      </Campo>
      <Aviso estado={estado} />
      <button
        disabled={pendiente || cuenta.esPropia || !cuenta.activo}
        onClick={(e) => { if (!window.confirm(`¿Restablecer la clave de ${cuenta.nombre}? La actual dejará de funcionar.`)) e.preventDefault(); }}
        className="min-h-11 w-full rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/10 px-4 text-sm font-semibold text-[#8ddaff] disabled:opacity-50"
      >
        {pendiente ? "Generando…" : esAgente ? "Restablecer PIN" : "Restablecer clave"}
      </button>
      {cuenta.esPropia && <p className="text-xs text-amber-300">Tu propia clave la cambias desde Mi perfil.</p>}
      {!cuenta.activo && <p className="text-xs text-amber-300">Cuenta bloqueada: desbloquéala antes.</p>}
    </form>
  );
}

export function EstadoCuenta({ cuenta }: { cuenta: Cuenta }) {
  return (
    <form action={cambiarEstadoUsuario} className="flex items-center justify-between gap-3">
      <input type="hidden" name="perfil_id" value={cuenta.id} />
      <input type="hidden" name="activar" value={cuenta.activo ? "0" : "1"} />
      <div><p className="font-medium">{cuenta.activo ? "Activa" : "Bloqueada"}</p><p className="text-xs text-slate-500">{cuenta.activo ? "Puede ingresar con su clave." : "No puede ingresar aunque conozca la clave."}</p></div>
      <button
        disabled={cuenta.esPropia}
        onClick={(e) => { if (cuenta.activo && !window.confirm(`¿Bloquear la cuenta de ${cuenta.nombre}? No podrá ingresar hasta que la desbloquees.`)) e.preventDefault(); }}
        className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-medium disabled:opacity-40 ${cuenta.activo ? "border-red-500/30 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"}`}
      >
        {cuenta.activo ? "Bloquear" : "Desbloquear"}
      </button>
    </form>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300">{etiqueta}{ayuda && <span className="ml-1 text-xs font-normal text-slate-500">{ayuda}</span>}{children}</label>;
}
function Aviso({ estado }: { estado: EstadoUsuario }) {
  if (!estado.mensaje) return null;
  return <p aria-live="polite" className={`rounded-xl border px-3 py-2.5 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>;
}
