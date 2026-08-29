/**
 * Radiografia del estado real de la base.
 *
 *   npm run escanear
 *
 * Usa la llave de servicio para ver TODO, sin el filtro de RLS: la idea es
 * saber que hay de verdad, no que veria un rol concreto.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secreta) {
  console.error("  Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const db = createClient(url, secreta, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const hora = (v) =>
  v
    ? new Intl.DateTimeFormat("es-EC", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Guayaquil",
      }).format(new Date(v))
    : "—";

const T = (t) => `\x1b[1m${t}\x1b[0m`;
const dim = (t) => `\x1b[2m${t}\x1b[0m`;

console.log(`\n${T("PROYECTO")}  ${url}\n`);

// --- Conteos ---------------------------------------------------------------
const TABLAS = [
  "zonas",
  "empresas_cliente",
  "perfiles",
  "guardias",
  "puestos",
  "contactos_puesto",
  "puntos_ronda",
  "turnos",
  "aperturas_turno",
  "novedades",
  "rondas",
];

console.log(T("CONTEO POR TABLA"));
const conteos = {};
for (const t of TABLAS) {
  const { count, error } = await db
    .from(t)
    .select("*", { count: "exact", head: true });
  conteos[t] = error ? `error: ${error.message}` : count;
  const n = conteos[t];
  const marca = n === 0 ? dim("vacía") : `${n}`;
  console.log(`  ${t.padEnd(20)} ${String(marca).padStart(6)}`);
}

// --- Usuarios de Auth ------------------------------------------------------
const { data: au } = await db.auth.admin.listUsers({ perPage: 200 });
console.log(`\n${T("CUENTAS DE ACCESO")}  (${au?.users.length ?? 0})`);
for (const u of au?.users ?? []) {
  const rol = u.app_metadata?.rol ?? "sin rol";
  const nom = u.user_metadata?.nombre ?? "";
  console.log(
    `  ${String(rol).padEnd(11)} ${String(u.email).padEnd(38)} ${nom}  ${dim(
      "último ingreso " + hora(u.last_sign_in_at),
    )}`,
  );
}

// --- Clientes y puestos ----------------------------------------------------
const { data: empresas } = await db
  .from("empresas_cliente")
  .select("id, nombre, ruc, activo")
  .order("nombre");
console.log(`\n${T("CLIENTES Y PUESTOS")}`);
for (const e of empresas ?? []) {
  const { data: ps } = await db
    .from("puestos")
    .select("id, codigo, nombre, cobertura_horas, armado, activo")
    .eq("empresa_cliente_id", e.id)
    .order("codigo");
  console.log(
    `  ${e.nombre}${e.ruc ? dim(" · RUC " + e.ruc) : ""}${e.activo ? "" : dim(" (inactivo)")}`,
  );
  if (!ps?.length) console.log(dim("      sin puestos"));
  for (const p of ps ?? []) {
    const { count: nPuntos } = await db
      .from("puntos_ronda")
      .select("*", { count: "exact", head: true })
      .eq("puesto_id", p.id);
    const { count: nCont } = await db
      .from("contactos_puesto")
      .select("*", { count: "exact", head: true })
      .eq("puesto_id", p.id);
    console.log(
      `      ${p.codigo}  ${p.nombre.padEnd(34)} ${String(p.cobertura_horas).padStart(2)}h` +
        `${p.armado ? "  armado" : "        "}  ${dim(`${nPuntos} puntos · ${nCont} contactos`)}`,
    );
  }
}

// --- Personal --------------------------------------------------------------
const { data: gs } = await db
  .from("guardias")
  .select("nombre, cedula, credencial, activo, perfil_id")
  .order("nombre");
console.log(`\n${T("PERSONAL")}  (${gs?.length ?? 0})`);
for (const g of gs ?? []) {
  console.log(
    `  ${g.nombre.padEnd(24)} CI ${g.cedula}  ${String(g.credencial ?? "—").padEnd(10)}` +
      `${g.perfil_id ? "" : dim("  SIN CUENTA DE ACCESO")}${g.activo ? "" : dim("  inactivo")}`,
  );
}

// --- Turnos ----------------------------------------------------------------
const ahora = new Date().toISOString();
const { data: vigentes } = await db
  .from("turnos")
  .select("inicio_programado, fin_programado, tipo, estado, guardia_id, puesto_id")
  .lte("inicio_programado", ahora)
  .gte("fin_programado", ahora);
const { count: futuros } = await db
  .from("turnos")
  .select("*", { count: "exact", head: true })
  .gt("inicio_programado", ahora);
console.log(`\n${T("TURNOS")}`);
console.log(`  vigentes ahora: ${vigentes?.length ?? 0}   programados a futuro: ${futuros ?? 0}`);
for (const t of vigentes ?? []) {
  console.log(
    `      ${hora(t.inicio_programado)} → ${hora(t.fin_programado)}  ${t.tipo}  ${t.estado}`,
  );
}

// --- Actividad -------------------------------------------------------------
const { data: nov } = await db
  .from("novedades")
  .select("tipo, severidad, estado, hora_captura, visible_cliente")
  .order("hora_captura", { ascending: false })
  .limit(5);
console.log(`\n${T("BITÁCORA")}  (${conteos.novedades} novedades, ${conteos.rondas} rondas)`);
for (const n of nov ?? [])
  console.log(
    `      ${hora(n.hora_captura)}  ${n.severidad.padEnd(12)} ${n.estado.padEnd(11)} ${n.tipo}` +
      `${n.visible_cliente ? "  visible al cliente" : ""}`,
  );
if (!nov?.length) console.log(dim("      sin registros"));

// --- Vistas ----------------------------------------------------------------
const { data: sinApertura } = await db.from("v_puestos_sin_apertura").select("*");
console.log(`\n${T("ALERTAS")}`);
console.log(`  puestos sin apertura: ${sinApertura?.length ?? 0}`);
for (const p of sinApertura ?? [])
  console.log(
    `      ${p.puesto_codigo} ${p.puesto_nombre} · ${p.guardia_nombre} · ${p.minutos_de_retraso} min de retraso`,
  );

console.log("");
