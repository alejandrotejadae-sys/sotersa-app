"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type PuntoMapa = {
  id: string;
  lat: number;
  lng: number;
  cliente: string;
  codigo: string;
  puesto: string;
  activo: boolean;
  /** Color del pin; si no se da, azul (activo) o gris (inactivo). */
  color?: string;
  /** Linea extra en el tooltip (estado, agente...). */
  detalle?: string;
};

/** Ecuador continental. Se usa cuando todavia no hay ningun puesto ubicado. */
const ECUADOR: [[number, number], [number, number]] = [[-5.1, -81.1], [1.5, -75.2]];

/**
 * Mapa real con los puestos que tienen coordenadas.
 *
 * Leaflet se carga solo en el navegador (toca window al importarse). Las
 * teselas son de OpenStreetMap, que no pide llave; como vienen claras, un
 * filtro CSS sobre la capa de teselas las invierte para que no deslumbren
 * junto al resto del panel (los pines y controles quedan fuera del filtro).
 * Los pines son circulos dibujados por Leaflet, no imagenes, asi que no
 * dependen de que el bundler resuelva los iconos.
 */
export function MapaPuestos({ puntos, alto = "h-72" }: { puntos: PuntoMapa[]; alto?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    let cancelado = false;
    let destruir = () => {};

    import("leaflet").then((L) => {
      if (cancelado) return;

      const mapa = L.map(nodo, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa);

      const grupo = L.featureGroup();
      for (const p of puntos) {
        L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: p.color ?? (p.activo ? "#0788ff" : "#64748b"),
          fillOpacity: 0.95,
        })
          .bindTooltip(`<strong>${escapar(p.cliente)}</strong><br>${escapar(p.codigo)} · ${escapar(p.puesto)}${p.detalle ? `<br>${escapar(p.detalle)}` : ""}`, { direction: "top", offset: [0, -8] })
          .addTo(grupo);
      }
      grupo.addTo(mapa);

      // Con puntos, se encuadra sobre ellos; con uno solo, un zoom de barrio.
      // Sin ninguno, el pais entero: el mapa vacio igual dice donde estamos.
      if (puntos.length > 1) mapa.fitBounds(grupo.getBounds().pad(0.25));
      else if (puntos.length === 1) mapa.setView([puntos[0].lat, puntos[0].lng], 15);
      else mapa.fitBounds(ECUADOR);

      destruir = () => mapa.remove();
    });

    return () => {
      cancelado = true;
      destruir();
    };
  }, [puntos]);

  return <div ref={contenedor} className={`mapa-oscuro ${alto} w-full rounded-xl bg-[#041225]`} aria-label="Mapa de puestos" role="img" />;
}

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
