import "server-only";

import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { servicio } from "@/lib/servicios";
import { uno } from "@/lib/sesion";

/**
 * Todo lo que la pantalla inicial del cliente necesita, calculado en el
 * servidor a partir de SU empresa. Igual que en portal/agentes: se usa la
 * llave de servicio porque el cliente no puede leer turnos ni rondas
 * directamente, y el filtro por empresa sale del perfil verificado, nunca de
 * un parametro.
 *
 * Lo que se le muestra del agente sigue siendo lo que promete el aviso LOPDP:
 * nombre, credencial, puesto y si esta en turno. Nada mas.
 */

const MINUTOS_TOLERANCIA_APERTURA = 15;
const MINUTOS_SIN_RONDA = 120;
const MINUTOS_POR_CERRAR = 30;

export type EstadoPuesto = "cubierto" | "sin_ronda" | "sin_apertura" | "por_cerrar" | "sin_cobertura" | "sin_turno_hoy" | "sin_programar";

export type PuestoAhora = {
  id: string;
  codigo: string;
  nombre: string;
  servicio: string;
  coberturaHoras: number;
  armado: boolean;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  desde: string;
  tienePuntosRonda: boolean;
  estado: EstadoPuesto;
  agente: { nombre: string; credencial: string | null } | null;
  inicioTurno: string | null;
  finTurno: string | null;
  apertura: string | null;
  ultimaRonda: string | null;
  rondasEnTurno: number;
  proximoTurno: string | null;
};

export type ResumenSemana = {
  turnosPlanificados: number;
  turnosCubiertos: number;
  turnosConRonda: number;
  rondasRegistradas: number;
  aperturasPuntuales: number;
  aperturasTotales: number;
};

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

const VACIO_SEMANA: ResumenSemana = { turnosPlanificados: 0, turnosCubiertos: 0, turnosConRonda: 0, rondasRegistradas: 0, aperturasPuntuales: 0, aperturasTotales: 0 };

