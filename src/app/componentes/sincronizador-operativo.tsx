"use client";

import { useCallback, useEffect, useState } from "react";
import { EVENTO_COLA, listarOperaciones, quitarOperacion } from "@/lib/cola-operativa";

export function SincronizadorOperativo() {
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const sincronizar = useCallback(async () => {
    const cola = await listarOperaciones().catch(() => []);
    setPendientes(cola.length);
    if (!navigator.onLine || cola.length === 0) return;
    setSincronizando(true);
    for (const item of cola) {
      try {
        const cuerpo = new FormData();
        cuerpo.set("operacion", JSON.stringify({ id: item.id, tipo: item.tipo, creadoEn: item.creadoEn, datos: item.datos }));
        if (item.foto) cuerpo.set("foto", item.foto, "evidencia-offline.jpg");
        const respuesta = await fetch("/api/sincronizar", { method: "POST", body: cuerpo });
        if (respuesta.ok || respuesta.status === 409) await quitarOperacion(item.id);
        if (!respuesta.ok && respuesta.status >= 500) break;
      } catch { break; }
    }
    const restantes = await listarOperaciones().catch(() => []);
    setPendientes(restantes.length);
    setSincronizando(false);
  }, []);

  useEffect(() => {
    const ejecutar = () => { void sincronizar(); };
    ejecutar();
    window.addEventListener("online", ejecutar);
    window.addEventListener(EVENTO_COLA, ejecutar);
    return () => { window.removeEventListener("online", ejecutar); window.removeEventListener(EVENTO_COLA, ejecutar); };
  }, [sincronizar]);

  if (pendientes === 0) return null;
  return <button type="button" onClick={() => void sincronizar()} className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] right-4 z-50 rounded-full border border-amber-400/40 bg-[#07172a] px-4 py-2 text-xs font-semibold text-amber-200 shadow-2xl">{sincronizando ? "Sincronizando…" : `${pendientes} registro${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`}</button>;
}

/** Estado visible y honesto de la cola local para la pantalla del agente. */
export function EstadoSincronizacion() {
  const [pendientes, setPendientes] = useState(0);
  const [enLinea, setEnLinea] = useState(true);
  const [comprobado, setComprobado] = useState<string | null>(null);

  const leer = useCallback(async () => {
    const cola = await listarOperaciones().catch(() => []);
    setPendientes(cola.length);
    setEnLinea(navigator.onLine);
    setComprobado(new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
  }, []);

  useEffect(() => {
    const actualizar = () => { void leer(); };
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    window.addEventListener(EVENTO_COLA, actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
      window.removeEventListener(EVENTO_COLA, actualizar);
    };
  }, [leer]);

  const correcto = enLinea && pendientes === 0;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${correcto ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300" : "border-amber-400/35 bg-amber-400/[0.08] text-amber-200"}`}>
      <span className="flex min-w-0 items-center gap-2 font-semibold">
        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${correcto ? "bg-emerald-400" : "bg-amber-300"}`} />
        {pendientes ? `${pendientes} registro${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}` : enLinea ? "Todo sincronizado" : "Sin señal · guardado local"}
      </span>
      {comprobado && <span className="shrink-0 text-[0.68rem] text-gris-500">Comprobado {comprobado}</span>}
    </div>
  );
}
