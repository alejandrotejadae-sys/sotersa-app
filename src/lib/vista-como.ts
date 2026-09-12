import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * "Ver como": el administrador entra con la sesion real de otra cuenta para
 * ver la app tal cual la ve esa persona, con sus mismos permisos de base de
 * datos. Mientras dura, una cookie firmada recuerda quien es el admin de
 * verdad para poder volver sin escribir la clave.
 *
 * La cookie va firmada con la llave de servicio: nadie puede fabricarse una
 * que diga "yo soy el admin" sin tener esa llave, y esa llave nunca sale del
 * servidor.
 */
export const COOKIE_VISTA_COMO = "sotersa-vista-como";
const DURACION_MS = 2 * 60 * 60 * 1000;

export type VistaComo = {
  adminId: string;
  adminEmail: string;
  comoId: string;
  comoNombre: string;
  comoRol: string;
  expira: number;
};

function llave() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!k) throw new Error("Falta la llave de servicio para firmar la cookie de 'ver como'.");
  return k;
}

function firma(cuerpo: string) {
  return createHmac("sha256", llave()).update(cuerpo).digest("base64url");
}

export function serializarVistaComo(datos: Omit<VistaComo, "expira">) {
  const cuerpo = Buffer.from(JSON.stringify({ ...datos, expira: Date.now() + DURACION_MS })).toString("base64url");
  return `${cuerpo}.${firma(cuerpo)}`;
}

export function opcionesCookieVistaComo() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: DURACION_MS / 1000 };
}

export async function leerVistaComo(): Promise<VistaComo | null> {
  const valor = (await cookies()).get(COOKIE_VISTA_COMO)?.value;
  if (!valor) return null;
  const [cuerpo, sello] = valor.split(".");
  if (!cuerpo || !sello) return null;
  try {
    const esperado = Buffer.from(firma(cuerpo));
    const recibido = Buffer.from(sello);
    if (esperado.length !== recibido.length || !timingSafeEqual(esperado, recibido)) return null;
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as VistaComo;
    if (typeof datos.expira !== "number" || datos.expira < Date.now()) return null;
    return datos;
  } catch {
    return null;
  }
}
