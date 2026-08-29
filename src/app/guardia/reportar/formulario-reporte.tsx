"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { IconoAlerta } from "@/app/componentes/iconos";
import { registrarNovedad, type EstadoReporte } from "./acciones";

const INICIAL: EstadoReporte = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-13 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-4 text-white outline-none focus:border-[#0788ff] focus:ring-4 focus:ring-[#0788ff]/10";

export function FormularioReporte({ soloLectura, severidadInicial }: { soloLectura: boolean; severidadInicial: string }) {
  const [estado, accion, pendiente] = useActionState(registrarNovedad, INICIAL);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [archivo, setArchivo] = useState("");

  function obtenerUbicacion() {
    setBuscando(true);
    if (!navigator.geolocation) { setBuscando(false); return; }
    navigator.geolocation.getCurrentPosition((posicion) => { setUbicacion({ lat: posicion.coords.latitude, lng: posicion.coords.longitude }); setBuscando(false); }, () => setBuscando(false), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  if (soloLectura) return <p className="mt-6 rounded-2xl border border-[#27425e] bg-[#07172a] p-5 text-sm leading-6 text-slate-400">Vista de administración: el reporte debe enviarlo el agente de seguridad desde su propia cuenta.</p>;
  if (estado.tipo === "exito") return <section className="mt-6 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-6 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</span><h2 className="mt-4 text-xl font-semibold text-emerald-200">Reporte enviado</h2><p className="mt-2 text-sm leading-6 text-slate-300">{estado.mensaje}</p><Link href="/guardia" className="boton-primario mt-5 grid min-h-13 place-items-center rounded-xl font-semibold text-white">Volver a mi puesto</Link></section>;

  return <form action={accion} className="mt-6 space-y-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-5">
    <Campo etiqueta="Tipo de novedad"><select name="tipo" defaultValue="Novedad general" className={control}><option>Novedad general</option><option>Acceso no autorizado</option><option>Daño o falla de equipos</option><option>Infraestructura</option><option>Incidente médico</option><option>Relevo de puesto</option><option>Otro</option></select></Campo>
    <Campo etiqueta="Prioridad"><select name="severidad" defaultValue={severidadInicial} className={control}><option value="informativa">Informativa</option><option value="novedad">Novedad</option><option value="emergencia">Emergencia</option></select></Campo>
    <Campo etiqueta="Descripción"><textarea name="descripcion" required minLength={10} maxLength={1200} rows={5} placeholder="Describe qué ocurrió, dónde y qué acciones realizaste…" className={`${control} resize-none py-3`} /></Campo>
    <div><label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0788ff]/65 bg-[#0788ff]/8 px-4 text-sm font-semibold text-[#8ddaff]"><Camara /> {archivo || "Adjuntar fotografía"}<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={(evento) => setArchivo(evento.target.files?.[0]?.name ?? "")} className="sr-only" /></label><p className="mt-2 text-center text-xs text-slate-500">Opcional · máximo 5 MB</p></div>
    <input type="hidden" name="lat" value={ubicacion?.lat ?? ""} /><input type="hidden" name="lng" value={ubicacion?.lng ?? ""} />
    <button type="button" onClick={obtenerUbicacion} disabled={buscando} className={`min-h-13 w-full rounded-xl border px-4 text-sm font-semibold ${ubicacion ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300" : "border-[#27425e] bg-[#041225] text-slate-300"}`}>{buscando ? "Obteniendo ubicación…" : ubicacion ? "✓ Ubicación registrada" : "Registrar ubicación GPS"}</button>
    {estado.tipo === "error" && <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">{estado.mensaje}</p>}
    <button disabled={pendiente} className="boton-primario flex min-h-14 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white disabled:opacity-50"><IconoAlerta className="h-5 w-5" /> {pendiente ? "Enviando reporte…" : "Enviar a supervisión"}</button>
  </form>;
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-300">{etiqueta}{children}</label>; }
function Camara() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4Z"/><circle cx="12" cy="13" r="3"/></svg>; }
