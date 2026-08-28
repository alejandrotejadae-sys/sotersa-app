import type { ReactNode } from "react";

export function TarjetaMetrica({
  titulo,
  valor,
  detalle,
  icono,
  tono = "azul",
}: {
  titulo: string;
  valor: string | number;
  detalle: string;
  icono: ReactNode;
  tono?: "azul" | "normal" | "novedad" | "emergencia";
}) {
  const color = {
    azul: "text-azul-400",
    normal: "text-green-300",
    novedad: "text-amber-300",
    emergencia: "text-red-300",
  }[tono];

  return (
    <article className="tarjeta min-h-36 p-4 sm:p-5">
      <div className={`h-7 w-7 ${color}`}>{icono}</div>
      <p className="mt-4 text-sm text-gris-400">{titulo}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${color}`}>{valor}</p>
      <p className="mt-1 text-xs text-gris-500">{detalle}</p>
    </article>
  );
}
