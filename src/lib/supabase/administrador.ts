import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la llave de servicio. SE SALTA TODAS LAS POLITICAS RLS.
 *
 * El import de "server-only" hace que la compilacion FALLE si algun dia
 * alguien importa este archivo desde un componente de cliente. Es una red de
 * seguridad a proposito: si esta llave llega al navegador, se filtra la base
 * entera — todos los clientes, todas las bitacoras, todos los guardias.
 *
 * Usar SOLO para lo que necesita saltarse RLS de forma legitima:
 *   - Dar de alta guardias y usuarios (crear cuentas en Auth).
 *   - Tareas de mantenimiento del panel interno.
 *
 * Nunca para leer datos que una politica RLS ya sabe filtrar.
 */
export function crearClienteAdministrador() {
  const llave =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!llave) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY en el servidor. " +
        "Se toma de Supabase > Project Settings > API Keys > Secret keys.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, llave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
