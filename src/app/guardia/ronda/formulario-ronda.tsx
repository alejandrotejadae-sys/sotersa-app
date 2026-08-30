"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconoQR } from "@/app/componentes/iconos";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { LectorQr } from "./lector-qr";

type Punto = { id: string; codigo: string; nombre: string; token: string; orden: number };

export function FormularioRonda({ turnoId, guardiaId, puntos, completados, soloLectura }: { turnoId: string; guardiaId: string; puntos: Punto[]; completados: string[]; soloLectura: boolean }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function registrar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    const valor = codigo.trim().toLowerCase();
    const punto = puntos.find((item) => item.token.toLowerCase() === valor || item.codigo.toLowerCase() === valor);
    if (!punto) { setError("El código no corresponde a un punto de esta ronda."); return; }
    if (completados.includes(punto.id)) { setError("Este punto ya fue registrado en el turno."); return; }

    setGuardando(true);
    const ubicacion = await obtenerUbicacion();
    const { error: fallo } = await crearClienteNavegador().from("rondas").insert({ turno_id: turnoId, punto_id: punto.id, guardia_id: guardiaId, hora_captura: new Date().toISOString(), lat: ubicacion?.lat ?? null, lng: ubicacion?.lng ?? null });
    setGuardando(false);
    if (fallo) { setError(`No se pudo registrar: ${fallo.message}`); return; }
    setCodigo("");
    router.refresh();
  }

  return (
    <form onSubmit={registrar} className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><IconoQR className="h-6 w-6 text-[#0788ff]"/> Registrar punto</h2>
      {soloLectura ? <p className="mt-3 rounded-xl border border-[#27425e] bg-[#061426] px-4 py-3 text-sm text-slate-400">Vista de administración: el registro debe realizarlo el agente de seguridad desde su cuenta.</p> : <><LectorQr alDetectar={(valor) => { setCodigo(valor); setError(null); }} /><label className="mt-4 block"><span className="text-sm text-slate-300">Código QR o código del punto</span><input value={codigo} onChange={(evento) => setCodigo(evento.target.value)} placeholder="Escanea o escribe el código" className="mt-2 min-h-14 w-full rounded-xl border border-[#087dd8] bg-[#020b18] px-4 text-white outline-none placeholder:text-slate-500"/></label>{codigo && <p className="mt-2 text-xs text-emerald-300">Código detectado. Confirma el punto para registrarlo.</p>}{error && <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button type="submit" disabled={guardando || !codigo.trim()} className="boton-primario mt-4 min-h-14 w-full rounded-xl font-semibold text-white disabled:opacity-50">{guardando ? "Registrando…" : "Confirmar punto"}</button></>}
    </form>
  );
}

function obtenerUbicacion(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolver) => {
    if (!navigator.geolocation) { resolver(null); return; }
    navigator.geolocation.getCurrentPosition(
      (posicion) => resolver({ lat: posicion.coords.latitude, lng: posicion.coords.longitude }),
      () => resolver(null),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 },
    );
  });
}
