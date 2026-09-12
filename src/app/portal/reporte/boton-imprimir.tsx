"use client";

export function BotonImprimir() {
  return <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center rounded-xl border border-azul-500/40 bg-azul-500/10 px-4 text-sm font-semibold text-azul-300">Guardar PDF</button>;
}
