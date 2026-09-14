"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SERVICIOS, servicio, type TipoServicio } from "@/lib/servicios";
import { Asignador } from "../dotacion/asignador";
import { liberarAgente } from "../dotacion/acciones";
import { actualizarPuesto, agregarPuesto, cambiarEstadoPuesto, type EstadoCliente } from "./acciones";
import { CamposPuesto } from "./formulario-cliente";

const INICIAL: EstadoCliente = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-11 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

export type PuestoCliente = {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string | null;
  tipo_servicio: string | null;
  armado: boolean;
  origen: string | null;
  destino: string | null;
  lat: number | null;
  lng: number | null;
  supervisor_id: string | null;
  activo: boolean;
  contactos: { id: string; tipo: string; nombre: string | null; telefono: string }[];
};

export type GuardiaResumen = { id: string; nombre: string; puesto_habitual_id: string | null; es_relevo: boolean };

/**
 * Los servicios contratados de un cliente, editables en su propia tarjeta:
 * agregar puesto, corregirlo, cerrarlo y decidir que agentes lo cubren.
 *
 * Es la misma informacion que dotacion, vista desde el cliente en vez de
 * desde el puesto. Para el admin es mas natural: "a Citimed le pongo a
 * fulano" antes que buscar P-01 en una lista de todos los puestos.
 */
export type SupervisorResumen = { id: string; nombre: string };

export function ServiciosCliente({ empresa, puestos, guardias, supervisores = [], soloLectura = false }: { empresa: { id: string; nombre: string; activo: boolean }; puestos: PuestoCliente[]; guardias: GuardiaResumen[]; supervisores?: SupervisorResumen[]; soloLectura?: boolean }) {
  const [agregando, setAgregando] = useState(false);
  const disponibles = guardias.filter((g) => g.es_relevo || !g.puesto_habitual_id);

  return (
    <div className="mt-4 rounded-xl border border-[#27425e] bg-[#041225]">
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <p className="text-sm font-medium text-slate-200">Servicios contratados <span className="text-slate-500">· {puestos.filter((p) => p.activo).length} activo{puestos.filter((p) => p.activo).length === 1 ? "" : "s"}</span></p>
        {empresa.activo && !soloLectura && (
          <button type="button" aria-pressed={agregando} onClick={() => setAgregando((v) => !v)} className={`min-h-9 rounded-full border px-3 text-xs font-medium ${agregando ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]" : "border-[#27425e] text-slate-300"}`}>
            {agregando ? "Cancelar" : "+ Agregar puesto"}
          </button>
        )}
      </div>

      {agregando && <FormularioNuevoPuesto empresaId={empresa.id} alCrear={() => setAgregando(false)} />}

      <div className="divide-y divide-[#20374e] border-t border-[#20374e]">
        {puestos.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">Sin puestos registrados.</p>
        ) : (
          puestos.map((puesto) => (
            <Puesto key={puesto.id} puesto={puesto} empresaActiva={empresa.activo} asignados={guardias.filter((g) => g.puesto_habitual_id === puesto.id)} disponibles={disponibles} supervisores={supervisores} soloLectura={soloLectura} />
          ))
        )}
      </div>
    </div>
  );
}