export async function resumenDeEmpresa(empresaId: string | null): Promise<ResumenEmpresa> {
  const vacio: ResumenEmpresa = { empresa: null, puestos: [], operacion: "normal", semana: VACIO_SEMANA, novedades: { lista: [], emergencias: 0, novedades: 0, informativas: 0, abiertas: 0 }, sla: { medidos: 0, cumplidos: 0, puntaje: 100, ultimo: null }, supervisores: [], central: null, jefeOperaciones: null };
  if (!empresaId) return vacio;

  const administrador = crearClienteAdministrador();
  const ahora = new Date();
  const ms = ahora.getTime();
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
  const zonas = [...new Set(puestosBase.map((p) => p.zona_id).filter((z): z is string => Boolean(z)))];

  const [turnosR, novedadesR, slaR, supervisoresR, contactosR] = await Promise.all([
    // Turnos de la ultima semana y del proximo dia: sirven para "ahora" y para la cobertura semanal.
    administrador.from("turnos").select("id,puesto_id,inicio_programado,fin_programado,estado,guardias(nombre,credencial),aperturas_turno(hora_captura),rondas(hora_captura)").in("puesto_id", idsPuestos).gte("fin_programado", hace7d).lte("inicio_programado", en24h).neq("estado", "ausente"),
    administrador.from("novedades").select("id,tipo,severidad,descripcion,hora_captura,estado,nota_supervisor,puestos(codigo)").in("puesto_id", idsPuestos).eq("visible_cliente", true).in("estado", ["validada", "notificada", "cerrada"]).gte("hora_captura", hace30d).order("hora_captura", { ascending: false }),
    administrador.from("v_sla_novedades").select("hora_captura,cumple_sla").eq("empresa_cliente_id", empresaId).gte("hora_captura", hace30d).order("hora_captura", { ascending: false }),
    zonas.length ? administrador.from("perfiles").select("nombre,telefono").eq("rol", "supervisor").eq("activo", true).in("zona_id", zonas).order("nombre") : Promise.resolve({ data: [] as { nombre: string; telefono: string | null }[] }),
    administrador.from("contactos_puesto").select("tipo,nombre,telefono").in("puesto_id", idsPuestos),
  ]);

  const turnos = turnosR.data ?? [];
  const porPuesto = new Map<string, typeof turnos>();
  for (const t of turnos) { if (!porPuesto.has(t.puesto_id)) porPuesto.set(t.puesto_id, []); porPuesto.get(t.puesto_id)!.push(t); }

  const puestos: PuestoAhora[] = puestosBase.map((p) => {
    const tienePuntosRonda = (p.puntos_ronda ?? []).some((x) => x.activo);
    const lista = porPuesto.get(p.id) ?? [];
    const actual = lista.find((t) => new Date(t.inicio_programado).getTime() <= ms && new Date(t.fin_programado).getTime() >= ms && t.estado !== "cerrado")
      ?? lista.find((t) => new Date(t.inicio_programado).getTime() <= ms && new Date(t.fin_programado).getTime() >= ms) ?? null;
    const proximo = lista.filter((t) => new Date(t.inicio_programado).getTime() > ms).sort((a, b) => a.inicio_programado.localeCompare(b.inicio_programado))[0] ?? null;
    const base = { id: p.id, codigo: p.codigo, nombre: p.nombre, servicio: servicio(p.tipo_servicio).etiqueta, coberturaHoras: p.cobertura_horas, armado: p.armado, direccion: p.direccion, lat: p.lat, lng: p.lng, desde: p.creado_en, tienePuntosRonda, proximoTurno: proximo?.inicio_programado ?? null };
    if (!actual) {
      // Sin ningun turno cargado no se puede afirmar nada: el cuadrante de ese
      // puesto todavia no esta en la app. No es una alarma, es un pendiente.
      if (lista.length === 0) return { ...base, estado: "sin_programar", agente: null, inicioTurno: null, finTurno: null, apertura: null, ultimaRonda: null, rondasEnTurno: 0 };
      // Un punto de 12 h fuera de su horario no esta "sin cobertura": no le toca.
      const hoyTuvo = lista.some((t) => new Date(t.fin_programado).getTime() > ms - 24 * 3600 * 1000);
      return { ...base, estado: p.cobertura_horas >= 24 || !hoyTuvo ? "sin_cobertura" : "sin_turno_hoy", agente: null, inicioTurno: null, finTurno: null, apertura: null, ultimaRonda: null, rondasEnTurno: 0 };
    }
    const g = uno(actual.guardias);
    const apertura = uno(actual.aperturas_turno)?.hora_captura ?? null;
    const rondas = (actual.rondas ?? []).map((r) => r.hora_captura).sort();
    const ultimaRonda = rondas.at(-1) ?? null;
    const inicio = new Date(actual.inicio_programado).getTime();
    const fin = new Date(actual.fin_programado).getTime();
    let estado: EstadoPuesto = "cubierto";
    if (!apertura && actual.estado !== "abierto") estado = ms - inicio > MINUTOS_TOLERANCIA_APERTURA * 60000 ? "sin_apertura" : "cubierto";
    else if (fin - ms < MINUTOS_POR_CERRAR * 60000) estado = "por_cerrar";
    else if (tienePuntosRonda && ms - inicio > MINUTOS_SIN_RONDA * 60000 && (!ultimaRonda || ms - new Date(ultimaRonda).getTime() > MINUTOS_SIN_RONDA * 60000)) estado = "sin_ronda";
    return { ...base, estado, agente: g ? { nombre: g.nombre, credencial: g.credencial } : null, inicioTurno: actual.inicio_programado, finTurno: actual.fin_programado, apertura, ultimaRonda, rondasEnTurno: rondas.length };
  });

  // Semana: solo turnos ya iniciados.
  const semana = { ...VACIO_SEMANA };
  for (const t of turnos) {
    const inicio = new Date(t.inicio_programado).getTime();
    if (inicio > ms || t.inicio_programado < hace7d) continue;
    const apertura = uno(t.aperturas_turno)?.hora_captura ?? null;
    const cubierto = Boolean(apertura) || t.estado === "abierto" || t.estado === "cerrado";
    semana.turnosPlanificados += 1;
    if (cubierto) semana.turnosCubiertos += 1;
    const rondas = t.rondas?.length ?? 0;
    semana.rondasRegistradas += rondas;
    if (rondas > 0) semana.turnosConRonda += 1;
    if (apertura) { semana.aperturasTotales += 1; if (new Date(apertura).getTime() - inicio <= MINUTOS_TOLERANCIA_APERTURA * 60000) semana.aperturasPuntuales += 1; }
  }

  const lista: NovedadCliente[] = (novedadesR.data ?? []).map((n) => ({ id: n.id, tipo: n.tipo, severidad: n.severidad as NovedadCliente["severidad"], descripcion: n.descripcion, hora_captura: n.hora_captura, estado: n.estado, nota_supervisor: n.nota_supervisor, puesto: uno(n.puestos)?.codigo ?? "" }));
  const novedades = { lista, emergencias: lista.filter((n) => n.severidad === "emergencia").length, novedades: lista.filter((n) => n.severidad === "novedad").length, informativas: lista.filter((n) => n.severidad === "informativa").length, abiertas: lista.filter((n) => n.estado !== "cerrada").length };

  const slaFilas = (slaR.data ?? []).filter((f) => f.cumple_sla !== null);
  const cumplidos = slaFilas.filter((f) => f.cumple_sla).length;
  const sla = { medidos: slaFilas.length, cumplidos, puntaje: slaFilas.length ? Math.round((cumplidos / slaFilas.length) * 100) : 100, ultimo: slaR.data?.[0]?.hora_captura ?? null };

  const supervisores: Contacto[] = (supervisoresR.data ?? []).filter((s) => s.telefono).map((s) => ({ nombre: s.nombre, telefono: s.telefono!, etiqueta: "Supervisor de zona" }));
  const contactos = contactosR.data ?? [];
  const central = contactos.find((c) => c.tipo === "central_monitoreo");
  const jefe = contactos.find((c) => c.tipo === "jefe_operaciones");
  if (supervisores.length === 0) { const s = contactos.find((c) => c.tipo === "supervisor_zona"); if (s) supervisores.push({ nombre: s.nombre, telefono: s.telefono, etiqueta: "Supervisor de zona" }); }

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
  const ahoraMs = Date.now();

  const { data: puestosBase } = await administrador.from("puestos").select("id,codigo,nombre,tipo_servicio").eq("empresa_cliente_id", empresaId).eq("activo", true).order("codigo");
  const idsPuestos = (puestosBase ?? []).map((p) => p.id);
  if (idsPuestos.length === 0) return { puestos: [], totales: { ...VACIO_SEMANA }, novedades: [] as NovedadCliente[], sla: { medidos: 0, cumplidos: 0, puntaje: 100 } };

  const [turnosR, novedadesR, slaR] = await Promise.all([
    administrador.from("turnos").select("puesto_id,inicio_programado,estado,aperturas_turno(hora_captura),rondas(id)").in("puesto_id", idsPuestos).gte("inicio_programado", desde).lt("inicio_programado", hasta).neq("estado", "ausente"),
    administrador.from("novedades").select("id,tipo,severidad,descripcion,hora_captura,estado,nota_supervisor,puestos(codigo)").in("puesto_id", idsPuestos).eq("visible_cliente", true).in("estado", ["validada", "notificada", "cerrada"]).gte("hora_captura", desde).lt("hora_captura", hasta).order("hora_captura"),
    administrador.from("v_sla_novedades").select("cumple_sla").eq("empresa_cliente_id", empresaId).gte("hora_captura", desde).lt("hora_captura", hasta),
  ]);

  const porPuesto = new Map<string, ResumenSemana>();
  const totales: ResumenSemana = { ...VACIO_SEMANA };
  for (const t of turnosR.data ?? []) {
    if (new Date(t.inicio_programado).getTime() > ahoraMs) continue;
    const acumulado = porPuesto.get(t.puesto_id) ?? { ...VACIO_SEMANA };
    const apertura = uno(t.aperturas_turno)?.hora_captura ?? null;
    const cubierto = Boolean(apertura) || t.estado === "abierto" || t.estado === "cerrado";
    const rondas = t.rondas?.length ?? 0;
    for (const r of [acumulado, totales]) {
      r.turnosPlanificados += 1;
      if (cubierto) r.turnosCubiertos += 1;
      r.rondasRegistradas += rondas;
      if (rondas > 0) r.turnosConRonda += 1;
      if (apertura) { r.aperturasTotales += 1; if (new Date(apertura).getTime() - new Date(t.inicio_programado).getTime() <= MINUTOS_TOLERANCIA_APERTURA * 60000) r.aperturasPuntuales += 1; }
    }
    porPuesto.set(t.puesto_id, acumulado);
  }

  const novedades: NovedadCliente[] = (novedadesR.data ?? []).map((n) => ({ id: n.id, tipo: n.tipo, severidad: n.severidad as NovedadCliente["severidad"], descripcion: n.descripcion, hora_captura: n.hora_captura, estado: n.estado, nota_supervisor: n.nota_supervisor, puesto: uno(n.puestos)?.codigo ?? "" }));
  const slaFilas = (slaR.data ?? []).filter((f) => f.cumple_sla !== null);
  const cumplidos = slaFilas.filter((f) => f.cumple_sla).length;

  return {
    puestos: (puestosBase ?? []).map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, servicio: servicio(p.tipo_servicio).etiqueta, ...(porPuesto.get(p.id) ?? { ...VACIO_SEMANA }) })),
    totales,
    novedades,
    sla: { medidos: slaFilas.length, cumplidos, puntaje: slaFilas.length ? Math.round((cumplidos / slaFilas.length) * 100) : 100 },
  };
}
