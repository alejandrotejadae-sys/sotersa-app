/**
 * Las sesiones de Supabase SSR se guardan en cookies con este patrón. Detectar
 * su presencia permite que las pantallas públicas no esperen a Supabase cuando
 * el visitante todavía no ha iniciado sesión.
 */
export function haySesionSupabase(cookies: Iterable<{ name: string }>) {
  for (const cookie of cookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) return true;
  }
  return false;
}
