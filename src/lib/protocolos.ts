/**
 * Contenido operativo oficial de SOTERSA.
 *
 * Transcrito del material que ya esta impreso y colocado en los puestos
 * (Drive: 11_Marketing):
 *   - SOTERSA_Normas_Garita_A4.png      -> REGLAMENTO INTERNO / PUESTO DE CONTROL
 *   - SOTERSA_Protocolos_Emergencia_A4.png -> PLAN DE RESPUESTA / PUESTO DE CONTROL
 *
 * IMPORTANTE: esto no se redacta de nuevo ni se "mejora" desde la app.
 * El procedimiento ya existe y esta certificado bajo BASC; la app solo lo
 * ejecuta. Si cambia el reglamento, se cambia el arte impreso Y este archivo,
 * en ese orden.
 *
 * Los protocolos deben quedar disponibles SIN SEÑAL: en una emergencia real
 * es justo cuando la red falla o se satura.
 */

export type Protocolo = {
  codigo: string;
  titulo: string;
  pasos: string[];
};

/** Los 4 protocolos de emergencia del puesto de control. */
export const PROTOCOLOS_EMERGENCIA: Protocolo[] = [
  {
    codigo: "01",
    titulo: "Sismo o terremoto",
    pasos: [
      "Durante el movimiento: agáchate, cúbrete y sujétate; aléjate de vidrios y estantes.",
      "No corras ni salgas mientras tiembla; espera a que termine.",
      "Al cesar, evacua por la ruta señalizada hacia el punto de encuentro.",
      "Corta la energía si hay olor a gas o cables sueltos; no enciendas fuego.",
      "No reingreses a la garita hasta que el supervisor lo autorice.",
    ],
  },
  {
    codigo: "02",
    titulo: "Incendio",
    pasos: [
      "Da la alarma y llama al 911 con la dirección exacta y el tipo de fuego.",
      "Usa el extintor solo si el fuego recién empieza y tienes la salida libre.",
      "Extintor: hala el seguro, apunta a la base, presiona y barre en abanico.",
      "Cierra puertas al salir, no uses ascensores y agáchate si hay humo.",
      "Evacua y verifica que todos estén en el punto de encuentro.",
    ],
  },
  {
    codigo: "03",
    titulo: "Robo o asalto",
    pasos: [
      "No opongas resistencia: la vida vale más que cualquier bien.",
      "Manos visibles, obedece sin gestos bruscos y evita el contacto visual fijo.",
      "Activa el botón de pánico solo si puedes hacerlo sin ser visto.",
      "Observa y memoriza: número de sujetos, rasgos, armas, vehículo y placa.",
      "Al retirarse: llama al 911, avisa a la central y no persigas.",
      "No toques nada; preserva la escena y espera a la Policía.",
    ],
  },
  {
    codigo: "04",
    titulo: "Otras emergencias",
    pasos: [
      "Emergencia médica: llama al 911 y no muevas al herido salvo riesgo mayor.",
      "Ceniza volcánica: cierra puertas y ventanas, usa mascarilla y gafas.",
      "Inundación: corta la energía del área, eleva los equipos y reporta.",
      "Objeto o vehículo sospechoso: no lo manipules, aísla el área y reporta.",
      "Amenaza telefónica: mantén la calma, anota hora y texto exacto, informa.",
    ],
  },
];

/** Principio rector impreso al pie del plan de respuesta. */
export const PRINCIPIO_EMERGENCIA =
  "Primero la vida, luego los bienes. Toda emergencia se reporta a la central y se registra en la bitácora.";

/** Instrucciones de la llamada al ECU 911, tal como estan en el arte. */
export const INSTRUCCION_911 =
  "Indica dirección exacta, tipo de emergencia, número de personas y tu nombre.";

/**
 * Contactos que el arte impreso marca como "COMPLETAR EN CADA PUESTO".
 * En la app dejan de escribirse a mano: se configuran por puesto y el
 * guardia los ve ya resueltos, con enlace para llamar.
 */
