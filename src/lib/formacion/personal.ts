import type { Modulo } from "./tipos";

/**
 * M4 y M5: la persona detras del uniforme y la integridad que exige BASC.
 *
 * Fuentes: OMS/OPS "En tiempos de estres, haz lo que importa" (2020, version
 * para America Latina 2022); INSST NTP 455 "Trabajo a turnos y nocturno";
 * Superintendencia de Bancos del Ecuador (educacion financiera); World BASC
 * Organization, "Guia de Implementacion Norma y Estandares Internacionales
 * BASC Version 6 - 2022"; LOVSP Art. 41, 47, 48, 51, 63.
 */
export const MODULOS_PERSONAL: Modulo[] = [
  // ==========================================================================
  // MODULO 4 · BIENESTAR Y CRECIMIENTO PERSONAL
  // ==========================================================================
  {
    id: "bienestar",
    codigo: "M4",
    titulo: "Bienestar y crecimiento personal del agente",
    resumen: "Dormir bien trabajando de noche, manejar el estrés de la garita, cuidar el dinero, la familia y el cuerpo, y saber hacia dónde crecer en SOTERSA.",
    paraQuien: "Para todo el personal. Especialmente útil en los primeros meses de turnos rotativos.",
    color: "azul",
    lecciones: [
      {
        id: "dormir-de-noche",
        titulo: "Dormir bien cuando se trabaja de noche",
        minutos: 15,
        objetivo: "Organizar el sueño alrededor del turno para llegar despierto a las 3 de la mañana y no enfermarse en el camino.",
        secciones: [
          {
            parrafos: [
              "El cuerpo humano está hecho para dormir de noche. Cuando trabajas de noche, no cambias esa biología: la engañas un poco, con disciplina. Los estudios de prevención laboral coinciden en tres cosas: el trabajo nocturno altera el sueño, la salud y la vida familiar; los efectos se acumulan con los años; y las medidas que más ayudan son simples y dependen de ti.",
              "En SOTERSA la mayoría de los puestos son de 12 horas. Un turno de noche mal dormido no es solo cansancio: es una ronda que no se hace, una cámara que no se mira y un reflejo lento cuando de verdad importa.",
            ],
          },
          {
            titulo: "Antes del turno de noche",
            lista: [
              "Duerme el bloque principal de día en una habitación oscura (cortinas gruesas o antifaz), fresca y silenciosa (tapones). Avisa en casa: «de 9 a 4 estoy durmiendo, como si fuera de noche».",
              "Si no logras 7 horas seguidas, suma una siesta de 60 a 90 minutos antes de salir al puesto. Es la medida con más respaldo para el turno nocturno.",
              "Come algo ligero antes de salir; no llegues al puesto con el estómago vacío ni con una comida pesada.",
            ],
          },
          {
            titulo: "Durante el turno",
            lista: [
              "Cafeína al inicio del turno y hasta la 1 o 2 de la mañana; después de esa hora te va a costar dormir al llegar a casa.",
              "Luz: garita bien iluminada por dentro te mantiene alerta. Muévete cada hora: la ronda no es solo seguridad, es tu antídoto contra el sueño.",
              "La hora crítica es entre las 3 y las 5. Programa ahí una ronda, agua fría en la cara, y nada de sentarte en un sillón cómodo.",
              "Si sientes que te vences, avisa a la central. Es mejor una llamada que un puesto dormido.",
            ],
          },
          {
            titulo: "Al salir",
            lista: [
              "Gafas oscuras en el camino a casa: la luz de la mañana le dice al cerebro que es hora de despertar.",
              "Directo a dormir. Cada hora que postergas el sueño cuesta más recuperarla.",
              "Los días libres, vuelve gradualmente al horario normal; no te desveles el primer día libre.",
            ],
          },
          {
            destacado: "Dormir es parte del trabajo del agente nocturno. Nadie puede hacerlo por ti.",
            enSotersa: "Si por un cambio de turno o un relevo no dormiste, dilo al supervisor antes de recibir el puesto. Un puesto armado con un agente sin dormir es un riesgo para todos.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "NTP 455: Trabajo a turnos y nocturno, aspectos organizativos", url: "https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/13-serie-ntp-numeros-436-a-470-ano-1998/ntp-455-trabajo-a-turnos-y-nocturno-aspectos-organizativos-1998", fuente: "Instituto Nacional de Seguridad y Salud en el Trabajo (España)", nota: "Referencia técnica sobre efectos del turno nocturno y medidas preventivas." },
        ],
      },
      {
        id: "estres-y-rutina",
        titulo: "Manejo del estrés y de la rutina",
        minutos: 15,
        objetivo: "Tener dos o tres herramientas concretas para el estrés agudo (un incidente) y para el desgaste lento (la monotonía).",
        secciones: [
          {
            parrafos: [
              "La garita tiene dos enemigos opuestos: la monotonía del 95 % del tiempo y el pico de adrenalina del 5 % restante. La OMS publicó una guía ilustrada, pensada para cualquier persona bajo presión, con técnicas que caben en un turno: se llama «En tiempos de estrés, haz lo que importa» y está en los recursos. Lo que sigue es una versión de bolsillo.",
            ],
          },
          {
            titulo: "Después de un incidente (estrés agudo)",
            lista: [
              "Anclarse: nota tres cosas que ves, dos que oyes, una que tocas. Trae la cabeza al presente.",
              "Respirar: inhala contando 4, sostén 4, exhala 6. Tres veces. El pulso baja; las manos dejan de temblar.",
              "Hablarlo: con el supervisor o la central, en las horas siguientes. Guardárselo no es fortaleza; es cómo empiezan los problemas de sueño y el mal genio.",
            ],
          },
          {
            titulo: "Contra la monotonía (desgaste lento)",
            lista: [
              "Ritual de inicio: apertura de turno con la app, revisión del puesto, saludo a quien entrega. Empezar bien ordena la noche.",
              "Objetivos pequeños por turno: «hoy reviso el cerco del fondo con más detalle», «hoy aprendo dos lecciones de la Escuela».",
              "Desenganchar los pensamientos rumiantes: cuando notes que llevas media hora dando vueltas a lo mismo, nómbralo («estoy rumiando») y vuelve a lo que tienes delante.",
              "Actúa según tus valores, no según tu ánimo: hacer bien la ronda cuando no tienes ganas es exactamente lo que construye el orgullo de hacer bien el trabajo.",
            ],
          },
          {
            titulo: "Señales de que necesitas ayuda, no solo técnicas",
            lista: [
              "Semanas sin dormir bien aunque tengas tiempo. Irritabilidad con la familia. Pensamientos de que nada vale la pena.",
              "Habla con tu supervisor o con la administración: SOTERSA está obligada a incluirte en el seguro de vida y accidentes (LOVSP Art. 41) y a cuidar tu salud y riesgos laborales. Pedir ayuda es un derecho, no una debilidad.",
            ],
          },
          {
            destacado: "Anclarse, respirar, hablarlo. Tres pasos que caben en cualquier garita.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "En tiempos de estrés, haz lo que importa: una guía ilustrada", url: "https://www.who.int/docs/default-source/mental-health/sh-2020-spa-3-web.pdf", fuente: "Organización Mundial de la Salud", nota: "Cinco herramientas prácticas, con dibujos, para cualquier persona bajo estrés." },
          { tipo: "web", titulo: "Versión adaptada para América Latina", url: "https://iris.paho.org/handle/10665.2/55829", fuente: "Organización Panamericana de la Salud" },
        ],
      },
      {
        id: "finanzas-personales",
        titulo: "Finanzas personales: presupuesto, deudas y el chulco",
        minutos: 15,
        objetivo: "Armar un presupuesto quincenal que aguante, y reconocer el momento en que una deuda se vuelve un riesgo de integridad.",
        secciones: [
          {
            parrafos: [
              "Hablar de dinero en un curso de seguridad no es casualidad. La mayoría de los guardias que terminan colaborando con un robo no empezaron queriendo robar: empezaron con una deuda que no podían pagar y alguien que «solo pedía un favor». Cuidar tus finanzas es cuidar tu integridad.",
            ],
          },
          {
            titulo: "El presupuesto de una hoja",
            lista: [
              "Ingresos fijos: sueldo, horas extra promedio (no las máximas), bonos.",
              "Gastos fijos: arriendo, servicios, transporte, comida, colegio, cuotas. Súmalos.",
              "Lo que queda se divide en tres: ahorro (aunque sean 10 dólares), imprevistos y gusto. En ese orden.",
              "Revisa cada quincena, el día que llega el sueldo, cinco minutos. Lo que no se mide se desordena.",
            ],
          },
          {
            titulo: "Deudas: las reglas",
            lista: [
              "Las cuotas de todas tus deudas no deberían pasar del 30 % de tu ingreso. Si pasan, no tomes ninguna nueva; primero paga la más cara (la de mayor interés), aunque sea la más pequeña.",
              "Nunca una tarjeta para pagar otra. Nunca un préstamo para pagar una cuota.",
              "El chulco (préstamo informal con interés diario o semanal) no es una salida: es la entrada a la extorsión. Si ya estás ahí, habla con la administración de SOTERSA antes de que otro lo use en tu contra.",
            ],
          },
          {
            titulo: "Herramientas gratuitas en Ecuador",
            lista: [
              "La Superintendencia de Bancos tiene un portal de educación financiera con cursos cortos sobre presupuesto, crédito y ahorro.",
              "Tu cuenta sueldo (obligatoria por ley, LOVSP Art. 41) sirve para separar el ahorro: pide una cuenta de ahorros aparte y programa una transferencia automática el día de pago.",
            ],
          },
          {
            destacado: "Ahorra primero, gasta después. Y una deuda que no puedes contar a tu familia es una deuda que alguien más va a usar.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "Educación financiera: prioridad de la Superintendencia de Bancos", url: "https://www.superbancos.gob.ec/bancos/educacion-financiera-prioridad-de-la-superintendencia-de-bancos/", fuente: "Superintendencia de Bancos del Ecuador", nota: "Portal «Aprendiendo finanzas, construyo mi futuro», con cursos gratuitos." },
        ],
      },
      {
        id: "familia-y-comunicacion",
        titulo: "Familia, pareja y el turno rotativo",
        minutos: 10,
        objetivo: "Reducir el desgaste que el horario de guardia produce en casa, con acuerdos simples.",
        secciones: [
          {
            parrafos: [
              "Los estudios sobre trabajo a turnos señalan un tercer efecto, además del sueño y la salud: la dificultad en la vida familiar y social. Estás cuando los demás no están, y no estás cuando ellos sí. Eso no se arregla con voluntad; se arregla con acuerdos.",
            ],
          },
          {
            titulo: "Acuerdos que funcionan",
            lista: [
              "El calendario del turno visible en casa (una foto del cuadrante en el refrigerador). Nadie adivina; todos saben cuándo estás.",
              "Un momento fijo de la semana que sea de la familia, pase lo que pase con el turno. Aunque sea un desayuno.",
              "Reglas del sueño de día explicadas a los niños como un juego: «papá está de noche, ahora es su noche».",
              "Al llegar del turno, diez minutos de conversación antes de dormir. No el reporte del turno: cómo están ellos.",
            ],
          },
          {
            titulo: "Lo que el turno no justifica",
            lista: [
              "Gritar o descargar en casa el estrés de la garita. Si notas que pasa, vuelve a la lección de estrés y habla con alguien.",
              "Cualquier forma de violencia. Además del daño, la ley es clara: una sentencia por violencia contra la mujer o el núcleo familiar es inhabilidad para ser guardia con arma (LOVSP Art. 51 numeral 3).",
            ],
          },
          {
            destacado: "La familia no necesita que estés siempre. Necesita saber cuándo vas a estar, y que ese rato sea de verdad.",
          },
        ],
        recursos: [],
      },
      {
        id: "carrera-en-sotersa",
        titulo: "Propósito y carrera: de dónde vienes y a dónde puedes llegar",
        minutos: 10,
        objetivo: "Ver el trabajo de agente como un oficio con camino, y saber qué hace falta para cada paso.",
        secciones: [
          {
            parrafos: [
              "Un agente de seguridad protege personas. En un hospital, cuida a quien llega enfermo; en un edificio, a familias que duermen tranquilas porque tú estás abajo. Eso es un propósito real, y merece que lo hagas con orgullo y con ambición.",
            ],
          },
          {
            titulo: "El camino dentro de la profesión",
            lista: [
              "Nivel I (sin arma): la base. Reentrenamiento cada dos años, pagado por la empresa si estás bajo dependencia (LOVSP Art. 52).",
              "Nivel II (con arma): abre puestos armados y custodia. Requiere Nivel I aprobado, aptitud física y psicológica, prueba de confianza y toxicológica (Art. 51).",
              "Cursos de especialización: custodia de carga, protección de personas, medios tecnológicos (Art. 53). Cada uno abre un tipo de servicio.",
              "Supervisor de zona: quien conoce los puestos, escribe bien los partes, resuelve conflictos y sabe usar la app. El módulo de liderazgo de esta escuela es el primer paso.",
            ],
          },
          {
            titulo: "Qué mira SOTERSA para promover",
            lista: [
              "Constancia: turnos abiertos a tiempo, rondas completas, cero ausencias sin aviso. La app lo registra todo; tu ficha habla por ti.",
              "Calidad de los reportes: novedades claras, con hora y hechos.",
              "Formación: módulos de esta escuela completos y evaluaciones aprobadas.",
              "Trato: cómo hablan de ti el cliente y tus compañeros.",
            ],
          },
          {
            destacado: "Tu ficha en la app es tu hoja de vida dentro de SOTERSA. Cada turno bien hecho la escribe.",
            enSotersa: "Puedes ver tu avance en la Escuela desde el menú. Cuando completes los módulos obligatorios, aparece en tu ficha y el administrador lo ve.",
          },
        ],
        recursos: [],
      },
      {
        id: "salud-fisica",
        titulo: "Salud física en el puesto: comida, postura y ejercicio",
        minutos: 10,
        objetivo: "Cuidar el cuerpo en un trabajo que combina muchas horas de pie o sentado con poco movimiento.",
        secciones: [
          {
            titulo: "Comer en la garita",
            lista: [
              "Lleva tu comida: lo que se compra a las 2 de la mañana es pan, gaseosa y fritura. Arroz, proteína, verdura, fruta, agua.",
              "Porciones pequeñas cada 3 o 4 horas mejor que una comida enorme a medianoche.",
              "Agua: dos litros por turno. La sed se confunde con sueño y con hambre.",
              "Energizantes: no. Suben y te dejan caer justo en la hora crítica.",
            ],
          },
          {
            titulo: "Postura y movimiento",
            lista: [
              "De pie: peso repartido en los dos pies, rodillas sueltas, cambia de apoyo cada rato. Calzado con suela que amortigüe.",
              "Sentado: espalda apoyada, pantalla a la altura de los ojos, levantarse cada 45 minutos.",
              "Quince minutos de ejercicio al día, en casa: sentadillas, flexiones, plancha y caminar. No hace falta gimnasio.",
              "Estiramientos al terminar la ronda: cuello, hombros, espalda baja.",
            ],
          },
          {
            titulo: "Señales que no se ignoran",
            lista: [
              "Dolor en el pecho, falta de aire, hormigueo en un brazo: 911, aunque estés en turno.",
              "Mareos repetidos, sed excesiva, visión borrosa: chequeo médico. Los turnos nocturnos aumentan el riesgo de diabetes e hipertensión.",
              "Los exámenes médicos y psicológicos son requisito del oficio (LOVSP Art. 62). Úsalos a tu favor: pregúntale al médico por tu presión y tu azúcar.",
            ],
          },
          {
            destacado: "El agente cuida al cliente con el cuerpo. Un cuerpo descuidado deja de cuidar.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m4p1", texto: "La medida con más respaldo para llegar despierto a un turno de noche es:", opciones: ["Tomar energizantes durante el turno.", "Dormir el bloque principal de día en oscuridad y sumar una siesta de 60-90 minutos antes de salir.", "No dormir de día para estar cansado a la noche siguiente.", "Tomar café a las 4 de la mañana."], correcta: 1, explicacion: "Sueño principal en oscuridad más siesta previa. La cafeína después de la 1 o 2 a. m. arruina el sueño de la mañana." },
        { id: "m4p2", texto: "Tras un incidente fuerte en el puesto, ¿qué recomienda esta lección?", opciones: ["Guardárselo para no parecer débil.", "Anclarse al presente, respirar 4-4-6 y hablarlo con supervisor o central en las horas siguientes.", "Tomar un trago al salir.", "Pedir cambio de puesto de inmediato."], correcta: 1, explicacion: "Anclarse, respirar, hablarlo. Callarlo es el inicio de problemas de sueño y ánimo." },
        { id: "m4p3", texto: "Las cuotas de todas tus deudas juntas no deberían pasar del:", opciones: ["70 % de tu ingreso.", "50 % de tu ingreso.", "30 % de tu ingreso.", "No hay límite si pagas a tiempo."], correcta: 2, explicacion: "Más del 30 % te deja sin margen para imprevistos, y ahí empiezan el chulco y los «favores»." },
        { id: "m4p4", texto: "¿Por qué un curso de seguridad habla de finanzas personales?", opciones: ["Porque la empresa quiere saber cuánto gastas.", "Porque una deuda impagable es la puerta más común por la que alguien intenta corromper a un guardia.", "Porque es un requisito del Ministerio.", "No tiene relación."], correcta: 1, explicacion: "La mayoría de las colaboraciones con robos empiezan con una deuda y un «favor pequeño». Cuidar el dinero es cuidar la integridad." },
        { id: "m4p5", texto: "Para pasar del Nivel I al Nivel II (con arma) la ley exige, entre otros:", opciones: ["Solo tener buena puntería.", "Nivel I aprobado, aptitud física y psicológica, prueba de confianza y toxicológica.", "Diez años de experiencia.", "Ser exmilitar."], correcta: 1, explicacion: "LOVSP Art. 51. Además, no haber sido sancionado por violencia contra la mujer o el núcleo familiar." },
        { id: "m4p6", texto: "Sientes dolor en el pecho y falta de aire en mitad del turno. Lo correcto es:", opciones: ["Terminar el turno y luego ir al médico.", "Llamar al 911 de inmediato y avisar a la central.", "Tomar agua y esperar.", "Salir a caminar para que pase."], correcta: 1, explicacion: "Dolor en el pecho con falta de aire es emergencia. 911 primero, aunque estés en turno." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 5 · INTEGRIDAD Y ESTANDAR BASC
  // ==========================================================================
  {
    id: "integridad-basc",
    codigo: "M5",
    titulo: "Integridad, alcohol y drogas, y estándar BASC",
    resumen: "Cómo se acercan las organizaciones criminales a un guardia, qué hacer ante un ofrecimiento, la política de alcohol y drogas, la confidencialidad y el canal para denunciar. Es el módulo que SOTERSA muestra en una auditoría.",
    paraQuien: "Obligatorio para todo el personal. Forma parte del programa de concientización BASC de la empresa.",
    color: "verde",
    lecciones: [
      {
        id: "que-es-basc",
        titulo: "Qué es BASC y por qué te involucra",
        minutos: 10,
        objetivo: "Entender que la certificación BASC de SOTERSA depende de lo que cada agente hace en su puesto.",
        secciones: [
          {
            parrafos: [
              "BASC (Business Alliance for Secure Commerce) es una alianza internacional de empresas que se comprometen a operar sin que el crimen organizado use sus procesos para contrabando, narcotráfico, terrorismo o lavado. SOTERSA está certificada bajo la Norma y Estándares Internacionales BASC versión 6 (2022). Eso significa que un auditor externo revisa, periódicamente, que la empresa cumple.",
              "Entre lo que revisa está la seguridad en los procesos relacionados con el personal: que exista un código de ética y se lo conozca, que el personal reciba formación en seguridad de forma periódica y desde la inducción, que se conserven registros de esa formación, y que las actividades sospechosas se comuniquen. Esta escuela, y tu avance en ella, son parte de esa evidencia.",
            ],
          },
          {
            titulo: "Lo que BASC espera de un agente",
            lista: [
              "Que conozca y firme el código de ética de SOTERSA.",
              "Que sepa reconocer una actividad sospechosa y a quién reportarla.",
              "Que mantenga la integridad de los accesos: nadie entra sin autorización, nada sale sin registro.",
              "Que proteja la información del cliente y de la empresa.",
              "Que se presente al puesto libre de alcohol y drogas, y acepte las pruebas que la empresa aplique.",
            ],
          },
          {
            destacado: "La certificación no la tiene el gerente: la tiene cada puesto, cada noche. Un solo agente comprado la pierde para todos.",
            enSotersa: "El registro de rondas, accesos y novedades en la app es la trazabilidad que BASC pide. Cuando registras, estás certificando.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "Guía de Implementación Norma y Estándares BASC V.6 – 2022", url: "https://www.wbasco.org/es/documento/guia-de-implementacion-norma-y-estandares-basc-v6-2022", fuente: "World BASC Organization", nota: "Secciones «Seguridad en los procesos relacionados con el personal» y «Programa de formación, capacitación y concientización»." },
        ],
      },
      {
        id: "como-te-corrompen",
        titulo: "Cómo se acercan: el favor pequeño",
        minutos: 15,
        objetivo: "Reconocer las etapas del acercamiento de una organización criminal a un guardia, antes de estar dentro.",
        secciones: [
          {
            parrafos: [
              "Nadie le ofrece a un guardia, el primer día, dinero por abrir la puerta a un robo. El proceso es lento y está estudiado. Conocerlo es la mejor defensa.",
            ],
          },
          {
            titulo: "Las etapas",
            lista: [
              "Contacto: alguien amable que pasa seguido, conversa, se aprende tu nombre, tu horario, tus problemas. Puede ser un repartidor, un vecino, un «amigo de un compañero».",
              "Favor pequeño: «¿me dejas estacionar cinco minutos?», «¿me guardas este paquete hasta mañana?», «no anotes que llegué tarde». Nada grave. Ya rompiste una regla.",
              "Regalo: una comida, una recarga, un billete «por la molestia». Ahora hay una deuda de gratitud, y una prueba de que aceptas.",
              "Presión: «si te niegas ahora, cuento lo de antes», o directamente una amenaza a tu familia. A esta altura ya no eres libre.",
            ],
          },
          {
            titulo: "Cómo cortarlo en la primera etapa",
            lista: [
              "No des información personal en el puesto: horarios, dirección, situación económica. Cortés, pero cerrado.",
              "Regla de oro: cualquier favor que no puedas anotar en la bitácora, no lo haces.",
              "Nunca aceptes regalos de personas ajenas al servicio. Ni comida.",
              "Si alguien insiste en conocerte «fuera del trabajo», repórtalo a tu supervisor. No es paranoia; es el patrón.",
            ],
          },
          {
            titulo: "Si ya diste un paso",
            parrafos: [
              "Cuanto antes hables, menos daño. Un favor pequeño reportado por ti mismo es una falta leve; el mismo favor descubierto después de un robo es complicidad. SOTERSA protege a quien reporta de buena fe.",
            ],
          },
          {
            destacado: "Si no puedes anotarlo en la bitácora, no lo hagas.",
          },
        ],
        recursos: [],
      },
      {
        id: "alcohol-y-drogas",
        titulo: "Alcohol y drogas: la política y las pruebas",
        minutos: 10,
        objetivo: "Conocer la política de SOTERSA, por qué existe, y qué pasa con una prueba positiva.",
        secciones: [
          {
            parrafos: [
              "La ley exige pruebas toxicológicas aprobadas para formarse como guardia de Nivel I y Nivel II (LOVSP Art. 50 y 51), y el estándar BASC pide que las empresas apliquen pruebas de alcohol y drogas al personal en cargos críticos, de forma periódica o ante sospecha. Un agente de seguridad es un cargo crítico por definición: controla accesos, a veces porta arma, y ve cosas que otros no ven.",
            ],
          },
          {
            titulo: "La política, en tres líneas",
            lista: [
              "Cero alcohol y cero drogas en el puesto, y ninguna cantidad en las horas previas que afecte tu estado al llegar.",
              "Las pruebas son aleatorias, periódicas o por sospecha razonable (olor, conducta, accidente). Se hacen con respeto y con tu consentimiento informado; negarse equivale a positivo.",
              "Un positivo se trata primero como un problema de salud, con reserva; la reincidencia o el consumo en el puesto son causa de desvinculación.",
            ],
          },
          {
            titulo: "Por qué no es solo tu problema",
            lista: [
              "Un agente bajo efectos no ve lo que debe ver, y es el blanco perfecto para el «favor pequeño».",
              "Los medicamentos también cuentan: si tomas algo que produce sueño, díselo al supervisor antes del turno.",
              "Si un compañero llega afectado, no lo cubras: avisa. Cubrirlo es exponerlo a él, al cliente y a ti.",
            ],
          },
          {
            destacado: "Al puesto se llega lúcido. No hay excepción, ni en Navidad.",
          },
        ],
        recursos: [],
      },
      {
        id: "confidencialidad",
        titulo: "Confidencialidad: lo que ves en el puesto se queda en el puesto",
        minutos: 10,
        objetivo: "Saber qué información es reservada y cómo se protege, dentro y fuera del trabajo.",
        secciones: [
          {
            parrafos: [
              "La ley obliga a la empresa a guardar reserva sobre la información confidencial que obtenga en su actividad (LOVSP Art. 41 numeral 4), y esa obligación la cumple a través de cada agente. En un puesto ves horarios de ejecutivos, movimientos de dinero, quién visita a quién, cámaras, códigos, rutas de custodia. Todo eso vale dinero para alguien.",
            ],
          },
          {
            titulo: "Reglas",
            lista: [
              "Nada del puesto se comenta fuera: ni con la familia, ni en el bus, ni en grupos de WhatsApp.",
              "Ninguna foto de cámaras, monitores, bitácoras, credenciales o instalaciones del cliente en tu celular personal. Las fotos de evidencia se toman con la app, que las guarda en un lugar privado.",
              "Las claves de la app y del dispositivo son personales. No se prestan, no se apuntan en un papel en la garita.",
              "Si alguien te pregunta por rutinas del cliente («¿a qué hora se va el gerente?»), es una señal de alerta: reporta.",
              "Los documentos que el cliente deja en la garita (listas de residentes, planos, órdenes) se guardan bajo llave y se devuelven.",
            ],
          },
          {
            destacado: "Si un dato le sirve a un delincuente, es confidencial. Ante la duda, lo es.",
            enSotersa: "Las novedades y fotos que registras en la app quedan en almacenamiento privado; el cliente solo ve lo que supervisión autoriza. No hay razón para sacar nada por otro canal.",
          },
        ],
        recursos: [],
      },
      {
        id: "denunciar",
        titulo: "Cómo y a quién reportar una actividad sospechosa",
        minutos: 8,
        objetivo: "Usar el canal correcto para reportar, con protección para quien reporta.",
        secciones: [
          {
            parrafos: [
              "BASC pide que las actividades sospechosas o inusuales que puedan afectar la integridad de las operaciones se comuniquen, y aclara algo importante: para reportar no necesitas tener certeza de que se cometió un delito. Basta con que algo no cuadre. Determinar si hubo delito es tarea de la autoridad, no tuya.",
            ],
          },
          {
            titulo: "Qué reportar",
            lista: [
              "Ofrecimientos, regalos o presiones de terceros.",
              "Compañeros que rompen procedimientos de acceso o registro de forma repetida.",
              "Personas que preguntan por rutinas, cámaras o claves.",
              "Paquetes, vehículos o visitas que no cuadran con el servicio.",
              "Cualquier intento de sacar bienes o información sin autorización.",
            ],
          },
          {
            titulo: "Cómo",
            lista: [
              "Canal inmediato: la central operativa o tu supervisor, por teléfono desde la app.",
              "Canal registrado: novedad en la app, severidad «novedad» o «emergencia» según el caso. Queda con hora inmutable.",
              "Si el reporte involucra a tu supervisor: directamente a la administración de SOTERSA.",
              "Si hay un delito en curso: 911.",
            ],
          },
          {
            destacado: "Reportar de buena fe nunca te perjudica. Callar sí.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 80,
      preguntas: [
        { id: "m5p1", texto: "Un repartidor que pasa todos los días te pide «guardar un paquete hasta mañana, sin anotarlo». Según el módulo, esto es:", opciones: ["Un favor normal entre conocidos.", "La segunda etapa del acercamiento: un favor pequeño que rompe una regla. Se rechaza y se reporta.", "Aceptable si el paquete es pequeño.", "Algo que solo importa si el paquete es peligroso."], correcta: 1, explicacion: "Cualquier favor que no puedas anotar en la bitácora, no lo haces. Es exactamente así como empieza." },
        { id: "m5p2", texto: "¿Qué exige BASC respecto a la formación del personal?", opciones: ["Nada; solo revisa cámaras.", "Formación periódica en seguridad según el cargo, desde la inducción, con registros que lo evidencien.", "Un curso al ingresar y nunca más.", "Solo para gerentes."], correcta: 1, explicacion: "Programa de formación, capacitación y concientización, con registros. Tu avance en esta escuela es esa evidencia." },
        { id: "m5p3", texto: "Negarse a una prueba de alcohol o drogas aplicada conforme a la política:", opciones: ["No tiene consecuencias.", "Equivale a un resultado positivo.", "Solo aplica a puestos armados.", "Requiere orden judicial."], correcta: 1, explicacion: "La política de SOTERSA trata la negativa como positivo. Las pruebas son parte del cargo crítico." },
        { id: "m5p4", texto: "Tomas una foto del monitor de cámaras con tu celular «para mostrarle a un amigo». Esto es:", opciones: ["Normal si no la publicas.", "Una violación de confidencialidad: información del cliente fuera del canal seguro.", "Permitido si el cliente no se entera.", "Obligatorio para respaldar tu trabajo."], correcta: 1, explicacion: "Nada del puesto en el celular personal. Las fotos de evidencia se toman con la app, en almacenamiento privado." },
        { id: "m5p5", texto: "Para reportar una actividad sospechosa según BASC, necesitas:", opciones: ["Pruebas de que se cometió un delito.", "Solo que algo no cuadre; determinar el delito es tarea de la autoridad.", "Autorización del cliente.", "Que lo confirme otro agente."], correcta: 1, explicacion: "No se requiere certeza de delito. Se reporta lo inusual; la autoridad determina." },
        { id: "m5p6", texto: "Si ya aceptaste un «favor pequeño» y te das cuenta del patrón, lo mejor es:", opciones: ["Callar y no volver a hacerlo.", "Reportarlo tú mismo cuanto antes: es una falta leve, y te protege de que lo usen en tu contra.", "Esperar a ver si insisten.", "Cambiar de puesto sin decir nada."], correcta: 1, explicacion: "Reportado por ti mismo es una falta leve; descubierto después de un robo es complicidad." },
      ],
    },
  },
];
