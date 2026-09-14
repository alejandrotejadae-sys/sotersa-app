import "server-only";
import zlib from "node:zlib";

/**
 * Lector minimo de .xlsx y .csv, sin dependencias. Un xlsx es un ZIP con XML
 * dentro: zlib descomprime cada entrada y unas expresiones regulares sacan
 * las celdas. Cubre lo que produce Excel, Google Sheets y LibreOffice para
 * una hoja de datos normal; no intenta cubrir formulas ni estilos.
 *
 * Es la version para la app del lector que ya se usaba en los scripts de
 * carga (supabase/xlsx-lector.mjs).
 */

export type Hoja = { nombre: string; filas: string[][] };

export function leerLibro(buffer: Buffer): Hoja[] {
  const archivos = descomprimir(buffer);
  const cadenas = leerCadenas(archivos);
  return listarHojas(archivos)
    .filter((h) => h.archivo && archivos.has(h.archivo))
    .map((h) => ({ nombre: h.nombre, filas: leerHoja(archivos.get(h.archivo!)!, cadenas) }));
}

/** CSV con separador coma o punto y coma (Excel en espanol exporta con ;). */
export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, "");
  const primera = limpio.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let enComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (enComillas) {
      if (c === '"' && limpio[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') enComillas = false;
      else celda += c;
    } else if (c === '"') enComillas = true;
    else if (c === sep) { fila.push(celda); celda = ""; }
    else if (c === "\n") { fila.push(celda); filas.push(fila); fila = []; celda = ""; }
    else if (c !== "\r") celda += c;
  }
  if (celda.length || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

/** Numero de serie de Excel (dias desde 1899-12-30) a fecha YYYY-MM-DD. */
export function fechaDeSerie(serie: number): string {
  const ms = Math.round((serie - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

/** Fraccion de dia de Excel (0.2916 = 07:00) a HH:MM. */
export function horaDeFraccion(fraccion: number): string {
  const minutos = Math.round((fraccion % 1) * 24 * 60);
  return `${String(Math.floor(minutos / 60) % 24).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------

function descomprimir(b: Buffer): Map<string, Buffer> {
  let eocd = -1;
  for (let i = b.length - 22; i >= 0 && i > b.length - 66000; i--) {
    if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("El archivo no es un .xlsx valido.");
  const nEntradas = b.readUInt16LE(eocd + 10);
  let off = b.readUInt32LE(eocd + 16);
  const archivos = new Map<string, Buffer>();
  for (let n = 0; n < nEntradas; n++) {
    if (b.readUInt32LE(off) !== 0x02014b50) break;
    const metodo = b.readUInt16LE(off + 10);
    const tamComp = b.readUInt32LE(off + 20);
    const lenNombre = b.readUInt16LE(off + 28);
    const lenExtra = b.readUInt16LE(off + 30);
    const lenCom = b.readUInt16LE(off + 32);
    const offLocal = b.readUInt32LE(off + 42);
    const nombre = b.toString("utf8", off + 46, off + 46 + lenNombre);
    const lnNombre = b.readUInt16LE(offLocal + 26);
    const lnExtra = b.readUInt16LE(offLocal + 28);
    const ini = offLocal + 30 + lnNombre + lnExtra;
    const crudo = b.subarray(ini, ini + tamComp);
    archivos.set(nombre, metodo === 0 ? Buffer.from(crudo) : zlib.inflateRawSync(crudo));
    off += 46 + lenNombre + lenExtra + lenCom;
  }
  return archivos;
}

const desescapar = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");

function leerCadenas(archivos: Map<string, Buffer>): string[] {
  const xml = archivos.get("xl/sharedStrings.xml");
  if (!xml) return [];
  return [...xml.toString("utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => desescapar(t[1])).join(""));
}

function listarHojas(archivos: Map<string, Buffer>): { nombre: string; archivo: string | null }[] {
  const wb = archivos.get("xl/workbook.xml")?.toString("utf8") ?? "";
  const rels = archivos.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const mapaRel = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1];
    const target = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && target) mapaRel.set(id, target.replace(/^\/?xl\//, "").replace(/^\//, ""));
  }
  const hojas: { nombre: string; archivo: string | null }[] = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*\/>/g)) {
    const nombre = desescapar(/name="([^"]*)"/.exec(m[0])?.[1] ?? "");
    const rid = /r:id="([^"]*)"/.exec(m[0])?.[1] ?? "";
    const destino = mapaRel.get(rid);
    hojas.push({ nombre, archivo: destino ? `xl/${destino}` : null });
  }
  return hojas;
}

const colANum = (ref: string) => {
  const letras = /^([A-Z]+)/.exec(ref)?.[1] ?? "A";
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};

function leerHoja(xmlBuf: Buffer, cadenas: string[]): string[][] {
  const xml = xmlBuf.toString("utf8");
  const filas: string[][] = [];
  for (const mf of xml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const idx = +mf[1] - 1;
    const celdas: string[] = [];
    for (const mc of mf[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = mc[1];
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? "A1";
      const tipo = /t="([^"]*)"/.exec(attrs)?.[1];
      const cuerpo = mc[2] ?? "";
      let valor = "";
      if (tipo === "inlineStr") valor = [...cuerpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => desescapar(t[1])).join("");
      else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(cuerpo)?.[1];
        if (v !== undefined) valor = tipo === "s" ? (cadenas[+v] ?? "") : desescapar(v);
      }
      celdas[colANum(ref)] = valor;
    }
    filas[idx] = celdas;
  }
  let ancho = 0;
  for (const f of filas) if (Array.isArray(f) && f.length > ancho) ancho = f.length;
  return Array.from({ length: filas.length }, (_, i) => Array.from({ length: ancho }, (_, j) => filas[i]?.[j] ?? ""));
}