export const CONTACTOS_POR_PUESTO = [
  "central_monitoreo",
  "administracion_cliente",
  "supervisor_zona",
  "jefe_operaciones",
] as const;

export type ContactoPuesto = (typeof CONTACTOS_POR_PUESTO)[number];

/**
 * Checklist de apertura de turno.
 * Sale literal de Normas de la Garita, seccion 03 Equipos y bienes:
 * "Verifica al iniciar el turno: radio, cámaras, linterna y bitácora."
 */
export const CHECKLIST_APERTURA = [
  { clave: "radio", etiqueta: "Radio" },
  { clave: "camaras", etiqueta: "Cámaras" },
  { clave: "linterna", etiqueta: "Linterna" },
  { clave: "bitacora", etiqueta: "Bitácora" },
] as const;

/**
 * Las 4 secciones del reglamento de garita. Se muestran como consulta
 * dentro de la app; las que generan un registro (checklist de equipos,
 * entrega del puesto) tienen su propia pantalla.
 */
export const NORMAS_GARITA: Protocolo[] = [
  {
    codigo: "01",
    titulo: "Orden y limpieza",
    pasos: [
      "Mantén la garita limpia, ordenada y libre de objetos personales.",
      "Limpia pisos, vidrios y superficies al inicio y al cierre del turno.",
      "Deposita los desechos en el basurero y evacúalos a diario.",
      "No consumas alimentos sobre el escritorio de control.",
      "Entrega el puesto limpio: quien recibe verifica y firma.",
    ],
  },
  {
    codigo: "02",
    titulo: "Ahorro de energía y agua",
    pasos: [
      "Apaga las luces interiores cuando haya luz natural suficiente.",
      "Enciende la iluminación perimetral solo en horario nocturno.",
      "Desconecta cargadores y equipos que no estén en uso.",
      "Cierra bien las llaves de agua y reporta cualquier fuga.",
      "Usa ventilador o calefactor únicamente el tiempo necesario.",
    ],
  },
  {
    codigo: "03",
    titulo: "Equipos y bienes",
    pasos: [
      "Verifica al iniciar el turno: radio, cámaras, linterna y bitácora.",
      "No modifiques la configuración de cámaras ni de comunicaciones.",
      "Prohibido conectar equipos ajenos al servicio en el puesto.",
      "Reporta de inmediato al supervisor todo daño o faltante.",
      "Cuida la señalética, mobiliario y llaves bajo tu custodia.",
    ],
  },
  {
    codigo: "04",
    titulo: "Conducta en el puesto",
    pasos: [
      "Uniforme completo, credencial visible y postura de atención.",
      "Prohibido dormir, fumar y usar el celular con fines personales.",
      "No permitas el ingreso de personas ajenas al servicio.",
      "Registra toda novedad en la bitácora con hora y firma.",
      "Trato cordial y respetuoso con clientes, visitantes y personal.",
    ],
  },
];

/** Cierre impreso del reglamento de garita. */
export const PRINCIPIO_GARITA =
  "La garita es la imagen de la empresa ante el cliente: se recibe y se entrega impecable.";

/** Severidad de una novedad. Define color y si dispara el SLA de 15 min. */
export const SEVERIDADES = [
  { clave: "informativa", etiqueta: "Informativa", disparaSLA: false },
  { clave: "novedad", etiqueta: "Novedad", disparaSLA: true },
  { clave: "emergencia", etiqueta: "Emergencia", disparaSLA: true },
] as const;

export type Severidad = (typeof SEVERIDADES)[number]["clave"];

/**
 * Compromiso contractual de aviso de novedades, en minutos.
 * Origen: resumen ejecutivo Citimed SOT-ES-2026-001-RE, cap. de
 * compromisos medibles. Se mide de hora_captura a notificada_at.
 */
export const SLA_AVISO_NOVEDAD_MIN = 15;
