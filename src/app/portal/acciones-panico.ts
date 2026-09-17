"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoPanico = {
  tipo: "inicial" | "error" | "exito";
  mensaje: string;
  alertaId?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function activarPanico(_: EstadoPanico, formData: FormData): Promise<EstadoPanico> {
  const puestoId = String(formData.get("puesto_id") ?? "");
  const latValor = String(formData.get("lat") ?? "");
  const lngValor = String(formData.get("lng") ?? "");
  if (!UUID.test(puestoId)) return { tipo: "error", mensaje: "Selecciona el puesto donde ocurre la emergencia." };

  const { supabase, perfil } = await exigirPerfil(["cliente", "admin", "operativo"]);
  const { data: puesto } = await supabase
    .from("puestos")
    .select("id,codigo,nombre,empresa_cliente_id,activo")
    .eq("id", puestoId)
    .maybeSingle();

  if (!puesto || !puesto.activo) return { tipo: "error", mensaje: "El puesto seleccionado no está disponible." };
  if (perfil.rol === "cliente" && puesto.empresa_cliente_id !== perfil.empresa_cliente_id) {
    return { tipo: "error", mensaje: "No tienes autorización para activar una alerta en ese puesto." };
  }

  const administrador = crearClienteAdministrador();
  const haceUnMinuto = new Date(Date.now() - 60_000).toISOString();
  const { data: repetida } = await administrador
    .from("novedades")
    .select("id")
    .eq("puesto_id", puesto.id)
    .eq("tipo", "Botón de pánico del cliente")
    .neq("estado", "cerrada")
    .gte("hora_captura", haceUnMinuto)
    .maybeSingle();

  if (repetida) {
    return { tipo: "exito", mensaje: "La alerta ya fue enviada. La Central SOTERSA está gestionando la emergencia.", alertaId: repetida.id };
  }

  const lat = numeroCoordenada(latValor, 90);
  const lng = numeroCoordenada(lngValor, 180);
  const ahora = new Date().toISOString();
  const { data: alerta, error } = await administrador
    .from("novedades")
    .insert({
      puesto_id: puesto.id,
      turno_id: null,
      guardia_id: null,
      tipo: "Botón de pánico del cliente",
      severidad: "emergencia",
      descripcion: `Alerta de pánico activada desde el portal por ${perfil.nombre}. Requiere contacto inmediato con el cliente y verificación del puesto ${puesto.codigo} · ${puesto.nombre}.`,
      lat,
      lng,
      hora_captura: ahora,
      estado: "registrada",
      visible_cliente: true,
    })
    .select("id")
    .single();

  if (error || !alerta) return { tipo: "error", mensaje: "No se pudo enviar la alerta. Llama inmediatamente al 911 y a la Central SOTERSA." };

  revalidatePath("/portal");
  revalidatePath("/central");
  revalidatePath("/admin");
  revalidatePath("/operacion/novedades");
  return { tipo: "exito", mensaje: "Alerta enviada a la Central SOTERSA. Mantén tu teléfono disponible y, si existe peligro inmediato, llama al 911.", alertaId: alerta.id };
}

function numeroCoordenada(valor: string, limite: number) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && Math.abs(numero) <= limite ? numero : null;
}
