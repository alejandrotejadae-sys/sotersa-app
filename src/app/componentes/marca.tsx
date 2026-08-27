import { MARCA } from "@/lib/marca";

/**
 * Marca denominativa.
 *
 * El degradado va de azul profundo a cian, que es exactamente el del logo
 * oficial. No dibujo el emblema del lobo: reproducir a mano el simbolo de una
 * marca es una forma de falsificarlo. Cuando el PNG en alta este en
 * public/logo-sotersa.png, este componente lo usa en lugar del texto.
 */
export function Marca({ tamano = "normal" }: { tamano?: "normal" | "grande" }) {
  const grande = tamano === "grande";

  return (
    <div className="flex flex-col">
      <span
        className={`bg-gradient-to-r from-azul-800 via-azul-500 to-azul-300 bg-clip-text font-bold tracking-tight text-transparent ${
          grande ? "text-4xl" : "text-xl"
        }`}
      >
        {MARCA.nombre}
      </span>
      <span
        className={`font-medium uppercase text-gris-400 ${
          grande
            ? "text-[0.7rem] tracking-[0.35em]"
            : "text-[0.55rem] tracking-[0.25em]"
        }`}
      >
        {MARCA.tagline}
      </span>
    </div>
  );
}

/** Barra superior comun a las pantallas del guardia. */
export function BarraSuperior({ derecha }: { derecha?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-borde/60 bg-gris-900/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
        <Marca />
        {derecha}
      </div>
    </header>
  );
}

/**
 * Punto de estado con latido. El latido solo cuando algo esta activo ahora
 * mismo: si todo parpadea, el parpadeo deja de significar nada.
 */
export function Pulso({ tono = "normal" }: { tono?: "normal" | "novedad" }) {
  const color = tono === "normal" ? "bg-normal" : "bg-novedad";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${color}`}
      />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}
