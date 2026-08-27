/**
 * Verificacion del esquema contra un Postgres REAL, sin Docker y sin
 * credenciales: PGlite es Postgres compilado a WASM, corriendo en proceso.
 *
 *   node supabase/verificar-esquema.mjs
 *
 * Que prueba esto:
 *   - Que schema.sql corre entero, sin errores de sintaxis.
 *   - Que el trigger de inmutabilidad de novedades realmente bloquea.
 *   - Que el borrado de novedades esta bloqueado, incluso para el dueño.
 *   - Que el check de hora_captura futura rechaza relojes adelantados.
 *   - Que los sellos de tiempo de validacion se ponen solos.
 *   - Que las politicas RLS filtran de verdad, con un rol sin privilegios.
 *
 * Que NO prueba:
 *   - Supabase Auth de verdad (aqui auth.users y auth.uid() son un doble).
 *   - Storage, Realtime, ni los limites de intentos de ingreso.
 *   Eso solo se prueba en el proyecto de la nube.
 */

import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));

let pasadas = 0;
let fallidas = 0;

function ok(nombre) {
  pasadas++;
  console.log(`  \x1b[32mOK\x1b[0m    ${nombre}`);
}
function falla(nombre, detalle) {
  fallidas++;
  console.log(`  \x1b[31mFALLA\x1b[0m ${nombre}`);
  if (detalle) console.log(`        ${String(detalle).split("\n")[0]}`);
}

/** Espera que la consulta reviente, y que el mensaje contenga `fragmento`. */
async function debeFallar(db, nombre, sql, fragmento) {
  try {
    await db.exec(sql);
    falla(nombre, "la operacion fue permitida y debia ser rechazada");
  } catch (e) {
    if (fragmento && !String(e.message).includes(fragmento)) {
      falla(nombre, `rechazada, pero por otro motivo: ${e.message}`);
    } else {
      ok(nombre);
    }
  }
}

async function debePasar(db, nombre, sql) {
  try {
    await db.exec(sql);
    ok(nombre);
  } catch (e) {
    falla(nombre, e.message);
  }
}

// Sin esto, un error de PGlite vuelca el bundle entero de WASM en la consola.
process.on("uncaughtException", (e) => {
  console.error("\n  ERROR:", e.message);
  process.exit(1);
});

const db = new PGlite();

// ---------------------------------------------------------------------------
// Doble de prueba del entorno Supabase.
// En la nube esto lo pone Supabase; aqui lo imitamos para poder correr el
// mismo schema.sql sin tocarlo.
// ---------------------------------------------------------------------------
console.log("\n\x1b[1mPreparando el doble de Supabase (auth.users, auth.uid)\x1b[0m");

await db.exec(`
  create schema if not exists auth;

  create table if not exists auth.users (
    id                 uuid primary key default gen_random_uuid(),
    email              text unique,
    raw_app_meta_data  jsonb default '{}'::jsonb,
    raw_user_meta_data jsonb default '{}'::jsonb
  );

  -- auth.uid() real lee el JWT. Aqui lee una variable de sesion, que es lo
  -- que nos permite "actuar como" cada usuario en las pruebas de RLS.
  create or replace function auth.uid()
  returns uuid language sql stable
  as $$ select nullif(current_setting('prueba.uid', true), '')::uuid $$;
`);
ok("doble de auth creado");

// ---------------------------------------------------------------------------
// 1. El esquema corre entero
// ---------------------------------------------------------------------------
console.log("\n\x1b[1m1. Ejecutar schema.sql\x1b[0m");

const schema = await readFile(join(aqui, "schema.sql"), "utf8");
try {
  await db.exec(schema);
  ok("schema.sql corre completo, sin errores");
} catch (e) {
  falla("schema.sql corre completo", e.message);
  console.error("\n  No tiene sentido seguir. Detalle:\n", e.message);
  process.exit(1);
}

// Idempotencia: el archivo dice que se puede volver a correr.
try {
  await db.exec(schema);
  ok("schema.sql es idempotente (se puede volver a correr)");
} catch (e) {
  falla("schema.sql es idempotente", e.message);
}

// ---------------------------------------------------------------------------
// 2. Datos de prueba
// ---------------------------------------------------------------------------
console.log("\n\x1b[1m2. Sembrar datos de prueba\x1b[0m");

