import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("code");
  const siguiente = request.nextUrl.searchParams.get("next");
  const destino = siguiente === "/restablecer-clave" ? siguiente : "/restablecer-clave";
  if (codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(destino, request.url));
  }
  return NextResponse.redirect(new URL("/recuperar?error=enlace", request.url));
}
