/**
 * Tipos del dominio, en espejo con supabase/schema.sql.
 * Si cambia el esquema, cambia este archivo en el mismo commit.
 */

export type RolUsuario = "guardia" | "supervisor" | "admin" | "cliente";
export type TipoTurno = "fijo_dia" | "fijo_noche" | "saca_francos" | "supervision";
export type EstadoTurno = "programado" | "abierto" | "cerrado" | "ausente";
export type SeveridadNovedad = "informativa" | "novedad" | "emergencia";
export type EstadoNovedad = "registrada" | "validada" | "notificada" | "cerrada";
export type TipoContactoPuesto =
  | "central_monitoreo"
  | "administracion_cliente"
  | "supervisor_zona"
  | "jefe_operaciones";

export type Perfil = {
  id: string;
  rol: RolUsuario;
  nombre: string;
  telefono: string | null;
  activo: boolean;
  empresa_cliente_id: string | null;
  zona_id: string | null;
  creado_en: string;
};

export type Guardia = {
  id: string;
  perfil_id: string | null;
  cedula: string;
  credencial: string | null;
  nombre: string;
  telefono: string | null;
  activo: boolean;
};

export type Puesto = {
  id: string;
  empresa_cliente_id: string;
  zona_id: string | null;
  codigo: string;
  nombre: string;
  cobertura_horas: number;
  armado: boolean;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  activo: boolean;
};

export type PuntoRonda = {
  id: string;
  puesto_id: string;
  codigo: string;
  nombre: string;
  token: string;
  orden: number;
  activo: boolean;
};

export type Turno = {
  id: string;
  puesto_id: string;
  guardia_id: string;
  tipo: TipoTurno;
  inicio_programado: string;
  fin_programado: string;
  estado: EstadoTurno;
};

export type AperturaTurno = {
  id: string;
  turno_id: string;
  hora_captura: string;
  hora_sync: string;
  /** { radio: true, camaras: true, linterna: false, bitacora: true } */
  checklist: Record<string, boolean>;
  estado_puesto: string | null;
  observacion: string | null;
  foto_url: string | null;
  firma_entrante_url: string | null;
  firma_saliente_url: string | null;
  guardia_saliente_id: string | null;
};

export type Novedad = {
  id: string;
  puesto_id: string;
  turno_id: string | null;
  guardia_id: string | null;
  // --- bloque inmutable ---
  tipo: string;
  severidad: SeveridadNovedad;
  descripcion: string;
  foto_url: string | null;
  lat: number | null;
  lng: number | null;
  hora_captura: string;
  hora_sync: string;
  // --- bloque de gestion ---
  estado: EstadoNovedad;
  visible_cliente: boolean;
  validada_por: string | null;
  validada_en: string | null;
  notificada_en: string | null;
  nota_supervisor: string | null;
};

export type Ronda = {
  id: string;
  turno_id: string;
  punto_id: string;
  guardia_id: string | null;
  hora_captura: string;
  hora_sync: string;
  lat: number | null;
  lng: number | null;
};

/** Fila de la vista v_puestos_sin_apertura — alerta de puesto vacio. */
export type PuestoSinApertura = {
  turno_id: string;
  puesto_id: string;
  puesto_codigo: string;
  puesto_nombre: string;
  zona_id: string | null;
  empresa_cliente_id: string;
  guardia_nombre: string;
  guardia_telefono: string | null;
  inicio_programado: string;
  minutos_de_retraso: number;
};

/** Fila de la vista v_sla_novedades — cumplimiento del aviso de 15 min. */
export type SlaNovedad = {
  id: string;
  puesto_id: string;
  empresa_cliente_id: string;
  severidad: SeveridadNovedad;
  hora_captura: string;
  notificada_en: string | null;
  minutos_aviso: number | null;
  cumple_sla: boolean | null;
};
