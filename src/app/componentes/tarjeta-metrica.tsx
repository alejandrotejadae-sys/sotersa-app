export function TarjetaMetrica({ etiqueta, valor, detalle }: { etiqueta: string; valor: string | number; detalle?: string }) {
  return <article className="tarjeta min-w-0 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gris-400">{etiqueta}</p><p className="mt-2 text-3xl font-bold text-white">{valor}</p>{detalle && <p className="mt-1 text-xs text-azul-300">{detalle}</p>}</article>;
}
