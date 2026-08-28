"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CLAVE_SESION = "sotersa:pantalla-apertura-v1";

/**
 * Apertura institucional aprobada en la hoja 2 del PDF de renders.
 *
 * Vive en el layout global para que también aparezca cuando una instalación
 * guardada abre directamente /guardia, /supervisor, /admin o /portal. Se
 * muestra una vez por sesión; `?apertura=1` permite revisarla nuevamente.
 */
export function PantallaApertura() {
  const [visible, setVisible] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  const [imagenLista, setImagenLista] = useState(false);

  useEffect(() => {
    const forzar = new URLSearchParams(window.location.search).get("apertura") === "1";

    if (!forzar && sessionStorage.getItem(CLAVE_SESION) === "vista") {
      const ocultarVisto = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(ocultarVisto);
    }

  }, []);

  useEffect(() => {
    if (!imagenLista) return;

    const inicioSalida = window.setTimeout(() => setSaliendo(true), 2400);
    const ocultar = window.setTimeout(() => {
      sessionStorage.setItem(CLAVE_SESION, "vista");
      setVisible(false);
    }, 2800);

    return () => {
      window.clearTimeout(inicioSalida);
      window.clearTimeout(ocultar);
    };
  }, [imagenLista]);

  if (!visible) return null;

  return (
    <div
      role="img"
      aria-label="SOTERSA Seguridad Estratégica. Tecnología que protege. Quito."
      className={`fixed inset-0 z-[1000] bg-[#020b18] transition-opacity duration-400 ${
        saliendo ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <Image
        src="/pantalla-apertura-sotersa.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={100}
        unoptimized
        onLoad={() => setImagenLista(true)}
        className={`object-cover object-center transition-opacity duration-200 ${
          imagenLista ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
