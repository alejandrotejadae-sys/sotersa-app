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
  const [preparando, setPreparando] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  useEffect(() => { if (estado.tipo === "exito") router.refresh(); }, [estado, router]);

  async function seleccionarFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setErrorFoto(null);
    setPreparando(true);
    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    try {
      const optimizada = await optimizarFoto(url, archivo.name);
      const transferencia = new DataTransfer();
      transferencia.items.add(optimizada);
      evento.target.files = transferencia.files;
      setVistaPrevia(URL.createObjectURL(optimizada));
    } catch {
      evento.target.value = "";
      setVistaPrevia(avatarUrl);
      setErrorFoto("No pudimos preparar esa imagen. Prueba con otra foto o una captura de pantalla.");
    } finally {
      URL.revokeObjectURL(url);
      setPreparando(false);
    }
  }

  return <form action={accion} className="mt-6 space-y-5">
    <div className="flex flex-col items-center gap-3 text-center"><span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-2 border-[#0788ff]/70 bg-[#0788ff]/10 text-[#49b6ff] shadow-[0_0_30px_rgba(0,136,255,0.16)]" style={vistaPrevia ? { backgroundImage: `url(${vistaPrevia})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>{!vistaPrevia && <IconoPersona className="h-14 w-14" />}</span><label className={`rounded-xl border border-[#0788ff]/60 bg-[#0788ff]/10 px-4 py-2.5 text-sm font-semibold text-[#8ddaff] ${preparando ? "cursor-wait opacity-60" : "cursor-pointer"}`}>{preparando ? "Preparando fotografía…" : "Elegir fotografía"}<input name="foto" type="file" accept="image/*" disabled={preparando} onChange={seleccionarFoto} className="sr-only" /></label><p className="text-xs text-slate-500">La app optimiza la foto automáticamente · máximo final 3 MB</p>{errorFoto && <p role="alert" className="text-xs text-red-300">{errorFoto}</p>}</div>
    <Campo etiqueta="Nombre completo"><input name="nombre" defaultValue={nombre} required minLength={3} maxLength={100} autoComplete="name" className={control} /></Campo>
    <Campo etiqueta="Teléfono"><input name="telefono" defaultValue={telefono} type="tel" maxLength={24} autoComplete="tel" placeholder="Ej. 098 000 0000" className={control} /></Campo>
    {estado.tipo !== "inicial" && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
    <button disabled={pendiente || preparando} className="boton-primario min-h-14 w-full rounded-xl text-base font-semibold text-white disabled:opacity-50">{pendiente ? "Guardando cambios…" : preparando ? "Preparando foto…" : "Guardar perfil"}</button>
  </form>;
}

const control = "mt-2 min-h-13 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-4 text-white outline-none transition focus:border-[#0788ff] focus:ring-4 focus:ring-[#0788ff]/10";
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }

async function optimizarFoto(url: string, nombre: string) {
  const imagen = new Image();
  imagen.src = url;
  await imagen.decode();
  const maximo = 1200;
  const escala = Math.min(1, maximo / Math.max(imagen.naturalWidth, imagen.naturalHeight));
  const ancho = Math.max(1, Math.round(imagen.naturalWidth * escala));
  const alto = Math.max(1, Math.round(imagen.naturalHeight * escala));
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho; lienzo.height = alto;
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("Canvas no disponible");
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.84));
  if (!blob || blob.size > 3 * 1024 * 1024) throw new Error("Imagen demasiado grande");
  return new File([blob], `${nombre.replace(/\.[^.]+$/, "") || "perfil"}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
