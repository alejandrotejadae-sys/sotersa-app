"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoAlerta,
  IconoCasa,
  IconoCiclo,
  IconoTelefono,
  IconoPersona,
} from "./iconos";

/**
 * Navegacion inferior de la app del guardia.
 *
 * Contactos vuelve siempre al bloque real de supervisor y central. No se
 * muestra una mensajería ficticia mientras esa función no exista.
 */
const ENTRADAS = [
  { href: "/guardia", etiqueta: "Inicio", Icono: IconoCasa },
  { href: "/guardia/ronda", etiqueta: "Ronda", Icono: IconoCiclo },
  { href: "/guardia/reportar", etiqueta: "Reportar", Icono: IconoAlerta },
  { href: "/guardia#contactos", etiqueta: "Contactos", Icono: IconoTelefono },
  { href: "/mi-perfil", etiqueta: "Perfil", Icono: IconoPersona },
] as const;

export function NavInferior() {
  const ruta = usePathname();

  return (
    <nav aria-label="Navegación móvil" className="sticky bottom-0 z-20 border-t border-borde/70 bg-[#020b18]/92 backdrop-blur-xl md:hidden">
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {ENTRADAS.map(({ href, etiqueta, Icono }) => {
          const activo = !href.includes("#") && href === ruta;
          const contenido = (
            <>
              <Icono className="h-7 w-7" />
              <span className="text-[0.72rem] font-medium">{etiqueta}</span>
            </>
          );
          const clases = `flex min-h-[66px] flex-1 flex-col items-center justify-center gap-1.5 py-2 ${
            activo
              ? "text-azul-400"
              : "text-gris-400"
          }`;

          return (
            <li key={etiqueta} className="flex flex-1">
              <Link href={href} aria-current={activo ? "page" : undefined} className={clases}>
                {contenido}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Las mismas secciones, como pestañas, para pantalla grande.
 *
 * En escritorio una barra pegada abajo se ve fuera de lugar: ahí la navegación
 * va arriba, junto a la marca. En el teléfono es al revés — el pulgar llega
 * abajo, no arriba. Por eso son dos formas del mismo menú y nunca se ven las
 * dos a la vez.
 */
export function NavEscritorio() {
  const ruta = usePathname();
  return (
    <nav aria-label="Navegación principal" className="hidden gap-1 md:flex">
      {ENTRADAS.map(({ href, etiqueta }) => {
        const activo = !href.includes("#") && href === ruta;
        const clases = `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
          activo
            ? "bg-azul-500/15 text-azul-300"
            : "text-gris-400 hover:bg-white/5 hover:text-white"
        }`;
        return <Link key={etiqueta} href={href} aria-current={activo ? "page" : undefined} className={clases}>{etiqueta}</Link>;
      })}
    </nav>
  );
}
