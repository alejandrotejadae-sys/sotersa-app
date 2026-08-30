"use client";

import { useEffect } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

const CLAVE = "sotersa-ultima-alerta-v1";

/** Notifica nuevas emergencias mientras la app o PWA permanece activa. */
export function NotificadorOperativo() {
  useEffect(() => {
    let cancelado = false;
    let temporizador: number | null = null;
    const supabase = crearClienteNavegador();
    async function revisar(inicial = false) {
      if (cancelado || document.visibilityState === "hidden") return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
      if (!perfil || !["admin", "supervisor"].includes(perfil.rol)) return;
      const ultima = localStorage.getItem(CLAVE);
      const { data } = await supabase.from("novedades").select("id,tipo,descripcion,hora_captura,puestos(codigo,nombre)").eq("severidad", "emergencia").neq("estado", "cerrada").order("hora_captura", { ascending: false }).limit(5);
      const nuevas = (data ?? []).filter((fila) => ultima && new Date(fila.hora_captura) > new Date(ultima));
      const masReciente = data?.[0]?.hora_captura;
      if (masReciente) localStorage.setItem(CLAVE, masReciente);
      if (!inicial && Notification.permission === "granted") nuevas.reverse().forEach((alerta) => {
        const puesto = Array.isArray(alerta.puestos) ? alerta.puestos[0] : alerta.puestos;
        new Notification(`SOTERSA · ${alerta.tipo}`, { body: `${puesto?.codigo ?? "Operación"}: ${alerta.descripcion.slice(0, 120)}`, icon: "/icono-lobo-sotersa-192.png", tag: alerta.id });
      });
    }
    void revisar(true);
    temporizador = window.setInterval(() => void revisar(false), 30000);
    const alVolver = () => void revisar(false);
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("online", alVolver);
    return () => { cancelado = true; if (temporizador) window.clearInterval(temporizador); document.removeEventListener("visibilitychange", alVolver); window.removeEventListener("online", alVolver); };
  }, []);
  return null;
}
