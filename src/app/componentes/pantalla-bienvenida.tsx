"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CLAVE_BIENVENIDA = "sotersa:bienvenida-completada-v1";

/** Bienvenida aprobada en la hoja 3 del PDF de renders. */
export function PantallaBienvenida() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const forzar = parametros.get("bienvenida") === "1";
    const revisarIngreso = parametros.get("pantalla") === "ingreso";
    if (revisarIngreso || (!forzar && localStorage.getItem(CLAVE_BIENVENIDA) === "completada")) {
      const ocultarCompletada = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(ocultarCompletada);
    }
  }, []);

  function completar() {
    localStorage.setItem(CLAVE_BIENVENIDA, "completada");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section
      aria-label="Bienvenida a SOTERSA"
      className="fixed inset-0 z-[900] overflow-hidden bg-[#020b18]"
    >
      <div className="relative h-full w-full overflow-hidden md:mx-auto md:aspect-[941/1672] md:w-auto">
        <Image
          src="/pantalla-bienvenida-sotersa.webp"
          alt="SOTERSA: seguridad en tiempo real. Monitorea personal, rondas, cámaras y alertas desde un solo lugar."
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-cover object-center md:object-contain"
        />

        <button
          type="button"
          onClick={completar}
          aria-label="Omitir presentación"
          className="absolute bottom-[2.5%] left-[6%] h-[10%] w-[36%] rounded-2xl bg-transparent"
        />
        <button
          type="button"
          onClick={completar}
          aria-label="Continuar al ingreso"
          className="absolute bottom-[2.5%] right-[3%] h-[10%] w-[48%] rounded-3xl bg-transparent"
        />
      </div>
    </section>
  );
}
