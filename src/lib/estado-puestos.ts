import { servicio } from "@/lib/servicios";
import { uno } from "@/lib/sesion";

/**
 * Motor comun de "como esta cada puesto ahora". Lo usan el portal del cliente
 * (filtrado por empresa) y el panel del supervisor (filtrado por zona). Es
 * una funcion pura: recibe puestos y turnos ya consultados, devuelve estados.
 *
 * Reglas:
 *  - cubierto:       hay turno en curso asignado al agente. La programación
 *                    mensual lo habilita automáticamente.
 *  - sin_ronda:      abierto, con puntos QR, y sin ronda en las ultimas 2 h.
 *  - por_cerrar:     abierto y faltan menos de 30 min para el relevo.
 *  - sin_cobertura:  no hay turno ahora, pero si hubo turnos cargados.
 *  - sin_turno_hoy:  punto de 12 h fuera de su horario (no le toca).
 *  - sin_programar:  ese puesto no tiene ningun turno en la app todavia.
 */

export const MINUTOS_TOLERANCIA_APERTURA = 15;
export const MINUTOS_SIN_RONDA = 120;
export const MINUTOS_POR_CERRAR = 30;

export type EstadoPuesto = "cubierto" | "sin_ronda" | "sin_apertura" | "por_cerrar" | "sin_cobertura" | "sin_turno_hoy" | "sin_programar";

export type PuestoBase = {
  id: string;
  codigo: string;
  nombre: string;
  tipo_servicio: string | null;
  cobertura_horas: number;
  armado: boolean;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  creado_en: string;
  puntos_ronda: { id: string; activo: boolean }[] | null;
};

export type AgenteTurno = { id?: string; nombre: string; credencial: string | null; telefono?: string | null };

export type TurnoBase = {
  id: string;
  puesto_id: string;
  inicio_programado: string;
  fin_programado: string;
  estado: string;
  guardias: AgenteTurno | AgenteTurno[] | null;
  aperturas_turno: { hora_captura: string } | { hora_captura: string }[] | null;
  rondas: { hora_captura: string }[] | null;
};

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
  turnoId: string | null;
  agente: AgenteTurno | null;
  inicioTurno: string | null;
  finTurno: string | null;
  apertura: string | null;
  ultimaRonda: string | null;
  rondasEnTurno: number;
  proximoTurno: string | null;
};

export type ResumenCobertura = {
  turnosPlanificados: number;
  turnosCubiertos: number;
  turnosConRonda: number;
  rondasRegistradas: number;
  aperturasPuntuales: number;
  aperturasTotales: number;
};

export const COBERTURA_VACIA: ResumenCobertura = { turnosPlanificados: 0, turnosCubiertos: 0, turnosConRonda: 0, rondasRegistradas: 0, aperturasPuntuales: 0, aperturasTotales: 0 };

/** Campos a pedir en la consulta de turnos para que el motor tenga lo que necesita. */
export const SELECT_TURNOS_AHORA = "id,puesto_id,inicio_programado,fin_programado,estado,guardias(nombre,credencial),aperturas_turno(hora_captura),rondas(hora_captura)";
export const SELECT_TURNOS_AHORA_CON_TELEFONO = "id,puesto_id,inicio_programado,fin_programado,estado,guardias(id,nombre,credencial,telefono),aperturas_turno(hora_captura),rondas(hora_captura)";

export const ES_ALARMA: Record<EstadoPuesto, "rojo" | "ambar" | "verde" | "gris"> = {
  cubierto: "verde", por_cerrar: "verde", sin_ronda: "ambar", sin_apertura: "rojo", sin_cobertura: "rojo", sin_turno_hoy: "gris", sin_programar: "gris",
};

