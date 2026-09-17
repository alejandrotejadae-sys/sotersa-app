"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { activarPanico, type EstadoPanico } from "./acciones-panico";

const INICIAL: EstadoPanico = { tipo: "inicial", mensaje: "" };
const DURACION = 3000;

export function BotonPanico({ puestos }: { puestos: { id: string; codigo: string; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState(activarPanico, INICIAL);
  const [progreso, setProgreso] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const inicio = useRef(0);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const lat = useRef<HTMLInputElement>(null);
  const lng = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function cancelar() {
    if (intervalo.current) clearInterval(intervalo.current);
    intervalo.current = null;
    inicio.current = 0;
    if (!confirmando) setProgreso(0);
  }

  function comenzar() {
    if (pendiente || confirmando || puestos.length === 0 || intervalo.current) return;
    inicio.current = Date.now();
    setProgreso(1);
    intervalo.current = setInterval(() => {
      const valor = Math.min(100, ((Date.now() - inicio.current) / DURACION) * 100);
      setProgreso(valor);
      if (valor >= 100) {
        if (intervalo.current) clearInterval(intervalo.current);
        intervalo.current = null;
        navigator.vibrate?.([120, 60, 120]);
        setConfirmando(true);
      }
    }, 40);
  }

  function enviar() {
    if (!formulario.current || pendiente) return;
    const enviarFormulario = () => formulario.current?.requestSubmit();
    if (!navigator.geolocation) return enviarFormulario();
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        if (lat.current) lat.current.value = String(posicion.coords.latitude);
        if (lng.current) lng.current.value = String(posicion.coords.longitude);
        enviarFormulario();
      },
      enviarFormulario,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  }

  if (estado.tipo === "exito") {
    return (
      <section className="overflow-hidden rounded-2xl border border-red-500/45 bg-gradient-to-br from-red-950/70 via-[#2a0b14] to-[#120914] p-5 shadow-[0_0_40px_rgba(239,68,68,.12)] sm:p-6">
        <div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-500 text-2xl font-black text-white">!</span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Alerta activa</p><h2 className="mt-1 text-xl font-bold text-white">Central SOTERSA notificada</h2><p className="mt-2 text-sm leading-6 text-red-100/80">{estado.mensaje}</p></div></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href="tel:911" className="grid min-h-12 place-items-center rounded-xl bg-red-500 px-4 text-sm font-bold text-white">Llamar al 911</a><button type="button" onClick={() => router.refresh()} className="min-h-12 rounded-xl border border-red-400/35 bg-red-500/10 px-4 text-sm font-semibold text-red-100">Actualizar estado</button></div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-red-500/45 bg-gradient-to-br from-red-950/65 via-[#250b14] to-[#100914] p-5 shadow-[0_0_40px_rgba(239,68,68,.10)] sm:p-6">
      <form ref={formulario} action={accion}>
        <input ref={lat} type="hidden" name="lat" />
        <input ref={lng} type="hidden" name="lng" />
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-500 text-2xl font-black text-white shadow-lg shadow-red-950/40">!</span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Emergencias</p><h2 className="mt-1 text-2xl font-bold text-white">Botón de pánico</h2><p className="mt-2 max-w-xl text-sm leading-6 text-red-100/70">Mantén presionado durante 3 segundos para preparar una alerta prioritaria a la Central SOTERSA.</p><p className="mt-2 flex items-center gap-2 text-xs text-red-200/70"><span className="h-2 w-2 rounded-full bg-red-400" /> Central operativa disponible 24/7</p></div>
          </div>
          <label className="block min-w-64 text-xs font-medium text-red-100/80">Puesto de la emergencia
            <select name="puesto_id" required defaultValue={puestos.length === 1 ? puestos[0].id : ""} className="mt-2 min-h-12 w-full rounded-xl border border-red-400/30 bg-[#160b13] px-3 text-sm text-white outline-none focus:border-red-400">
              {puestos.length !== 1 && <option value="" disabled>Selecciona el puesto</option>}
              {puestos.map((puesto) => <option key={puesto.id} value={puesto.id}>{puesto.codigo} · {puesto.nombre}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <button
            type="button"
            disabled={pendiente || puestos.length === 0}
            onPointerDown={comenzar}
            onPointerUp={cancelar}
            onPointerCancel={cancelar}
            onPointerLeave={cancelar}
            onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); comenzar(); } }}
            onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") cancelar(); }}
            className="relative grid h-28 w-28 select-none place-items-center rounded-full border border-red-400/50 bg-[#10080d] text-center shadow-inner touch-none disabled:opacity-40"
            style={{ background: `conic-gradient(#ef4444 ${progreso * 3.6}deg, #2b1119 0deg)` }}
            aria-label="Mantén presionado tres segundos para activar el botón de pánico"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-black text-white shadow-lg shadow-red-950/60">{progreso ? `${Math.ceil((DURACION * (1 - progreso / 100)) / 1000)}s` : "SOS"}</span>
          </button>
          <div><p className="text-base font-bold text-white">{progreso ? (progreso >= 100 ? "Listo para confirmar" : "No sueltes…") : "MANTENER PRESIONADO"}</p><p className="mt-1 text-sm text-red-100/65">La alerta no se enviará hasta que completes los 3 segundos y confirmes.</p></div>
        </div>

        {confirmando && (
          <div role="alertdialog" aria-label="Confirmar alerta de pánico" className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 p-4">
            <p className="font-bold text-white">¿Confirmas que existe una emergencia?</p><p className="mt-1 text-sm leading-6 text-red-100/75">Se enviará una alerta prioritaria con el puesto seleccionado y, si lo autorizas, tu ubicación actual.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" onClick={enviar} disabled={pendiente} className="min-h-12 rounded-xl bg-red-500 px-4 text-sm font-bold text-white shadow-lg shadow-red-950/40 disabled:opacity-50">{pendiente ? "Enviando alerta…" : "Sí, enviar alerta ahora"}</button><button type="button" onClick={() => { setConfirmando(false); setProgreso(0); }} disabled={pendiente} className="min-h-12 rounded-xl border border-red-300/25 px-4 text-sm font-semibold text-red-100">Cancelar</button></div>
          </div>
        )}

        {puestos.length === 0 && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">No hay puestos activos vinculados a esta cuenta. Contacta a SOTERSA.</p>}
        {estado.tipo === "error" && <p className="mt-4 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{estado.mensaje}</p>}
      </form>
      <p className="mt-4 border-t border-red-300/15 pt-3 text-xs leading-5 text-red-100/55">Si existe peligro inmediato para personas, llama primero al 911. Este botón complementa la atención pública de emergencias.</p>
    </section>
  );
}
