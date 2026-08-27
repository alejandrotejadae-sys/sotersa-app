"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoAlerta,
  IconoCasa,
  IconoCiclo,
  IconoLibro,
  IconoPersona,
} from "./iconos";

/**
 * Navegacion inferior de la app del guardia.
 *
 * Los destinos que todavia no existen se muestran apagados y NO son enlaces.
 * Un guardia que toca algo y no pasa nada deja de confiar en la app entera.
 *
 * "Mensajes" del diseno no esta: no hay mensajeria construida ni tabla que la
 * respalde. En su lugar va "Protocolo", que si existe y ademas funciona sin
 * senal.
 */
const ENTRADAS = [
  { href: "/guardia", etiqueta: "Inicio", Icono: IconoCasa },
  { href: null, etiqueta: "Ronda", Icono: IconoCiclo },
  { href: null, etiqueta: "Reportar", Icono: IconoAlerta },
  { href: "/guardia/emergencia", etiqueta: "Protocolo", Icono: IconoLibro },
  { href: "/guardia/perfil", etiqueta: "Perfil", Icono: IconoPersona },
] as const;

export function NavInferior() {
  const ruta = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-borde/70 bg-[#020b18]/92 backdrop-blur-xl">
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {ENTRADAS.map(({ href, etiqueta, Icono }) => {
          const activo = href === ruta;
          const contenido = (
            <>
              <Icono className="h-6 w-6" />
              <span className="text-[0.68rem] font-medium">{etiqueta}</span>
            </>
          );
          const clases = `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 ${
            activo
              ? "text-azul-400"
              : href
                ? "text-gris-400"
                : "text-gris-600 opacity-45"
          }`;

          return (
            <li key={etiqueta} className="flex flex-1">
              {href ? (
                <Link
                  href={href}
                  aria-current={activo ? "page" : undefined}
                  className={clases}
                >
                  {contenido}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title="En construcción"
                  className={clases}
                >
                  {contenido}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