function Puesto({ puesto, empresaActiva, asignados, disponibles, supervisores, soloLectura }: { puesto: PuestoCliente; empresaActiva: boolean; asignados: GuardiaResumen[]; disponibles: GuardiaResumen[]; supervisores: SupervisorResumen[]; soloLectura: boolean }) {
  const [editando, setEditando] = useState(false);
  const modalidad = servicio(puesto.tipo_servicio);
  const plazas = modalidad.fijos;
  const falta = plazas - asignados.length;

  return (
    <div className={`px-3 py-3 ${puesto.activo ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            <span className="font-mono text-[#0788ff]">{puesto.codigo}</span> · {puesto.nombre}
            {puesto.armado && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] text-amber-300">ARMADO</span>}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {modalidad.etiqueta} · {plazas} plaza{plazas === 1 ? "" : "s"}{modalidad.requiereRelevo && " + relevo"} · {puesto.contactos.length}/4 contactos
            {puesto.lat != null && " · ubicado"}
          </p>
          {puesto.origen && puesto.destino && <p className="mt-1 text-xs text-slate-400">{puesto.origen} → {puesto.destino}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${puesto.activo ? "bg-emerald-400" : "bg-slate-500"}`} />
          {puesto.activo && !soloLectura && (
            <button type="button" aria-pressed={editando} onClick={() => setEditando((v) => !v)} className={`rounded-md border px-2 py-1 text-[0.65rem] ${editando ? "border-[#0788ff] text-[#65c8ff]" : "border-[#27425e] text-slate-300"}`}>
              {editando ? "Cerrar edición" : "Editar"}
            </button>
          )}
          {(puesto.activo || empresaActiva) && !soloLectura && (
            <form action={cambiarEstadoPuesto}>
              <input type="hidden" name="puesto_id" value={puesto.id} />
              <input type="hidden" name="activar" value={puesto.activo ? "0" : "1"} />
              <button
                onClick={(e) => { if (puesto.activo && asignados.length > 0 && !window.confirm(`¿Cerrar ${puesto.codigo}? Sus ${asignados.length} agente(s) quedarán sin plaza.`)) e.preventDefault(); }}
                className={`rounded-md border px-2 py-1 text-[0.65rem] ${puesto.activo ? "border-[#27425e] text-slate-400" : "border-emerald-500/40 text-emerald-300"}`}
              >
                {puesto.activo ? "Cerrar" : "Reabrir"}
              </button>
            </form>
          )}
        </div>
      </div>

      {puesto.contactos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {puesto.contactos.map((c) => <span key={c.id} className="rounded-md bg-[#0b2035] px-2 py-1 text-[0.65rem] text-slate-400">{etiquetaContacto(c.tipo)} · {c.telefono}</span>)}
        </div>
      )}

      {editando && <FormularioEditarPuesto puesto={puesto} supervisores={supervisores} alGuardar={() => setEditando(false)} />}

      {puesto.activo && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-400">
            Agentes asignados
            <span className={`ml-2 ${falta > 0 ? "text-amber-300" : falta < 0 ? "text-red-300" : "text-emerald-300"}`}>
              {asignados.length}/{plazas}{falta > 0 ? ` · falta${falta === 1 ? "" : "n"} ${falta}` : falta < 0 ? ` · ${-falta} de más` : " · completo"}
            </span>
          </p>
          {asignados.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {asignados.map((g) => (
                <li key={g.id}>
                  <form action={liberarAgente} className="flex items-center gap-1 rounded-full border border-[#27425e] bg-[#07172a] py-1 pl-3 pr-1 text-xs text-slate-200">
                    <input type="hidden" name="guardia_id" value={g.id} />
                    {g.nombre}
                    {!soloLectura && <button title="Quitar de este puesto" aria-label={`Quitar a ${g.nombre} de ${puesto.codigo}`} className="grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:bg-red-500/15 hover:text-red-300">×</button>}
                  </form>
                </li>
              ))}
            </ul>
          )}
          {!soloLectura && <Asignador puestoId={puesto.id} disponibles={disponibles} />}
        </div>
      )}
    </div>
  );
}

function FormularioNuevoPuesto({ empresaId, alCrear }: { empresaId: string; alCrear: () => void }) {
  const [estado, accion, pendiente] = useActionState(agregarPuesto, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.tipo === "exito") { form.current?.reset(); alCrear(); } }, [estado, alCrear]);

  return (
    <form ref={form} action={accion} className="space-y-4 border-t border-[#20374e] px-3 py-4">
      <input type="hidden" name="empresa_cliente_id" value={empresaId} />
      <CamposPuesto requerido />
      <Aviso estado={estado} />
      <button disabled={pendiente} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Agregando…" : "Agregar puesto"}</button>
    </form>
  );
}

