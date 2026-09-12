import { yt, type Modulo } from "./tipos";

/**
 * M10-M12: lo especifico de cada tipo de cliente de SOTERSA. Hospitales
 * (Citimed, UNIB.E), edificios residenciales (Dareus, Napoles) y custodia.
 *
 * Fuentes: OIT/OMS/CIE/ISP, "Directrices marco para afrontar la violencia
 * laboral en el sector de la salud" (2002); OMS, herramientas de riesgos
 * laborales en el sector salud; Reglamento General de la Ley de Propiedad
 * Horizontal (Ecuador); LOVSP Art. 13, 17, 19, 48.
 */
export const MODULOS_CLIENTES: Modulo[] = [
  // ==========================================================================
  // MODULO 10 · SEGURIDAD EN ENTORNOS DE SALUD
  // ==========================================================================
  {
    id: "entornos-de-salud",
    alcance: "cliente",
    codigo: "M10",
    titulo: "Seguridad en hospitales y clínicas",
    resumen: "Un hospital es un lugar donde la gente llega asustada, enferma o de duelo. El agente protege sin agregar dolor: control de visitas, áreas restringidas, pacientes y familiares alterados, medicamentos y morgue.",
    paraQuien: "Obligatorio para agentes asignados a Citimed, UNIB.E y cualquier puesto de salud.",
    color: "ambar",
    lecciones: [
      {
        id: "el-hospital-como-puesto",
        titulo: "El hospital como puesto: lo que lo hace distinto",
        minutos: 10,
        objetivo: "Entender por qué las reglas de un hospital no son las de un edificio de oficinas.",
        secciones: [
          {
            parrafos: [
              "El sector salud es uno de los más expuestos a la violencia en el trabajo: la OIT y la OMS publicaron directrices específicas porque el personal sanitario sufre agresiones con mucha más frecuencia que otros sectores. La razón es simple: quien llega a un hospital viene en el peor momento de su vida, con miedo, dolor o duelo, y muchas veces con horas de espera. El agente de seguridad es el primero que recibe esa tensión.",
              "Al mismo tiempo, un hospital tiene dentro cosas que otros lugares no tienen: medicamentos controlados, equipos costosos, recién nacidos, historias clínicas, y personas que no pueden defenderse. Proteger todo eso sin tratar a la gente como sospechosa es el oficio.",
            ],
          },
          {
            titulo: "Zonas y reglas",
            lista: [
              "Emergencia: acceso rápido para pacientes, control estricto de acompañantes (normalmente uno). Vehículos en la rampa solo el tiempo de bajar al paciente.",
              "Hospitalización: horario de visita y número de visitantes por paciente según la norma del hospital. Credencial de visitante con el número de cama.",
              "Áreas restringidas (quirófanos, UCI, neonatología, farmacia, laboratorio): solo personal con credencial del hospital. Nadie más, ni con «permiso verbal».",
              "Morgue: acceso solo con autorización escrita y acompañado por personal del hospital.",
              "Farmacia y bodegas: registro de todo lo que entra y sale, con firma de quien recibe.",
            ],
          },
          {
            destacado: "En un hospital, el agente cuida a gente que no puede cuidarse. Firmeza en la puerta, suavidad en el trato.",
            enSotersa: "Cada hospital tiene su reglamento interno de visitas y accesos. Está en los documentos del puesto; conócelo antes del primer turno y ante la duda pregunta a supervisión.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "Directrices marco para afrontar la violencia laboral en el sector de la salud", url: "https://www.ilo.org/es/publications/directrices-marco-para-afrontar-la-violencia-laboral-en-el-sector-de-la", fuente: "OIT / OMS / CIE / ISP" },
          { tipo: "web", titulo: "Violencia y acoso: riesgos laborales en el sector salud", url: "https://www.who.int/es/tools/occupational-hazards-in-health-sector/violence-harassment", fuente: "Organización Mundial de la Salud" },
        ],
      },
      {
        id: "familiares-alterados",
        titulo: "Pacientes y familiares alterados",
        minutos: 12,
        objetivo: "Contener a una persona en crisis emocional sin escalar, y saber cuándo pasa a ser un problema de seguridad.",
        secciones: [
          {
            parrafos: [
              "El familiar que grita en emergencia no es un delincuente: es alguien con miedo. Casi todo lo del módulo de desescalada aplica aquí, con un matiz: no discutas nunca sobre la atención médica. No sabes, no te corresponde y lo empeora.",
            ],
          },
          {
            titulo: "Qué decir",
            lista: [
              "«Entiendo que está asustado. Voy a avisar a la enfermera de turno para que le den información». Y hazlo: la mayoría de las crisis se resuelven cuando alguien del hospital habla con la familia.",
              "Nunca: «eso no es conmigo», «tiene que esperar como todos», «cálmese». Nunca opiniones sobre médicos, tiempos o diagnósticos.",
              "Si pide entrar a un área restringida: «No puedo dejarle pasar; sí puedo pedir que alguien salga a hablar con usted».",
            ],
          },
          {
            titulo: "Cuándo pasa a seguridad",
            lista: [
              "Agresión física o intento de forzar el ingreso a un área restringida: distancia, apoyo, protocolo de desescalada, 911 si hay violencia.",
              "Grupos numerosos (pandillas, familias en conflicto, hinchadas) llegando con un herido: avisa a central y al hospital de inmediato; controla el acceso a uno o dos acompañantes; los demás afuera.",
              "Persona que dice ser policía o funcionario: identificación, y confirmación con la administración del hospital antes de darle acceso a un paciente.",
            ],
          },
          {
            titulo: "Situaciones especiales",
            lista: [
              "Paciente psiquiátrico o bajo efectos que intenta salir: no lo retengas por la fuerza tú solo; avisa al personal de salud, que es quien decide y tiene protocolo. Acompaña y contiene solo si te lo piden y con ellos.",
              "Fallecimiento: la familia va a reaccionar. Espacio, silencio, y avisa a trabajo social del hospital. No apures.",
              "Prensa: ningún dato. Todo se remite a la administración.",
            ],
          },
          {
            destacado: "No discutas la atención médica. Consigue que alguien del hospital hable con la familia; eso apaga el 80 % de las crisis.",
          },
        ],
        recursos: [
          yt("RXU1WLR3mT4", "Desescalada verbal y seguridad laboral: atención al paciente en agitación", "EVO Training (YouTube)"),
        ],
      },
      {
        id: "bebes-menores-vulnerables",
        titulo: "Recién nacidos, menores y personas vulnerables",
        minutos: 8,
        objetivo: "Prevenir el robo o la salida no autorizada de un menor o de un paciente sin capacidad de decidir.",
        secciones: [
          {
            lista: [
              "Ningún recién nacido sale del hospital sin el procedimiento del hospital (brazalete que coincide con el de la madre, alta firmada, personal que acompaña). Ante la mínima duda, se detiene la salida y se llama a enfermería.",
              "Persona que sale cargando un bebé sin personal del hospital: no es descortesía preguntar. Es tu trabajo.",
              "Menores que llegan solos o acompañados por adultos que no son los padres: registro completo del acompañante; avisa a trabajo social si algo no cuadra.",
              "Adultos mayores o pacientes desorientados que intentan salir: acompañamiento, no fuerza; avisa a enfermería.",
              "Cualquier sospecha de maltrato a un menor o adulto mayor (lesiones que no cuadran con la historia, miedo al acompañante): reporta a trabajo social del hospital y a la central. No confrontes al acompañante.",
            ],
          },
          {
            destacado: "Preguntar a quien sale con un bebé no ofende a nadie. No preguntar puede costar una vida.",
          },
        ],
        recursos: [],
      },
      {
        id: "medicamentos-equipos-datos",
        titulo: "Medicamentos, equipos, historias clínicas",
        minutos: 8,
        objetivo: "Cuidar los tres bienes del hospital que más valen para un ladrón.",
        secciones: [
          {
            lista: [
              "Medicamentos controlados: circulan solo con personal de farmacia y registro. Cualquier persona sacando cajas de medicinas sin documentación se detiene y se verifica.",
              "Equipos (monitores, bombas de infusión, laptops, tablets): salida de bienes solo con orden escrita del hospital. Registra número de serie si lo tiene.",
              "Historias clínicas y datos de pacientes: son datos sensibles por ley (LOPDP). Ningún documento con nombre de paciente se deja en la garita, se fotografía ni se comenta. Si alguien pregunta «¿en qué habitación está fulano?», la respuesta es «consulte en información».",
              "Proveedores y técnicos: orden de trabajo, credencial, acompañamiento por personal del hospital en áreas restringidas.",
              "Vehículos en parqueadero: inspección visual a la salida en horario nocturno, según reglamento del hospital.",
            ],
          },
          {
            destacado: "Medicinas, equipos y datos de pacientes: nada sale sin papel, y nada se cuenta.",
            enSotersa: "Salidas de bienes y verificaciones de proveedores se registran como novedad informativa. Es lo que le muestra al hospital que el control existe.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m10p1", texto: "Un familiar grita en emergencia porque «nadie le dice nada» de su padre. Lo correcto es:", opciones: ["Explicarle que los médicos están ocupados y que espere como todos.", "Reconocer su miedo y avisar a la enfermera de turno para que alguien del hospital le dé información.", "Decirle que el diagnóstico seguro no es grave.", "Pedirle que se retire del hospital."], correcta: 1, explicacion: "No se discute la atención médica. Conseguir que alguien del hospital hable con la familia resuelve la mayoría de las crisis." },
        { id: "m10p2", texto: "Una mujer sale del hospital cargando un recién nacido, sin personal que la acompañe. Tú:", opciones: ["La dejas pasar; seguramente es la madre.", "Le preguntas con cortesía, verificas el brazalete y el alta con enfermería antes de que salga.", "La detienes por la fuerza.", "Le pides que vuelva más tarde."], correcta: 1, explicacion: "Ningún recién nacido sale sin el procedimiento del hospital. Preguntar es el trabajo; retener por la fuerza no." },
        { id: "m10p3", texto: "Un paciente psiquiátrico intenta salir por la puerta principal. Tú:", opciones: ["Lo retienes físicamente tú solo hasta que se calme.", "Lo dejas ir; es libre.", "Avisas de inmediato al personal de salud, que decide y tiene protocolo; contienes solo si te lo piden y con ellos.", "Llamas a la Policía para que lo detengan."], correcta: 2, explicacion: "La decisión y el protocolo son del personal de salud. El agente apoya, no actúa solo." },
        { id: "m10p4", texto: "Alguien pregunta en la garita en qué habitación está un paciente. Respondes:", opciones: ["Le das el número si parece familiar.", "«Consulte en información»: los datos de pacientes son sensibles y no se entregan en la garita.", "Le pides que espere mientras revisas la lista.", "Le das el número solo si muestra cédula."], correcta: 1, explicacion: "Datos de pacientes son datos sensibles (LOPDP). La garita no informa; remite a información." },
        { id: "m10p5", texto: "Un técnico externo quiere entrar a UCI a revisar un equipo, con una orden de trabajo. Lo correcto es:", opciones: ["Dejarlo pasar con la orden.", "Verificar la orden y la credencial, y que personal del hospital lo acompañe: el área es restringida.", "Negarle el ingreso siempre.", "Dejarlo pasar si el equipo es urgente."], correcta: 1, explicacion: "Áreas restringidas: solo personal del hospital; los externos entran acompañados y con verificación." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 11 · EDIFICIOS RESIDENCIALES
  // ==========================================================================
  {
    id: "residencial",
    alcance: "cliente",
    codigo: "M11",
    titulo: "Seguridad en edificios y conjuntos residenciales",
    resumen: "Residentes, visitas, delivery, mudanzas y el reglamento interno. El puesto donde el «cliente» son cien familias con cien opiniones, y el agente tiene que aplicar una sola regla.",
    paraQuien: "Obligatorio para agentes en Dareus, Nápoles y cualquier conjunto residencial.",
    color: "azul",
    lecciones: [
      {
        id: "quien-manda",
        titulo: "Quién manda en un conjunto: el reglamento y la administración",
        minutos: 8,
        objetivo: "Saber de quién recibes instrucciones y qué hacer cuando un residente pide algo distinto.",
        secciones: [
          {
            parrafos: [
              "En Ecuador, todo edificio o conjunto bajo propiedad horizontal tiene un reglamento interno aprobado por la asamblea de copropietarios, y una administración que lo ejecuta. Ese reglamento define horarios, visitas, mudanzas, mascotas, uso de áreas comunes. Para el agente es la ley del puesto.",
              "Un residente individual no puede cambiar el reglamento en la garita. Puede pedirte cosas; tú aplicas la regla, con cortesía, y remites a la administración lo que salga de ella.",
            ],
          },
          {
            titulo: "La cadena",
            lista: [
              "Instrucciones operativas: administración del conjunto → SOTERSA (supervisor) → agente. Cualquier cambio de procedimiento llega por ahí, por escrito.",
              "Residentes: se les atiende, no se les obedece contra el reglamento. «Con gusto, pero eso lo autoriza la administración; le doy el contacto».",
              "Directiva: son residentes con cargo. Sus pedidos fuera del reglamento también van a la administración.",
            ],
          },
          {
            titulo: "El pedido de siempre",
            lista: [
              "«Déjalo pasar, es de confianza» → registro igual. Explica que es la regla para todos, y que lo protege a él.",
              "«No anotes que entré tarde con visitas» → la bitácora no se edita. Sonríe y anota.",
              "«Guárdame esto», «préstame la llave», «no le digas a la administración» → no. Y si insiste, reporta.",
            ],
          },
          {
            destacado: "Cien residentes, una regla. La regla la pone la asamblea y la aplica el agente.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "Reglamento General de la Ley de Propiedad Horizontal", url: "https://www.gob.ec/regulaciones/reglamento-general-ley-propiedad-horizontal", fuente: "gob.ec", nota: "Marco legal de los reglamentos internos de conjuntos y edificios." },
        ],
      },
      {
        id: "visitas-delivery",
        titulo: "Visitas, delivery y servicios",
        minutos: 10,
        objetivo: "Controlar el flujo diario de personas ajenas sin convertir el acceso en un cuello de botella.",
        secciones: [
          {
            titulo: "Visitas",
            lista: [
              "Nombre de la visita, documento, a quién visita. Confirmación con el residente (llamada al departamento o al celular registrado). Sin confirmación no entra, aunque diga que lo esperan.",
              "Registro de entrada y salida. Credencial de visitante si el conjunto la usa.",
              "Visitas que se quedan más de lo normal (horas, días): informa a la administración; puede ser un arrendatario no declarado.",
            ],
          },
          {
            titulo: "Delivery y plataformas",
            lista: [
              "El repartidor no sube: entrega en garita o el residente baja, según el reglamento. Registro de la plataforma, placa de la moto y departamento.",
              "Nunca recibas pedidos pagados con el dinero del residente ni «adelantes» dinero. Ni guardes comida más de unos minutos.",
              "Motos ajenas al servicio no ingresan al parqueadero.",
            ],
          },
          {
            titulo: "Servicios y proveedores",
            lista: [
              "Gas, agua, internet, plomería: el residente debe haber avisado o el proveedor trae orden. Registro con nombre, empresa, departamento y hora de salida.",
              "Lectores de medidores y «inspectores» de empresas de servicios: credencial de la empresa y confirmación con administración. Es una modalidad clásica de ingreso para robo.",
              "Empleadas domésticas y personal frecuente: lista autorizada por el residente ante la administración. Quien no está en la lista, se confirma cada vez.",
            ],
          },
          {
            destacado: "«Lo están esperando» no es una autorización. La confirmación con el residente sí.",
            enSotersa: "Cada negativa de acceso y cada proveedor sin orden se anota como novedad informativa. Cuando un residente reclame «a mi visita no la dejaron entrar», la bitácora explica por qué.",
          },
        ],
        recursos: [],
      },
      {
        id: "mudanzas-bienes",
        titulo: "Mudanzas, salida de bienes y áreas comunes",
        minutos: 8,
        objetivo: "Evitar que un robo salga por la puerta principal disfrazado de mudanza.",
        secciones: [
          {
            lista: [
              "Mudanza de entrada o salida: solo con autorización escrita de la administración (que verifica que el propietario está al día y que es realmente su departamento). Sin ese papel, no se mueve nada.",
              "Registra empresa de mudanza, placa, nombres, hora de inicio y fin. Inspección visual de lo que sale si el reglamento lo permite.",
              "Salida de electrodomésticos, muebles o bicicletas fuera de una mudanza: confirmación con el residente titular, no con quien lo saca.",
              "Áreas comunes (salón, piscina, gimnasio, parqueadero de visitas): reservas según reglamento; horarios; ruido. El agente aplica, la administración sanciona.",
              "Parqueaderos: cada vehículo en su puesto asignado; visitas en el área de visitas. Vehículos desconocidos estacionados por horas: reporta.",
              "Ronda nocturna por áreas comunes y parqueaderos: puertas de acceso peatonal cerradas, iluminación, vehículos.",
            ],
          },
          {
            destacado: "Una mudanza sin autorización escrita es, hasta que se demuestre lo contrario, un robo con camión.",
          },
        ],
        recursos: [],
      },
      {
        id: "convivencia-y-emergencias",
        titulo: "Convivencia, ruido y emergencias en el conjunto",
        minutos: 8,
        objetivo: "Manejar los conflictos entre vecinos sin tomar partido, y actuar en emergencias domésticas.",
        secciones: [
          {
            titulo: "Conflictos entre residentes",
            lista: [
              "Ruido, mascotas, parqueaderos, fiestas: no eres juez. Registra la queja con hora, avisa al residente causante con cortesía si el reglamento lo prevé, e informa a la administración.",
              "Nunca te pongas de un lado. «Registro su queja y la paso a la administración» es la única frase.",
              "Violencia dentro de un departamento (gritos, golpes, pedidos de auxilio): 911 de inmediato. No entres al departamento; espera a la Policía. Registra todo.",
            ],
          },
          {
            titulo: "Emergencias domésticas",
            lista: [
              "Olor a gas: no enciendas nada, ventila si puedes, evacúa el área, corta el suministro si sabes dónde, 911 y administración.",
              "Fuga de agua o inundación: corta la llave de paso del área si la conoces, avisa al residente y a la administración, protege equipos eléctricos.",
              "Ascensor detenido con personas dentro: tranquiliza por el intercomunicador, llama a la empresa de mantenimiento y a la administración; nunca intentes abrir la puerta tú.",
              "Corte de energía: verifica la planta o el generador si el conjunto tiene, ilumina la garita, refuerza la ronda: los accesos automáticos pueden quedar abiertos.",
            ],
          },
          {
            destacado: "Entre vecinos, el agente registra y remite. En una emergencia, actúa y avisa.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m11p1", texto: "Un residente te pide que dejes entrar a su visita sin registrarla «porque es de confianza». Tú:", opciones: ["La dejas entrar; el residente lo autoriza.", "La registras igual y le explicas que la regla es para todos y lo protege a él.", "La dejas entrar pero la anotas después.", "Le pides al residente que firme una excepción."], correcta: 1, explicacion: "El reglamento lo pone la asamblea; un residente no lo cambia en la garita." },
        { id: "m11p2", texto: "Llega un camión de mudanza con dos personas que dicen que el propietario del 5A los envió. Sin papel de la administración:", opciones: ["Los dejas subir si el 5A confirma por teléfono.", "No se mueve nada hasta tener la autorización escrita de la administración.", "Los dejas cargar pero anotas la placa.", "Les pides que vuelvan de noche cuando hay menos gente."], correcta: 1, explicacion: "Mudanza sin autorización escrita de la administración es, hasta demostrar lo contrario, un robo con camión." },
        { id: "m11p3", texto: "Un «lector de medidores» de la empresa eléctrica pide entrar al conjunto. Lo correcto es:", opciones: ["Dejarlo pasar; viene uniformado.", "Pedir credencial de la empresa y confirmar con la administración; es una modalidad clásica de ingreso para robo.", "Negarle el paso siempre.", "Acompañarlo tú y dejar la garita."], correcta: 1, explicacion: "Credencial y confirmación. Y la garita no se abandona." },
        { id: "m11p4", texto: "Escuchas gritos y golpes dentro de un departamento y una voz que pide auxilio. Tú:", opciones: ["Subes y entras a separar.", "Llamas al 911 de inmediato, no entras, esperas a la Policía y registras todo.", "Esperas a ver si se calma.", "Llamas al residente para preguntar si todo está bien."], correcta: 1, explicacion: "Violencia dentro de un domicilio: 911. El agente no entra; espera a la Policía y registra." },
        { id: "m11p5", texto: "Dos vecinos discuten por un parqueadero y ambos te piden que les des la razón. Tú:", opciones: ["Decides quién tiene razón según el reglamento.", "Registras la queja con hora y la pasas a la administración, sin tomar partido.", "Ignoras a los dos.", "Llamas a la Policía."], correcta: 1, explicacion: "Entre vecinos, el agente registra y remite. No es juez." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 12 · CUSTODIA ARMADA Y TRANSPORTE
  // ==========================================================================
  {
    id: "custodia-armada",
    alcance: "cliente",
    codigo: "M12",
    titulo: "Custodia armada y transporte de carga",
    resumen: "Planificar la ruta, revisar el vehículo, mantener comunicación continua, reconocer que te siguen, y actuar ante una emboscada. Para el equipo de custodia de SOTERSA.",
    paraQuien: "Obligatorio para agentes asignados a servicios de custodia. Requiere Nivel II vigente.",
    color: "verde",
    lecciones: [
      {
        id: "marco-y-preparacion",
        titulo: "Marco legal y preparación del servicio",
        minutos: 10,
        objetivo: "Conocer qué autoriza la ley en custodia y cómo se prepara un servicio antes de arrancar.",
        secciones: [
          {
            parrafos: [
              "La LOVSP distingue el servicio de custodia de carga y carga crítica (Art. 19), prestado con personal especializado, con o sin vehículo de apoyo armado, y el de transporte de valores (Art. 17), que requiere vehículos y permisos específicos. Solo puede ir armado quien tiene Nivel II vigente (Art. 51), y el arma se usa exclusivamente en el servicio autorizado (Art. 48). Una custodia es un servicio con nombre, hora, origen, destino y responsable; nada de eso se improvisa.",
            ],
          },
          {
            titulo: "Antes de salir",
            lista: [
              "Orden de servicio: qué se custodia, quién lo entrega, quién lo recibe, ruta autorizada, horarios. Sin orden, no hay servicio.",
              "Ruta principal y alternativa revisadas ese día: obras, cierres, zonas de riesgo conocidas, hora del tráfico. Se avisa a central cuál se tomará.",
              "Vehículo: combustible, llantas, luces, frenos, radio y teléfono cargados, GPS activo. Revisión visual bajo el vehículo y en el motor si estuvo sin vigilancia.",
              "Equipo: arma y munición verificadas (registro de entrega), chaleco, EPI, linterna, botiquín.",
              "Reunión de dos minutos del equipo: roles (conductor, custodio), señales, puntos de parada permitidos (ninguno que no esté en la orden).",
            ],
          },
          {
            destacado: "La custodia se gana o se pierde antes de arrancar: en la ruta, el vehículo y la orden de servicio.",
            enSotersa: "La ficha de custodia en la app tiene la ruta origen-destino y los contactos. El turno se abre al iniciar y se cierra con firma al entregar; las novedades del trayecto se reportan en el momento.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "LOVSP Art. 13, 17, 19, 48 y 51", url: "https://www.ministeriodelinterior.gob.ec/wp-content/uploads/downloads/2025/08/LOVSP.pdf", fuente: "Ministerio del Interior" },
        ],
      },
      {
        id: "en-ruta",
        titulo: "En ruta: comunicación, observación y paradas",
        minutos: 12,
        objetivo: "Mantener el control del servicio durante todo el trayecto.",
        secciones: [
          {
            titulo: "Comunicación",
            lista: [
              "Reportes a central en cada hito: salida, puntos de control acordados, llegada. Si pasan más de 20 minutos sin reporte, central debe llamar; si no contesta, activa el protocolo.",
              "Por radio o teléfono, sin datos sensibles: usa los códigos acordados para carga, ruta y estado.",
              "Palabra de coacción: una frase normal acordada que significa «estoy bajo amenaza». Se define antes de salir y se cambia por servicio.",
            ],
          },
          {
            titulo: "Observación: ¿te siguen?",
            lista: [
              "Un vehículo que hace tres giros contigo, mantiene distancia constante, o cambia de carril cuando tú lo haces. Motos con dos ocupantes que se acercan y se alejan repetidamente.",
              "Prueba: cambia de velocidad, toma una calle secundaria y vuelve a la ruta. Si sigue ahí, reporta placa, tipo y color a central; no te detengas; dirígete a un punto seguro (UPC, estación de servicio con gente) si la orden lo permite.",
              "Personas en el punto de entrega que no cuadran: esperan sin motivo, hablan por teléfono mirándote, se acercan al vehículo.",
            ],
          },
          {
            titulo: "Paradas",
            lista: [
              "Solo las de la orden de servicio. Ninguna para comer, cargar combustible o «un momento». Todo eso se hace antes.",
              "Si una parada es inevitable (avería, accidente): reporta antes de detenerte, custodio afuera con visión de 360°, conductor en el vehículo con el motor encendido, tiempo mínimo.",
              "Ventanas arriba, puertas con seguro, nadie ajeno se acerca al vehículo. Un «¿me da una dirección?» a la ventana es el inicio clásico de un asalto.",
            ],
          },
          {
            destacado: "Reporte en cada hito, ninguna parada fuera de la orden, y un vehículo que hace tres giros contigo no es casualidad.",
          },
        ],
        recursos: [],
      },
      {
        id: "entrega-y-emboscada",
        titulo: "Entrega, recepción y qué hacer ante una emboscada",
        minutos: 12,
        objetivo: "Cerrar el servicio con trazabilidad y reaccionar correctamente si hay un ataque.",
        secciones: [
          {
            titulo: "Entrega y recepción",
            lista: [
              "Identificación de quien recibe contra la orden de servicio: nombre, documento, firma. Si no coincide, no se entrega; se llama a central.",
              "Verificación conjunta de la carga (sellos, cantidad, estado) antes de firmar. Foto de sellos y del acta con la app.",
              "Cierre del servicio en la app con firma. Reporte a central de «entrega completa» con hora.",
            ],
          },
          {
            titulo: "Emboscada o asalto en ruta",
            lista: [
              "Prioridad absoluta: la vida del equipo. La carga está asegurada; las personas no se reemplazan.",
              "Si hay posibilidad de salir: acelera, no te detengas, dirígete al punto seguro más cercano, reporta con la palabra de coacción o directamente.",
              "Si el vehículo está bloqueado y hay armas apuntando: manos visibles, obedece, no hagas movimientos bruscos, no mires fijo. El arma del custodio no se saca en desventaja; sacarla es lo que convierte un robo en un tiroteo.",
              "Legítima defensa solo con agresión actual y necesidad racional (COIP Art. 33): si ya tienen el control, no hay defensa posible, hay supervivencia.",
              "Observa y memoriza: número de atacantes, armas, vehículos, placas, dirección de huida, frases que usaron.",
              "Apenas se retiren: 911, central, no persigas, preserva la escena, atiende heridos.",
            ],
          },
          {
            titulo: "Después",
            lista: [
              "Reporte inmediato en la app como emergencia, con todo el detalle.",
              "Declaración a la Policía: hechos, en orden, sin opinar.",
              "Revisión del servicio con supervisión: qué falló en ruta, comunicación o preparación. Sin culpas, con aprendizaje.",
            ],
          },
          {
            destacado: "En una emboscada, la carga ya está perdida o asegurada; lo que decides es si el equipo vuelve a casa.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 80,
      preguntas: [
        { id: "m12p1", texto: "El equipo tiene hambre a mitad de una custodia y hay una parada de comida en la ruta. Lo correcto es:", opciones: ["Parar cinco minutos si el custodio se queda en el vehículo.", "No parar: solo se hacen las paradas de la orden de servicio; comer se resuelve antes de salir.", "Parar y reportar después.", "Parar solo si la carga no es valiosa."], correcta: 1, explicacion: "Ninguna parada fuera de la orden. Todo lo demás se hace antes de arrancar." },
        { id: "m12p2", texto: "Un vehículo hace tres giros contigo y mantiene la distancia. Tú:", opciones: ["Te detienes a ver qué quiere.", "Aceleras y lo pierdes por calles secundarias sin avisar.", "Cambias de velocidad, tomas una secundaria y vuelves; si sigue, reportas placa a central y vas a un punto seguro sin detenerte.", "Lo ignoras; puede ser casualidad."], correcta: 2, explicacion: "Prueba de seguimiento, reporte y punto seguro. Detenerse o improvisar rutas sin avisar es lo que buscan." },
        { id: "m12p3", texto: "Quien recibe la carga no coincide con la persona indicada en la orden de servicio, pero dice que «lo mandaron». Tú:", opciones: ["Entregas si muestra cédula.", "No entregas; llamas a central para confirmar antes de mover nada.", "Entregas y anotas su nombre.", "Entregas la mitad hasta confirmar."], correcta: 1, explicacion: "Sin coincidencia con la orden, no hay entrega. Central confirma." },
        { id: "m12p4", texto: "Bloquean tu vehículo y dos personas apuntan con armas a la cabina. Según el módulo:", opciones: ["El custodio saca el arma y responde.", "Manos visibles, obediencia, sin movimientos bruscos; observar y memorizar; sacar el arma en desventaja convierte el robo en tiroteo.", "El conductor acelera contra los atacantes.", "Se negocia la entrega de la mitad de la carga."], correcta: 1, explicacion: "Con el control perdido no hay defensa posible, hay supervivencia. Observar, memorizar, reportar cuando se retiren." },
        { id: "m12p5", texto: "¿Qué es la «palabra de coacción»?", opciones: ["Un código para pedir combustible.", "Una frase normal acordada antes del servicio que significa «estoy bajo amenaza», para avisar sin que el atacante lo note.", "El nombre del cliente.", "La clave del GPS."], correcta: 1, explicacion: "Se define antes de salir y se cambia por servicio. Permite alertar a central bajo amenaza." },
      ],
    },
  },
];
