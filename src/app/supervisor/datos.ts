import "server-only";

import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { uno } from "@/lib/sesion";
import { acumularCobertura, estadoDePuestos, SELECT_TURNOS_AHORA_CON_TELEFONO, type PuestoAhora, type ResumenCobertura } from "@/lib/estado-puestos";

/**
 * Lo que un supervisor necesita ver de SUS puestos (tabla
 * supervision_puestos). El filtro sale del usuario verificado en el servidor
 * (el supervisor solo puede ver los suyos) o del selector, que existe solo
 * para admin y operativo: por supervisor, todos, o los que nadie supervisa.
 */
export type FiltroSupervision = { tipo: "supervisor"; id: string } | { tipo: "todos" } | { tipo: "sin-supervisor" };

export type PuestoZona = PuestoAhora & { empresa: string; supervisores: string[] };

export type TurnoHoy = {
  id: string;
  puestoId: string;
  puesto: string;
  empresa: string;
  agente: { id: string; nombre: string; credencial: string | null; telefono: string | null } | null;
  inicio: string;
  fin: string;
  estado: string;
  apertura: string | null;
  rondas: number;
  situacion: "en_puesto" | "cerrado" | "sin_abrir" | "programado" | "sin_apertura";
};

export type NovedadZona = {
  id: string;
  tipo: string;
  severidad: "informativa" | "novedad" | "emergencia";
  descripcion: string;
  hora_captura: string;
  estado: string;
  visible_cliente: boolean;
  nota_supervisor: string | null;
  puesto: string;
  empresa: string;
  agente: string | null;
};

export type ResumenZona = {
  puestos: PuestoZona[];
  turnosHoy: TurnoHoy[];
  pendientes: NovedadZona[];
  abiertas: NovedadZona[];
  semana: ResumenCobertura;
  rondasHoy: number;
};

