"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoAlerta,
  IconoCasa,
  IconoCiclo,
  IconoMensaje,
  IconoPersona,
} from "./iconos";

/**
 * Navegacion inferior de la app del guardia.
 *
 * Los destinos que todavia no existen se muestran apagados y NO son enlaces.
 * Un guardia que toca algo y no pasa nada deja de confiar en la app entera.
 *
 * "Mensajes" todavía no tiene destino funcional, pero se conserva porque es
 * parte de la navegación aprobada. Se muestra desactivado sin engañar al usuario.
 */
const ENTRADAS = [
  { href: "/guardia", etiqueta: "Inicio", Icono: IconoCasa },
  { href: "/guardia/ronda", etiqueta: "Ronda", Icono: IconoCiclo },
  { href: "/guardia/reportar", etiqueta: "Reportar", Icono: IconoAlerta },
  { href: null, etiqueta: "Mensajes", Icono: IconoMensaje },
  { href: "/mi-perfil", etiqueta: "Perfil", Icono: IconoPersona },
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
              <Icono className="h-7 w-7" />
              <span className="text-[0.72rem] font-medium">{etiqueta}</span>
            </>
          );
          const clases = `flex min-h-[66px] flex-1 flex-col items-center justify-center gap-1.5 py-2 ${
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
