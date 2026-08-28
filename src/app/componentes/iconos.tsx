/**
 * Iconos de interfaz, en linea y sin libreria externa.
 *
 * Trazo de 1.75 y esquinas redondeadas: a 28px en un telefono, un trazo mas
 * fino desaparece bajo el sol y uno mas grueso se empasta.
 *
 * Son iconos genericos de interfaz. El emblema de SOTERSA no se dibuja aqui:
 * es una imagen real, en public/logo-sotersa.png.
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

export function IconoEscudoOk({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3 4.5 6v5.5c0 4.4 3 8 7.5 9.5 4.5-1.5 7.5-5.1 7.5-9.5V6L12 3Z" />
      <path d="m8.8 11.8 2.2 2.2 4.2-4.2" />
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

export function IconoCiclo({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4.2 12a7.8 7.8 0 0 1 13.3-5.5L20 9" />
      <path d="M20 4.5V9h-4.5" />
      <path d="M19.8 12a7.8 7.8 0 0 1-13.3 5.5L4 15" />
      <path d="M4 19.5V15h4.5" />
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

export function IconoFlecha({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function IconoQR({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 8.5V5.5A1.5 1.5 0 0 1 5.5 4h3" />
      <path d="M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3" />
      <path d="M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3" />
      <path d="M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </svg>
  );
}

export function IconoTurno({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.2v3.4" />
      <path d="M16 3.2v3.4" />
      <path d="M12 12.6v2.6l1.8 1.1" />
    </svg>
  );
}

export function IconoTelefono({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M6.2 3.8h3l1.5 3.7-1.9 1.2a11 11 0 0 0 5.5 5.5l1.2-1.9 3.7 1.5v3a1.7 1.7 0 0 1-1.9 1.7C9.9 17.8 6.2 14.1 4.5 5.7a1.7 1.7 0 0 1 1.7-1.9Z" />
    </svg>
  );
}

export function IconoLibro({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5.2A1.7 1.7 0 0 1 5.7 3.5H11v16H5.7A1.7 1.7 0 0 1 4 17.8Z" />
      <path d="M20 5.2a1.7 1.7 0 0 0-1.7-1.7H13v16h5.3a1.7 1.7 0 0 0 1.7-1.7Z" />
    </svg>
  );
}

export function IconoCasa({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 10.4 12 4l8 6.4V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function IconoPersona({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
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

export function IconoMensaje({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9A1.5 1.5 0 0 1 19 16.5H10L5.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5Z" />
      <path d="M8 9h8M8 12.5h5" />
    </svg>
  );
}

export function IconoHuella({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M8.3 9.1a4.5 4.5 0 0 1 7.4 3.4c0 3.2-.8 5.8-2.4 7.8" />
      <path d="M5.6 10.5A7 7 0 0 1 19 13c0 3.4-.7 6.1-2.2 8" />
      <path d="M4.1 14.2c.2-1.6.4-2.7.7-3.5" />
      <path d="M8.1 13.2c0 3.1-.5 5.3-1.7 6.9" />
      <path d="M11.9 12.3c.1 4.1-.5 7.1-1.7 9" />
      <path d="M4.5 17.5c.7-1.3 1-2.8 1-4.5" />
    </svg>
  );
}
