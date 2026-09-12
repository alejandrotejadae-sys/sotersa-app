"use client";

import { useRouter } from "next/navigation";

/**
 * Solo para admin y operativo: el cliente entra amarrado a su empresa y nunca
 * ve este selector. Cambiar de empresa recarga la pagina con ?empresa=.
 */
export function SelectorEmpresa({ empresas, actual }: { empresas: Array<{ id: string; nombre: string }>; actual: string | null }) {
  const router = useRouter();
  return (
    <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-borde/60 bg-white/[0.03] px-4 py-3 text-sm">
      <span className="text-gris-400">Ver el portal como</span>
      <select value={actual ?? ""} onChange={(e) => router.push(`/portal?empresa=${e.target.value}`)} className="min-h-10 flex-1 rounded-xl border border-borde/60 bg-[#07172a] px-3 text-white outline-none focus:border-azul-500">
        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
    </label>
  );
}
