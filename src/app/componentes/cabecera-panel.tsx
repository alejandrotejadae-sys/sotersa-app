import { Marca } from "./marca";
import { BotonSalirIcono } from "./boton-salir-icono";

export function CabeceraPanel({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return <header className="flex items-center justify-between gap-4 border-b border-borde pb-5">
    <div><Marca /><p className="mt-3 text-xs font-semibold uppercase tracking-[.2em] text-azul-300">{titulo}</p><p className="mt-1 text-sm text-gris-400">{subtitulo}</p></div>
    <BotonSalirIcono rutaRetorno="/acceso" />
  </header>;
}
