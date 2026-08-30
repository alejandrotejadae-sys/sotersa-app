"use client";

import { useEffect, useRef, useState } from "react";

export function FirmaCanvas({ nombre = "firma", etiqueta = "Firma" }: { nombre?: string; etiqueta?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [valor, setValor] = useState("");

  useEffect(() => {
    const lienzo = canvas.current;
    if (!lienzo) return;
    const escala = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const ancho = lienzo.clientWidth;
    const alto = 180;
    lienzo.width = ancho * escala;
    lienzo.height = alto * escala;
    lienzo.getContext("2d")?.scale(escala, escala);
  }, []);

  function posicion(evento: React.PointerEvent<HTMLCanvasElement>) {
    const caja = evento.currentTarget.getBoundingClientRect();
    return { x: evento.clientX - caja.left, y: evento.clientY - caja.top };
  }

  function iniciar(evento: React.PointerEvent<HTMLCanvasElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId);
    const contexto = evento.currentTarget.getContext("2d");
    if (!contexto) return;
    const punto = posicion(evento);
    contexto.beginPath();
    contexto.moveTo(punto.x, punto.y);
    contexto.strokeStyle = "#dff5ff";
    contexto.lineWidth = 2.4;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    dibujando.current = true;
  }

  function mover(evento: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const contexto = evento.currentTarget.getContext("2d");
    if (!contexto) return;
    const punto = posicion(evento);
    contexto.lineTo(punto.x, punto.y);
    contexto.stroke();
  }

  function terminar() {
    dibujando.current = false;
    if (canvas.current) setValor(canvas.current.toDataURL("image/png"));
  }

  function limpiar() {
    const lienzo = canvas.current;
    if (!lienzo) return;
    lienzo.getContext("2d")?.clearRect(0, 0, lienzo.width, lienzo.height);
    setValor("");
  }

  return <fieldset>
    <div className="mb-2 flex items-center justify-between gap-3"><legend className="text-sm font-medium text-gris-300">{etiqueta}</legend><button type="button" onClick={limpiar} className="text-xs font-semibold text-azul-400">Limpiar</button></div>
    <canvas ref={canvas} onPointerDown={iniciar} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={terminar} className="h-[180px] w-full touch-none rounded-xl border border-borde bg-[#020b18] shadow-inner" aria-label={etiqueta} />
    <input type="hidden" name={nombre} value={valor} />
    <p className="mt-2 text-xs text-gris-500">Firma dentro del recuadro con el dedo.</p>
  </fieldset>;
}