function FormularioEditarPuesto({ puesto, supervisores, alGuardar }: { puesto: PuestoCliente; supervisores: SupervisorResumen[]; alGuardar: () => void }) {
  const [estado, accion, pendiente] = useActionState(actualizarPuesto, INICIAL);
  const [tipo, setTipo] = useState<TipoServicio>((puesto.tipo_servicio as TipoServicio) ?? "punto_24_l_d");
  const modalidad = servicio(tipo);
  useEffect(() => { if (estado.tipo === "exito") alGuardar(); }, [estado, alGuardar]);

  return (
    <form action={accion} className="mt-3 space-y-3 rounded-xl border border-[#0788ff]/30 bg-[#0788ff]/5 p-3">
      <input type="hidden" name="puesto_id" value={puesto.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Código"><input name="puesto_codigo" required maxLength={16} defaultValue={puesto.codigo} className={control} /></Campo>
        <Campo etiqueta="Tipo de servicio">
          <select name="puesto_tipo_servicio" value={tipo} onChange={(e) => setTipo(e.target.value as TipoServicio)} className={control}>
            {SERVICIOS.map((s) => <option key={s.valor} value={s.valor}>{s.etiqueta}</option>)}
          </select>
        </Campo>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{modalidad.detalle} <span className="text-[#65c8ff]">{modalidad.fijos} agente{modalidad.fijos === 1 ? "" : "s"} fijo{modalidad.fijos === 1 ? "" : "s"}{modalidad.requiereRelevo && " + relevo"}.</span></p>
      {modalidad.requiereRuta && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Origen"><input name="puesto_origen" required maxLength={200} defaultValue={puesto.origen ?? ""} className={control} /></Campo>
          <Campo etiqueta="Destino"><input name="puesto_destino" required maxLength={200} defaultValue={puesto.destino ?? ""} className={control} /></Campo>
        </div>
      )}
      <Campo etiqueta="Nombre del puesto"><input name="puesto_nombre" required maxLength={120} defaultValue={puesto.nombre} className={control} /></Campo>
      <Campo etiqueta="Dirección"><input name="puesto_direccion" maxLength={200} defaultValue={puesto.direccion ?? ""} className={control} /></Campo>
      <Campo etiqueta="Supervisor a cargo" ayuda="quién ve y valida este puesto · para más de uno, usa la ficha del supervisor">
        <select name="puesto_supervisor_id" defaultValue={puesto.supervisor_id ?? ""} className={control}>
          <option value="">Sin supervisor</option>
          {supervisores.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Ubicación Google Maps" ayuda={puesto.lat != null ? "ya tiene coordenadas · pega un enlace solo para cambiarlas" : "opcional · pega el enlace del punto"}>
        <input name="puesto_google_maps" type="url" maxLength={500} placeholder="https://maps.app.goo.gl/..." className={control} />
      </Campo>
      <label className="flex items-center gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5 text-sm text-slate-300">
        <input type="checkbox" name="puesto_armado" defaultChecked={puesto.armado} className="h-5 w-5 accent-[#0788ff]" />
        Puesto con arma de fuego
      </label>
      <Aviso estado={estado} />
      <button disabled={pendiente} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando…" : "Guardar puesto"}</button>
    </form>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300">{etiqueta}{ayuda && <span className="ml-1 text-xs font-normal text-slate-500">{ayuda}</span>}{children}</label>;
}

function Aviso({ estado }: { estado: EstadoCliente }) {
  if (!estado.mensaje) return null;
  return <p aria-live="polite" className={`rounded-xl border px-3 py-2.5 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>;
}

function etiquetaContacto(tipo: string) {
  return ({ central_monitoreo: "Central", supervisor_zona: "Supervisor", jefe_operaciones: "Operaciones", administracion_cliente: "Cliente" } as Record<string, string>)[tipo] ?? tipo;
}
