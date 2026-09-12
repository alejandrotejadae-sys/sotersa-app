"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Atajo flotante al panel para admin y operativo. En el panel mismo no hace falta. */
export function BotonPanel() {
  const ruta = usePathname();
  if (ruta === "/admin" || ruta === "/acceso") return null;
  return (
    <Link
      href="/admin"
      aria-label="Volver al panel administrativo"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-3 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#0788ff]/45 bg-[#031226]/95 px-4 py-2 text-sm font-semibold text-[#8ddaff] shadow-xl shadow-black/35 backdrop-blur-xl transition hover:border-[#49b6ff] hover:bg-[#08203a] md:bottom-5 md:right-5"
    >
      <span aria-hidden="true">←</span>
      Panel
    </Link>
  );
}
