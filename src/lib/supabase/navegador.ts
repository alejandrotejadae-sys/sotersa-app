import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador (componentes con "use client").
 *
 * Usa la llave anonima, que es publica a proposito: toda la proteccion real
 * vive en las politicas RLS de la base de datos, no en esconder esta llave.
 */
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
