"use client";

import { useActionState } from "react";
import { aceptarAviso, type EstadoConsentimiento } from "./acciones";

const INICIAL: EstadoConsentimiento = { tipo: "inicial", mensaje: "" };

export function FormularioConsentimiento() {
  const [estado, accion, pendiente] = useActionState(aceptarAviso, INICIAL);

  return (
    <form action={accion} className="mt-6 space-y-4">
      {/* Casilla sin marcar por defecto y a propósito: un consentimiento
          premarcado no es un consentimiento. */}
      <label className="flex items-start gap-3 rounded-2xl border border-[#27425e] bg-[#041225] px-4 py-4 text-sm leading-relaxed text-slate-200">
        <input
          type="checkbox"
          name="confirmo"
          className="mt-0.5 h-6 w-6 shrink-0 accent-[#0788ff]"
        />
        <span>
          He leído esta información y <strong>autorizo</strong> a SOTER CIA.
          LTDA. a tratar mis datos personales para operar el servicio de
          seguridad, en los términos descritos arriba.
        </span>
      </label>

      {estado.mensaje && (
        <p
          aria-live="polite"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {estado.mensaje}
        </p>
      )}

      <button
        disabled={pendiente}
        className="boton-campo w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-base font-semibold text-white disabled:opacity-50"
      >
        {pendiente ? "Registrando…" : "Autorizo y continúo"}
      </button>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Si no autorizas, no podrás usar la aplicación. Habla con operaciones
        para ver qué alternativas hay.
      </p>
    </form>
  );
}
