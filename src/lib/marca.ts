/**
 * SOTERSA — fuente unica de verdad de los datos institucionales.
 *
 * Regla de la casa (heredada de comexbox-app): ningun dato de contacto
 * se escribe a mano en un componente. Si cambia un telefono, se cambia
 * aqui y en ningun otro lugar.
 *
 * Convencion de la casa para documentos formales: los campos sin
 * verificar se marcan POR VALIDAR, nunca se inventan.
 */

export const MARCA = {
  /** Marca comercial. */
  nombre: "SOTERSA",
  /** Razon social — la que va en documentos formales y contratos. */
  razonSocial: "SOTER CIA. LTDA.",
  tagline: "Seguridad Estratégica",

  contacto: {
    telefono: "+593 99 847 1459",
    /** Formato E.164, para enlaces tel: y wa.me */
    telefonoE164: "+593998471459",
    correo: "ventas@sotersa.com",
    sitio: "https://sotersa.com",
    direccion: "Azuay E2-192 y Av. República",
    ciudad: "Quito",
    pais: "Ecuador",
  },

  certificacion: {
    esquema: "BASC",
    descripcion: "Business Alliance for Secure Commerce",
    sistema: "Sistema de Gestión en Control y Seguridad",
    /**
     * POR VALIDAR — el material de puesto (Normas de Garita y Protocolos
     * de Emergencia) devuelve dos codigos distintos al leerlo por OCR:
     * "ECUVIC00659" en el encabezado y "ECUUI000659" en el pie.
     * Puede ser ruido del OCR o una diferencia real en el arte.
     * Contrastar contra el certificado fisico antes de publicarlo.
     */
    codigo: null as string | null,
  },
} as const;

/** Linea unica de emergencias del Ecuador. Gratuita desde fijo o celular. */
export const ECU911 = "911";

/**
 * Formatea un monto en dolares con la convencion ecuatoriana ($1.234,56).
 * Mismo criterio que comexbox-app: en Ecuador la coma es el separador
 * decimal, no el punto.
 */
export function formatearUSD(monto: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(monto);
}

/**
 * Formatea una fecha/hora para la bitacora, en horario de Ecuador.
 * La bitacora siempre muestra la hora de CAPTURA, nunca la de
 * sincronizacion: una novedad registrada a las 02:14 sin señal debe
 * seguir apareciendo como 02:14 cuando el telefono suba el dato.
 */
export function formatearHora(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(d);
}
