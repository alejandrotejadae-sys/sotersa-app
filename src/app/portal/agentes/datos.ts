import "server-only";

import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { ahoraConDesfase, uno } from "@/lib/sesion";

/**
 * Lo que un cliente puede saber de los agentes que cubren SUS puestos.
 *
 * Los campos son deliberadamente pocos: nombre, credencial, puesto y estado
 * del turno. Nada de cedula, telefono ni historial personal: el aviso LOPDP
 * que aceptan los agentes promete exactamente eso.
 *
 * Se consulta con la llave de servicio porque las politicas RLS no dejan a
 * un cliente leer guardias en absoluto (y esta bien que sea asi para el
 * acceso directo). El filtro por empresa sale del perfil verificado en el
 * servidor, nunca de un parametro del cliente.
 */
export type PuestoCliente = { id: string; codigo: string; nombre: string; tipo_servicio: string | null; direccion: string | null; contactos: { tipo: string; nombre: string | null; telefono: string }[] };

export type AgenteCliente = {
  id: string;
  nombre: string;
  credencial: string | null;
  /** Antiguedad en SOTERSA: dato laboral, no personal. */
  desde: string;
  puesto: PuestoCliente | null;
  esRelevo: boolean;
  estado: "en_puesto" | "programado" | "fuera";
};

export async function agentesDeEmpresa(empresaId: string): Promise<{ agentes: AgenteCliente[]; puestos: PuestoCliente[] }> {
  const administrador = crearClienteAdministrador();
  const { data: puestos } = await administrador.from("puestos").select("id,codigo,nombre,tipo_servicio,direccion,contactos_puesto(tipo,nombre,telefono)").eq("empresa_cliente_id", empresaId).eq("activo", true).order("codigo");
  const idsPuestos = (puestos ?? []).map((p) => p.id);
  if (idsPuestos.length === 0) return { agentes: [], puestos: [] };

  const desde = ahoraConDesfase(-12);
  const hasta = ahoraConDesfase(16);
  const [fijosR, turnosR] = await Promise.all([
    administrador.from("guardias").select("id,nombre,credencial,es_relevo,puesto_habitual_id,creado_en").eq("activo", true).in("puesto_habitual_id", idsPuestos).order("nombre"),
    administrador.from("turnos").select("guardia_id,puesto_id,estado,aperturas_turno(id),guardias(id,nombre,credencial,es_relevo,activo,creado_en)").in("puesto_id", idsPuestos).gte("fin_programado", desde).lte("inicio_programado", hasta).neq("estado", "ausente"),
  ]);

  const porPuesto = new Map<string, PuestoCliente>((puestos ?? []).map((p) => [p.id, { id: p.id, codigo: p.codigo, nombre: p.nombre, tipo_servicio: p.tipo_servicio, direccion: p.direccion, contactos: (p.contactos_puesto ?? []).map((c) => ({ tipo: c.tipo, nombre: c.nombre, telefono: c.telefono })) }]));
  const turnoDe = new Map<string, { puesto_id: string; abierto: boolean }>();
  for (const t of turnosR.data ?? []) turnoDe.set(t.guardia_id, { puesto_id: t.puesto_id, abierto: (t.aperturas_turno?.length ?? 0) > 0 });

  const agentes = new Map<string, AgenteCliente>();
  for (const g of fijosR.data ?? []) {
    const turno = turnoDe.get(g.id);
    agentes.set(g.id, { id: g.id, nombre: g.nombre, credencial: g.credencial, desde: g.creado_en, puesto: porPuesto.get(g.puesto_habitual_id ?? "") ?? null, esRelevo: false, estado: turno ? (turno.abierto ? "en_puesto" : "programado") : "fuera" });
  }
  // Relevos y cubrientes: no tienen plaza en este cliente pero hoy estan aqui.
  for (const t of turnosR.data ?? []) {
    const g = uno(t.guardias);
    if (!g || !g.activo || agentes.has(g.id)) continue;
    const abierto = (t.aperturas_turno?.length ?? 0) > 0;
    agentes.set(g.id, { id: g.id, nombre: g.nombre, credencial: g.credencial, desde: g.creado_en, puesto: porPuesto.get(t.puesto_id) ?? null, esRelevo: true, estado: abierto ? "en_puesto" : "programado" });
  }

  return { agentes: [...agentes.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)), puestos: [...porPuesto.values()] };
}

/** Turnos de un agente en los puestos de esta empresa, ultimos 30 dias. */
export async function turnosDeAgenteEnEmpresa(guardiaId: string, empresaId: string) {
  const administrador = crearClienteAdministrador();
  const { data: puestos } = await administrador.from("puestos").select("id").eq("empresa_cliente_id", empresaId);
  const idsPuestos = (puestos ?? []).map((p) => p.id);
  if (idsPuestos.length === 0) return [];
  const { data } = await administrador
    .from("turnos")
    .select("id,inicio_programado,fin_programado,estado,puestos(codigo,nombre),aperturas_turno(hora_captura)")
    .eq("guardia_id", guardiaId)
    .in("puesto_id", idsPuestos)
    .gte("fin_programado", ahoraConDesfase(-30 * 24))
    .lte("inicio_programado", ahoraConDesfase(7 * 24))
    .order("inicio_programado", { ascending: false })
    .limit(20);
  return data ?? [];
}
