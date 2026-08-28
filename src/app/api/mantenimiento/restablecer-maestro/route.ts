import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

const TOKEN_TEMPORAL = "68fad8c05f1910f307301753fd531aeabbbd0848237c9c06";
const CORREO_MAESTRO = "atejada@sotersa.com";

export async function POST(request: Request) {
  const autorizacion = request.headers.get("authorization");

  if (autorizacion !== `Bearer ${TOKEN_TEMPORAL}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const cuerpo = (await request.json()) as { password?: string };
  const password = cuerpo.password ?? "";

  if (password.length < 12) {
    return NextResponse.json(
      { ok: false, error: "La contraseña no cumple el mínimo de seguridad." },
      { status: 400 },
    );
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
      { ok: false, error: `No se pudo verificar: ${errorVerificacion.message}` },
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
