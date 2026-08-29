"use client";

import { useEffect, useState } from "react";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk } from "@/app/componentes/iconos";

const CLAVE_SESION = "sotersa:pantalla-apertura-v1";

export function PantallaApertura() {
  const [visible, setVisible] = useState(true);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const forzar = parametros.get("apertura") === "1";
    const omitir = parametros.get("pantalla") === "ingreso" || window.location.pathname === "/perfiles";

    if (omitir || (!forzar && sessionStorage.getItem(CLAVE_SESION) === "vista")) {
      const ocultar = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(ocultar);
    }

    const duracion = forzar ? 8000 : 2200;
    const iniciarSalida = window.setTimeout(() => setSaliendo(true), duracion);
    const ocultar = window.setTimeout(() => {
      sessionStorage.setItem(CLAVE_SESION, "vista");
      setVisible(false);
    }, duracion + 400);

    return () => {
      window.clearTimeout(iniciarSalida);
      window.clearTimeout(ocultar);
    };
  }, []);

  if (!visible) return null;

  return (
    <section aria-label="Apertura de SOTERSA" className={`fixed inset-0 z-[1000] overflow-hidden bg-[#020b18] transition-opacity duration-400 ${saliendo ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_33%,rgba(0,160,255,0.22),transparent_30%),linear-gradient(180deg,#020b18,#03152b_58%,#020b18)]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] opacity-35 [background-image:linear-gradient(rgba(12,92,149,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(12,92,149,0.35)_1px,transparent_1px)] [background-size:28px_28px] [transform:perspective(420px)_rotateX(58deg)_scale(1.45)] [transform-origin:bottom]" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="animate-[pulse_2.4s_ease-in-out_infinite] drop-shadow-[0_0_35px_rgba(0,174,255,0.28)]">
          <Marca tamano="grande" />
        </div>
        <div className="mt-12 flex items-center gap-3 text-[#18bff0]">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#18bff0]" />
          <IconoEscudoOk className="h-6 w-6" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#18bff0]" />
        </div>
        <p className="mt-5 text-xl font-medium tracking-wide text-white">Tecnología que protege</p>
        <p className="mt-2 text-sm tracking-[0.2em] text-slate-500">QUITO · ECUADOR</p>
      </div>
    </section>
  );
}
