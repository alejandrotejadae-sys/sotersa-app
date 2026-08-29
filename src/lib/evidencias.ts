import "server-only";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

/**
 * Enlaces a la evidencia fotográfica de una novedad.
 *
 * El contenedor `evidencias-novedades` es PRIVADO a propósito: son fotos de
 * incidentes dentro de instalaciones de clientes. Si fuera público, cualquiera
 * con el enlace vería el interior de un edificio ajeno, para siempre y sin
 * pasar por la app.
 *
 * Por eso en `novedades.foto_url` se guarda la RUTA dentro del contenedor, no
 * una URL. El enlace se firma al momento de mostrarlo y caduca solo.
 */

/** Una hora alcanza para revisar la novedad; después el enlace muere. */
const VIGENCIA_SEGUNDOS = 60 * 60;

/**
 * Convierte rutas en enlaces firmados. Recibe y devuelve un mapa para poder
 * firmar toda una lista con una sola llamada a Supabase.
 */
export async function firmarEvidencias(
  rutas: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const limpias = [...new Set(rutas.filter((r): r is string => !!r))];
  const firmadas = new Map<string, string>();
  if (limpias.length === 0) return firmadas;

  // Compatibilidad: las novedades guardadas antes de este cambio tienen una
  // URL completa. Se dejan pasar tal cual en vez de romper la pantalla.
  const yaSonUrl = limpias.filter((r) => r.startsWith("http"));
  for (const u of yaSonUrl) firmadas.set(u, u);

  const porFirmar = limpias.filter((r) => !r.startsWith("http"));
  if (porFirmar.length === 0) return firmadas;

  try {
    const { data } = await crearClienteAdministrador()
      .storage.from("evidencias-novedades")
      .createSignedUrls(porFirmar, VIGENCIA_SEGUNDOS);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) firmadas.set(item.path, item.signedUrl);
    }
  } catch {
    // Sin enlace firmado la novedad se sigue viendo: se pierde la foto, no
    // el registro. Una bitácora incompleta es mejor que una pantalla en error.
  }

  return firmadas;
}
