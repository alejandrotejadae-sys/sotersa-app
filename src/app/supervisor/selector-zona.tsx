"use client";

import { useRouter } from "next/navigation";

/** Solo admin y operativo: el supervisor entra amarrado a su zona. */
export function SelectorZona({ zonas, actual }: { zonas: Array<{ id: string; nombre: string }>; actual: string }) {
  const router = useRouter();
  return (
    <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#27425e] bg-[#07172a]/95 px-4 py-3 text-sm">
      <span className="text-slate-400">Ver la supervisión de</span>
      <select value={actual} onChange={(e) => router.push(`/supervisor?zona=${e.target.value}`)} className="min-h-10 flex-1 rounded-xl border border-[#27425e] bg-[#041225] px-3 text-white outline-none focus:border-[#0788ff]">
        <option value="todas">Todas las zonas</option>
        {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
        <option value="sin-zona">Puestos sin zona asignada</option>
      </select>
    </label>
  );
}
