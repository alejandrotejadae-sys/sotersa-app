/**
 * Verifica el proyecto de Supabase EN LA NUBE, no una imitacion local.
 *
 *   npm run verificar:nube
 *
 * Entra como visitante anonimo, que es el peor caso: si algo se ve desde aqui,
 * se ve desde internet. Para cada tabla comprueba dos cosas a la vez:
 *
 *   - Que la tabla EXISTE  -> si no existiera, PostgREST responderia PGRST205.
 *   - Que RLS la protege   -> un anonimo debe recibir 0 filas, nunca datos.
 *
 * LIMITE CONOCIDO: con la base vacia, esta prueba no distingue "protegido" de
 * "no hay datos". Las fugas entre clientes se prueban en verificar-esquema.mjs,
 * que si siembra datos de dos clientes distintos.
 *
 * Nunca imprime la llave.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !llave) {
  console.error("\n  Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local\n");
  process.exit(1);
}

console.log(`\n  Proyecto: ${url}`);
console.log(`  Llave:    ${llave.slice(0, 15)}... (${llave.length} caracteres)\n`);

const supabase = createClient(url, llave);

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

const VISTAS = ["v_sla_novedades", "v_puestos_sin_apertura"];

let pasadas = 0;
let fallidas = 0;

function ok(t) { pasadas++; console.log(`  \x1b[32mOK\x1b[0m    ${t}`); }
function falla(t, d) { fallidas++; console.log(`  \x1b[31mFALLA\x1b[0m ${t}`); if (d) console.log(`        ${d}`); }

async function revisar(nombre, esVista) {
  const { data, error } = await supabase.from(nombre).select("*").limit(1);

  if (error) {
    // PGRST205 = no existe en el esquema expuesto.
    if (error.code === "PGRST205") {
      falla(`${nombre}`, "no existe — el schema.sql no llego a crearla");
    } else if (error.code === "42501" || /permission denied/i.test(error.message)) {
      // Denegar tambien es proteger: la tabla existe y no deja pasar.
      ok(`${nombre} — existe y RLS bloquea al anonimo`);
    } else {
      falla(`${nombre}`, `${error.code ?? ""} ${error.message}`);
    }
    return;
  }

  if (data.length === 0) {
    ok(`${nombre} — existe y ${esVista ? "no filtra nada" : "RLS bloquea al anonimo"}`);
  } else {
    falla(
      `${nombre}`,
      `DEVOLVIO ${data.length} fila(s) a un anonimo. Revisar RLS de inmediato.`,
    );
  }
}

console.log("\x1b[1m  Tablas\x1b[0m");
for (const t of TABLAS) await revisar(t, false);

console.log("\n\x1b[1m  Vistas\x1b[0m");
for (const v of VISTAS) await revisar(v, true);

// El ingreso con una cedula inexistente debe ser rechazado, no colgarse.
console.log("\n\x1b[1m  Autenticacion\x1b[0m");
const { error: errAuth } = await supabase.auth.signInWithPassword({
  email: "0000000000@guardias.sotersa.app",
  password: "000000",
});
if (errAuth) ok(`Auth responde y rechaza credenciales falsas ("${errAuth.message}")`);
else falla("Auth", "acepto una credencial que no deberia existir");

console.log(`\n\x1b[1m  Resultado:\x1b[0m ${pasadas} pasadas, ${fallidas} fallidas\n`);
process.exit(fallidas > 0 ? 1 : 0);
