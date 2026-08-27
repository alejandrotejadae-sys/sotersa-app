"use client";

import { useEffect, useState } from "react";

/**
 * Indicador de conexion REAL.
 *
 * El render mostraba "En línea" fijo. Un rotulo que siempre dice lo mismo no
 * informa nada: en un subsuelo el guardia veria "En línea" sin tenerla, y
 * confiaria en que su reporte salio. Aqui se lee del navegador.
 *
 * navigator.onLine solo garantiza que hay interfaz de red; puede decir que si
 * y no haber salida a internet. Sirve para el caso que importa — el celular
 * sin senal — y no promete mas de lo que sabe.
 */
export function EstadoConexion() {
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    const leer = () => setEnLinea(navigator.onLine);
    leer();
    window.addEventListener("online", leer);
    window.addEventListener("offline", leer);
    return () => {
      window.removeEventListener("online", leer);
      window.removeEventListener("offline", leer);
    };
  }, []);

  return (
    <span
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        enLinea
          ? "border-normal/40 bg-normal/10 text-green-300"
          : "border-novedad/50 bg-novedad/10 text-amber-200"
      }`}
    >
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${enLinea ? "bg-normal" : "bg-novedad"}`}
      />
      {enLinea ? "En línea" : "Sin señal"}
    </span>
  );
}
