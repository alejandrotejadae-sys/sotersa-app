/**
 * Siembra datos de demostracion en el proyecto de Supabase.
 *
 *   npm run sembrar:demo
 *
 * Crea lo minimo para poder USAR la app del guardia hoy:
 *   - Zona "Norte de Quito"
 *   - Empresa cliente "Edificio Citimed"
 *   - Puesto P-01 "Lobby y acceso peatonal" (24 h)
 *   - Un guardia con cuenta de ingreso
 *   - Un turno que cubre el momento actual, para que haya algo que abrir
 *
 * Es idempotente: si ya existe, no duplica.
 *
 * ATENCION: usa la llave de servicio, que se salta RLS. Corre solo en tu
 * maquina y nunca desde el navegador. Estos son datos de PRUEBA — antes de
 * operar de verdad hay que borrarlos y cargar los puestos y guardias reales.
 */

import { createClient } from "@supabase/supabase-js";
import { cedulaACorreo, cedulaEsValida } from "../src/lib/auth.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secreta) {
  console.error(`
  Falta SUPABASE_SERVICE_ROLE_KEY en .env.local.

  Se toma de Supabase > Project Settings > API Keys > Secret keys ("default").
  Es la llave que se salta todas las politicas RLS: va solo en .env.local,
  nunca en el navegador ni en el repositorio.
`);
  process.exit(1);
}

// --- Datos de la demo -------------------------------------------------------
const CEDULA = "1710034065";
const PIN = "482913"; // de prueba; en produccion se fuerza cambio al primer ingreso
const NOMBRE_GUARDIA = "Juan Pérez";

if (!cedulaEsValida(CEDULA)) {
  console.error(`  La cedula ${CEDULA} no pasa el digito verificador.`);
  process.exit(1);
}

const db = createClient(url, secreta, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function paso(t) {
  console.log(`  \x1b[32m·\x1b[0m ${t}`);
}

/** Inserta si no existe, y devuelve la fila en ambos casos. */
async function asegurar(tabla, filtro, valores) {
  const consulta = db.from(tabla).select("*");
  for (const [k, v] of Object.entries(filtro)) consulta.eq(k, v);
  const { data: existente } = await consulta.maybeSingle();
  if (existente) return existente;

  const { data, error } = await db
    .from(tabla)
    .insert({ ...filtro, ...valores })
    .select()
    .single();
  if (error) throw new Error(`${tabla}: ${error.message}`);
  return data;
}

console.log("\n\x1b[1m  Sembrando datos de demostración\x1b[0m\n");

const zona = await asegurar("zonas", { nombre: "Norte de Quito" }, {});
paso(`Zona: ${zona.nombre}`);

const empresa = await asegurar(
  "empresas_cliente",
  { nombre: "Edificio Citimed" },
  {
    direccion: "Av. Mariana de Jesús OE7-02 y Nuño de Valderrama, Quito",
    contacto_correo: "edificiocitimed@gmail.com",
    contacto_telefono: "(02) 3 515 101",
  },
);
paso(`Cliente: ${empresa.nombre}`);

const puesto = await asegurar(
  "puestos",
  { empresa_cliente_id: empresa.id, codigo: "P-01" },
  {
    zona_id: zona.id,
    nombre: "Lobby y acceso peatonal",
    cobertura_horas: 24,
    armado: false,
    direccion: "Av. Mariana de Jesús OE7-02, Quito",
  },
);
paso(`Puesto: ${puesto.codigo} — ${puesto.nombre}`);

// Contactos que el arte impreso deja "POR COMPLETAR EN CADA PUESTO".
for (const c of [
  { tipo: "central_monitoreo", nombre: "Central SOTERSA", telefono: "+593 99 847 1459" },
  { tipo: "administracion_cliente", nombre: "Administración Citimed", telefono: "(02) 3 515 101" },
  { tipo: "supervisor_zona", nombre: "Supervisor Norte", telefono: "+593 99 000 0000" },
  { tipo: "jefe_operaciones", nombre: "Jefatura de Operaciones", telefono: "+593 99 000 0001" },
]) {
  await asegurar("contactos_puesto", { puesto_id: puesto.id, tipo: c.tipo }, c);
}
paso("Contactos del puesto: 4");

// --- Cuenta del guardia -----------------------------------------------------
const correo = cedulaACorreo(CEDULA);
const { data: usuarios } = await db.auth.admin.listUsers();
let usuario = usuarios?.users.find((u) => u.email === correo);

if (!usuario) {
  const { data, error } = await db.auth.admin.createUser({
    email: correo,
    password: PIN,
    email_confirm: true, // el correo es sintetico: no hay bandeja que confirmar
    app_metadata: { rol: "guardia" }, // el rol NUNCA lo declara el usuario
    user_metadata: { nombre: NOMBRE_GUARDIA },
  });
  if (error) throw new Error(`crear usuario: ${error.message}`);
  usuario = data.user;
  paso(`Cuenta creada: ${correo}`);
} else {
  paso(`Cuenta ya existía: ${correo}`);
}

const guardia = await asegurar(
  "guardias",
  { cedula: CEDULA },
  { perfil_id: usuario.id, nombre: NOMBRE_GUARDIA, credencial: "CRD-0001" },
);
paso(`Guardia: ${guardia.nombre}`);

// --- Turno que cubre AHORA --------------------------------------------------
const inicio = new Date(Date.now() - 60 * 60 * 1000); // empezo hace 1 hora
const fin = new Date(Date.now() + 11 * 60 * 60 * 1000); // turno de 12 h

const { data: turnoVigente } = await db
  .from("turnos")
  .select("id")
  .eq("guardia_id", guardia.id)
  .lte("inicio_programado", new Date().toISOString())
  .gte("fin_programado", new Date().toISOString())
  .maybeSingle();

if (turnoVigente) {
  paso("Turno vigente: ya existía");
} else {
  const { error } = await db.from("turnos").insert({
    puesto_id: puesto.id,
    guardia_id: guardia.id,
    tipo: "fijo_dia",
    inicio_programado: inicio.toISOString(),
    fin_programado: fin.toISOString(),
  });
  if (error) throw new Error(`turno: ${error.message}`);
  paso(`Turno creado: ${inicio.toLocaleTimeString("es-EC")} → ${fin.toLocaleTimeString("es-EC")}`);
}

console.log(`
\x1b[1m  Listo. Para entrar a la app:\x1b[0m

    Cédula: ${CEDULA}
    PIN:    ${PIN}

  Estos son datos de PRUEBA. Antes de operar de verdad hay que borrarlos
  y cargar los puestos y guardias reales.
`);
