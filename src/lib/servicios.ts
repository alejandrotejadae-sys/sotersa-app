/**
 * Modalidades de servicio que SOTERSA contrata.
 *
 * Fuente única: el formulario de alta, el panel de dotación y cualquier
 * cotización futura leen de aquí. Si se agrega una modalidad, se agrega en
 * este archivo y en el enum `tipo_servicio` de la base — en ese orden, y
 * ambas cosas, o quedan desincronizados.
 */

export type TipoServicio =
  | "punto_24_l_d"
  | "punto_12_l_d"
  | "punto_12_l_s"
  | "punto_12_diurno"
  | "punto_12_nocturno"
  | "horario_especial"
  | "custodia_armada";

export type Servicio = {
  valor: TipoServicio;
  etiqueta: string;
  detalle: string;
  /** Horas de cobertura al día. */
  horas: number;
  /**
   * Agentes fijos que exige la modalidad.
   *
   * Un punto de 24 h son dos turnos de 12 h, así que dos fijos. Los de 12 h
   * son uno. El saca francos NO se cuenta aquí: no tiene plaza, cubre los
   * días libres de varios puestos.
   */
  fijos: number;
  /** Si además necesita relevo para cubrir el día libre semanal. */
  requiereRelevo: boolean;
  /** Custodia armada: sin origen y destino no es una ruta. */
  requiereRuta: boolean;
};

export const SERVICIOS: Servicio[] = [
  {
    valor: "punto_24_l_d",
    etiqueta: "Punto 24 h · lunes a domingo",
    detalle: "Dos turnos de 12 h, todos los días.",
    horas: 24,
    fijos: 2,
    requiereRelevo: true,
    requiereRuta: false,
  },
  {
    valor: "punto_12_l_d",
    etiqueta: "Punto 12 h · lunes a domingo",
    detalle: "Un turno de 12 h, todos los días.",
    horas: 12,
    fijos: 1,
    requiereRelevo: true,
    requiereRuta: false,
  },
  {
    valor: "punto_12_l_s",
    etiqueta: "Punto 12 h · lunes a sábado",
    detalle: "Un turno de 12 h, con domingo libre.",
    horas: 12,
    fijos: 1,
    requiereRelevo: false,
    requiereRuta: false,
  },
  {
    valor: "punto_12_diurno",
    etiqueta: "12 h diurno",
    detalle: "Cobertura de día.",
    horas: 12,
    fijos: 1,
    requiereRelevo: true,
    requiereRuta: false,
  },
  {
    valor: "punto_12_nocturno",
    etiqueta: "12 h nocturno",
    detalle: "Cobertura de noche.",
    horas: 12,
    fijos: 1,
    requiereRelevo: true,
    requiereRuta: false,
  },
  {
    valor: "horario_especial",
    etiqueta: "Horario especial",
    detalle: "Jornada pactada con el cliente; se detalla en el nombre del puesto.",
    horas: 12,
    fijos: 1,
    requiereRelevo: false,
    requiereRuta: false,
  },
  {
    valor: "custodia_armada",
    etiqueta: "Custodia armada",
    detalle: "Acompañamiento de ruta, con origen y destino.",
    horas: 12,
    fijos: 1,
    requiereRelevo: false,
    requiereRuta: true,
  },
];

const PORVALOR = new Map(SERVICIOS.map((s) => [s.valor, s]));

export function servicio(valor: string | null | undefined): Servicio {
  return PORVALOR.get(valor as TipoServicio) ?? SERVICIOS[0];
}

export function esTipoServicio(valor: string): valor is TipoServicio {
  return PORVALOR.has(valor as TipoServicio);
}
