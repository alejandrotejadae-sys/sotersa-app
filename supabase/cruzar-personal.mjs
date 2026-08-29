/**
 * Cruza la base de datos de Talento Humano con los agentes ya cargados.
 *
 *   npm run cruzar:personal          -> solo informa, no toca nada
 *   npm run cruzar:personal -- aplicar -> escribe cedula, telefono y correo
 *
 * Fuente: 05_Nómina y RRHH/Talento Humano/BASE DE DATOS PERSONAL SOTERSA.xlsx
 *
 * Trae datos personales (cedula, telefono, domicilio). Se cargan solo los tres
 * que la app necesita para operar: cedula (es el usuario de ingreso), telefono
 * y credencial. Domicilio, cuenta bancaria y fecha de nacimiento NO se copian:
 * la app no los usa, y cada dato que no se guarda es un dato que no hay que
 * proteger ni justificar ante la LOPDP.
 */

import { createClient } from "@supabase/supabase-js";
import { abrirXlsx, leerCadenas, leerHoja, listarHojas } from "./xlsx-lector.mjs";

const RUTA =
  "G:/Mi unidad/Sotersa/05_Nómina y RRHH/Talento Humano/BASE DE DATOS PERSONAL SOTERSA.xlsx";

const APLICAR = process.argv.includes("aplicar");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/** Nombres para comparar: sin tildes, sin dobles espacios, en mayusculas. */
const clave = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

/** Valida cedula ecuatoriana (modulo 10), igual que src/lib/auth.ts. */
function cedulaValida(c) {
  const d = String(c ?? "").replace(/\D/g, "");
  if (d.length !== 10) return false;
  const prov = Number(d.slice(0, 2));
  if (prov < 1 || prov > 24) return false;
  if (Number(d[2]) > 5) return false;
  const co = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let p = Number(d[i]) * co[i];
    if (p > 9) p -= 9;
    suma += p;
  }
  return (10 - (suma % 10)) % 10 === Number(d[9]);
}

// --- Leer la hoja -----------------------------------------------------------
const archivos = abrirXlsx(RUTA);
const cadenas = leerCadenas(archivos);
const hoja = listarHojas(archivos)[0];
const filas = leerHoja(archivos, hoja.archivo, cadenas);

const COL = {
  nombre: 1,
  cedula: 2,
  salida: 5,
  codigo: 6,
  estatus: 8,
  puesto: 9,
  denominacion: 10,
  celular: 15,
  correo: 17,
};

const personal = [];
for (let i = 2; i < filas.length; i++) {
  const f = filas[i];
  const nombre = String(f[COL.nombre] ?? "").trim();
  if (!nombre) continue;
  personal.push({
    nombre,
    llave: clave(nombre),
    cedula: String(f[COL.cedula] ?? "").replace(/\D/g, ""),
    codigo: String(f[COL.codigo] ?? "").trim(),
    estatus: String(f[COL.estatus] ?? "").trim().toUpperCase(),
    puesto: String(f[COL.puesto] ?? "").trim(),
    denominacion: String(f[COL.denominacion] ?? "").trim(),
    celular: String(f[COL.celular] ?? "").replace(/\s/g, ""),
    correo: String(f[COL.correo] ?? "").trim().toLowerCase(),
    salida: String(f[COL.salida] ?? "").trim(),
  });
}

console.log(`\n\x1b[1m  Base de Talento Humano\x1b[0m`);
console.log(`    registros: ${personal.length}`);
console.log(
  `    marcados ACTIVO: ${personal.filter((p) => p.estatus === "ACTIVO").length}`,
);
console.log(
  `    con cédula válida: ${personal.filter((p) => cedulaValida(p.cedula)).length}`,
);

// --- Cruzar con lo cargado --------------------------------------------------
const { data: guardias } = await db
  .from("guardias")
  .select("id,nombre,cedula,telefono,credencial,puesto_habitual_id,es_relevo");

