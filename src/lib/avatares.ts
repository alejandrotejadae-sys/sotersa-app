import "server-only";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

/**
 * Enlace a la foto de perfil.
 *
 * El contenedor `avatares-perfil` es PRIVADO: son caras de trabajadores de una
 * empresa de seguridad. Público las dejaría accesibles para siempre a
 * cualquiera con el enlace, sin sesión y sin dejar rastro — y para personal
 * que hace custodia armada eso no es un detalle.
 *
 * Por eso en `user_metadata.avatar_path` se guarda la ruta, y el enlace se
 * firma al mostrarlo.
 */
const VIGENCIA_SEGUNDOS = 60 * 60;

export async function firmarAvatar(
  ruta: string | null | undefined,
): Promise<string | undefined> {
  if (!ruta) return undefined;

  // Compatibilidad: los avatares subidos antes de este cambio guardaron una
  // URL completa. Se deja pasar en vez de romper la pantalla.
  if (ruta.startsWith("http")) return ruta;

  try {
    const { data } = await crearClienteAdministrador()
      .storage.from("avatares-perfil")
      .createSignedUrl(ruta, VIGENCIA_SEGUNDOS);
    return data?.signedUrl;
  } catch {
    // Sin foto la pantalla sigue sirviendo: se pierde el retrato, no el perfil.
    return undefined;
  }
}
