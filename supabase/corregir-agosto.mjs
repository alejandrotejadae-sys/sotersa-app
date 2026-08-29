/**
 * Correcciones sobre la carga de agosto, según lo aclarado por operaciones:
 *
 *   - "Meta" y "Hospital" son el mismo cliente: HOSPITAL AMERICANO.
 *     Un puesto de 24 h con 2 agentes fijos y un saca francos.
 *   - UNIB.E son 3 puestos de 24 h: 6 guardias fijos y un saca francos.
 *   - Los saca francos cubren distintos puestos, no uno fijo.
 *
 *   npm run corregir:agosto
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const db = createClient(url, secreta, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const paso = (t) => console.log(`  \x1b[32m·\x1b[0m ${t}`);
const aviso = (t) => console.log(`  \x1b[33m!\x1b[0m ${t}`);

/** Los 2 fijos del Hospital Americano, según la nómina (columna PUESTO). */
const FIJOS_HOSPITAL = [
  "MENESES CABANILLA DANIEL ANTONIO",
  "PAEZ ENCARNACION MICHAEL ALEXANDER",
];

/** Relevos: cubren distintos puestos, sin puesto fijo. */
const RELEVOS = [
  "CAMPAÑA TULCAN CRISTHIAN DAVID",
  "PRADO MONSTES JAVIER JOSUE",
  "SANTOS VARGAS EDISON ALEXIS",
];

console.log("\n\x1b[1m  Corrigiendo la carga de agosto\x1b[0m\n");

// --- 1. Meta pasa a llamarse Hospital Americano -----------------------------
const { data: meta } = await db
  .from("empresas_cliente")
  .select("id, nombre")
  .eq("nombre", "Meta")
  .maybeSingle();

let hospitalId = null;
if (meta) {
  const { error } = await db
    .from("empresas_cliente")
    .update({ nombre: "Hospital Americano" })
    .eq("id", meta.id);
  if (error) throw new Error(error.message);
  hospitalId = meta.id;
  paso('«Meta» renombrado a «Hospital Americano»');
} else {
  const { data } = await db
    .from("empresas_cliente")
    .select("id")
    .eq("nombre", "Hospital Americano")
    .maybeSingle();
  hospitalId = data?.id ?? null;
  paso("«Hospital Americano» ya estaba corregido");
}

// --- 2. Su puesto: 24 h, con nombre real ------------------------------------
let puestoHospital = null;
if (hospitalId) {
  const { data: ps } = await db
    .from("puestos")
    .select("id")
    .eq("empresa_cliente_id", hospitalId)
    .order("codigo");
  puestoHospital = ps?.[0]?.id ?? null;
  if (puestoHospital) {
    await db
      .from("puestos")
      .update({ nombre: "Puesto principal", cobertura_horas: 24 })
      .eq("id", puestoHospital);
    paso("Puesto del Hospital Americano: 24 h");
  }
}

// --- 3. Los 2 fijos del hospital quedan anclados a ese puesto ---------------
let nFijos = 0;
for (const nombre of FIJOS_HOSPITAL) {
  const { error, count } = await db
    .from("guardias")
    .update({ puesto_habitual_id: puestoHospital, es_relevo: false }, { count: "exact" })
    .eq("nombre", nombre);
  if (error) throw new Error(error.message);
  nFijos += count ?? 0;
}
paso(`Agentes fijos del Hospital Americano asignados: ${nFijos}`);

// --- 4. Relevos marcados y sin puesto fijo ----------------------------------
let nRelevos = 0;
for (const nombre of RELEVOS) {
  const { error, count } = await db
    .from("guardias")
    .update({ es_relevo: true, puesto_habitual_id: null }, { count: "exact" })
    .eq("nombre", nombre);
  if (error) throw new Error(error.message);
  nRelevos += count ?? 0;
}
paso(`Relevos marcados (sin puesto fijo): ${nRelevos}`);

// --- 5. Resumen de dotación por cliente -------------------------------------
const { data: empresas } = await db
  .from("empresas_cliente")
  .select("id, nombre")
  .order("nombre");
const { data: guardias } = await db
  .from("guardias")
  .select("nombre, puesto_habitual_id, es_relevo");

console.log("\n\x1b[1m  Dotación por cliente\x1b[0m");
for (const e of empresas ?? []) {
  const { data: ps } = await db
    .from("puestos")
    .select("id, cobertura_horas")
    .eq("empresa_cliente_id", e.id);
  const ids = new Set((ps ?? []).map((p) => p.id));
  const asignados = (guardias ?? []).filter((g) => ids.has(g.puesto_habitual_id));
  // Un puesto de 24 h necesita 2 fijos de 12 h.
  const requeridos = (ps ?? []).reduce(
    (t, p) => t + (p.cobertura_horas >= 24 ? 2 : 1),
    0,
  );
  const falta = requeridos - asignados.length;
  console.log(
    `  ${e.nombre.padEnd(20)} ${String(ps?.length ?? 0).padStart(2)} puesto(s)  ` +
      `${String(asignados.length).padStart(2)}/${requeridos} fijos` +
      (falta > 0 ? `  \x1b[33mfaltan ${falta}\x1b[0m` : falta < 0 ? `  \x1b[33m${-falta} de más\x1b[0m` : ""),
  );
}

const relevos = (guardias ?? []).filter((g) => g.es_relevo);
const sueltos = (guardias ?? []).filter((g) => !g.es_relevo && !g.puesto_habitual_id);
console.log(`\n  relevos: ${relevos.length}`);
console.log(`  sin puesto anotado y sin marcar como relevo: ${sueltos.length}`);
if (sueltos.length) {
  aviso("Estos siguen sin puesto — el cuadro no dice en cuál de los varios están:");
  for (const g of sueltos) console.log(`      ${g.nombre}`);
}
console.log("");
