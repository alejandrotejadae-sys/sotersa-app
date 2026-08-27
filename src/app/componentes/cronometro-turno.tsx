"use client";

import { useEffect, useState } from "react";

/**
 * Tiempo transcurrido desde la apertura del turno.
 *
 * Se calcula en el navegador y se actualiza cada 30 s. No se guarda: es una
 * resta entre la hora de apertura, que si esta registrada, y el ahora.
 */
export function CronometroTurno({ desde }: { desde: string }) {
  const [texto, setTexto] = useState("—");

  useEffect(() => {
    const calcular = () => {
      const ms = Date.now() - new Date(desde).getTime();
      if (ms < 0) return setTexto("00h 00m");
      const min = Math.floor(ms / 60000);
      const h = Math.floor(min / 60);
      setTexto(
        `${String(h).padStart(2, "0")}h ${String(min % 60).padStart(2, "0")}m`,
      );
    };
    calcular();
    const id = setInterval(calcular, 30000);
    return () => clearInterval(id);
  }, [desde]);

  return <span suppressHydrationWarning>{texto}</span>;
}
