/**
 * Carga los datos reales de operacion desde el cuadro de costos.
 *
 *   npm run cargar:reales -- clientes     (clientes y puestos)
 *   npm run cargar:reales -- personal     (requiere la migracion 002)
 *
 * Fuente: G:/Mi unidad/Sotersa/07_Confidencial/cuadro de costos Sotersa.xlsx,
 * hoja "Agosto" (la vigente). Es idempotente: se puede volver a correr.
 *
 * NO inventa datos. Lo que no esta en la fuente queda vacio y se reporta:
 * cedulas, RUC, direcciones, telefonos y contactos por puesto.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !secreta) {
  console.error("  Falta la llave de servicio en .env.local");
  process.exit(1);
}
const db = createClient(url, secreta, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const modo = process.argv[2] ?? "clientes";
const paso = (t) => console.log(`  \x1b[32m·\x1b[0m ${t}`);
const aviso = (t) => console.log(`  \x1b[33m!\x1b[0m ${t}`);

/**
 * Clientes con su cantidad de puestos, segun la hoja Agosto.
 * El nombre es el rotulo interno del cuadro: la razon social y el RUC todavia
 * no estan en ninguna fuente, y no se inventan.
 */
const CLIENTES = [
  { clave: "flp", nombre: "FLP", puntos: 1, cobertura: null },
  { clave: "la selva", nombre: "La Selva", puntos: 2, cobertura: 24 },
  { clave: "napoles", nombre: "Napoles", puntos: 1, cobertura: 24 },
  { clave: "boreal", nombre: "Boreal", puntos: 1, cobertura: 24 },
  { clave: "meta", nombre: "Meta", puntos: 1, cobertura: 24 },
  { clave: "marfil", nombre: "Marfil", puntos: 1, cobertura: 24 },
  { clave: "colina", nombre: "Colina", puntos: 1, cobertura: 24 },
  { clave: "unibe", nombre: "UNIB.E", puntos: 3, cobertura: 24 },
];

/** Personal de la nomina de agosto. Sin cedula: no consta en la fuente. */
const PERSONAL = [
  ["HERNANDEZ CEVALLOS KEVIN WLADIMIR", "boreal"],
  ["MARCILLO ZAMBRANO LUIS ALFREDO", "boreal"],
  ["GANCHOZO HERNANDEZ JORDY ALEJANDRO", "colina"],
  ["VASCONEZ CORNEJO ROBERTO GERMAN", "colina"],
  ["CHANG RAMOS RICHARD CRISTIAN", "flp"],
  ["GUEVARA TRUJILLO JONATHAN MILTON", "flp"],
  ["MENESES CABANILLA DANIEL ANTONIO", "hospital"],
  ["PAEZ ENCARNACION MICHAEL ALEXANDER", "hospital"],
  ["JEMPEKAT CHAMIK DIEGO ROMARIO", "la selva"],
  ["PEÑAFIEL CAGMA CRISTIAN DAVID", "la selva"],
  ["PUWAINCHIR CAÑIRZA MARCELO ALCIDES", "la selva"],
  ["GARCIA JUANGA JAIME GUSTAVO", "la selva"],
  ["SALINAS ORELLANA FRALKLIN GEOVANNY", "la selva"],
  ["MORA BENALCAZAR JOSELITO RAMON", "marfil"],
  ["VILLACRESES ALMENDARIZ DARIO FRANCISCO", "marfil"],
  ["CAMPOS CHERREZ MAURO GERMAN", "napoles"],
  ["SARANGO VIVANCO CARLOS ENRIQUE", "napoles"],
  ["BALAREZO TOBAR CARLOS JERALD", "unibe"],
  ["BENAVIDES ASTUDILLO JHONATHAN ALBERTO", "unibe"],
  ["CASTRO RODRIGUEZ LUIS RAÚL", "unibe"],
  ["CHANALUISA CHILIQUINGA LUIS FERNANDO", "unibe"],
  ["RAMIREZ ELIZALDE HILTON YASMANI", "unibe"],
  ["VEGA CASTILLO CESAR AUGUSTO", "unibe"],
  ["NOLIVOS ÑACATO EDWIN JOSE", "unibe"],
  ["CAMPAÑA TULCAN CRISTHIAN DAVID", "saca franco"],
  ["PRADO MONSTES JAVIER JOSUE", "saca franco"],
  ["SANTOS VARGAS EDISON ALEXIS", "saca vacaciones"],
];

