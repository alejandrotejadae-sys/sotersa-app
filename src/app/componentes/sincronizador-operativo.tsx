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
