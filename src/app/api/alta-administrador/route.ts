import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

const HASH_AUTORIZADO = "b0bad0f8b6f72984347b1a5c4d0b20ef20d4b88b1535711a26ccbb1a180a4a13";
const CORREO_INTERNO = "atejada@sotersa.com";

function tokenValido(token: string) {
  const recibido = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const esperado = Buffer.from(HASH_AUTORIZADO);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function POST(request: NextRequest) {
  const autorizacion = request.headers.get("authorization") ?? "";
  const token = autorizacion.startsWith("Bearer ") ? autorizacion.slice(7) : "";
  if (!tokenValido(token)) return NextResponse.json({ ok: false }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!cuerpo?.password || cuerpo.password.length < 20) {
    return NextResponse.json({ ok: false, error: "credencial_invalida" }, { status: 400 });
  }

  let etapa = "inicializacion";
  try {
    const db = crearClienteAdministrador();
    etapa = "listar_usuarios";
    const { data: listado, error: errorListado } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (errorListado) throw errorListado;

    let usuario = listado.users.find((candidato) => candidato.email === CORREO_INTERNO);
    let creado = false;

    if (usuario) {
      etapa = "actualizar_usuario";
      const { data, error } = await db.auth.admin.updateUserById(usuario.id, {
        password: cuerpo.password,
        email_confirm: true,
        app_metadata: { ...usuario.app_metadata, rol: "admin" },
        user_metadata: { ...usuario.user_metadata, nombre: "Alejandro Tejada" },
      });
      if (error) throw error;
      usuario = data.user;
    } else {
      etapa = "crear_usuario";
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

    etapa = "guardar_perfil";
    const { error: errorPerfil } = await db.from("perfiles").upsert({
      id: usuario.id,
      rol: "admin",
      nombre: "Alejandro Tejada",
      activo: true,
      empresa_cliente_id: null,
      zona_id: null,
    });
    if (errorPerfil) throw errorPerfil;

    etapa = "verificar_perfil";
    const { data: perfil, error: errorVerificacion } = await db
      .from("perfiles")
      .select("rol, nombre, activo")
      .eq("id", usuario.id)
      .single();
    if (errorVerificacion || perfil?.rol !== "admin" || !perfil.activo) {
      throw errorVerificacion ?? new Error("Perfil administrativo no verificado");
    }

    return NextResponse.json({
      ok: true,
      correo: CORREO_INTERNO,
      usuario: "atejada",
      rol: perfil.rol,
      activo: perfil.activo,
      creado,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "alta_no_completada",
        etapa,
        detalle: error instanceof Error ? error.message : "error_desconocido",
      },
      { status: 500 },
    );
  }
}
