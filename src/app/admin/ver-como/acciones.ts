"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { COOKIE_VISTA_COMO, leerVistaComo, opcionesCookieVistaComo, serializarVistaComo } from "@/lib/vista-como";

const DESTINOS = new Set(["/", "/guardia/custodia"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Abre la sesion de otra cuenta sin conocer su clave: se genera un enlace
 * magico de un solo uso y se canjea aqui mismo, en el servidor. La sesion del
 * navegador pasa a ser la de esa persona; la cookie firmada guarda quien era
 * el admin para poder volver.
 */
export async function entrarComo(formData: FormData) {
  const { user: admin } = await exigirPerfil(["admin"]);
  if (!admin.email) redirect("/admin/ver-como?error=sin-correo");

  const perfilId = String(formData.get("perfil_id") ?? "");
  const destino = String(formData.get("destino") ?? "/");
  if (!UUID.test(perfilId) || !DESTINOS.has(destino)) redirect("/admin/ver-como?error=datos");
  if (perfilId === admin.id) redirect("/admin");

  const administrador = crearClienteAdministrador();
  const [{ data: perfil }, { data: cuenta }] = await Promise.all([
    administrador.from("perfiles").select("id,nombre,rol,activo").eq("id", perfilId).maybeSingle(),
    administrador.auth.admin.getUserById(perfilId),
  ]);
  if (!perfil || !cuenta?.user?.email) redirect("/admin/ver-como?error=no-existe");
  if (perfil.rol === "admin") redirect("/admin/ver-como?error=admin");
  if (!perfil.activo) redirect("/admin/ver-como?error=bloqueada");

  const { data: enlace, error } = await administrador.auth.admin.generateLink({ type: "magiclink", email: cuenta.user.email });
  const tokenHash = enlace?.properties?.hashed_token;
  if (error || !tokenHash) redirect("/admin/ver-como?error=enlace");

  const supabase = await crearClienteServidor();
  const { error: errorSesion } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (errorSesion) redirect("/admin/ver-como?error=sesion");

  (await cookies()).set(
    COOKIE_VISTA_COMO,
    serializarVistaComo({ adminId: admin.id, adminEmail: admin.email, comoId: perfil.id, comoNombre: perfil.nombre, comoRol: perfil.rol }),
    opcionesCookieVistaComo(),
  );
  redirect(destino);
}

/** Cierra la sesion prestada y restaura la del administrador. */
export async function volverAMiCuenta() {
  const vista = await leerVistaComo();
  const almacen = await cookies();
  almacen.delete(COOKIE_VISTA_COMO);
  if (!vista) redirect("/acceso");

  const administrador = crearClienteAdministrador();
  // Se comprueba que la cuenta a restaurar siga siendo admin y activa: la
  // cookie prueba quien la emitio, no que siga teniendo ese poder.
  const { data: perfilAdmin } = await administrador.from("perfiles").select("rol,activo").eq("id", vista.adminId).maybeSingle();
  if (!perfilAdmin || perfilAdmin.rol !== "admin" || !perfilAdmin.activo) redirect("/acceso");

  const { data: enlace, error } = await administrador.auth.admin.generateLink({ type: "magiclink", email: vista.adminEmail });
  const tokenHash = enlace?.properties?.hashed_token;
  if (error || !tokenHash) redirect("/acceso");

  const supabase = await crearClienteServidor();
  await supabase.auth.signOut({ scope: "local" });
  const { error: errorSesion } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (errorSesion) redirect("/acceso");
  redirect("/admin/ver-como");
}