const porLlave = new Map();
for (const p of personal) {
  // Si alguien aparece dos veces, gana el que sigue activo.
  const previo = porLlave.get(p.llave);
  if (!previo || (p.estatus === "ACTIVO" && previo.estatus !== "ACTIVO")) {
    porLlave.set(p.llave, p);
  }
}

const encontrados = [];
const sinFicha = [];
for (const g of guardias ?? []) {
  const p = porLlave.get(clave(g.nombre));
  if (p) encontrados.push({ g, p });
  else sinFicha.push(g);
}

console.log(`\n\x1b[1m  Cruce con los agentes cargados\x1b[0m`);
console.log(`    agentes en la app: ${guardias?.length ?? 0}`);
console.log(`    encontrados en Talento Humano: ${encontrados.length}`);
console.log(`    sin ficha: ${sinFicha.length}`);

const conCedula = encontrados.filter(({ p }) => cedulaValida(p.cedula));
const cedulaMala = encontrados.filter(
  ({ p }) => p.cedula && !cedulaValida(p.cedula),
);
console.log(`    con cédula válida: ${conCedula.length}`);
if (cedulaMala.length) {
  console.log(`\n  \x1b[33m!\x1b[0m Cédulas que no pasan el dígito verificador:`);
  for (const { g, p } of cedulaMala) {
    console.log(`      ${g.nombre.padEnd(40)} ${p.cedula}`);
  }
}
if (sinFicha.length) {
  console.log(`\n  \x1b[33m!\x1b[0m En la app pero no en Talento Humano:`);
  for (const g of sinFicha) console.log(`      ${g.nombre}`);
}

// Puesto de trabajo segun Talento Humano: resuelve La Selva y UNIB.E.
console.log(`\n\x1b[1m  Puesto de trabajo según Talento Humano\x1b[0m`);
const porPuesto = new Map();
for (const { g, p } of encontrados) {
  const k = p.puesto || "(sin puesto)";
  if (!porPuesto.has(k)) porPuesto.set(k, []);
  porPuesto.get(k).push({ nombre: g.nombre, denominacion: p.denominacion });
}
for (const [puesto, gente] of [...porPuesto].sort()) {
  console.log(`    ${puesto}  (${gente.length})`);
  for (const x of gente) {
    console.log(`        ${x.nombre.padEnd(40)} ${x.denominacion}`);
  }
}

// --- Escribir ---------------------------------------------------------------
if (!APLICAR) {
  console.log(
    `\n  Solo informe. Para escribir cédula, teléfono y credencial:\n    npm run cruzar:personal -- aplicar\n`,
  );
  process.exit(0);
}

let escritos = 0;
let choques = 0;
for (const { g, p } of conCedula) {
  if (g.cedula === p.cedula) continue;

  // La cedula es unica: si ya la tiene otra ficha, no se pisa en silencio.
  const { data: ocupada } = await db
    .from("guardias")
    .select("id,nombre")
    .eq("cedula", p.cedula)
    .neq("id", g.id)
    .maybeSingle();
  if (ocupada) {
    console.log(
      `  \x1b[33m!\x1b[0m ${p.cedula} ya está en «${ocupada.nombre}»; no se toca ${g.nombre}.`,
    );
    choques++;
    continue;
  }

  const { error } = await db
    .from("guardias")
    .update({
      cedula: p.cedula,
      telefono: p.celular || g.telefono,
      credencial: p.codigo || g.credencial,
    })
    .eq("id", g.id);

  if (error) console.log(`  ERROR en ${g.nombre}: ${error.message}`);
  else escritos++;
}

console.log(`\n  actualizados: ${escritos}   choques de cédula: ${choques}`);
const { count } = await db
  .from("guardias")
  .select("*", { count: "exact", head: true })
  .not("cedula", "is", null);
console.log(`  agentes con cédula en la app: ${count}\n`);
