"use client";

import { useEffect, useState } from "react";
import { Marca } from "@/app/componentes/marca";
import { IconoAlerta, IconoCiclo, IconoEscudoOk, IconoPersona } from "@/app/componentes/iconos";

const CLAVE_BIENVENIDA = "sotersa:bienvenida-completada-v1";

export function PantallaBienvenida() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const forzar = parametros.get("bienvenida") === "1";
    const omitir = parametros.get("pantalla") === "ingreso" || window.location.pathname === "/perfiles";
    if (omitir || (!forzar && localStorage.getItem(CLAVE_BIENVENIDA) === "completada")) {
      const ocultar = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(ocultar);
    }
  }, []);

  function completar() {
    localStorage.setItem(CLAVE_BIENVENIDA, "completada");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section aria-label="Bienvenida a SOTERSA" className="fixed inset-0 z-[900] overflow-y-auto bg-[#020b18]">
      <div className="mx-auto flex min-h-full w-full max-w-[540px] flex-col bg-[radial-gradient(circle_at_50%_24%,rgba(0,144,255,0.18),transparent_34%),linear-gradient(180deg,#020b18,#03152b_60%,#020b18)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex justify-center"><Marca tamano="panel" /></div>

        <div className="relative mx-auto mt-10 grid h-52 w-52 place-items-center rounded-full border border-[#0d66a7]/60 bg-[#041a31] shadow-[0_0_70px_rgba(0,132,255,0.14)]">
          <span className="absolute inset-5 rounded-full border border-dashed border-[#087ff0]/45" />
          <IconoEscudoOk className="h-24 w-24 text-[#0788ff]" />
          <span className="absolute -left-3 top-14 grid h-12 w-12 place-items-center rounded-xl border border-[#254967] bg-[#07172a] text-[#16bceb]"><IconoPersona className="h-6 w-6" /></span>
          <span className="absolute -right-3 top-14 grid h-12 w-12 place-items-center rounded-xl border border-[#254967] bg-[#07172a] text-[#16bceb]"><IconoCiclo className="h-6 w-6" /></span>
          <span className="absolute bottom-0 right-5 grid h-12 w-12 place-items-center rounded-xl border border-[#254967] bg-[#07172a] text-red-400"><IconoAlerta className="h-6 w-6" /></span>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0788ff]">Control operativo inteligente</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Seguridad en tiempo real</h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-400">Monitorea personal, rondas, cámaras y alertas desde un solo lugar.</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <Beneficio icono={<IconoPersona className="h-6 w-6" />} texto="Personal" />
          <Beneficio icono={<IconoCiclo className="h-6 w-6" />} texto="Rondas" />
          <Beneficio icono={<IconoAlerta className="h-6 w-6" />} texto="Alertas" />
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-10">
          <button type="button" onClick={completar} className="min-h-14 px-4 text-sm font-medium text-slate-400">Omitir</button>
          <div className="flex gap-2" aria-label="Paso 1 de 3"><span className="h-2 w-6 rounded-full bg-[#0788ff]" /><span className="h-2 w-2 rounded-full bg-slate-700" /><span className="h-2 w-2 rounded-full bg-slate-700" /></div>
          <button type="button" onClick={completar} className="boton-primario min-h-14 rounded-xl px-7 text-sm font-semibold text-white">Continuar</button>
        </div>
      </div>
    </section>
  );
}

function Beneficio({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#254967] bg-[#07172a]/85 px-2 py-4 text-sm text-slate-300"><span className="text-[#0788ff]">{icono}</span>{texto}</div>;
}
