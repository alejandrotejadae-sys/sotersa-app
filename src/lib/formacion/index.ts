/**
 * Escuela de Formacion SOTERSA: plan de estudios.
 *
 * El contenido vive en el codigo, como los protocolos: se versiona, se revisa
 * en un cambio y no depende de que alguien lo cargue en una tabla. Lo que si
 * va a la base es el avance de cada persona (lecciones completadas y
 * resultados de evaluacion), en formacion_progreso y formacion_evaluaciones.
 *
 * Citas legales: Ley Organica de Vigilancia y Seguridad Privada (LOVSP),
 * Registro Oficial Suplemento 496 de 9 de febrero de 2024, fe de erratas
 * Suplemento 507 de 28 de febrero de 2024; y Codigo Organico Integral Penal
 * (COIP). Los articulos citados se tomaron del texto oficial. Esta escuela es
 * formacion INTERNA de SOTERSA: no sustituye los cursos de Nivel I y II ni el
 * reentrenamiento bienal, que solo pueden impartir centros acreditados por el
 * ente rector (LOVSP Art. 50-53 y 66).
 *
 * Recursos externos: todos fueron verificados al momento de escribirlos; si
 * un video desaparece, el enlace simplemente abre YouTube con el aviso.
 */

export * from "./tipos";
import type { Modulo } from "./tipos";
import { MODULOS_BASE } from "./base";
import { MODULOS_PERSONAL } from "./personal";
import { MODULOS_OPERACION } from "./operacion";
import { MODULOS_CLIENTES } from "./clientes";
import { MODULOS_TRANSVERSAL } from "./transversal";

/** Orden en que se muestran: base, integridad y bienestar, operacion, por cliente, transversales. */
export const MODULOS: Modulo[] = [...MODULOS_BASE, ...MODULOS_PERSONAL, ...MODULOS_OPERACION, ...MODULOS_CLIENTES, ...MODULOS_TRANSVERSAL];

/** Como se presenta el catalogo: por bloques, con un titulo que explica el porque. */
export const GRUPOS: { titulo: string; detalle: string; modulos: Modulo[] }[] = [
  { titulo: "Base del oficio", detalle: "Lo que todo agente debe saber antes de su primer turno.", modulos: MODULOS_BASE },
  { titulo: "La persona y la integridad", detalle: "Bienestar, dinero, familia; y lo que BASC exige de cada uno.", modulos: MODULOS_PERSONAL },
  { titulo: "Herramientas del oficio", detalle: "La app, la radio, los primeros auxilios y la desescalada.", modulos: MODULOS_OPERACION },
  { titulo: "Por tipo de cliente", detalle: "Solo para quien esta asignado a ese tipo de puesto.", modulos: MODULOS_CLIENTES },
  { titulo: "Supervision y transversales", detalle: "Liderazgo, fraudes y proteccion de datos.", modulos: MODULOS_TRANSVERSAL },
];

/** Modulos que cuentan para la "formacion basica completa" de cualquier agente. */
export const MODULOS_BASICOS = MODULOS.filter((m) => (m.alcance ?? "todos") === "todos");

export function modulo(id: string) {
  return MODULOS.find((m) => m.id === id) ?? null;
}

export function leccion(moduloId: string, leccionId: string) {
  const m = modulo(moduloId);
  const indice = m?.lecciones.findIndex((l) => l.id === leccionId) ?? -1;
  if (!m || indice < 0) return null;
  return { modulo: m, leccion: m.lecciones[indice], indice, siguiente: m.lecciones[indice + 1] ?? null, anterior: m.lecciones[indice - 1] ?? null };
}

/** Identificador de leccion tal como se guarda en formacion_progreso. */
export function claveLeccion(moduloId: string, leccionId: string) {
  return `${moduloId}/${leccionId}`;
}

export const TOTAL_LECCIONES = MODULOS.reduce((n, m) => n + m.lecciones.length, 0);
export const TOTAL_LECCIONES_BASICAS = MODULOS_BASICOS.reduce((n, m) => n + m.lecciones.length, 0);
