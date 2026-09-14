import "server-only";

import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { servicio } from "@/lib/servicios";
import { uno } from "@/lib/sesion";
import { acumularCobertura, COBERTURA_VACIA, estadoDePuestos, SELECT_TURNOS_AHORA, type PuestoAhora, type ResumenCobertura, type EstadoPuesto } from "@/lib/estado-puestos";

export type { PuestoAhora, EstadoPuesto };
export type ResumenSemana = ResumenCobertura;

/**
 * Todo lo que la pantalla inicial del cliente necesita, calculado en el
 * servidor a partir de SU empresa. Igual que en portal/agentes: se usa la
 * llave de servicio porque el cliente no puede leer turnos ni rondas
 * directamente, y el filtro por empresa sale del perfil verificado, nunca de
 * un parametro.
 *
 * Lo que se le muestra del agente sigue siendo lo que promete el aviso LOPDP:
 * nombre, credencial, puesto y si esta en turno. La consulta no pide el
 * telefono, asi que no puede llegar a la pantalla.
 */

export type NovedadCliente = {
  id: string;
  tipo: string;
  severidad: "informativa" | "novedad" | "emergencia";
  descripcion: string;
  hora_captura: string;
  estado: string;
  nota_supervisor: string | null;
  puesto: string;
};

export type Contacto = { nombre: string | null; telefono: string; etiqueta: string };

export type ResumenEmpresa = {
  empresa: { id: string; nombre: string; direccion: string | null; clienteDesde: string } | null;
  puestos: PuestoAhora[];
  operacion: "normal" | "atencion" | "critica";
  semana: ResumenSemana;
  novedades: { lista: NovedadCliente[]; emergencias: number; novedades: number; informativas: number; abiertas: number };
  sla: { medidos: number; cumplidos: number; puntaje: number; ultimo: string | null };
  supervisores: Contacto[];
  central: Contacto | null;
  jefeOperaciones: Contacto | null;
};

export async function resumenDeEmpresa(empresaId: string | null): Promise<ResumenEmpresa> {
  const vacio: ResumenEmpresa = { empresa: null, puestos: [], operacion: "normal", semana: COBERTURA_VACIA, novedades: { lista: [], emergencias: 0, novedades: 0, informativas: 0, abiertas: 0 }, sla: { medidos: 0, cumplidos: 0, puntaje: 100, ultimo: null }, supervisores: [], central: null, jefeOperaciones: null };
  if (!empresaId) return vacio;

  const administrador = crearClienteAdministrador();
  const ms = Date.now();
  const hace7d = new Date(ms - 7 * 24 * 3600 * 1000).toISOString();
  const hace30d = new Date(ms - 30 * 24 * 3600 * 1000).toISOString();
  const en24h = new Date(ms + 24 * 3600 * 1000).toISOString();

  const [empresaR, puestosR] = await Promise.all([
    administrador.from("empresas_cliente").select("id,nombre,direccion,creado_en").eq("id", empresaId).maybeSingle(),
    administrador.from("puestos").select("id,codigo,nombre,tipo_servicio,cobertura_horas,armado,direccion,lat,lng,zona_id,creado_en,puntos_ronda(id,activo)").eq("empresa_cliente_id", empresaId).eq("activo", true).order("codigo"),
  ]);
  if (!empresaR.data) return vacio;
  const empresa = { id: empresaR.data.id, nombre: empresaR.data.nombre, direccion: empresaR.data.direccion, clienteDesde: empresaR.data.creado_en };
  const puestosBase = puestosR.data ?? [];
  const idsPuestos = puestosBase.map((p) => p.id);
  if (idsPuestos.length === 0) return { ...vacio, empresa };

  const [turnosR, novedadesR, slaR, supervisoresR, contactosR] = await Promise.all([
    // Turnos de la ultima semana y del proximo dia: sirven para "ahora" y para la cobertura semanal.
    administrador.from("turnos").select(SELECT_TURNOS_AHORA).in("puesto_id", idsPuestos).gte("fin_programado", hace7d).lte("inicio_programado", en24h).neq("estado", "ausente"),
    administrador.from("novedades").select("id,tipo,severidad,descripcion,hora_captura,estado,nota_supervisor,puestos(codigo)").in("puesto_id", idsPuestos).eq("visible_cliente", true).in("estado", ["validada", "notificada", "cerrada"]).gte("hora_captura", hace30d).order("hora_captura", { ascending: false }),
    administrador.from("v_sla_novedades").select("hora_captura,cumple_sla").eq("empresa_cliente_id", empresaId).gte("hora_captura", hace30d).order("hora_captura", { ascending: false }),
    administrador.from("supervision_puestos").select("perfiles!supervision_puestos_supervisor_id_fkey(nombre,telefono,activo)").in("puesto_id", idsPuestos),
    administrador.from("contactos_puesto").select("tipo,nombre,telefono").in("puesto_id", idsPuestos),
  ]);

  const turnos = turnosR.data ?? [];
  const puestos = estadoDePuestos(puestosBase, turnos, ms);
  const semana = acumularCobertura(turnos, hace7d, ms);

  const lista: NovedadCliente[] = (novedadesR.data ?? []).map((n) => ({ id: n.id, tipo: n.tipo, severidad: n.severidad as NovedadCliente["severidad"], descripcion: n.descripcion, hora_captura: n.hora_captura, estado: n.estado, nota_supervisor: n.nota_supervisor, puesto: uno(n.puestos)?.codigo ?? "" }));
  const novedades = { lista, emergencias: lista.filter((n) => n.severidad === "emergencia").length, novedades: lista.filter((n) => n.severidad === "novedad").length, informativas: lista.filter((n) => n.severidad === "informativa").length, abiertas: lista.filter((n) => n.estado !== "cerrada").length };

  const slaFilas = (slaR.data ?? []).filter((f) => f.cumple_sla !== null);
  const cumplidos = slaFilas.filter((f) => f.cumple_sla).length;
  const sla = { medidos: slaFilas.length, cumplidos, puntaje: slaFilas.length ? Math.round((cumplidos / slaFilas.length) * 100) : 100, ultimo: slaR.data?.[0]?.hora_captura ?? null };

  const vistos = new Set<string>();
  const supervisores: Contacto[] = [];
  for (const fila of supervisoresR.data ?? []) {
    const s = uno(fila.perfiles);
    if (!s?.activo || !s.telefono || vistos.has(s.nombre)) continue;
    vistos.add(s.nombre);
    supervisores.push({ nombre: s.nombre, telefono: s.telefono, etiqueta: "Supervisor" });
  }
  const contactos = contactosR.data ?? [];
  const central = contactos.find((c) => c.tipo === "central_monitoreo");
  const jefe = contactos.find((c) => c.tipo === "jefe_operaciones");
  if (supervisores.length === 0) { const s = contactos.find((c) => c.tipo === "supervisor_zona"); if (s) supervisores.push({ nombre: s.nombre, telefono: s.telefono, etiqueta: "Supervisor" }); }

  const critica = puestos.some((p) => p.estado === "sin_cobertura" || p.estado === "sin_apertura") || novedades.lista.some((n) => n.severidad === "emergencia" && n.estado !== "cerrada");
  const atencion = puestos.some((p) => p.estado === "sin_ronda") || novedades.abiertas > 0;

  return {
    empresa,
    puestos,
    operacion: critica ? "critica" : atencion ? "atencion" : "normal",
    semana,
    novedades,
    sla,
    supervisores,
    central: central ? { nombre: central.nombre, telefono: central.telefono, etiqueta: "Central 24/7" } : null,
    jefeOperaciones: jefe ? { nombre: jefe.nombre, telefono: jefe.telefono, etiqueta: "Jefe de operaciones" } : null,
  };
}

