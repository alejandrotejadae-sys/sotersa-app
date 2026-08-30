"use client";

export function BotonImprimirQr({ deshabilitado = false }: { deshabilitado?: boolean }) {
  return <button type="button" disabled={deshabilitado} onClick={() => window.print()} className="boton-primario min-h-11 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50">Imprimir códigos QR</button>;
}
