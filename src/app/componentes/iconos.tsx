/**
 * Iconos de interfaz, en linea y sin libreria externa.
 *
 * Trazo de 1.75 y esquinas redondeadas: a 28px en un telefono, un trazo mas
 * fino desaparece bajo el sol y uno mas grueso se empasta.
 *
 * Son iconos genericos de interfaz. El emblema de SOTERSA no se dibuja aqui.
 */

type Props = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function IconoEscudo({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3 4.5 6v5.5c0 4.4 3 8 7.5 9.5 4.5-1.5 7.5-5.1 7.5-9.5V6L12 3Z" />
    </svg>
  );
}

export function IconoAlerta({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.3h.01" />
    </svg>
  );
}

export function IconoRonda({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21c4.4-4.6 6.6-8 6.6-10.4A6.6 6.6 0 0 0 5.4 10.6C5.4 13 7.6 16.4 12 21Z" />
    </svg>
  );
}

export function IconoLista({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M8.5 4h7a1.5 1.5 0 0 1 1.5 1.5V6a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 6v-.5A1.5 1.5 0 0 1 8.5 4Z" />
      <path d="M17 6h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2" />
      <path d="m8.5 12.5 1.6 1.6 3.4-3.4" />
      <path d="M8.5 17.5h7" />
    </svg>
  );
}

export function IconoSalir({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M15 17v1.5A1.5 1.5 0 0 1 13.5 20h-7A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M19 12H9.5" />
      <path d="m16.5 9 2.9 3-2.9 3" />
    </svg>
  );
}

export function IconoFlecha({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}
