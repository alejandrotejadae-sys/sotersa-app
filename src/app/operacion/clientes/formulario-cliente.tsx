"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { agregarPuesto, crearCliente, type EstadoCliente } from "./acciones";

const INICIAL: EstadoCliente = { tipo: "inicial", mensaje: "" };

const control =
  "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {etiqueta}
      {ayuda && <span className="ml-1 text-xs text-slate-500">{ayuda}</span>}
      {children}
    </label>
  );
}

function Aviso({ estado }: { estado: EstadoCliente }) {
  if (!estado.mensaje) return null;
  return (
    <p
      aria-live="polite"
      className={`rounded-xl border px-3 py-3 text-sm ${
        estado.tipo === "exito"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-red-500/30 bg-red-500/10 text-red-200"
      }`}
    >
      {estado.mensaje}
    </p>
  );
}

/** Campos del puesto, compartidos por las dos pestañas. */
function CamposPuesto({ requerido }: { requerido?: boolean }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Código" ayuda="P-01, P-02…">
          <input
            name="puesto_codigo"
            required={requerido}
            maxLength={16}
            placeholder="P-01"
            className={control}
          />
        </Campo>
        <Campo etiqueta="Cobertura" ayuda="horas al día">
          <select name="puesto_cobertura" defaultValue="24" className={control}>
            <option value="24">24 horas</option>
            <option value="12">12 horas</option>
            <option value="15">15 horas</option>
            <option value="8">8 horas</option>
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Nombre del puesto">
        <input
          name="puesto_nombre"
          required={requerido}
          maxLength={120}
          placeholder="Lobby y acceso peatonal"
          className={control}
        />
      </Campo>
      <Campo etiqueta="Dirección del puesto" ayuda="opcional">
        <input name="puesto_direccion" maxLength={200} className={control} />
      </Campo>
      <label className="flex items-center gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-sm text-slate-300">
        <input
          type="checkbox"
          name="puesto_armado"
          className="h-5 w-5 accent-[#0788ff]"
        />
        Puesto con arma de fuego
      </label>
    </>
  );
}

export function FormularioCliente({
  empresas,
}: {
  empresas: { id: string; nombre: string }[];
}) {
  const [pestana, setPestana] = useState<"cliente" | "puesto">("cliente");
  const [estadoC, accionC, pendienteC] = useActionState(crearCliente, INICIAL);
  const [estadoP, accionP, pendienteP] = useActionState(agregarPuesto, INICIAL);
  const formC = useRef<HTMLFormElement>(null);
  const formP = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estadoC.tipo === "exito") formC.current?.reset();
  }, [estadoC]);
  useEffect(() => {
    if (estadoP.tipo === "exito") formP.current?.reset();
  }, [estadoP]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Alta de clientes y puestos"
        className="flex gap-2"
      >
        {(
          [
            ["cliente", "Nuevo cliente"],
            ["puesto", "Nuevo puesto"],
          ] as const
        ).map(([id, texto]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${
              pestana === id
                ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]"
                : "border-[#27425e] bg-[#041225] text-slate-400"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      {pestana === "cliente" ? (
        <form ref={formC} action={accionC} className="mt-4 space-y-4">
          <Campo etiqueta="Nombre del cliente">
            <input
              name="nombre"
              required
              maxLength={120}
              placeholder="Edificio Citimed"
              className={control}
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="RUC" ayuda="13 dígitos, opcional">
              <input
                name="ruc"
                inputMode="numeric"
                maxLength={13}
                className={control}
              />
            </Campo>
            <Campo etiqueta="Teléfono de contacto" ayuda="opcional">
              <input name="contacto_telefono" maxLength={40} className={control} />
            </Campo>
          </div>
          <Campo etiqueta="Dirección" ayuda="opcional">
            <input name="direccion" maxLength={200} className={control} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Persona de contacto" ayuda="opcional">
              <input name="contacto_nombre" maxLength={120} className={control} />
            </Campo>
            <Campo etiqueta="Correo de contacto" ayuda="opcional">
              <input
                name="contacto_correo"
                type="email"
                maxLength={120}
                className={control}
              />
            </Campo>
          </div>

          <fieldset className="rounded-xl border border-[#27425e] bg-[#041225]/60 p-4">
            <legend className="px-1 text-sm font-semibold text-[#65c8ff]">
              Primer puesto
            </legend>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              Un cliente sin puestos no se puede facturar ni asignar personal.
              Puedes dejarlo en blanco y agregarlo después desde la otra pestaña.
            </p>
            <div className="space-y-4">
              <CamposPuesto />
            </div>
          </fieldset>

          <Aviso estado={estadoC} />
          <button
            disabled={pendienteC}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pendienteC ? "Creando…" : "Crear cliente"}
          </button>
        </form>
      ) : (
        <form ref={formP} action={accionP} className="mt-4 space-y-4">
          <Campo etiqueta="Cliente">
            <select
              name="empresa_cliente_id"
              required
              defaultValue=""
              className={control}
            >
              <option value="" disabled>
                Selecciona un cliente
              </option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <CamposPuesto requerido />
          <Aviso estado={estadoP} />
          <button
            disabled={pendienteP || empresas.length === 0}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pendienteP ? "Agregando…" : "Agregar puesto"}
          </button>
        </form>
      )}
    </div>
  );
}
