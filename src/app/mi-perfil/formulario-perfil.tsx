"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconoPersona } from "@/app/componentes/iconos";
import { guardarPerfil, type EstadoPerfil } from "./acciones";

const INICIAL: EstadoPerfil = { tipo: "inicial", mensaje: "" };

export function FormularioPerfil({ nombre, telefono, avatarUrl }: { nombre: string; telefono: string; avatarUrl?: string }) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState(guardarPerfil, INICIAL);
  const [vistaPrevia, setVistaPrevia] = useState(avatarUrl);
  useEffect(() => { if (estado.tipo === "exito") router.refresh(); }, [estado, router]);

  function seleccionarFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (archivo) setVistaPrevia(URL.createObjectURL(archivo));
  }

  return <form action={accion} className="mt-6 space-y-5">
    <div className="flex flex-col items-center gap-3 text-center"><span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-2 border-[#0788ff]/70 bg-[#0788ff]/10 text-[#49b6ff] shadow-[0_0_30px_rgba(0,136,255,0.16)]" style={vistaPrevia ? { backgroundImage: `url(${vistaPrevia})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>{!vistaPrevia && <IconoPersona className="h-14 w-14" />}</span><label className="cursor-pointer rounded-xl border border-[#0788ff]/60 bg-[#0788ff]/10 px-4 py-2.5 text-sm font-semibold text-[#8ddaff]">Elegir fotografía<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={seleccionarFoto} className="sr-only" /></label><p className="text-xs text-slate-500">JPG, PNG o WebP · máximo 3 MB</p></div>
    <Campo etiqueta="Nombre completo"><input name="nombre" defaultValue={nombre} required minLength={3} maxLength={100} autoComplete="name" className={control} /></Campo>
    <Campo etiqueta="Teléfono"><input name="telefono" defaultValue={telefono} type="tel" maxLength={24} autoComplete="tel" placeholder="Ej. 098 000 0000" className={control} /></Campo>
    {estado.tipo !== "inicial" && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
    <button disabled={pendiente} className="boton-primario min-h-14 w-full rounded-xl text-base font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando cambios…" : "Guardar perfil"}</button>
  </form>;
}

const control = "mt-2 min-h-13 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-4 text-white outline-none transition focus:border-[#0788ff] focus:ring-4 focus:ring-[#0788ff]/10";
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }
