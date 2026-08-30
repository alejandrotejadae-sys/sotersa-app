"use client";

import { useEffect, useRef, useState } from "react";
import { IconoQR } from "@/app/componentes/iconos";

type Detector = { detect: (fuente: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> };
type ConstructorDetector = new (opciones?: { formats?: string[] }) => Detector;

export function LectorQr({ alDetectar }: { alDetectar: (valor: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const temporizador = useRef<number | null>(null);
  const [activo, setActivo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function detener() {
    if (temporizador.current) window.clearTimeout(temporizador.current);
    temporizador.current = null;
    flujo.current?.getTracks().forEach((pista) => pista.stop());
    flujo.current = null;
    setActivo(false);
  }

  useEffect(() => detener, []);

  async function iniciar() {
    setMensaje(null);
    const DetectorQr = (window as typeof window & { BarcodeDetector?: ConstructorDetector }).BarcodeDetector;
    if (!DetectorQr || !navigator.mediaDevices?.getUserMedia) {
      setMensaje("Este navegador no permite escanear QR. Puedes escribir el código del punto.");
      return;
    }
    try {
      const camara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      flujo.current = camara;
      if (!video.current) return;
      video.current.srcObject = camara;
      await video.current.play();
      setActivo(true);
      const detector = new DetectorQr({ formats: ["qr_code"] });
      const revisar = async () => {
        if (!flujo.current || !video.current) return;
        try {
          const resultados = await detector.detect(video.current);
          const valor = resultados[0]?.rawValue?.trim();
          if (valor) { alDetectar(valor); detener(); return; }
        } catch { /* La cámara aún puede estar preparando el siguiente cuadro. */ }
        temporizador.current = window.setTimeout(revisar, 300);
      };
      revisar();
    } catch {
      detener();
      setMensaje("No fue posible abrir la cámara. Revisa el permiso de cámara o escribe el código.");
    }
  }

  return <div className="mt-4">
    {!activo ? <button type="button" onClick={iniciar} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-[#087dd8] bg-[#087dd8]/10 font-semibold text-[#7fd4f0]"><IconoQR className="h-6 w-6" /> Abrir cámara y escanear</button> : <div className="overflow-hidden rounded-2xl border border-[#087dd8] bg-black"><video ref={video} muted playsInline className="aspect-square w-full object-cover" /><div className="p-3"><button type="button" onClick={detener} className="min-h-11 w-full rounded-xl border border-white/20 text-sm font-semibold text-white">Cancelar escaneo</button></div></div>}
    {mensaje && <p className="mt-3 rounded-xl border border-[#27425e] bg-[#061426] px-4 py-3 text-sm text-slate-300">{mensaje}</p>}
  </div>;
}
