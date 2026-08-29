"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarClave, type EstadoClave } from "./acciones";

const INICIAL: EstadoClave = { tipo: "inicial", mensaje: "" };

export function FormularioClave({ esGuardia }: { esGuardia: boolean }) {
  const [estado, accion, pendiente] = useActionState(cambiarClave, INICIAL);
  const [mostrar, setMostrar] = useState(false);
  const router = useRouter();
  useEffect(() => { if (estado.tipo === "exito") { const temporizador = window.setTimeout(() => { router.replace("/perfiles"); router.refresh(); }, 900); return () => window.clearTimeout(temporizador); } }, [estado, router]);

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta={esGuardia ? "Nuevo PIN" : "Nueva contraseña"}><input name="clave" required type={mostrar ? "text" : "password"} inputMode={esGuardia ? "numeric" : "text"} minLength={esGuardia ? 6 : 12} maxLength={esGuardia ? 6 : 128} pattern={esGuardia ? "[0-9]{6}" : undefined} autoComplete="new-password" className={control} placeholder={esGuardia ? "••••••" : "Mínimo 12 caracteres"} /></Campo>
      <Campo etiqueta={esGuardia ? "Confirmar PIN" : "Confirmar contraseña"}><input name="confirmacion" required type={mostrar ? "text" : "password"} inputMode={esGuardia ? "numeric" : "text"} minLength={esGuardia ? 6 : 12} maxLength={esGuardia ? 6 : 128} pattern={esGuardia ? "[0-9]{6}" : undefined} autoComplete="new-password" className={control} placeholder={esGuardia ? "••••••" : "Repite la contraseña"} /></Campo>
      <button type="button" onClick={() => setMostrar((actual) => !actual)} className="text-sm font-medium text-[#49b6ff]">{mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}</button>
      <p className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-3 text-xs leading-5 text-slate-400">{esGuardia ? "Usa seis números que no sean consecutivos, repetidos ni parte de tu cédula." : "Incluye mayúscula, minúscula, número y símbolo. No compartas esta contraseña."}</p>
      {estado.mensaje && <p aria-live="polite" className={`rounded-xl border px-3 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
      <button disabled={pendiente || estado.tipo === "exito"} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 disabled:opacity-50">{pendiente ? "Guardando..." : estado.tipo === "exito" ? "Contraseña actualizada" : "Guardar nueva contraseña"}</button>
    </form>
  );
}

const control = "mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-3 text-sm text-white outline-none focus:border-[#0788ff]";
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }
