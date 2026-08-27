"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { CHECKLIST_APERTURA } from "@/lib/protocolos";

/**
 * Apertura de turno. Sale literal de Normas de la Garita, seccion 03:
 *   "Verifica al iniciar el turno: radio, camaras, linterna y bitacora."
 *
 * Un equipo marcado como faltante NO impide abrir el turno. Al contrario:
 * abrir dejando constancia de que la linterna no esta es exactamente lo que
 * se quiere. Si el sistema bloqueara, el guardia marcaria todo en verde para
 * poder trabajar, y el registro perderia todo su valor.
 */
export default function FormularioApertura({ turnoId }: { turnoId: string }) {
  const router = useRouter();
  const [equipos, setEquipos] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_APERTURA.map((c) => [c.clave, true])),
  );
  const [estadoPuesto, setEstadoPuesto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const faltantes = CHECKLIST_APERTURA.filter((c) => !equipos[c.clave]);

  async function abrir() {
    setError(null);
    setGuardando(true);

    const supabase = crearClienteNavegador();
    // La hora de captura la pone el dispositivo, no el servidor: es el
    // momento real en que el guardia abrio el puesto.
    const { error: err } = await supabase.from("aperturas_turno").insert({
      turno_id: turnoId,
      hora_captura: new Date().toISOString(),
      checklist: equipos,
      estado_puesto: estadoPuesto || null,
      observacion: observacion || null,
    });

    setGuardando(false);

    if (err) {
      setError(
        err.code === "23505"
          ? "Este turno ya fue abierto."
          : `No se pudo guardar: ${err.message}`,
      );
      return;
    }

    router.push("/guardia");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gris-500">
          Verificación de equipo
        </h2>
        <p className="-mt-1 mb-1 text-xs text-gris-500">
          Toca para cambiar el estado de cada equipo.
        </p>
        {CHECKLIST_APERTURA.map((c) => {
          const presente = equipos[c.clave];
          return (
            <button
              key={c.clave}
              type="button"
              aria-pressed={presente}
              onClick={() =>
                setEquipos((e) => ({ ...e, [c.clave]: !e[c.clave] }))
              }
              className={`boton-campo flex items-center gap-3.5 rounded-xl border px-4 text-left transition active:scale-[0.99] ${
                presente
                  ? "border-normal/40 bg-normal/10"
                  : "border-novedad/50 bg-novedad/10"
              }`}
            >
              <span
                aria-hidden
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                  presente
                    ? "bg-normal/25 text-green-300"
                    : "bg-novedad/25 text-azul-200"
                }`}
              >
                {presente ? "✓" : "!"}
              </span>
              <span className="flex-1 text-lg font-medium text-white">
                {c.etiqueta}
              </span>
              <span
                className={`text-sm font-semibold ${
                  presente ? "text-green-300" : "text-azul-200"
                }`}
              >
                {presente ? "Conforme" : "Falta"}
              </span>
            </button>
          );
        })}
      </section>

      {faltantes.length > 0 && (
        <p className="rounded-xl border border-novedad/40 bg-novedad/10 px-4 py-3 text-sm text-azul-100">
          Vas a abrir el turno reportando {faltantes.length}{" "}
          {faltantes.length === 1 ? "novedad" : "novedades"} de equipo. Queda
          registrado con tu nombre y la hora — es lo correcto, no un problema.
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gris-300">
          ¿Cómo recibes el puesto?
        </span>
        <input
          type="text"
          value={estadoPuesto}
          onChange={(e) => setEstadoPuesto(e.target.value)}
          placeholder="Limpio y ordenado"
          className="boton-campo rounded-xl border border-gris-700 bg-gris-900 px-4 text-white outline-none focus:border-azul-500"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gris-300">
          Observación <span className="text-gris-500">(opcional)</span>
        </span>
        <textarea
          rows={3}
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="rounded-xl border border-gris-700 bg-gris-900 px-4 py-3 text-white outline-none focus:border-azul-500"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-emergencia/15 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={abrir}
        disabled={guardando}
        className="boton-campo rounded-xl bg-gradient-to-r from-azul-600 to-azul-500 text-lg font-semibold text-white shadow-lg shadow-azul-900/40 transition active:scale-[0.99] active:from-azul-700 active:to-azul-600 disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Abrir turno"}
      </button>
    </div>
  );
}
