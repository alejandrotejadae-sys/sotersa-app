import Image from "next/image";
import { MARCA } from "@/lib/marca";

/**
 * Marca: el emblema real de SOTERSA mas la denominacion.
 *
 * El PNG salio de los renders aprobados, recortado con transparencia. No es
 * un dibujo mio: reproducir a mano el simbolo de una marca es falsificarlo.
 */
export function Marca({ tamano = "normal" }: { tamano?: "normal" | "panel" | "grande" }) {
  const grande = tamano === "grande";
  const panel = tamano === "panel";
  const lado = grande ? 92 : panel ? 46 : 34;

  return (
    <div className={`flex items-center ${grande ? "flex-col gap-3" : "gap-2.5"}`}>
      <Image
        src="/logo-sotersa.png"
        alt=""
        width={lado}
        height={Math.round(lado * 1.186)}
        priority
        className="shrink-0"
      />
      <div className="flex flex-col leading-none">
        <span
          className={`bg-gradient-to-r from-azul-500 via-azul-400 to-azul-300 bg-clip-text font-bold tracking-[0.14em] text-transparent ${
            grande ? "text-3xl" : panel ? "text-xl" : "text-base"
          }`}
        >
          {MARCA.nombre}
        </span>
        <span
          className={`font-medium uppercase text-gris-400 ${
            grande
              ? "mt-1.5 text-[0.6rem] tracking-[0.3em]"
              : panel
                ? "mt-1 text-[0.48rem] tracking-[0.24em]"
              : "mt-1 text-[0.42rem] tracking-[0.22em]"
          }`}
        >
          {MARCA.tagline}
        </span>
      </div>
    </div>
  );
}

/**
 * Punto de estado con latido. El latido solo cuando algo esta activo ahora
 * mismo: si todo parpadea, el parpadeo deja de significar nada.
 */
export function Pulso({
  tono = "normal",
}: {
  tono?: "normal" | "novedad" | "emergencia";
}) {
  const color =
    tono === "normal"
      ? "bg-normal"
      : tono === "novedad"
        ? "bg-novedad"
        : "bg-emergencia";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${color}`}
      />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}