export async function resumenDeZona(filtro: FiltroSupervision): Promise<ResumenZona> {
  const administrador = crearClienteAdministrador();
  const ms = Date.now();
  const hace7d = new Date(ms - 7 * 24 * 3600 * 1000).toISOString();
  const hace24h = new Date(ms - 24 * 3600 * 1000).toISOString();
  const en24h = new Date(ms + 24 * 3600 * 1000).toISOString();

  // Quien supervisa que. Se trae completo (son pocas filas) para etiquetar
  // cada puesto con sus supervisores y para resolver "sin supervisor".
  const { data: asignaciones } = await administrador.from("supervision_puestos").select("supervisor_id,puesto_id,perfiles!supervision_puestos_supervisor_id_fkey(nombre,activo)");
  const supervisoresDe = new Map<string, string[]>();
  const puestosDe = new Map<string, Set<string>>();
  for (const a of asignaciones ?? []) {
    const perfil = uno(a.perfiles);
    if (!perfil?.activo) continue;
    if (!supervisoresDe.has(a.puesto_id)) supervisoresDe.set(a.puesto_id, []);
    supervisoresDe.get(a.puesto_id)!.push(perfil.nombre);
    if (!puestosDe.has(a.supervisor_id)) puestosDe.set(a.supervisor_id, new Set());
    puestosDe.get(a.supervisor_id)!.add(a.puesto_id);
  }

  let consulta = administrador.from("puestos").select("id,codigo,nombre,tipo_servicio,cobertura_horas,armado,direccion,lat,lng,zona_id,creado_en,puntos_ronda(id,activo),empresas_cliente(nombre)").eq("activo", true).order("codigo");
  if (filtro.tipo === "supervisor") {
    const ids = [...(puestosDe.get(filtro.id) ?? [])];
    if (ids.length === 0) return { puestos: [], turnosHoy: [], pendientes: [], abiertas: [], semana: acumularCobertura([], hace7d, ms), rondasHoy: 0 };
    consulta = consulta.in("id", ids);
  }
  const { data: puestosBase } = await consulta;
  const base = (puestosBase ?? []).filter((p) => filtro.tipo !== "sin-supervisor" || !supervisoresDe.has(p.id));
  const idsPuestos = base.map((p) => p.id);
  const vacio: ResumenZona = { puestos: [], turnosHoy: [], pendientes: [], abiertas: [], semana: acumularCobertura([], hace7d, ms), rondasHoy: 0 };
  if (idsPuestos.length === 0) return vacio;

  const [turnosR, novedadesR, rondasR] = await Promise.all([
    administrador.from("turnos").select(SELECT_TURNOS_AHORA_CON_TELEFONO).in("puesto_id", idsPuestos).gte("fin_programado", hace7d).lte("inicio_programado", en24h).neq("estado", "ausente").order("inicio_programado"),
    administrador.from("novedades").select("id,tipo,severidad,descripcion,hora_captura,estado,visible_cliente,nota_supervisor,puestos(codigo,empresas_cliente(nombre)),guardias(nombre)").in("puesto_id", idsPuestos).neq("estado", "cerrada").order("hora_captura", { ascending: false }).limit(60),
    administrador.from("rondas").select("id,turnos!inner(puesto_id)", { count: "exact", head: true }).in("turnos.puesto_id", idsPuestos).gte("hora_captura", hace24h),
  ]);

  const turnos = turnosR.data ?? [];
  const nombreEmpresa = new Map(base.map((p) => [p.id, uno(p.empresas_cliente)?.nombre ?? ""]));
  const codigoPuesto = new Map(base.map((p) => [p.id, `${p.codigo} · ${p.nombre}`]));

  const puestos: PuestoZona[] = estadoDePuestos(base, turnos, ms).map((p) => ({ ...p, empresa: nombreEmpresa.get(p.id) ?? "", supervisores: supervisoresDe.get(p.id) ?? [] }));
  const semana = acumularCobertura(turnos, hace7d, ms);

  const turnosHoy: TurnoHoy[] = turnos
    .filter((t) => new Date(t.fin_programado).getTime() > ms - 24 * 3600 * 1000 && new Date(t.inicio_programado).getTime() < ms + 24 * 3600 * 1000)
    .map((t) => {
      const g = uno(t.guardias);
      const apertura = uno(t.aperturas_turno)?.hora_captura ?? null;
      const inicio = new Date(t.inicio_programado).getTime();
      const fin = new Date(t.fin_programado).getTime();
      let situacion: TurnoHoy["situacion"];
      if (t.estado === "cerrado") situacion = "cerrado";
      else if (apertura || t.estado === "abierto") situacion = "en_puesto";
      else if (inicio > ms) situacion = "programado";
      else if (fin < ms) situacion = "sin_abrir";
      else situacion = ms - inicio > 15 * 60000 ? "sin_apertura" : "programado";
      return { id: t.id, puestoId: t.puesto_id, puesto: codigoPuesto.get(t.puesto_id) ?? "", empresa: nombreEmpresa.get(t.puesto_id) ?? "", agente: g ? { id: g.id ?? "", nombre: g.nombre, credencial: g.credencial, telefono: g.telefono ?? null } : null, inicio: t.inicio_programado, fin: t.fin_programado, estado: t.estado, apertura, rondas: t.rondas?.length ?? 0, situacion };
    });

  const novedades: NovedadZona[] = (novedadesR.data ?? []).map((n) => {
    const p = uno(n.puestos);
    return { id: n.id, tipo: n.tipo, severidad: n.severidad as NovedadZona["severidad"], descripcion: n.descripcion, hora_captura: n.hora_captura, estado: n.estado, visible_cliente: n.visible_cliente, nota_supervisor: n.nota_supervisor, puesto: p?.codigo ?? "", empresa: uno(p?.empresas_cliente)?.nombre ?? "", agente: uno(n.guardias)?.nombre ?? null };
  });
  const orden = { emergencia: 0, novedad: 1, informativa: 2 };
  novedades.sort((a, b) => orden[a.severidad] - orden[b.severidad] || b.hora_captura.localeCompare(a.hora_captura));

  return {
    puestos,
    turnosHoy,
    pendientes: novedades.filter((n) => n.estado === "registrada"),
    abiertas: novedades.filter((n) => n.estado !== "registrada"),
    semana,
    rondasHoy: rondasR.count ?? 0,
  };
}
