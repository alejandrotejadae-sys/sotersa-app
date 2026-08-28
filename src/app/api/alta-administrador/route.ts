import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

const HASH_AUTORIZADO = "d268ae32a885beea4060a6bbba7ae1e63abb7257f5e6692d678cdf0a11d926fb";
const CORREO_INTERNO = "atejada@sotersa.com";

function tokenValido(token: string) {
  const recibido = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const esperado = Buffer.from(HASH_AUTORIZADO);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function POST(request: NextRequest) {
  const autorizacion = request.headers.get("authorization") ?? "";
  const token = autorizacion.startsWith("Bearer ") ? autorizacion.slice(7) : "";

  if (!tokenValido(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!cuerpo?.password || cuerpo.password.length < 20) {
    return NextResponse.json({ ok: false, error: "credencial_invalida" }, { status: 400 });
  }

  try {
    const db = crearClienteAdministrador();
    const { data: listado, error: errorListado } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (errorListado) throw errorListado;

    let usuario = listado.users.find((candidato) => candidato.email === CORREO_INTERNO);
    let creado = false;

    if (usuario) {
      const { data, error } = await db.auth.admin.updateUserById(usuario.id, {
        password: cuerpo.password,
        email_confirm: true,
        app_metadata: { ...usuario.app_metadata, rol: "admin" },
        user_metadata: { ...usuario.user_metadata, nombre: "Alejandro Tejada" },
      });
      if (error) throw error;
      usuario = data.user;
    } else {
      const { data, error } = await db.auth.admin.createUser({
        email: CORREO_INTERNO,
        password: cuerpo.password,
        email_confirm: true,
        app_metadata: { rol: "admin" },
        user_metadata: { nombre: "Alejandro Tejada" },
      });
      if (error) throw error;
      usuario = data.user;
      creado = true;
    }

    const { error: errorPerfil } = await db.from("perfiles").upsert({
      id: usuario.id,
      rol: "admin",
      nombre: "Alejandro Tejada",
      activo: true,
      empresa_cliente_id: null,
      zona_id: null,
    });
    if (errorPerfil) throw errorPerfil;

    return NextResponse.json({ ok: true, usuario: "atejada", rol: "admin", creado });
  } catch {
    return NextResponse.json({ ok: false, error: "configuracion_no_disponible" }, { status: 500 });
  }
}
