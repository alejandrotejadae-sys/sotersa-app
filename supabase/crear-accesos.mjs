/**
 * Crea la cuenta de acceso de cada agente que ya tiene cédula.
 *
 *   npm run crear:accesos            -> informa, no crea nada
 *   npm run crear:accesos -- aplicar -> crea las cuentas
 *
 * Usuario: la cédula (se traduce a cedula@guardias.sotersa.app, ver
 * src/lib/auth.ts). Clave temporal: la misma para todos, decidida por
 * operaciones para el despliegue inicial.
 *
 * ATENCIÓN — riesgo conocido y aceptado:
 * Una clave igual para todos significa que, entre que se crea la cuenta y el
 * agente entra por primera vez, cualquiera que sepa una cédula puede entrar
 * como esa persona. Lo que lo acota:
 *   - debe_cambiar_clave obliga a cambiarla en el primer ingreso, y el
 *     middleware bloquea toda la app hasta que lo haga.
 *   - Una cuenta de guardia solo ve su propio turno y registra novedades.
 * Aun así, conviene entregar las credenciales el mismo día en que se pide
 * entrar, no semanas antes.
 */

import { createClient } from "@supabase/supabase-js";

const CLAVE_TEMPORAL = "123456";
const DOMINIO = "guardias.sotersa.app";
const APLICAR = process.argv.includes("aplicar");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: guardias } = await db
  .from("guardias")
  .select("id,nombre,cedula,perfil_id,activo")
  .eq("activo", true)
  .order("nombre");

const conCedula = (guardias ?? []).filter((g) => g.cedula);
const sinCedula = (guardias ?? []).filter((g) => !g.cedula);
const yaTienen = conCedula.filter((g) => g.perfil_id);
const porCrear = conCedula.filter((g) => !g.perfil_id);

console.log(`\n\x1b[1m  Cuentas de acceso\x1b[0m`);
console.log(`    agentes activos:      ${guardias?.length ?? 0}`);
console.log(`    con cédula:           ${conCedula.length}`);
console.log(`    ya tienen cuenta:     ${yaTienen.length}`);
console.log(`    \x1b[36mpor crear:            ${porCrear.length}\x1b[0m`);
if (sinCedula.length) {
  console.log(`    \x1b[33msin cédula (no pueden tener cuenta): ${sinCedula.length}\x1b[0m`);
  for (const g of sinCedula) console.log(`        ${g.nombre}`);
}

if (!APLICAR) {
  console.log(
    `\n  Solo informe. Para crearlas:\n    npm run crear:accesos -- aplicar\n`,
  );
  process.exit(0);
}

console.log(`\n\x1b[1m  Creando\x1b[0m`);
let creadas = 0;
let fallos = 0;

for (const g of porCrear) {
  const correo = `${g.cedula}@${DOMINIO}`;

  const { data, error } = await db.auth.admin.createUser({
    email: correo,
    password: CLAVE_TEMPORAL,
    // El correo es sintético: no hay bandeja que confirmar.
    email_confirm: true,
    // El rol NUNCA sale de lo que mande el usuario.
    app_metadata: { rol: "guardia" },
    user_metadata: {
      nombre: g.nombre,
      rol: "guardia",
      debe_cambiar_clave: true,
    },
  });

  if (error) {
    console.log(`  \x1b[31m×\x1b[0m ${g.nombre}: ${error.message}`);
    fallos++;
    continue;
  }

  const { error: errorVinculo } = await db
    .from("guardias")
    .update({ perfil_id: data.user.id })
    .eq("id", g.id);

  if (errorVinculo) {
    // Sin vínculo la cuenta entra pero no encuentra su ficha: mejor deshacer
    // que dejar una cuenta huérfana que nadie sabe a quién pertenece.
    await db.auth.admin.deleteUser(data.user.id);
    console.log(`  \x1b[31m×\x1b[0m ${g.nombre}: no se pudo vincular, cuenta deshecha`);
    fallos++;
    continue;
  }

  console.log(`  \x1b[32m·\x1b[0m ${g.nombre.padEnd(42)} ${g.cedula}`);
  creadas++;
}

console.log(`\n  creadas: ${creadas}   fallos: ${fallos}`);
console.log(`
  \x1b[1mCómo entran:\x1b[0m
    Usuario: su número de cédula
    Clave:   ${CLAVE_TEMPORAL}

  La app los obliga a cambiarla en el primer ingreso, y no los deja pasar de
  esa pantalla hasta que lo hagan.
`);
