/**
 * Ingreso del personal de campo: cedula + PIN.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NO CORREO Y CONTRASEÑA
 * ---------------------------------------------------------------------------
 * Un guardia no tiene correo corporativo. Pedirle un correo y una contraseña
 * de 12 caracteres es garantizar que no entra a la app, y que a la semana
 * vuelve al cuaderno. Entra con lo que siempre lleva encima: su cedula.
 *
 * ---------------------------------------------------------------------------
 * COMO SE IMPLEMENTA
 * ---------------------------------------------------------------------------
 * Supabase Auth trabaja con correo y contraseña. En vez de escribir un sistema
 * de autenticacion propio — que es de las peores ideas posibles en seguridad —
 * se traduce la cedula a un correo interno sintetico:
 *
 *     1712345678  ->  1712345678@guardias.sotersa.app
 *
 * Ese correo no existe ni recibe nada: es solo el identificador que Supabase
 * necesita. El PIN es la contraseña. Asi se conserva todo lo que Supabase ya
 * hace bien (hash de la credencial, rotacion de sesion, auth.uid() para RLS).
 *
 * ---------------------------------------------------------------------------
 * LO QUE ESTO CUESTA — dicho ahora, no cuando falle
 * ---------------------------------------------------------------------------
 * Un PIN de 6 digitos es UN MILLON de combinaciones. Contra un atacante que
 * pueda probar sin limite, eso no es nada. Lo que lo hace aceptable aqui:
 *
 *   - Hay que conocer una cedula valida Y activa en el sistema.
 *   - Una cuenta de guardia comprometida solo puede leer su propio turno y
 *     registrar novedades: no ve otros clientes, no valida, no borra. El
 *     daño posible esta acotado por RLS, no por el PIN.
 *   - Supabase limita intentos por IP de fabrica.
 *
 * Lo que FALTA y no es opcional antes de produccion:
 *   - [ ] Bloqueo de la cuenta tras N intentos fallidos (Fase 2).
 *   - [ ] PIN de 6 digitos obligatorio, y rechazar los obvios (123456, la
 *         propia cedula, fechas de nacimiento).
 *   - [ ] Cambio de PIN forzado en el primer ingreso.
 *
 * Para supervisor, admin y cliente NO se usa esto: esos si entran con correo
 * real y contraseña, porque manejan datos de varios puestos a la vez.
 */

/** Dominio interno. No envia ni recibe correo; solo identifica. */
export const DOMINIO_GUARDIAS = "guardias.sotersa.app";

export const PIN_LARGO = 6;

/** PINs que se rechazan por obvios. */
const PINS_PROHIBIDOS = new Set([
  "000000",
  "111111",
  "123456",
  "654321",
  "121212",
  "112233",
  "999999",
]);

/** Deja la cedula en 10 digitos, sin espacios ni guiones. */
export function normalizarCedula(cedula: string): string {
  return cedula.replace(/\D/g, "");
}

/**
 * Valida una cedula ecuatoriana con su digito verificador (modulo 10).
 * Evita crear cuentas con numeros tecleados mal, que despues nadie puede
 * usar y hay que depurar a mano.
 */
export function cedulaEsValida(cedula: string): boolean {
  const c = normalizarCedula(cedula);
  if (c.length !== 10) return false;

  const provincia = Number(c.slice(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  if (Number(c[2]) > 5) return false; // 6 y 7 no son cedulas de persona natural

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let producto = Number(c[i]) * coeficientes[i];
    if (producto > 9) producto -= 9;
    suma += producto;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(c[9]);
}

/** Traduce la cedula al correo interno que usa Supabase Auth. */
export function cedulaACorreo(cedula: string): string {
  return `${normalizarCedula(cedula)}@${DOMINIO_GUARDIAS}`;
}

/** Recupera la cedula desde el correo interno. */
export function correoACedula(correo: string): string | null {
  const [usuario, dominio] = correo.split("@");
  return dominio === DOMINIO_GUARDIAS ? usuario : null;
}

export type ResultadoPin = { valido: true } | { valido: false; motivo: string };

export function validarPin(pin: string, cedula?: string): ResultadoPin {
  if (!/^\d+$/.test(pin)) {
    return { valido: false, motivo: "El PIN debe ser solo numeros." };
  }
  if (pin.length !== PIN_LARGO) {
    return { valido: false, motivo: `El PIN debe tener ${PIN_LARGO} digitos.` };
  }
  if (PINS_PROHIBIDOS.has(pin)) {
    return { valido: false, motivo: "Ese PIN es demasiado facil de adivinar." };
  }
  if (/^(\d)\1+$/.test(pin)) {
    return { valido: false, motivo: "El PIN no puede ser un mismo digito repetido." };
  }
  if (cedula && normalizarCedula(cedula).includes(pin)) {
    return { valido: false, motivo: "El PIN no puede salir de su propia cedula." };
  }
  return { valido: true };
}