await db.exec(`
  insert into zonas (id, nombre)
    values ('11111111-1111-1111-1111-111111111111', 'Norte de Quito');

  insert into empresas_cliente (id, nombre, ruc)
    values ('22222222-2222-2222-2222-222222222222', 'Edificio Citimed', '1790000000001');
  insert into empresas_cliente (id, nombre)
    values ('22222222-2222-2222-2222-222222222223', 'UNIB.E');

  -- Usuarios: el trigger de auth.users debe crear el perfil solo.
  insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
    ('aaaaaaaa-0000-0000-0000-000000000001',
     '1710034065@guardias.sotersa.app',
     '{"rol":"guardia"}'::jsonb, '{"nombre":"Guardia Uno"}'::jsonb),
    ('aaaaaaaa-0000-0000-0000-000000000002',
     'supervisor@sotersa.com',
     '{"rol":"supervisor","zona_id":"11111111-1111-1111-1111-111111111111"}'::jsonb,
     '{"nombre":"Supervisor Norte"}'::jsonb),
    ('aaaaaaaa-0000-0000-0000-000000000003',
     'admin@sotersa.com',
     '{"rol":"admin"}'::jsonb, '{"nombre":"Operaciones"}'::jsonb),
    ('aaaaaaaa-0000-0000-0000-000000000004',
     'administracion@citimed.ec',
     '{"rol":"cliente","empresa_cliente_id":"22222222-2222-2222-2222-222222222222"}'::jsonb,
     '{"nombre":"Administracion Citimed"}'::jsonb),
    ('aaaaaaaa-0000-0000-0000-000000000005',
     'rectorado@unibe.edu.ec',
     '{"rol":"cliente","empresa_cliente_id":"22222222-2222-2222-2222-222222222223"}'::jsonb,
     '{"nombre":"Administracion UNIBE"}'::jsonb);

  insert into guardias (id, perfil_id, cedula, nombre) values
    ('bbbbbbbb-0000-0000-0000-000000000001',
     'aaaaaaaa-0000-0000-0000-000000000001', '1710034065', 'Guardia Uno');

  insert into puestos (id, empresa_cliente_id, zona_id, codigo, nombre, cobertura_horas)
    values ('cccccccc-0000-0000-0000-000000000001',
            '22222222-2222-2222-2222-222222222222',
            '11111111-1111-1111-1111-111111111111',
            'P-01', 'Lobby y acceso peatonal', 24);

  insert into turnos (id, puesto_id, guardia_id, tipo, inicio_programado, fin_programado)
    values ('dddddddd-0000-0000-0000-000000000001',
            'cccccccc-0000-0000-0000-000000000001',
            'bbbbbbbb-0000-0000-0000-000000000001',
            'fijo_noche', now() - interval '2 hours', now() + interval '10 hours');
`);
ok("datos sembrados");

const perfiles = await db.query(`select rol, nombre from perfiles order by nombre`);
if (perfiles.rows.length === 5) {
  ok(`el trigger de auth.users creo los 5 perfiles solo`);
} else {
  falla("trigger de perfiles", `se esperaban 5 perfiles, hay ${perfiles.rows.length}`);
}

const cli = perfiles.rows.find((r) => r.nombre === "Administracion Citimed");
if (cli?.rol === "cliente") ok("el rol se tomo de app_metadata, no de lo que mande el usuario");
else falla("rol desde app_metadata", `rol leido: ${cli?.rol}`);

// ---------------------------------------------------------------------------
// 3. Reglas de integridad de la bitacora
// ---------------------------------------------------------------------------
console.log("\n\x1b[1m3. Integridad de la bitacora\x1b[0m");

await db.exec(`
  insert into novedades (id, puesto_id, turno_id, guardia_id, tipo, severidad,
                         descripcion, hora_captura)
  values ('eeeeeeee-0000-0000-0000-000000000001',
          'cccccccc-0000-0000-0000-000000000001',
          'dddddddd-0000-0000-0000-000000000001',
          'bbbbbbbb-0000-0000-0000-000000000001',
          'acceso_no_autorizado', 'novedad',
          'Persona intenta ingresar sin registro por el lobby.',
          now() - interval '30 minutes');
`);
ok("novedad registrada");

await debeFallar(
  db,
  "no se puede editar la descripcion de una novedad",
  `update novedades set descripcion = 'otra cosa'
   where id = 'eeeeeeee-0000-0000-0000-000000000001'`,
  "inmutable",
);

await debeFallar(
  db,
  "no se puede mover la hora de captura",
  `update novedades set hora_captura = now()
   where id = 'eeeeeeee-0000-0000-0000-000000000001'`,
  "inmutable",
);

await debeFallar(
  db,
  "no se puede cambiar la severidad",
  `update novedades set severidad = 'informativa'
   where id = 'eeeeeeee-0000-0000-0000-000000000001'`,
  "inmutable",
);

