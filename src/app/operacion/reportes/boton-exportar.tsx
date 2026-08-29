"use client";

type FilaExportacion = {
  fecha: string;
  categoria: string;
  puesto: string;
  detalle: string;
  estado: string;
};

export function BotonExportar({ filas }: { filas: FilaExportacion[] }) {
  function descargar() {
    const encabezado = ["Fecha", "Categoría", "Puesto", "Detalle", "Estado"];
    const contenido = [encabezado, ...filas.map((fila) => [fila.fecha, fila.categoria, fila.puesto, fila.detalle, fila.estado])]
      .map((columnas) => columnas.map(celdaCsv).join(","))
      .join("\r\n");
    const archivo = new Blob(["\ufeff", contenido], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `reporte-sotersa-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  return <button type="button" onClick={descargar} disabled={filas.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0788ff]/40 bg-[#0788ff]/12 px-4 text-sm font-semibold text-[#65c8ff] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"><Descarga className="h-5 w-5" /> Exportar CSV</button>;
}

function celdaCsv(valor: string) {
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replaceAll('"', '""')}"`;
}

function Descarga({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>; }
