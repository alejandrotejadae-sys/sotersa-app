"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoCierre = { tipo: "inicial" | "error" | "exito"; mensaje: string };

export async function cerrarTurno(_: EstadoCierre, formData: FormData): Promise<EstadoCierre> {
  const { user } = await exigirPerfil(["guardia"]);
  const turnoId = String(formData.get("turno_id") ?? "");
  const estadoPuesto = String(formData.get("estado_puesto") ?? "").trim().replace(/\s+/g, " ").slice(0, 500);
  const observacion = String(formData.get("observacion") ?? "").trim().replace(/\s+/g, " ").slice(0, 800);
  const firma = String(formData.get("firma") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(turnoId)) return fallo("El turno no es válido.");
  if (estadoPuesto.length < 3) return fallo("Describe cómo entregas el puesto.");
  const imagen = decodificarFirma(firma);
  if (!imagen) return fallo("Firma dentro del recuadro antes de cerrar el turno.");

  const administrador = crearClienteAdministrador();
  const { data: agente } = await administrador.from("guardias").select("id,nombre").eq("perfil_id", user.id).eq("activo", true).maybeSingle();
  if (!agente) return fallo("Tu cuenta no está vinculada con un agente activo.");
  const { data: turno } = await administrador.from("turnos").select("id,puesto_id,guardia_id,estado").eq("id", turnoId).eq("guardia_id", agente.id).maybeSingle();
  if (!turno) return fallo("Este turno no pertenece a tu cuenta.");
  if (turno.estado === "cerrado") return fallo("Este turno ya fue cerrado.");
  const { data: apertura } = await administrador.from("aperturas_turno").select("id").eq("turno_id", turnoId).maybeSingle();
  if (!apertura) return fallo("Debes abrir el turno antes de cerrarlo.");

  const contenedor = "firmas-turno";
  const { error: sinContenedor } = await administrador.storage.getBucket(contenedor);
  if (sinContenedor) {
    const { error } = await administrador.storage.createBucket(contenedor, { public: false, allowedMimeTypes: ["image/png"], fileSizeLimit: 1024 * 1024 });
    if (error && !error.message.toLowerCase().includes("already")) return fallo("No fue posible preparar el almacenamiento de firmas.");
  }
  const ahora = new Date();
  const rutaFirma = `${agente.id}/${turnoId}-salida-${ahora.getTime()}.png`;
  const { error: errorFirma } = await administrador.storage.from(contenedor).upload(rutaFirma, imagen, { contentType: "image/png", cacheControl: "3600" });
  if (errorFirma) return fallo("No fue posible guardar la firma.");

  const { error: errorApertura } = await administrador.from("aperturas_turno").update({ firma_saliente_url: rutaFirma, guardia_saliente_id: agente.id }).eq("id", apertura.id);
  if (errorApertura) {
    await administrador.storage.from(contenedor).remove([rutaFirma]);
    return fallo("No fue posible vincular la firma con el turno.");
  }
  const { error: errorTurno } = await administrador.from("turnos").update({ estado: "cerrado" }).eq("id", turnoId).eq("guardia_id", agente.id);
  if (errorTurno) return fallo("La firma se guardó, pero no fue posible cerrar el turno.");

  await administrador.from("novedades").insert({
    puesto_id: turno.puesto_id,
    turno_id: turno.id,
    guardia_id: agente.id,
    tipo: "Relevo de puesto",
    severidad: "informativa",
    descripcion: `Turno cerrado por ${agente.nombre}. Estado de entrega: ${estadoPuesto}${observacion ? `. Observación: ${observacion}` : ""}`,
    hora_captura: ahora.toISOString(),
    estado: "registrada",
    visible_cliente: false,
  });

  ["/guardia", "/guardia/cierre", "/operacion/turnos", "/operacion/novedades", "/admin", "/supervisor"].forEach((ruta) => revalidatePath(ruta));
  return { tipo: "exito", mensaje: "Turno cerrado y entrega registrada correctamente." };
}

function decodificarFirma(valor: string) {
  const coincidencia = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(valor);
  if (!coincidencia) return null;
  const bytes = Buffer.from(coincidencia[1], "base64");
  return bytes.length > 100 && bytes.length <= 1024 * 1024 ? bytes : null;
}
function fallo(mensaje: string): EstadoCierre { return { tipo: "error", mensaje }; }