async function asegurar(tabla, filtro, valores) {
  const q = db.from(tabla).select("*");
  for (const [k, v] of Object.entries(filtro)) q.eq(k, v);
  const { data: existente } = await q.maybeSingle();
  if (existente) return { fila: existente, nuevo: false };
  const { data, error } = await db
    .from(tabla)
    .insert({ ...filtro, ...valores })
    .select()
    .single();
  if (error) throw new Error(`${tabla}: ${error.message}`);
  return { fila: data, nuevo: true };
}

console.log(`\n\x1b[1m  Cargando datos reales — ${modo}\x1b[0m\n`);

if (modo === "clientes") {
  let nC = 0,
    nP = 0;
  for (const c of CLIENTES) {
    const { fila: emp, nuevo } = await asegurar(
      "empresas_cliente",
      { nombre: c.nombre },
      {},
    );
    if (nuevo) nC++;
    for (let i = 1; i <= c.puntos; i++) {
      const codigo = `P-${String(i).padStart(2, "0")}`;
      const { nuevo: np } = await asegurar(
        "puestos",
        { empresa_cliente_id: emp.id, codigo },
        {
          nombre: c.puntos === 1 ? "Puesto principal" : `Puesto ${i}`,
          cobertura_horas: c.cobertura ?? 24,
        },
      );
      if (np) nP++;
    }
    paso(`${c.nombre.padEnd(10)} ${c.puntos} puesto(s)`);
  }
  console.log("");
  paso(`clientes nuevos: ${nC}   puestos nuevos: ${nP}`);
  aviso("Sin RUC, dirección ni contacto: no constan en el cuadro de costos.");
  aviso("FLP figura como tipo de puesto «Otro»; se cargó 24 h por defecto.");
} else if (modo === "personal") {
  // Mapa cliente -> su primer puesto, para dejar anotado donde trabaja cada uno.
  const { data: emps } = await db.from("empresas_cliente").select("id, nombre");
  const porNombre = new Map((emps ?? []).map((e) => [e.nombre.toLowerCase(), e.id]));
  const clavePorNombre = new Map(CLIENTES.map((c) => [c.clave, c.nombre.toLowerCase()]));

  let n = 0,
    sinPuesto = 0;
  for (const [nombre, clave] of PERSONAL) {
    const nombreEmp = clavePorNombre.get(clave);
    const empId = nombreEmp ? porNombre.get(nombreEmp) : null;

    let puestoId = null;
    if (empId) {
      const { data: ps } = await db
        .from("puestos")
        .select("id")
        .eq("empresa_cliente_id", empId)
        .order("codigo");
      // Solo se anota el puesto si el cliente tiene uno: con varios, el cuadro
      // no dice en cual esta cada guardia y no se adivina.
      if (ps?.length === 1) puestoId = ps[0].id;
    }
    if (!puestoId) sinPuesto++;

    // Se busca por nombre en vez de usar un índice único sobre el nombre:
    // dos personas pueden llamarse igual, y no conviene grabar esa suposición
    // en el esquema solo para poder repetir esta carga.
    await asegurar(
      "guardias",
      { nombre },
      { puesto_habitual_id: puestoId, activo: true },
    );
    n++;
  }
  paso(`personal cargado: ${n}`);
  aviso(`${sinPuesto} sin puesto fijo anotado (relevos o clientes con varios puestos).`);
  aviso("Todos sin cédula ni credencial: no constan en la fuente.");
  aviso("Sin cédula no pueden tener cuenta de acceso — la cédula es el usuario.");
}

console.log("");
