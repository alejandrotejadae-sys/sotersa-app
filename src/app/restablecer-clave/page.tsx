import { exigirPerfil } from "@/lib/sesion";
import { PantallaClave } from "@/app/cambiar-clave/pantalla-clave";

export const metadata = { title: "Restablecer contraseña — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaRestablecerClave() {
  const { perfil } = await exigirPerfil(["admin", "supervisor", "cliente", "guardia"], { permitirClaveTemporal: true });
  return <PantallaClave esGuardia={perfil.rol === "guardia"} nombre={perfil.nombre} recuperacion />;
}
