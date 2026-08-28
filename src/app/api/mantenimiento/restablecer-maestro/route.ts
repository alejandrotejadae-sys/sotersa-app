import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

const TOKEN_TEMPORAL = "edbcaff94f521c2a075e317db590c060c0ddbb5d1f624c92";
const CORREO_MAESTRO = "atejada@sotersa.com";

export async function POST(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${TOKEN_TEMPORAL}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const cuerpo = (await request.json()) as { password?: string };
  const password = cuerpo.password ?? "";

  if (password.length < 12) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const administrador = crearClienteAdministrador();
  const { data: listado, error: errorListado } =
    await administrador.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (errorListado) {
    return NextResponse.json(
      { ok: false, error: errorListado.message },
      { status: 500 },
    );
  }

  const usuario = listado.users.find(
    (candidato) => candidato.email?.toLowerCase() === CORREO_MAESTRO,
  );

  if (!usuario) {
    return NextResponse.json(
      { ok: false, error: "No existe la cuenta maestra." },
      { status: 404 },
    );
  }

  const { error: errorActualizacion } =
    await administrador.auth.admin.updateUserById(usuario.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...usuario.user_metadata,
        nombre: "Alejandro Tejada",
        rol: "admin",
        activo: true,
      },
    });

  if (errorActualizacion) {
    return NextResponse.json(
      { ok: false, error: errorActualizacion.message },
      { status: 500 },
    );
  }

  const verificador = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: errorVerificacion } = await verificador.auth.signInWithPassword({
    email: CORREO_MAESTRO,
    password,
  });

  if (errorVerificacion) {
    return NextResponse.json(
      { ok: false, error: errorVerificacion.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    correo: CORREO_MAESTRO,
    usuario: "atejada",
    verificado: true,
  });
}
