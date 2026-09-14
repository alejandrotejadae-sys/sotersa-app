"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil, uno } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { cedulaEsValida } from "@/lib/auth";
import { leerCsv, leerLibro } from "@/lib/xlsx";

export type EstadoCargaPersonal = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  errores?: string[];
  avisos?: string[];
  resumen?: { creados: number; actualizados: number; bajas: number; sinCambios: number };
};

const MAX_FILAS = 500;

/**
 * Carga o actualiza el listado de personal desde Excel/CSV. La cedula es la
 * llave: si ya existe, se actualiza la ficha con lo que traiga la fila; si no,
 * se crea. Solo crea la FICHA operativa: el acceso a la app (cuenta y PIN) se
 * sigue creando en Usuarios y permisos, que es el unico lugar autorizado.
 *
 * Columnas (la primera fila es cabecera; el orden no importa):
 *   Cedula | Nombre (o Apellidos + Nombres) | Telefono | Credencial | Cliente | Puesto | Relevo | Estado
 *
 * Validacion todo o nada: una cedula invalida o un nombre vacio detienen la
 * carga completa con la lista de filas. Un puesto que no se encuentra NO
 * detiene: se crea la ficha sin plaza y se avisa.
 */
export async function cargarPersonal(_: EstadoCargaPersonal, formData: FormData): Promise<EstadoCargaPersonal> {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { tipo: "error", mensaje: "Elige un archivo .xlsx o .csv." };
  if (archivo.size > 3 * 1024 * 1024) return { tipo: "error", mensaje: "El archivo supera 3 MB." };

  await exigirPerfil(["admin"]);

  let filas: string[][];
  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    if (/\.csv$/i.test(archivo.name)) filas = leerCsv(buffer.toString("utf8"));
    else {
      const hojas = leerLibro(buffer);
      const hoja = hojas.find((h) => h.filas.some((f) => f.some(Boolean))) ?? hojas[0];
      if (!hoja) return { tipo: "error", mensaje: "El archivo no tiene hojas con datos." };
      filas = hoja.filas;
    }
  } catch {
    return { tipo: "error", mensaje: "No pude leer el archivo. Guárdalo como .xlsx (Excel) o .csv y vuelve a intentar." };
  }

  filas = filas.filter((f) => f.some((c) => String(c ?? "").trim()));
  if (filas.length < 2) return { tipo: "error", mensaje: "El archivo no tiene filas de personal." };
  if (filas.length - 1 > MAX_FILAS) return { tipo: "error", mensaje: `Máximo ${MAX_FILAS} personas por archivo.` };

  const cab = filas[0].map(normalizar);
  const col = (...nombres: string[]) => { for (const n of nombres) { const i = cab.findIndex((c) => c === n || c.startsWith(n)); if (i >= 0) return i; } return -1; };
  const iCedula = col("cedula", "ci", "identificacion", "documento");
  const iNombre = col("nombre completo", "nombre y apellido", "nombres y apellidos", "apellidos y nombres", "agente", "guardia", "nombre");
  const iApellidos = col("apellidos", "apellido");
  const iNombres = cab.findIndex((c) => c === "nombres");
  const iTelefono = col("telefono", "celular", "movil", "contacto");
  const iCredencial = col("credencial", "carnet", "licencia", "codigo");
  const iCliente = col("cliente", "empresa");
  const iPuesto = col("puesto", "plaza");
  const iRelevo = col("relevo", "saca francos", "sacafrancos");
  const iEstado = col("estado", "situacion", "activo");
  if (iCedula < 0) return { tipo: "error", mensaje: "Falta la columna Cédula en la cabecera. Descarga la plantilla para ver el formato." };
  if (iNombre < 0 && !(iApellidos >= 0 && iNombres >= 0)) return { tipo: "error", mensaje: "Falta la columna Nombre (o Apellidos y Nombres). Descarga la plantilla." };

  const administrador = crearClienteAdministrador();
  const [{ data: existentes }, { data: puestos }] = await Promise.all([
    administrador.from("guardias").select("id,cedula,nombre,telefono,credencial,activo,es_relevo,puesto_habitual_id"),
    administrador.from("puestos").select("id,codigo,nombre,empresas_cliente(nombre)").eq("activo", true),
  ]);
  const porCedula = new Map((existentes ?? []).filter((g) => g.cedula).map((g) => [g.cedula!, g]));
  const porNombre = new Map((existentes ?? []).filter((g) => !g.cedula).map((g) => [normalizar(g.nombre), g]));
  const catalogoPuestos = (puestos ?? []).map((p) => ({ id: p.id, codigo: normalizar(p.codigo).toUpperCase(), empresa: normalizar(uno(p.empresas_cliente)?.nombre ?? "") }));

  type Fila = { n: number; cedula: string; nombre: string; telefono: string | null; credencial: string | null; puestoId: string | null | undefined; esRelevo: boolean | undefined; activo: boolean | undefined };
  const validas: Fila[] = [];
  const errores: string[] = [];
  const avisos: string[] = [];
  const vistas = new Set<string>();

  for (let r = 1; r < filas.length; r++) {
    const f = filas[r];
    const n = r + 1;
    const celda = (i: number) => (i >= 0 ? String(f[i] ?? "").trim() : "");

    const cedula = celda(iCedula).replace(/\D/g, "").padStart(celda(iCedula).replace(/\D/g, "").length === 9 ? 10 : 0, "0");
    if (!cedulaEsValida(cedula)) { errores.push(`Fila ${n}: cédula «${celda(iCedula)}» no válida.`); continue; }
    if (vistas.has(cedula)) { errores.push(`Fila ${n}: la cédula ${cedula} está repetida en el archivo.`); continue; }
    vistas.add(cedula);

    const nombre = titulo(iNombre >= 0 && celda(iNombre) ? celda(iNombre) : `${celda(iNombres)} ${celda(iApellidos)}`).slice(0, 100);
    if (nombre.length < 3) { errores.push(`Fila ${n}: falta el nombre.`); continue; }

    const telefonoCrudo = celda(iTelefono).replace(/[^\d+]/g, "");
    const telefono = telefonoCrudo ? (telefonoCrudo.length === 9 && !telefonoCrudo.startsWith("+") ? `0${telefonoCrudo}` : telefonoCrudo).slice(0, 15) : null;
    if (telefono && telefono.length < 7) { errores.push(`Fila ${n}: teléfono «${celda(iTelefono)}» no válido.`); continue; }
    const credencial = celda(iCredencial).slice(0, 40) || null;

    let puestoId: string | null | undefined = undefined;
    const codigo = normalizar(celda(iPuesto)).toUpperCase();
    const cliente = normalizar(celda(iCliente));
    if (codigo || cliente) {
      const candidatos = catalogoPuestos.filter((p) => (!codigo || p.codigo === codigo) && (!cliente || p.empresa.includes(cliente) || cliente.includes(p.empresa)));
      if (candidatos.length === 1) puestoId = candidatos[0].id;
      else if (candidatos.length === 0) avisos.push(`Fila ${n} (${nombre}): no encontré el puesto «${[celda(iCliente), celda(iPuesto)].filter(Boolean).join(" ")}»; queda sin plaza.`);
      else avisos.push(`Fila ${n} (${nombre}): «${[celda(iCliente), celda(iPuesto)].filter(Boolean).join(" ")}» coincide con ${candidatos.length} puestos; queda sin plaza. Indica cliente y código.`);
    }

    const relevoTexto = normalizar(celda(iRelevo));
    const esRelevo = relevoTexto ? /^(si|s|x|1|true|relevo|saca)/.test(relevoTexto) : undefined;
    const estadoTexto = normalizar(celda(iEstado));
    const activo = estadoTexto ? !/^(baja|inactivo|retirado|salida|no|0|false|desvinculado|liquidado)/.test(estadoTexto) : undefined;

    validas.push({ n, cedula, nombre, telefono, credencial, puestoId, esRelevo, activo });
  }

  if (errores.length) return { tipo: "error", mensaje: `No se cargó nada: ${errores.length} fila${errores.length === 1 ? "" : "s"} con error. Corrige y vuelve a subir.`, errores: errores.slice(0, 40) };
  if (validas.length === 0) return { tipo: "error", mensaje: "No hay personas válidas en el archivo." };

  let creados = 0, actualizados = 0, bajas = 0, sinCambios = 0;
  const nuevos: { cedula: string; nombre: string; telefono: string | null; credencial: string | null; puesto_habitual_id: string | null; es_relevo: boolean; activo: boolean }[] = [];

  for (const v of validas) {
    const actual = porCedula.get(v.cedula) ?? porNombre.get(normalizar(v.nombre));
    if (!actual) {
      nuevos.push({ cedula: v.cedula, nombre: v.nombre, telefono: v.telefono, credencial: v.credencial, puesto_habitual_id: v.puestoId ?? null, es_relevo: v.esRelevo ?? false, activo: v.activo ?? true });
      continue;
    }
    // Existente: solo se tocan los campos que la fila trae con valor.
    const cambios: Record<string, unknown> = {};
    if (!actual.cedula) cambios.cedula = v.cedula;
    if (v.nombre && v.nombre !== actual.nombre) cambios.nombre = v.nombre;
    if (v.telefono && v.telefono !== actual.telefono) cambios.telefono = v.telefono;
    if (v.credencial && v.credencial !== actual.credencial) cambios.credencial = v.credencial;
    if (v.puestoId && v.puestoId !== actual.puesto_habitual_id) cambios.puesto_habitual_id = v.puestoId;
    if (v.esRelevo !== undefined && v.esRelevo !== actual.es_relevo) cambios.es_relevo = v.esRelevo;
    if (v.activo !== undefined && v.activo !== actual.activo) { cambios.activo = v.activo; if (!v.activo) cambios.puesto_habitual_id = null; }
    if (Object.keys(cambios).length === 0) { sinCambios += 1; continue; }
    const { error } = await administrador.from("guardias").update(cambios).eq("id", actual.id);
    if (error) return { tipo: "error", mensaje: `No pude actualizar a ${v.nombre} (fila ${v.n}). Se detuvo la carga ahí.`, errores: [error.message] };
    if (cambios.activo === false) bajas += 1; else actualizados += 1;
  }

  if (nuevos.length) {
    const { error } = await administrador.from("guardias").insert(nuevos);
    if (error) return { tipo: "error", mensaje: "La base de datos rechazó las fichas nuevas. Las actualizaciones de los existentes sí se guardaron.", errores: [error.message] };
    creados = nuevos.length;
  }

  for (const ruta of ["/operacion/personal", "/operacion/usuarios", "/operacion/dotacion", "/operacion/clientes", "/admin", "/supervisor"]) revalidatePath(ruta);

  const partes = [`${creados} ficha${creados === 1 ? "" : "s"} nueva${creados === 1 ? "" : "s"}`, `${actualizados} actualizada${actualizados === 1 ? "" : "s"}`];
  if (bajas) partes.push(`${bajas} dada${bajas === 1 ? "" : "s"} de baja`);
  if (sinCambios) partes.push(`${sinCambios} sin cambios`);
  return {
    tipo: "exito",
    mensaje: `Listo: ${partes.join(" · ")}.${creados ? " Para darles acceso a la app, crea sus cuentas en Usuarios y permisos." : ""}`,
    avisos: avisos.slice(0, 40),
    resumen: { creados, actualizados, bajas, sinCambios },
  };
}

function normalizar(s: string) { return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " "); }
/** "PEREZ JUAN" -> "Perez Juan"; respeta partículas como "de", "del", "la". */
function titulo(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase().split(" ").map((p) => (["de", "del", "la", "los", "las", "y"].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(" ");
}
