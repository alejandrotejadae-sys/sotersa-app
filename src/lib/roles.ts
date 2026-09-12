import type { RolUsuario } from "@/lib/tipos";

/**
 * Que puede hacer cada rol, en dos preguntas.
 *
 * - esLector: ve todo lo que ve el administrador (paneles, clientes, agentes,
 *   cuentas, portal de cualquier cliente). admin y operativo.
 * - puedeEditar: crea, edita, asigna, restablece claves, bloquea. Solo admin.
 *
 * El rol "operativo" existe para la central: mirar todo sin poder tocar. La
 * base de datos aplica lo mismo con sus politicas (lectura ampliada, escritura
 * solo admin), asi que esta separacion no depende de que una pantalla se
 * acuerde de esconder un boton.
 */
export function esLector(rol: RolUsuario | string | null | undefined) {
  return rol === "admin" || rol === "operativo";
}

export function puedeEditar(rol: RolUsuario | string | null | undefined) {
  return rol === "admin";
}

export const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  operativo: "Operativo",
  supervisor: "Supervisor",
  guardia: "Agente de seguridad",
  cliente: "Cliente",
};
