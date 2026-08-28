import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

const HASH_AUTORIZADO = "7f1f1b7c9d6aabecb52664df022277259f07e797294ffbeabd7fcbc65595254b";

function autorizado(token: string) {
  const recibido = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const esperado = Buffer.from(HASH_AUTORIZADO);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function POST(request: NextRequest) {
  const cabecera = request.headers.get("authorization") ?? "";
  const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "";
  if (!autorizado(token)) return NextResponse.json({ ok: false }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!cuerpo?.password || cuerpo.password.length < 20) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const db = crearClienteAdministrador();
    const { data: listado, error: errorListado } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (errorListado) throw errorListado;
    const usuario = listado.users.find((candidato) => candidato.email === "atejada@sotersa.com");
    if (!usuario) throw new Error("cuenta_no_encontrada");

    const { error: errorUsuario } = await db.auth.admin.updateUserById(usuario.id, {
      password: cuerpo.password,
      email_confirm: true,
      app_metadata: { ...usuario.app_metadata, rol: "admin" },
      user_metadata: { ...usuario.user_metadata, nombre: "Alejandro Tejada" },
    });
    if (errorUsuario) throw errorUsuario;

    const { error: errorPerfil } = await db.from("perfiles").upsert({
      id: usuario.id,
      rol: "admin",
      nombre: "Alejandro Tejada",
      activo: true,
      empresa_cliente_id: null,
      zona_id: null,
    });
    if (errorPerfil) throw errorPerfil;

    return NextResponse.json({ ok: true, usuario: "atejada", rol: "admin" });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
