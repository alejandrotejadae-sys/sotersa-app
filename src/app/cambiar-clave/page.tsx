import { exigirPerfil } from "@/lib/sesion";
import { PantallaClave } from "./pantalla-clave";

export const metadata = { title: "Cambiar contraseña — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaCambiarClave() {
  const { perfil, user } = await exigirPerfil(["admin", "supervisor", "cliente", "guardia"], { permitirClaveTemporal: true });
  const temporal = user.user_metadata?.debe_cambiar_clave === true;
  return <PantallaClave esGuardia={perfil.rol === "guardia"} nombre={perfil.nombre} temporal={temporal} />;
}
