"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";

export type EstadoCliente = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Refresca todo lo que muestra clientes, puestos o dotación. */
function refrescar() {
  for (const ruta of [
    "/operacion/clientes",
    "/operacion/dotacion",
    "/operacion/turnos",
    "/operacion/usuarios",
    "/admin",
  ]) {
    revalidatePath(ruta);
  }
}

const texto = (fd: FormData, campo: string, max: number) =>
  String(fd.get(campo) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/**
 * Alta de un cliente, opcionalmente con su primer puesto.
 *
 * Van juntos a proposito: un cliente sin puestos no se puede facturar, no se
 * le puede asignar personal y no puede tener turnos. Crearlo suelto deja una
 * ficha que no sirve para nada y que despues nadie recuerda completar.
 */
export async function crearCliente(
  _: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  const nombre = texto(formData, "nombre", 120);
  const ruc = texto(formData, "ruc", 13).replace(/\D/g, "");
  const direccion = texto(formData, "direccion", 200);
  const contactoNombre = texto(formData, "contacto_nombre", 120);
  const contactoCorreo = texto(formData, "contacto_correo", 120).toLowerCase();
  const contactoTelefono = texto(formData, "contacto_telefono", 40);

  if (nombre.length < 3) {
    return { tipo: "error", mensaje: "El nombre del cliente es obligatorio." };
  }
  if (ruc && ruc.length !== 13) {
    return { tipo: "error", mensaje: "El RUC ecuatoriano tiene 13 dígitos." };
  }
  if (contactoCorreo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactoCorreo)) {
    return { tipo: "error", mensaje: "El correo de contacto no es válido." };
  }

  const { supabase } = await exigirPerfil(["admin"]);

  // Duplicar un cliente parte su historial en dos fichas: las novedades de
  // ayer quedan en una y las de hoy en otra, y ningun informe cuadra.
  const { data: repetido } = await supabase
    .from("empresas_cliente")
    .select("id")
    .ilike("nombre", nombre)
    .maybeSingle();
  if (repetido) {
    return { tipo: "error", mensaje: `Ya existe un cliente llamado «${nombre}».` };
  }

  const { data: empresa, error } = await supabase
    .from("empresas_cliente")
    .insert({
      nombre,
      ruc: ruc || null,
      direccion: direccion || null,
      contacto_nombre: contactoNombre || null,
      contacto_correo: contactoCorreo || null,
      contacto_telefono: contactoTelefono || null,
      activo: true,
    })
    .select("id,nombre")
    .single();

  if (error || !empresa) {
    return { tipo: "error", mensaje: "No fue posible crear el cliente." };
  }

  // El primer puesto es opcional pero se ofrece en el mismo formulario para
  // no dejar al cliente a medias.
  const codigoPuesto = texto(formData, "puesto_codigo", 16).toUpperCase();
  if (codigoPuesto) {
    const fallo = await insertarPuesto(supabase, empresa.id, formData);
    if (fallo) {
      refrescar();
      return {
        tipo: "error",
        mensaje: `Cliente «${empresa.nombre}» creado, pero el puesto no: ${fallo}`,
      };
    }
    refrescar();
    return {
      tipo: "exito",
      mensaje: `Cliente «${empresa.nombre}» creado con el puesto ${codigoPuesto}.`,
    };
  }

  refrescar();
  return {
    tipo: "exito",
    mensaje: `Cliente «${empresa.nombre}» creado. Agrégale al menos un puesto.`,
  };
}

/** Agrega un puesto a un cliente que ya existe. */
export async function agregarPuesto(
  _: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  const empresaId = String(formData.get("empresa_cliente_id") ?? "");
  if (!UUID.test(empresaId)) {
    return { tipo: "error", mensaje: "Selecciona el cliente." };
  }

  const { supabase } = await exigirPerfil(["admin"]);
  const { data: empresa } = await supabase
    .from("empresas_cliente")
    .select("id,nombre")
    .eq("id", empresaId)
    .maybeSingle();
  if (!empresa) return { tipo: "error", mensaje: "Ese cliente ya no existe." };

  const fallo = await insertarPuesto(supabase, empresaId, formData);
  if (fallo) return { tipo: "error", mensaje: fallo };

  refrescar();
  return {
    tipo: "exito",
    mensaje: `Puesto agregado a ${empresa.nombre}.`,
  };
}

type ClienteSupabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

/** Devuelve null si todo fue bien, o el motivo del fallo. */
async function insertarPuesto(
  supabase: ClienteSupabase,
  empresaId: string,
  formData: FormData,
): Promise<string | null> {
  const codigo = texto(formData, "puesto_codigo", 16).toUpperCase();
  const nombre = texto(formData, "puesto_nombre", 120);
  const direccion = texto(formData, "puesto_direccion", 200);
  const cobertura = Number(formData.get("puesto_cobertura") ?? 24);
  const armado = formData.get("puesto_armado") === "on";

  if (!/^[A-Z0-9-]{2,16}$/.test(codigo)) {
    return "El código del puesto usa letras, números y guiones (ej. P-01).";
  }
  if (nombre.length < 3) return "El nombre del puesto es obligatorio.";
  if (!Number.isInteger(cobertura) || cobertura < 1 || cobertura > 24) {
    return "La cobertura va de 1 a 24 horas.";
  }

  const { error } = await supabase.from("puestos").insert({
    empresa_cliente_id: empresaId,
    codigo,
    nombre,
    direccion: direccion || null,
    cobertura_horas: cobertura,
    armado,
    activo: true,
  });

  if (error) {
    // El esquema tiene unique (empresa_cliente_id, codigo).
    if (error.code === "23505") return `Ese cliente ya tiene un puesto ${codigo}.`;
    return "No fue posible crear el puesto.";
  }
  return null;
}
