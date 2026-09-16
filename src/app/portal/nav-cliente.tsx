"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoCasa, IconoLista, IconoPersona, IconoEscudoOk } from "@/app/componentes/iconos";

const ITEMS = [
  { href: "/portal", texto: "Inicio", Icono: IconoCasa },
  { href: "/portal/agentes", texto: "Equipo", Icono: IconoPersona },
  { href: "/portal/documentos", texto: "Documentos", Icono: IconoLista },
  { href: "/perfiles", texto: "Más", Icono: IconoEscudoOk },
] as const;

export function NavCliente({ sufijo = "" }: { sufijo?: string }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Navegación del cliente" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#173752] bg-[#020b18]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 py-1.5">
        {ITEMS.map(({ href, texto, Icono }) => {
          const destino = href.startsWith("/portal/") ? `${href}${sufijo}` : href;
          const activo = href === "/portal" ? ruta === href : ruta.startsWith(href);
          return <li key={href}><Link href={destino} aria-current={activo ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium ${activo ? "text-azul-300" : "text-gris-500"}`}><Icono className="h-5 w-5" /><span>{texto}</span></Link></li>;
        })}
      </ul>
    </nav>
  );
}