export function estadoDePuestos(puestosBase: PuestoBase[], turnos: TurnoBase[], ms = Date.now()): PuestoAhora[] {
  const porPuesto = new Map<string, TurnoBase[]>();
  for (const t of turnos) { if (!porPuesto.has(t.puesto_id)) porPuesto.set(t.puesto_id, []); porPuesto.get(t.puesto_id)!.push(t); }

  return puestosBase.map((p) => {
    const tienePuntosRonda = (p.puntos_ronda ?? []).some((x) => x.activo);
    const lista = porPuesto.get(p.id) ?? [];
    const enCurso = (t: TurnoBase) => new Date(t.inicio_programado).getTime() <= ms && new Date(t.fin_programado).getTime() >= ms;
    const actual = lista.find((t) => enCurso(t) && t.estado !== "cerrado") ?? lista.find(enCurso) ?? null;
    const proximo = lista.filter((t) => new Date(t.inicio_programado).getTime() > ms).sort((a, b) => a.inicio_programado.localeCompare(b.inicio_programado))[0] ?? null;
    const base = { id: p.id, codigo: p.codigo, nombre: p.nombre, servicio: servicio(p.tipo_servicio).etiqueta, coberturaHoras: p.cobertura_horas, armado: p.armado, direccion: p.direccion, lat: p.lat, lng: p.lng, desde: p.creado_en, tienePuntosRonda, proximoTurno: proximo?.inicio_programado ?? null };
    const vacio = { turnoId: null, agente: null, inicioTurno: null, finTurno: null, apertura: null, ultimaRonda: null, rondasEnTurno: 0 };

    if (!actual) {
      if (lista.length === 0) return { ...base, ...vacio, estado: "sin_programar" };
      const hoyTuvo = lista.some((t) => new Date(t.fin_programado).getTime() > ms - 24 * 3600 * 1000);
      return { ...base, ...vacio, estado: p.cobertura_horas >= 24 || !hoyTuvo ? "sin_cobertura" : "sin_turno_hoy" };
    }

    const g = uno(actual.guardias);
    const apertura = uno(actual.aperturas_turno)?.hora_captura ?? null;
    const rondas = (actual.rondas ?? []).map((r) => r.hora_captura).sort();
    const ultimaRonda = rondas.at(-1) ?? null;
    const inicio = new Date(actual.inicio_programado).getTime();
    const fin = new Date(actual.fin_programado).getTime();
    let estado: EstadoPuesto = "cubierto";
    if (fin - ms < MINUTOS_POR_CERRAR * 60000) estado = "por_cerrar";
    else if (tienePuntosRonda && ms - inicio > MINUTOS_SIN_RONDA * 60000 && (!ultimaRonda || ms - new Date(ultimaRonda).getTime() > MINUTOS_SIN_RONDA * 60000)) estado = "sin_ronda";

    return { ...base, estado, turnoId: actual.id, agente: g, inicioTurno: actual.inicio_programado, finTurno: actual.fin_programado, apertura, ultimaRonda, rondasEnTurno: rondas.length };
  });
}

/** Acumula cobertura de los turnos ya iniciados dentro de una ventana. */
export function acumularCobertura(turnos: TurnoBase[], desdeIso: string, ms = Date.now(), porPuesto?: Map<string, ResumenCobertura>): ResumenCobertura {
  const total: ResumenCobertura = { ...COBERTURA_VACIA };
  for (const t of turnos) {
    const inicio = new Date(t.inicio_programado).getTime();
    if (inicio > ms || t.inicio_programado < desdeIso) continue;
    const apertura = uno(t.aperturas_turno)?.hora_captura ?? null;
    // Los turnos heredados como "programado" ya tienen agente y se tratan
    // igual que los nuevos turnos abiertos automáticamente.
    const cubierto = Boolean(apertura) || t.estado === "programado" || t.estado === "abierto" || t.estado === "cerrado";
    const rondas = t.rondas?.length ?? 0;
    const destinos = [total];
    if (porPuesto) { const r = porPuesto.get(t.puesto_id) ?? { ...COBERTURA_VACIA }; porPuesto.set(t.puesto_id, r); destinos.push(r); }
    for (const r of destinos) {
      r.turnosPlanificados += 1;
      if (cubierto) r.turnosCubiertos += 1;
      r.rondasRegistradas += rondas;
      if (rondas > 0) r.turnosConRonda += 1;
      if (apertura) { r.aperturasTotales += 1; if (new Date(apertura).getTime() - inicio <= MINUTOS_TOLERANCIA_APERTURA * 60000) r.aperturasPuntuales += 1; }
    }
  }
  return total;
}
