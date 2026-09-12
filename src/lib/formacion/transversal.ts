import type { Modulo } from "./tipos";

/**
 * M13-M15: supervision, fraudes y proteccion de datos.
 *
 * Fuentes: LOVSP Art. 47, 48, 65; Ley Organica de Proteccion de Datos
 * Personales (Registro Oficial Suplemento 459, 26 de mayo de 2021) y su
 * Reglamento; Policia Nacional del Ecuador, Unidad de Ciberdelitos
 * (linea 1800-DELITO); BASC v6, seguridad de la informacion.
 */
export const MODULOS_TRANSVERSAL: Modulo[] = [
  // ==========================================================================
  // MODULO 13 · LIDERAZGO DE SUPERVISION
  // ==========================================================================
  {
    id: "liderazgo-supervision",
    alcance: "supervisores",
    codigo: "M13",
    titulo: "Liderazgo de supervisión",
    resumen: "Cómo hacer una ronda de supervisión que sirva, dar retroalimentación sin humillar, manejar ausencias y relevos, y qué escalar a central. Para quien ya supervisa y para quien quiere llegar.",
    paraQuien: "Obligatorio para supervisores. Recomendado para agentes con proyección.",
    color: "ambar",
    lecciones: [
      {
        id: "que-hace-un-supervisor",
        titulo: "Qué hace un supervisor de SOTERSA",
        minutos: 8,
        objetivo: "Tener claro el rol: asegurar el servicio en los puestos, cuidar a la gente y ser el puente con el cliente y la central.",
        secciones: [
          {
            titulo: "Tres responsabilidades",
            lista: [
              "El servicio: que cada puesto esté cubierto, abierto a tiempo, con rondas hechas y novedades reportadas. La app te muestra en tiempo real qué puestos no han abierto y qué novedades esperan validación.",
              "La gente: que los agentes tengan equipo, información, relevo y a quién acudir. Un agente que no confía en su supervisor no reporta, y un puesto que no reporta es un puesto ciego.",
              "El cliente: ser la cara de SOTERSA ante la administración del cliente. Visitas periódicas, respuesta a quejas, y que las novedades que el cliente ve en su portal estén validadas y bien escritas.",
            ],
          },
          {
            titulo: "Lo que un supervisor no es",
            lista: [
              "No es un agente con más antigüedad que hace lo mismo pero cobra más. Su trabajo es que los demás hagan bien el suyo.",
              "No es un capataz. La autoridad se la da la ley y el cargo; el respeto se lo gana en cada ronda.",
              "No es quien esconde problemas a la central. Es quien los detecta antes.",
            ],
          },
          {
            destacado: "Servicio, gente, cliente. Si uno falla, los otros dos lo pagan.",
            enSotersa: "El panel de supervisión muestra puestos sin apertura, novedades por validar y el estado de cada agente. Empieza cada turno ahí.",
          },
        ],
        recursos: [],
      },
      {
        id: "ronda-de-supervision",
        titulo: "La ronda de supervisión",
        minutos: 10,
        objetivo: "Visitar puestos de forma que se detecten problemas y se refuerce al agente, no solo se «marque presencia».",
        secciones: [
          {
            titulo: "Antes de llegar",
            lista: [
              "Revisa en la app: ¿abrió a tiempo? ¿marcó la ronda? ¿qué reportó anoche? ¿qué reportó el cliente? Llegas sabiendo, no preguntando.",
              "Horario variable. Una supervisión que llega siempre a las 10 no supervisa; visita.",
            ],
          },
          {
            titulo: "En el puesto (15 minutos que valen)",
            lista: [
              "Presentación del agente: uniforme, credencial, postura, estado de alerta. Se nota en los primeros diez segundos.",
              "Equipo: radio, linterna, bitácora, botiquín, arma si aplica. Contra lo que marcó en la apertura.",
              "Puesto: limpieza, iluminación, accesos, cámaras. Recorre un punto de ronda con él.",
              "Conversación: «¿qué pasó anoche que no está en la app?», «¿qué necesitas?», «¿algún residente o funcionario que te esté pidiendo cosas raras?». La última pregunta destapa los «favores pequeños».",
              "Cliente: si hay administración presente, dos minutos: «¿cómo va el servicio? ¿algo que deba saber?».",
            ],
          },
          {
            titulo: "Después",
            lista: [
              "Registro de la visita en la app como novedad informativa: hora, hallazgos, acuerdos. Es evidencia para el cliente y para BASC.",
              "Lo que falta (equipo, relevo, reparación) se gestiona ese mismo día, y se le avisa al agente cuándo se resuelve. Prometer y no cumplir destruye la confianza más rápido que no prometer.",
            ],
          },
          {
            destacado: "Llega sabiendo, revisa lo concreto, pregunta lo incómodo, registra y cumple.",
          },
        ],
        recursos: [],
      },
      {
        id: "retroalimentacion",
        titulo: "Corregir sin humillar, reconocer sin exagerar",
        minutos: 10,
        objetivo: "Dar retroalimentación que cambie la conducta y mantenga al agente de tu lado.",
        secciones: [
          {
            titulo: "Corregir",
            lista: [
              "En privado, nunca frente al cliente ni a otros agentes. Lo que se corrige en público se recuerda como humillación, no como aprendizaje.",
              "Hecho concreto, no etiqueta: «anoche la ronda de las 2 no está marcada» en lugar de «eres un vago».",
              "Pregunta antes de concluir: «¿qué pasó?». A veces el QR estaba roto.",
              "Acuerdo claro y plazo: «desde hoy, todas las rondas marcadas; lo reviso el jueves».",
              "Consecuencias proporcionales y anunciadas: primero conversación, luego registro escrito, luego lo que corresponda. Sin sorpresas.",
            ],
          },
          {
            titulo: "Reconocer",
            lista: [
              "Específico y a tiempo: «el parte de anoche estaba perfecto; el cliente lo leyó y lo agradeció». Un «bien hecho» genérico no enseña nada.",
              "En público cuando sea posible: lo que se reconoce en público se repite.",
              "Reconoce el proceso, no solo el resultado: el agente que reportó un favor pequeño que rechazó hizo algo difícil aunque «no pasó nada».",
            ],
          },
          {
            titulo: "Las conversaciones difíciles",
            lista: [
              "Sospecha de consumo, de colaboración con terceros, de acoso: no las manejes solo. Reporta a la administración de SOTERSA y sigue el procedimiento. Tu trabajo es detectar y reportar con hechos, no investigar ni juzgar.",
            ],
          },
          {
            destacado: "Corrige en privado con hechos; reconoce en público con detalle.",
          },
        ],
        recursos: [],
      },
      {
        id: "ausencias-y-relevos",
        titulo: "Ausencias, relevos y cobertura",
        minutos: 8,
        objetivo: "Que ningún puesto quede descubierto y que los relevos no quemen a la gente.",
        secciones: [
          {
            lista: [
              "Regla de oro: un puesto no queda sin agente. Antes de aceptar que alguien salga, tienes el reemplazo confirmado en el puesto.",
              "Ausencia avisada con anticipación: se cubre con relevo (saca francos) o intercambio. Se registra en el cuadrante de la app.",
              "Ausencia sin aviso: llama al agente; si no responde en 15 minutos, activa relevo y notifica a central. Después, conversación de corrección y registro.",
              "El agente que cubre no puede encadenar turnos sin descanso: un turno doble ocasional se acepta con aviso a central; dos seguidos, no. Un agente sin dormir es un riesgo, y la ley exige que la empresa cuide la salud y los riesgos laborales (LOVSP Art. 41).",
              "Relevos frecuentes en el mismo puesto son una señal: alguien está por irse, está enfermo, o tiene un problema. Pregunta antes de que renuncie.",
              "Entrega y recepción con firma en la app en cada relevo. Sin firma de ambos, el relevo no está completo.",
            ],
          },
          {
            destacado: "Primero el reemplazo en el puesto; después la salida. Y nadie cubre dos turnos seguidos.",
            enSotersa: "Dotación por puesto y el cuadrante en la app te muestran quién está en cada plaza y quién es relevo. Los cambios se registran ahí, no en WhatsApp.",
          },
        ],
        recursos: [],
      },
      {
        id: "escalar-a-central",
        titulo: "Qué escalar a central y a la administración",
        minutos: 6,
        objetivo: "Decidir rápido qué resuelves tú y qué debe subir.",
        secciones: [
          {
            titulo: "Lo resuelves tú",
            lista: [
              "Faltantes de equipo, relevos programados, quejas menores del cliente, correcciones de conducta de primera vez, validación de novedades informativas.",
            ],
          },
          {
            titulo: "Sube a central de inmediato",
            lista: [
              "Emergencias (robo, incendio, lesiones, agresión), puesto descubierto sin solución en 30 minutos, arma extraviada o con novedad, accidente vehicular en custodia.",
            ],
          },
          {
            titulo: "Sube a la administración de SOTERSA",
            lista: [
              "Sospechas de integridad (consumo, colaboración con terceros, acoso), reclamos formales del cliente, cualquier requerimiento de Policía o Fiscalía, cambios de contrato o de puestos, accidentes de trabajo.",
            ],
          },
          {
            destacado: "Ante la duda, sube. Nadie fue sancionado por informar de más; muchos por informar tarde.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m13p1", texto: "Un agente no marcó la ronda de las 2 a. m. La mejor forma de abordarlo es:", opciones: ["Llamarle la atención frente al cliente para que sirva de ejemplo.", "En privado, con el hecho concreto, preguntar qué pasó, acordar y fijar plazo.", "Descontarle el día sin hablar.", "Ignorarlo si fue la primera vez."], correcta: 1, explicacion: "Privado, hecho concreto, pregunta, acuerdo, plazo. Corregir en público es humillar." },
        { id: "m13p2", texto: "Un agente pide salir dos horas antes por un trámite. Tú:", opciones: ["Lo autorizas y avisas después.", "Lo autorizas solo cuando el reemplazo está confirmado en el puesto.", "Lo niegas siempre.", "Le dices que cierre el turno en la app y se vaya."], correcta: 1, explicacion: "Un puesto no queda sin agente. Primero el reemplazo en el puesto; después la salida." },
        { id: "m13p3", texto: "¿Cuál pregunta de la ronda de supervisión ayuda a destapar «favores pequeños»?", opciones: ["«¿Todo bien?».", "«¿Algún residente o funcionario que te esté pidiendo cosas raras?».", "«¿Cuántas rondas hiciste?».", "«¿Necesitas vacaciones?»."], correcta: 1, explicacion: "Preguntar lo incómodo, de forma concreta, es lo que hace que el agente cuente lo que no está en la app." },
        { id: "m13p4", texto: "Sospechas que un agente consume alcohol en el puesto. Lo correcto es:", opciones: ["Investigarlo tú, registrando su casillero.", "Reportar con hechos a la administración de SOTERSA y seguir el procedimiento.", "Hablarlo con los otros agentes para confirmar.", "Cambiarlo de puesto sin decir nada."], correcta: 1, explicacion: "El supervisor detecta y reporta con hechos. No investiga ni juzga solo." },
        { id: "m13p5", texto: "Un agente ya cubrió un turno doble y el siguiente relevo no aparece. Tú:", opciones: ["Le pides que se quede otro turno; es responsable.", "Activas otro relevo o cubres tú, y notificas a central: nadie encadena dos turnos dobles.", "Cierras el puesto.", "Le pagas horas extra y listo."], correcta: 1, explicacion: "Un agente sin dormir es un riesgo. Se busca otra cobertura y se notifica." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 14 · FRAUDES Y CIBERSEGURIDAD BASICA
  // ==========================================================================
  {
    id: "fraudes-ciberseguridad",
    codigo: "M14",
    titulo: "Fraudes y ciberseguridad básica",
    resumen: "Las estafas que más golpean a trabajadores en Ecuador (la llamada del banco, el WhatsApp del familiar, el enlace falso), y cómo cuidar tu teléfono, tus claves y las de la app.",
    paraQuien: "Para todo el personal y sus familias. Protege al agente y a la información de SOTERSA.",
    color: "azul",
    lecciones: [
      {
        id: "estafas-comunes",
        titulo: "Las estafas que más se ven en Ecuador",
        minutos: 12,
        objetivo: "Reconocer las cinco modalidades más frecuentes en el momento en que te llegan.",
        secciones: [
          {
            parrafos: [
              "La Policía Nacional y la Superintendencia de Bancos alertan cada año sobre las mismas modalidades, con variaciones. Todas tienen algo en común: urgencia, un canal que no puedes verificar, y un pedido de dinero o de claves. Si ves las tres cosas juntas, es estafa hasta que se demuestre lo contrario.",
            ],
          },
          {
            titulo: "Las modalidades",
            lista: [
              "La llamada del banco (vishing): «detectamos un movimiento sospechoso, confirme su clave/OTP para bloquearlo». Ningún banco pide claves ni códigos por teléfono. Cuelga y llama tú al número oficial de la tarjeta.",
              "El WhatsApp del familiar: «cambié de número, necesito que me deposites urgente». Llama al número de siempre. Si no puedes, no depositas.",
              "El enlace falso (phishing): mensaje del «banco», «SRI», «IESS», «Correos» con un enlace. La página es idéntica y roba usuario y clave. Nunca entres desde un enlace; escribe la dirección tú.",
              "El premio o la herencia: «ganó un vehículo, pague el impuesto para retirarlo». No hay premio; hay pago.",
              "La oferta de trabajo o el préstamo fácil: «depósito de garantía» o «costo de gestión» por adelantado. Un trabajo real nunca cobra por contratarte; un préstamo real no pide dinero antes de dártelo.",
              "Compra por redes sociales: precio increíble, pago por transferencia, vendedor que desaparece. Paga contra entrega o no pagues.",
            ],
          },
          {
            titulo: "Si ya pasó",
            lista: [
              "Llama al banco de inmediato para bloquear tarjetas y cuentas.",
              "Denuncia en la Fiscalía (en línea) y en la Unidad de Ciberdelitos de la Policía; orientación en la línea 1800-DELITO (335486).",
              "Guarda capturas, números y comprobantes. No borres nada.",
              "Avisa a la familia y al supervisor: el mismo estafador suele intentar con tus contactos.",
            ],
          },
          {
            destacado: "Urgencia + canal no verificable + pedido de dinero o claves = estafa. Cuelga, llama tú al número oficial.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "Ciberseguridad en Ecuador: cómo operan las estafas digitales y qué hacer si roban tus datos", url: "https://www.eluniverso.com/noticias/seguridad/ciberseguridad-en-ecuador-como-operan-las-estafas-digitales-y-que-hacer-si-roban-tus-datos-nota/", fuente: "El Universo", nota: "Incluye las recomendaciones de la Unidad de Ciberdelitos de la Policía Nacional." },
        ],
      },
      {
        id: "cuidar-el-telefono",
        titulo: "Cuidar el teléfono: el puesto también está ahí",
        minutos: 10,
        objetivo: "Configurar y usar el teléfono de forma que ni tu dinero ni la app de SOTERSA queden expuestos.",
        secciones: [
          {
            titulo: "Configuración mínima",
            lista: [
              "Bloqueo de pantalla con PIN de 6 dígitos o huella. Sin bloqueo, quien encuentre tu teléfono tiene tu banco, tu WhatsApp y la app.",
              "Actualizaciones instaladas: la mayoría de los robos de datos usan fallas ya corregidas.",
              "Solo apps de la tienda oficial (Play Store, App Store). Nada de APK descargados de enlaces.",
              "Verificación en dos pasos en WhatsApp (Ajustes → Cuenta) y en el correo. Evita que te clonen la cuenta.",
              "Copia de seguridad de contactos y fotos: si te roban el teléfono, pierdes el aparato, no la vida.",
            ],
          },
          {
            titulo: "Uso",
            lista: [
              "Wi-Fi público (centros comerciales, cafés): no entres al banco ni a la app desde ahí. Usa tus datos.",
              "Cargar el teléfono en puertos USB públicos puede copiar datos: usa tu cargador a la toma de corriente.",
              "Permisos: una app de linterna no necesita tus contactos ni tu ubicación. Si los pide, desinstálala.",
              "Si te roban el teléfono: bloquea la línea con la operadora, cambia la clave del banco y del correo desde otro dispositivo, y avisa a SOTERSA para restablecer tu PIN de la app.",
            ],
          },
          {
            destacado: "El teléfono con la app de SOTERSA es una llave del puesto. Se cuida como un arma: con bloqueo y sin prestarlo.",
            enSotersa: "Si pierdes el teléfono, avisa el mismo día: la administración restablece tu PIN y la sesión anterior deja de servir.",
          },
        ],
        recursos: [],
      },
      {
        id: "claves-y-la-app",
        titulo: "Claves, la app y la información de SOTERSA",
        minutos: 8,
        objetivo: "Manejar claves y accesos como pide el estándar BASC de seguridad de la información.",
        secciones: [
          {
            lista: [
              "Una clave por servicio. La clave del banco no es la del correo ni la de la app. Si una se filtra, las demás siguen a salvo.",
              "Claves largas mejor que raras: una frase que recuerdes («MiPerroLadra2Veces!») vale más que «P@ss1».",
              "El PIN de la app: seis números que no sean tu fecha de nacimiento ni parte de tu cédula. Nadie de SOTERSA te lo pedirá jamás por teléfono ni por WhatsApp. Si alguien lo pide, es un intento de acceso.",
              "No prestes tu sesión: cada ronda y cada novedad lleva tu nombre. Si otro registra con tu cuenta, es tu firma en algo que no hiciste.",
              "Los correos o mensajes «de SOTERSA» que pidan claves, datos bancarios o descargar algo: confirma por teléfono con la administración antes de hacer nada.",
              "Información del cliente en el teléfono personal: nunca. Fotos, listas, planos, contactos: solo en la app.",
            ],
          },
          {
            destacado: "Nadie de SOTERSA te pedirá tu PIN. Quien lo pida, no es de SOTERSA.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m14p1", texto: "Te llama «el banco» diciendo que hay un movimiento sospechoso y que confirmes el código que te llegó por SMS. Tú:", opciones: ["Das el código para que bloqueen el movimiento.", "Cuelgas y llamas tú al número oficial que está en tu tarjeta.", "Pides que te llamen más tarde.", "Das solo la mitad del código."], correcta: 1, explicacion: "Ningún banco pide claves ni códigos por teléfono. Cuelga y llama tú." },
        { id: "m14p2", texto: "Un mensaje de un número desconocido dice ser tu hermano con número nuevo y pide un depósito urgente. Tú:", opciones: ["Depositas; es urgente.", "Llamas al número de siempre de tu hermano para confirmar; si no puedes, no depositas.", "Pides una foto para confirmar.", "Depositas la mitad."], correcta: 1, explicacion: "Urgencia + canal no verificable + dinero = estafa. Se confirma por el canal conocido." },
        { id: "m14p3", texto: "¿Cuál de estas configuraciones NO es parte del mínimo recomendado?", opciones: ["Bloqueo de pantalla con PIN o huella.", "Verificación en dos pasos en WhatsApp.", "Instalar apps desde enlaces de WhatsApp para tener las versiones «completas».", "Mantener el sistema actualizado."], correcta: 2, explicacion: "Solo apps de la tienda oficial. Los APK de enlaces son la forma más común de infectar un teléfono." },
        { id: "m14p4", texto: "Alguien que dice ser del área de sistemas de SOTERSA te pide tu PIN por WhatsApp para «actualizar la app». Tú:", opciones: ["Lo das; es de la empresa.", "No lo das: nadie de SOTERSA pide el PIN. Confirmas por teléfono con la administración y reportas.", "Das un PIN falso para probarlo.", "Le pides su cédula antes de darlo."], correcta: 1, explicacion: "Quien pida el PIN no es de SOTERSA. Se confirma por teléfono y se reporta." },
        { id: "m14p5", texto: "Te robaron el teléfono con la app instalada. Lo primero:", opciones: ["Comprar otro teléfono.", "Bloquear la línea, cambiar claves de banco y correo desde otro dispositivo, y avisar a SOTERSA para restablecer el PIN.", "Esperar a ver si lo devuelven.", "Publicarlo en redes."], correcta: 1, explicacion: "Bloquear, cambiar claves, avisar. La sesión anterior deja de servir cuando se restablece el PIN." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 15 · PROTECCION DE DATOS (LOPDP)
  // ==========================================================================
  {
    id: "proteccion-de-datos",
    codigo: "M15",
    titulo: "Protección de datos personales (LOPDP)",
    resumen: "Por qué firmaste un consentimiento, qué datos tuyos registra la app y quién los ve, y qué datos del cliente y de terceros puedes tratar en el puesto y cuáles no.",
    paraQuien: "Para todo el personal. Cierra el círculo con el aviso que aceptaste al entrar a la app.",
    color: "verde",
    lecciones: [
      {
        id: "la-ley-en-corto",
        titulo: "La LOPDP en corto",
        minutos: 10,
        objetivo: "Entender los conceptos básicos de la ley ecuatoriana de datos: dato personal, dato sensible, consentimiento, derechos.",
        secciones: [
          {
            parrafos: [
              "La Ley Orgánica de Protección de Datos Personales rige en Ecuador desde mayo de 2021 (Registro Oficial Suplemento 459). Establece que los datos de una persona le pertenecen, que quien los trata necesita una base legal (por ejemplo, el consentimiento), y que la persona tiene derechos sobre ellos. La autoridad de control es la Superintendencia de Protección de Datos Personales, y las sanciones a empresas pueden ser un porcentaje de su facturación.",
            ],
          },
          {
            titulo: "Conceptos",
            lista: [
              "Dato personal: cualquier información que identifique o haga identificable a una persona: nombre, cédula, teléfono, foto, placa, ubicación, voz.",
              "Dato sensible: salud, biometría (huella, rostro), origen étnico, ideología, religión, orientación sexual, datos de menores. Requieren protección reforzada. En un hospital, casi todo lo que ves es sensible.",
              "Tratamiento: recoger, guardar, consultar, compartir, borrar. Mirar una lista de residentes ya es tratar datos.",
              "Consentimiento: libre, específico, informado e inequívoco. Se puede retirar.",
              "Derechos de la persona: acceso, rectificación, eliminación, oposición, portabilidad, y a no ser objeto de decisiones automatizadas.",
            ],
          },
          {
            destacado: "Si identifica a una persona, es dato personal. Si habla de su salud o su cuerpo, es sensible. Los dos tienen dueño, y no eres tú.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "Ley Orgánica de Protección de Datos Personales", url: "https://www.finanzaspopulares.gob.ec/wp-content/uploads/2021/07/ley_organica_de_proteccion_de_datos_personales.pdf", fuente: "Registro Oficial Suplemento 459, 26 de mayo de 2021" },
          { tipo: "web", titulo: "Ficha de la LOPDP en la Guía Oficial de Trámites", url: "https://www.gob.ec/regulaciones/ley-organica-proteccion-datos-personales", fuente: "gob.ec" },
        ],
      },
      {
        id: "tus-datos-en-la-app",
        titulo: "Tus datos en la app: qué se registra y quién lo ve",
        minutos: 8,
        objetivo: "Saber exactamente qué firmaste en el aviso de consentimiento y cómo ejercer tus derechos.",
        secciones: [
          {
            titulo: "Lo que la app registra de ti",
            lista: [
              "Identificación: nombre, cédula, teléfono, credencial, foto de perfil.",
              "Turnos: hora de apertura y cierre, estado del equipo que reportas, tu firma de entrega y recepción.",
              "Rondas: hora y ubicación GPS de cada punto que escaneas.",
              "Novedades: texto, hora de captura, ubicación y fotos que adjuntas.",
              "Formación: lecciones completadas y resultados de evaluación.",
            ],
          },
          {
            titulo: "Quién lo ve",
            lista: [
              "Tu supervisor de zona y la central operativa de SOTERSA: todo lo operativo.",
              "El cliente del puesto donde trabajas: tu nombre, número de credencial, puesto asignado y si estás en turno, además de las novedades de su puesto que supervisión autorice. No ve tu cédula, teléfono, fotos ni historial.",
              "Nadie más. No se vende, no se comparte con terceros, salvo requerimiento de autoridad competente.",
            ],
          },
          {
            titulo: "Tus derechos, en la práctica",
            lista: [
              "Acceso: tu ficha en la app muestra tus datos y tu actividad.",
              "Rectificación: nombre, teléfono y foto los corriges tú en Mi perfil; cédula y credencial, con la administración.",
              "Retiro del consentimiento: desde la pantalla del aviso. Ten en cuenta que sin consentimiento la app no puede operar tu turno.",
              "Eliminación y otros: solicitud a la administración de SOTERSA, que responde en los plazos de ley.",
            ],
          },
          {
            destacado: "Nada de lo que registras se puede editar ni borrar después, ni siquiera por el administrador. Es tu protección: nadie puede cambiar lo que tú dijiste que pasó.",
            enSotersa: "El aviso completo está en la app (menú → Mi perfil → Aviso de protección de datos). Léelo cada vez que cambie de versión: la app te lo pedirá.",
          },
        ],
        recursos: [],
      },
      {
        id: "datos-de-terceros",
        titulo: "Datos de terceros en el puesto: residentes, visitantes, pacientes",
        minutos: 10,
        objetivo: "Tratar correctamente los datos de las personas que pasan por tu puesto.",
        secciones: [
          {
            parrafos: [
              "En un puesto manejas datos de cientos de personas: registras cédulas de visitantes, ves listas de residentes, placas, cámaras, y en un hospital, pacientes. Todo eso lo tratas en nombre del cliente y de SOTERSA. Las reglas son pocas y no tienen excepciones.",
            ],
          },
          {
            titulo: "Sí",
            lista: [
              "Registrar lo necesario para el control de acceso: nombre, documento, destino, hora. Ni más ni menos.",
              "Guardar las listas y registros bajo llave en la garita, y devolverlos o destruirlos según indique el cliente.",
              "Reportar en la app con los datos necesarios para describir el hecho.",
            ],
          },
          {
            titulo: "No",
            lista: [
              "Fotografiar cédulas, listas, monitores o personas con el celular personal.",
              "Dar información sobre residentes, pacientes o empleados a quien la pida en la garita, por teléfono o en persona. «¿Vive aquí fulano?», «¿en qué piso está?», «¿a qué hora sale?»: la respuesta siempre es «consulte con la administración».",
              "Comentar fuera del puesto quién entra, quién sale, quién visita a quién.",
              "Copiar registros para «tenerlos de respaldo».",
              "Grabar conversaciones o tomar fotos de personas sin que sea necesario para una novedad de seguridad.",
            ],
          },
          {
            titulo: "Cámaras",
            lista: [
              "Las grabaciones son del cliente. El agente las observa para su función; no las descarga, no las comparte, no las muestra a residentes ni visitantes. Un requerimiento de Policía o Fiscalía se canaliza por la administración.",
            ],
          },
          {
            destacado: "Registra lo necesario, guarda bajo llave, no informes a nadie. Los datos de terceros se tratan; no se comparten.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m15p1", texto: "¿Cuál de estos es un dato sensible según la LOPDP?", opciones: ["La placa de un vehículo.", "El diagnóstico de un paciente.", "El nombre de un visitante.", "La hora de una ronda."], correcta: 1, explicacion: "Salud, biometría, origen, ideología, religión, orientación sexual y datos de menores son sensibles y tienen protección reforzada." },
        { id: "m15p2", texto: "El cliente del puesto donde trabajas puede ver en su portal:", opciones: ["Tu cédula y teléfono.", "Tu nombre, credencial, puesto asignado y si estás en turno; y las novedades de su puesto que supervisión autorice.", "Todo tu historial y tus fotos.", "Nada; el cliente no ve agentes."], correcta: 1, explicacion: "Es exactamente lo que dice el aviso que aceptaste. Sin cédula, teléfono, fotos ni historial." },
        { id: "m15p3", texto: "Alguien llama a la garita y pregunta si «fulano vive en el edificio y a qué hora sale». Tú:", opciones: ["Respondes si suena de confianza.", "Respondes solo el piso, no la hora.", "Remites a la administración: no se informa sobre residentes en la garita.", "Le pides que llame más tarde cuando esté el supervisor."], correcta: 2, explicacion: "Datos de terceros no se informan a nadie en la garita. Es además una señal de alerta que se reporta." },
        { id: "m15p4", texto: "Un residente te pide que le muestres la grabación de la cámara del parqueadero porque cree que le rayaron el carro. Tú:", opciones: ["Se la muestras; es residente.", "Le explicas que las grabaciones se solicitan a la administración, y registras el pedido como novedad.", "Le mandas el video por WhatsApp.", "Le dices que no hay cámaras."], correcta: 1, explicacion: "Las grabaciones son del cliente y se canalizan por la administración. El agente observa; no comparte." },
        { id: "m15p5", texto: "¿Por qué las novedades de la app no se pueden editar ni borrar?", opciones: ["Por un error del sistema.", "Para que nadie, ni el administrador, pueda cambiar lo que el agente registró: es una protección para el agente y una garantía de evidencia.", "Porque la ley lo prohíbe expresamente.", "Para ahorrar espacio."], correcta: 1, explicacion: "La inmutabilidad protege al agente y hace que el registro sirva como evidencia." },
      ],
    },
  },
];
