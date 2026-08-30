import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión y protege el flujo de acceso en cada petición. */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/guardia" && request.nextUrl.searchParams.get("desde") !== "perfiles" && request.headers.get("sec-fetch-dest") === "document") {
    const destino = request.nextUrl.clone(); destino.pathname = "/perfiles"; destino.search = ""; return NextResponse.redirect(destino);
  }
  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesAEstablecer) {
        cookiesAEstablecer.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesAEstablecer.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const rutasClave = new Set(["/cambiar-clave", "/restablecer-clave", "/recuperar", "/acceso", "/ingreso", "/auth/callback"]);
  if (user?.user_metadata?.debe_cambiar_clave === true && !rutasClave.has(request.nextUrl.pathname)) {
    const destino = request.nextUrl.clone(); destino.pathname = "/cambiar-clave"; destino.search = ""; return NextResponse.redirect(destino);
  }
  return respuesta;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|sin-conexion|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
