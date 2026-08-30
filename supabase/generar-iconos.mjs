/**
 * Genera los iconos de la app componiendo el emblema sobre fondo blanco.
 *
 *   node supabase/generar-iconos.mjs
 *
 * Parte de public/logo-sotersa.png, que es el emblema recortado con
 * transparencia de los renders aprobados. No dibuja nada: solo lo escala y lo
 * pega centrado sobre blanco.
 *
 * Escala con interpolacion bilineal. Con vecino mas cercano, los bordes
 * diagonales del lobo quedan dentados a 48px, que es justo donde mas se nota.
 */
import fs from "node:fs";
import zlib from "node:zlib";

const ORIGEN = "public/logo-sotersa.png";
const SALIDAS = [
  { archivo: "public/icono-lobo-sotersa-48.png", lado: 48 },
  { archivo: "public/icono-lobo-sotersa-192.png", lado: 192 },
  { archivo: "public/icono-lobo-sotersa-512.png", lado: 512 },
  { archivo: "public/apple-touch-icon.png", lado: 180 },
  // Enmascarable: el sistema lo recorta en circulo o squircle. Solo se
  // garantiza lo que cae dentro del 80% central, asi que el emblema va mas
  // pequeño. Con el mismo tamaño que los demas, Android le corta las orejas.
  { archivo: "public/icono-lobo-maskable-512.png", lado: 512, ocupacion: 0.56 },
];

/** Proporcion del icono que ocupa el emblema. El resto es aire. */
const OCUPACION = 0.74;

// --- Leer el PNG de origen (RGBA, filtro 0 en todas las filas) --------------
function leerPNG(ruta) {
  const b = fs.readFileSync(ruta);
  let off = 8;
  let ancho = 0;
  let alto = 0;
  let tipoColor = 6;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const tipo = b.subarray(off + 4, off + 8).toString("ascii");
    const datos = b.subarray(off + 8, off + 8 + len);
    if (tipo === "IHDR") {
      ancho = datos.readUInt32BE(0);
      alto = datos.readUInt32BE(4);
      tipoColor = datos[9];
    } else if (tipo === "IDAT") idat.push(datos);
    else if (tipo === "IEND") break;
    off += 12 + len;
  }
  if (tipoColor !== 6) throw new Error(`${ruta} no es RGBA`);

  const canales = 4;
  const bruto = zlib.inflateSync(Buffer.concat(idat));
  const paso = ancho * canales;
  const px = Buffer.alloc(paso * alto);

  // Deshacer los filtros por fila. El nuestro usa 0, pero conviene soportar
  // los cinco por si el archivo se regenera con otra herramienta.
  let anterior = Buffer.alloc(paso);
  for (let y = 0; y < alto; y++) {
    const filtro = bruto[y * (paso + 1)];
    const fila = bruto.subarray(y * (paso + 1) + 1, y * (paso + 1) + 1 + paso);
    const salida = Buffer.alloc(paso);
    for (let i = 0; i < paso; i++) {
      const a = i >= canales ? salida[i - canales] : 0;
      const b2 = anterior[i];
      const c = i >= canales ? anterior[i - canales] : 0;
      let v = fila[i];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b2;
      else if (filtro === 3) v += Math.floor((a + b2) / 2);
      else if (filtro === 4) {
        const p = a + b2 - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b2);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b2 : c;
      }
      salida[i] = v & 255;
    }
    salida.copy(px, y * paso);
    anterior = salida;
  }
  return { ancho, alto, px };
}

/** Muestra bilineal del origen, devolviendo RGBA. */
function muestrear(src, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, src.ancho - 1);
  const y1 = Math.min(y0 + 1, src.alto - 1);
  const fx = x - x0;
  const fy = y - y0;
  const en = (xx, yy, c) => src.px[(yy * src.ancho + xx) * 4 + c];
  const salida = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    const arriba = en(x0, y0, c) * (1 - fx) + en(x1, y0, c) * fx;
    const abajo = en(x0, y1, c) * (1 - fx) + en(x1, y1, c) * fx;
    salida[c] = arriba * (1 - fy) + abajo * fy;
  }
  return salida;
}

function escribirPNG(ruta, lado, rgb) {
  const tabla = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  const crc = (b) => {
    let c = -1;
    for (const x of b) c = tabla[(c ^ x) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const trozo = (tipo, datos) => {
    const l = Buffer.alloc(4);
    l.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(cuerpo));
    return Buffer.concat([l, cuerpo, c]);
  };
  const paso = lado * 3;
  const conFiltro = Buffer.alloc((paso + 1) * lado);
  for (let y = 0; y < lado; y++) {
    conFiltro[y * (paso + 1)] = 0;
    rgb.copy(conFiltro, y * (paso + 1) + 1, y * paso, y * paso + paso);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB: el fondo es opaco, no hace falta canal alfa
  fs.writeFileSync(
    ruta,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      trozo("IHDR", ihdr),
      trozo("IDAT", zlib.deflateSync(conFiltro, { level: 9 })),
      trozo("IEND", Buffer.alloc(0)),
    ]),
  );
}

// --- Componer ---------------------------------------------------------------
const src = leerPNG(ORIGEN);
console.log(`\n  origen: ${ORIGEN}  ${src.ancho}x${src.alto} RGBA\n`);

for (const { archivo, lado, ocupacion } of SALIDAS) {
  const destino = Buffer.alloc(lado * lado * 3, 255); // blanco

  // El emblema es más alto que ancho: se ajusta por el lado mayor para que
  // quepa entero, y se centra.
  const escala = (lado * (ocupacion ?? OCUPACION)) / Math.max(src.ancho, src.alto);
  const anchoDest = Math.round(src.ancho * escala);
  const altoDest = Math.round(src.alto * escala);
  const offX = Math.round((lado - anchoDest) / 2);
  const offY = Math.round((lado - altoDest) / 2);

  for (let y = 0; y < altoDest; y++) {
    for (let x = 0; x < anchoDest; x++) {
      const [r, g, b, a] = muestrear(
        src,
        (x / anchoDest) * (src.ancho - 1),
        (y / altoDest) * (src.alto - 1),
      );
      // El recorte original dejo los pixeles del fondo oscuro del render con
      // algo de opacidad. Sobre el fondo negro de la app no se notaban; sobre
      // blanco forman un halo gris. Todo lo que no llegue al umbral se
      // descarta, y el resto se reescala para no perder el suavizado del borde.
      const UMBRAL = 0.34;
      const crudo = a / 255;
      if (crudo <= UMBRAL) continue;
      const alfa = Math.min(1, (crudo - UMBRAL) / (1 - UMBRAL));
      const i = ((y + offY) * lado + (x + offX)) * 3;
      // Sobre blanco: color * alfa + 255 * (1 - alfa)
      destino[i] = Math.round(r * alfa + 255 * (1 - alfa));
      destino[i + 1] = Math.round(g * alfa + 255 * (1 - alfa));
      destino[i + 2] = Math.round(b * alfa + 255 * (1 - alfa));
    }
  }

  escribirPNG(archivo, lado, destino);
  const esquina = [destino[0], destino[1], destino[2]].join(",");
  console.log(
    `  ${archivo.replace("public/", "").padEnd(28)}${lado}x${lado}  emblema ${anchoDest}x${altoDest}  esquina rgb(${esquina})  ${fs.statSync(archivo).size} bytes`,
  );
}
console.log("");