await debeFallar(
  db,
  "no se puede borrar una novedad",
  `delete from novedades where id = 'eeeeeeee-0000-0000-0000-000000000001'`,
  "no se borra",
);

await debePasar(
  db,
  "el supervisor SI puede agregar su nota y validar",
  `update novedades
     set estado = 'validada',
         nota_supervisor = 'Confirmado por CCTV. Se orienta al visitante a recepcion.',
         visible_cliente = true
   where id = 'eeeeeeee-0000-0000-0000-000000000001'`,
);

const sellada = await db.query(
  `select estado, validada_en from novedades where id = 'eeeeeeee-0000-0000-0000-000000000001'`,
);
if (sellada.rows[0].validada_en) ok("validada_en se sello solo al validar");
else falla("sello de validada_en", "quedo nulo");

await debeFallar(
  db,
  "se rechaza una captura con el reloj adelantado",
  `insert into novedades (puesto_id, turno_id, guardia_id, tipo, descripcion, hora_captura)
   values ('cccccccc-0000-0000-0000-000000000001',
           'dddddddd-0000-0000-0000-000000000001',
           'bbbbbbbb-0000-0000-0000-000000000001',
           'prueba', 'Reloj del telefono adelantado 3 horas',
           now() + interval '3 hours')`,
  "captura_no_futura",
);

// ---------------------------------------------------------------------------
// 4. SLA
// ---------------------------------------------------------------------------
console.log("\n\x1b[1m4. Medicion del SLA de 15 minutos\x1b[0m");

await db.exec(`
  update novedades set estado = 'notificada'
  where id = 'eeeeeeee-0000-0000-0000-000000000001';
`);
const sla = await db.query(`select minutos_aviso, cumple_sla from v_sla_novedades`);
const fila = sla.rows[0];
if (fila && fila.minutos_aviso >= 29 && fila.minutos_aviso <= 31) {
  ok(`minutos_aviso calculado correctamente (${fila.minutos_aviso} min)`);
} else {
  falla("minutos_aviso", `valor inesperado: ${fila?.minutos_aviso}`);
}
if (fila && fila.cumple_sla === false) {
  ok("marca INCUMPLIDO un aviso de 30 min contra un SLA de 15");
} else {
  falla("cumple_sla", `valor inesperado: ${fila?.cumple_sla}`);
}

// ---------------------------------------------------------------------------
// 5. RLS con un rol sin privilegios
//
// PGlite corre como superusuario y el superusuario SE SALTA RLS. Para probar
// de verdad hay que crear un rol normal y actuar como el.
// ---------------------------------------------------------------------------
console.log("\n\x1b[1m5. Politicas RLS (con rol sin privilegios)\x1b[0m");

await db.exec(`
  do $$ begin
    create role app_usuario nologin;
  exception when duplicate_object then null; end $$;
  grant usage on schema public, auth to app_usuario;
  grant select, insert, update on all tables in schema public to app_usuario;
  grant select on auth.users to app_usuario;
  grant execute on all functions in schema public to app_usuario;
  grant execute on all functions in schema auth to app_usuario;
`);

/** Ejecuta una consulta actuando como un usuario concreto. */
async function comoUsuario(uid, sql) {
  await db.exec(`set local role app_usuario;`);
  await db.exec(`select set_config('prueba.uid', '${uid}', true);`);
  const r = await db.query(sql);
  await db.exec(`reset role;`);
  return r;
}

const CITIMED = "aaaaaaaa-0000-0000-0000-000000000004";
const UNIBE = "aaaaaaaa-0000-0000-0000-000000000005";

try {
  await db.exec("begin");
  const vistoCitimed = await comoUsuario(CITIMED, `select count(*)::int as n from novedades`);
  await db.exec("rollback");
  if (vistoCitimed.rows[0].n === 1) ok("el cliente Citimed ve su novedad validada");
  else falla("visibilidad Citimed", `ve ${vistoCitimed.rows[0].n}, se esperaba 1`);
} catch (e) {
  await db.exec("rollback").catch(() => {});
  falla("visibilidad Citimed", e.message);
}

try {
  await db.exec("begin");
  const vistoUnibe = await comoUsuario(UNIBE, `select count(*)::int as n from novedades`);
  await db.exec("rollback");
  if (vistoUnibe.rows[0].n === 0) ok("el cliente UNIB.E NO ve novedades de Citimed");
  else falla("aislamiento entre clientes", `ve ${vistoUnibe.rows[0].n}, debia ver 0`);
} catch (e) {
  await db.exec("rollback").catch(() => {});
  falla("aislamiento entre clientes", e.message);
}

