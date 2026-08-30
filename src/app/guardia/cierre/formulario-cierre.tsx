"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FirmaCanvas } from "@/app/componentes/firma-canvas";
import { cerrarTurno, type EstadoCierre } from "./acciones";

const INICIAL: EstadoCierre = { tipo: "inicial", mensaje: "" };

export function FormularioCierre({ turnoId }: { turnoId: string }) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(cerrarTurno, INICIAL);
  useEffect(() => { if (estado.tipo === "exito") { const id = window.setTimeout(() => { router.replace("/guardia"); router.refresh(); }, 1200); return () => window.clearTimeout(id); } }, [estado, router]);

  return <form action={accion} className="space-y-5">
    <input type="hidden" name="turno_id" value={turnoId} />
    <label className="block text-sm font-medium text-gris-300">¿Cómo entregas el puesto?<input name="estado_puesto" required minLength={3} maxLength={500} placeholder="Limpio, ordenado y sin novedades" className="mt-2 min-h-14 w-full rounded-xl border border-borde bg-[#020b18] px-4 text-white outline-none focus:border-azul-500" /></label>
    <label className="block text-sm font-medium text-gris-300">Observación <span className="text-gris-500">(opcional)</span><textarea name="observacion" rows={3} maxLength={800} className="mt-2 w-full rounded-xl border border-borde bg-[#020b18] px-4 py-3 text-white outline-none focus:border-azul-500" /></label>
    <FirmaCanvas etiqueta="Firma de quien entrega" />
    {estado.mensaje && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
    <button disabled={pendiente || estado.tipo === "exito"} className="boton-primario min-h-14 w-full rounded-xl text-base font-semibold text-white disabled:opacity-50">{pendiente ? "Registrando entrega…" : estado.tipo === "exito" ? "Turno cerrado" : "Firmar y cerrar turno"}</button>
  </form>;
}