/** Numero listo para tel: y para wa.me (Ecuador). */
export function telefonoLimpio(telefono: string) { return telefono.replace(/[^\d+]/g, ""); }
export function enlaceWhatsapp(telefono: string) {
  let n = telefonoLimpio(telefono).replace(/^\+/, "");
  if (n.startsWith("0")) n = "593" + n.slice(1);
  else if (!n.startsWith("593")) n = "593" + n;
  return `https://wa.me/${n}`;
}

/** Resumen de un mes calendario, para el reporte imprimible. */
export async function resumenMensual(empresaId: string, anio: number, mes: number) {
  const administrador = crearClienteAdministrador();
  const inicio = new Date(Date.UTC(anio, mes - 1, 1, 5, 0, 0)); // 00:00 Ecuador = 05:00 UTC
  const fin = new Date(Date.UTC(anio, mes, 1, 5, 0, 0));
  const desde = inicio.toISOString();
  const hasta = fin.toISOString();

  const { data: puestosBase } = await administrador.from("puestos").select("id,codigo,nombre,tipo_servicio").eq("empresa_cliente_id", empresaId).eq("activo", true).order("codigo");
  const idsPuestos = (puestosBase ?? []).map((p) => p.id);
  if (idsPuestos.length === 0) return { puestos: [], totales: { ...COBERTURA_VACIA }, novedades: [] as NovedadCliente[], sla: { medidos: 0, cumplidos: 0, puntaje: 100 } };

  const [turnosR, novedadesR, slaR] = await Promise.all([
    administrador.from("turnos").select(SELECT_TURNOS_AHORA).in("puesto_id", idsPuestos).gte("inicio_programado", desde).lt("inicio_programado", hasta).neq("estado", "ausente"),
    administrador.from("novedades").select("id,tipo,severidad,descripcion,hora_captura,estado,nota_supervisor,puestos(codigo)").in("puesto_id", idsPuestos).eq("visible_cliente", true).in("estado", ["validada", "notificada", "cerrada"]).gte("hora_captura", desde).lt("hora_captura", hasta).order("hora_captura"),
    administrador.from("v_sla_novedades").select("cumple_sla").eq("empresa_cliente_id", empresaId).gte("hora_captura", desde).lt("hora_captura", hasta),
  ]);

  const porPuesto = new Map<string, ResumenCobertura>();
  const totales = acumularCobertura(turnosR.data ?? [], desde, Date.now(), porPuesto);

  const novedades: NovedadCliente[] = (novedadesR.data ?? []).map((n) => ({ id: n.id, tipo: n.tipo, severidad: n.severidad as NovedadCliente["severidad"], descripcion: n.descripcion, hora_captura: n.hora_captura, estado: n.estado, nota_supervisor: n.nota_supervisor, puesto: uno(n.puestos)?.codigo ?? "" }));
  const slaFilas = (slaR.data ?? []).filter((f) => f.cumple_sla !== null);
  const cumplidos = slaFilas.filter((f) => f.cumple_sla).length;

  return {
    puestos: (puestosBase ?? []).map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, servicio: servicio(p.tipo_servicio).etiqueta, ...(porPuesto.get(p.id) ?? { ...COBERTURA_VACIA }) })),
    totales,
    novedades,
    sla: { medidos: slaFilas.length, cumplidos, puntaje: slaFilas.length ? Math.round((cumplidos / slaFilas.length) * 100) : 100 },
  };
}