// Una novedad sin validar no debe llegar al portal del cliente.
await db.exec(`
  insert into novedades (id, puesto_id, turno_id, guardia_id, tipo, descripcion, hora_captura)
  values ('eeeeeeee-0000-0000-0000-000000000002',
          'cccccccc-0000-0000-0000-000000000001',
          'dddddddd-0000-0000-0000-000000000001',
          'bbbbbbbb-0000-0000-0000-000000000001',
          'disciplina', 'Guardia saliente entrego el puesto sin limpiar.',
          now() - interval '10 minutes');
`);

try {
  await db.exec("begin");
  const r = await comoUsuario(CITIMED, `select count(*)::int as n from novedades`);
  await db.exec("rollback");
  if (r.rows[0].n === 1) ok("una novedad sin validar NO aparece en el portal del cliente");
  else falla("filtro de no validadas", `ve ${r.rows[0].n}, se esperaba 1`);
} catch (e) {
  await db.exec("rollback").catch(() => {});
  falla("filtro de no validadas", e.message);
}

try {
  await db.exec("begin");
  const r = await comoUsuario(CITIMED, `select count(*)::int as n from empresas_cliente`);
  await db.exec("rollback");
  if (r.rows[0].n === 1) ok("el cliente solo ve su propia empresa");
  else falla("aislamiento de empresas", `ve ${r.rows[0].n}, se esperaba 1`);
} catch (e) {
  await db.exec("rollback").catch(() => {});
  falla("aislamiento de empresas", e.message);
}

// Una vista corre con los permisos de SU DUEÑO salvo que se diga lo contrario,
// asi que puede saltarse el RLS de las tablas que consulta. Hay que probarlo
// con datos reales: con la base vacia, una vista insegura tambien devuelve 0.
try {
  await db.exec('begin');
  const r = await comoUsuario(UNIBE, 'select count(*)::int as n from v_sla_novedades');
  await db.exec('rollback');
  if (r.rows[0].n === 0) ok('la vista de SLA NO filtra datos de Citimed a UNIB.E');
  else falla("fuga por la vista v_sla_novedades",
    `UNIB.E ve ${r.rows[0].n} fila(s) del SLA de otro cliente`);
} catch (e) {
  await db.exec("rollback").catch(() => {});
  falla("fuga por la vista v_sla_novedades", e.message);
}

try {
  await db.exec("begin");
  const r = await comoUsuario(UNIBE, "select count(*)::int as n from v_puestos_sin_apertura");
  await db.exec("rollback");
  if (r.rows[0].n === 0) ok("la vista de puestos sin apertura NO filtra a UNIB.E");
  else falla("fuga por la vista v_puestos_sin_apertura",
    `UNIB.E ve ${r.rows[0].n} turno(s) de otro cliente`);
} catch (e) {
  await db.exec("rollback").catch(() => {});
  falla("fuga por la vista v_puestos_sin_apertura", e.message);
}

// ---------------------------------------------------------------------------
// 6. Alerta de puesto vacio
// ---------------------------------------------------------------------------
console.log("\n\x1b[1m6. Alerta de puesto vacio\x1b[0m");

const vacios = await db.query(`select puesto_codigo, minutos_de_retraso from v_puestos_sin_apertura`);
if (vacios.rows.length === 1 && vacios.rows[0].puesto_codigo === "P-01") {
  ok(`detecta el turno abierto sin apertura (${vacios.rows[0].minutos_de_retraso} min de retraso)`);
} else {
  falla("v_puestos_sin_apertura", `filas: ${vacios.rows.length}`);
}

await db.exec(`
  insert into aperturas_turno (turno_id, hora_captura, checklist)
  values ('dddddddd-0000-0000-0000-000000000001', now() - interval '2 hours',
          '{"radio":true,"camaras":true,"linterna":true,"bitacora":true}'::jsonb);
`);
const vacios2 = await db.query(`select count(*)::int as n from v_puestos_sin_apertura`);
if (vacios2.rows[0].n === 0) ok("la alerta se apaga cuando el guardia marca apertura");
else falla("apagado de la alerta", `siguen ${vacios2.rows[0].n}`);

// ---------------------------------------------------------------------------
console.log(
  `\n\x1b[1mResultado:\x1b[0m ${pasadas} pasadas, ${fallidas} fallidas\n`,
);
await db.close();
process.exit(fallidas > 0 ? 1 : 0);
