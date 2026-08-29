/**
 * Lector minimo de .xlsx sin dependencias.
 * Un xlsx es un ZIP con XML dentro; zlib ya sabe descomprimir cada entrada.
 */
import fs from "node:fs";
import zlib from "node:zlib";

export function abrirXlsx(ruta) {
  const b = fs.readFileSync(ruta);

  // --- Localizar el fin del directorio central (firma PK\x05\x06) ---
  let eocd = -1;
  for (let i = b.length - 22; i >= 0 && i > b.length - 66000; i--) {
    if (b.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("no parece un ZIP valido");

  const nEntradas = b.readUInt16LE(eocd + 10);
  let off = b.readUInt32LE(eocd + 16);

  const archivos = new Map();
  for (let n = 0; n < nEntradas; n++) {
    if (b.readUInt32LE(off) !== 0x02014b50) break;
    const metodo = b.readUInt16LE(off + 10);
    const tamComp = b.readUInt32LE(off + 20);
    const lenNombre = b.readUInt16LE(off + 28);
    const lenExtra = b.readUInt16LE(off + 30);
    const lenCom = b.readUInt16LE(off + 32);
    const offLocal = b.readUInt32LE(off + 42);
    const nombre = b.toString("utf8", off + 46, off + 46 + lenNombre);

    // Cabecera local: los campos extra pueden diferir de los del directorio.
    const lnNombre = b.readUInt16LE(offLocal + 26);
    const lnExtra = b.readUInt16LE(offLocal + 28);
    const ini = offLocal + 30 + lnNombre + lnExtra;
    const crudo = b.subarray(ini, ini + tamComp);

    archivos.set(
      nombre,
      metodo === 0 ? crudo : zlib.inflateRawSync(crudo),
    );
    off += 46 + lenNombre + lenExtra + lenCom;
  }
  return archivos;
}

const desescapar = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, "&");

/** Cadenas compartidas: las celdas de texto apuntan a este indice. */
export function leerCadenas(archivos) {
  const xml = archivos.get("xl/sharedStrings.xml");
  if (!xml) return [];
  const texto = xml.toString("utf8");
  return [...texto.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((t) => desescapar(t[1]))
      .join(""),
  );
}

/** Nombres de hoja en orden, con su archivo correspondiente. */
export function listarHojas(archivos) {
  const wb = archivos.get("xl/workbook.xml").toString("utf8");
  const rels = archivos.get("xl/_rels/workbook.xml.rels").toString("utf8");

  const mapaRel = new Map();
  for (const m of rels.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    mapaRel.set(m[1], m[2].replace(/^\/?xl\//, "").replace(/^\//, ""));
  }

  const hojas = [];
  for (const m of wb.matchAll(/<sheet[^>]*\/>/g)) {
    const nombre = desescapar(/name="([^"]*)"/.exec(m[0])?.[1] ?? "");
    const rid = /r:id="([^"]*)"/.exec(m[0])?.[1];
    const destino = mapaRel.get(rid);
    hojas.push({ nombre, archivo: destino ? `xl/${destino}` : null });
  }
  return hojas;
}

const colANum = (ref) => {
  const letras = /^([A-Z]+)/.exec(ref)?.[1] ?? "A";
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};

/** Devuelve la hoja como matriz de strings. */
export function leerHoja(archivos, rutaHoja, cadenas) {
  const xml = archivos.get(rutaHoja).toString("utf8");
  const filas = [];
  for (const mf of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const idx = +mf[1] - 1;
    const celdas = [];
    for (const mc of mf[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = mc[1];
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? "A1";
      const tipo = /t="([^"]*)"/.exec(attrs)?.[1];
      const cuerpo = mc[2];
      let valor = "";
      if (tipo === "inlineStr") {
        valor = [...cuerpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((t) => desescapar(t[1]))
          .join("");
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(cuerpo)?.[1];
        if (v !== undefined) {
          valor = tipo === "s" ? (cadenas[+v] ?? "") : desescapar(v);
        }
      }
      celdas[colANum(ref)] = valor;
    }
    filas[idx] = celdas;
  }
  // Rellenar huecos para poder indexar sin sorpresas.
  // Ojo: `filas` es un arreglo disperso y map() conserva los huecos, que al
  // esparcirlos en Math.max se vuelven undefined y dan NaN. Hay que filtrar.
  let ancho = 0;
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    if (Array.isArray(f) && f.length > ancho) ancho = f.length;
  }
  return Array.from({ length: filas.length }, (_, i) =>
    Array.from({ length: ancho }, (_, j) => filas[i]?.[j] ?? ""),
  );
}
