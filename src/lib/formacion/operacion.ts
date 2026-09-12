import { yt, type Modulo } from "./tipos";

/**
 * M6-M9: herramientas del oficio. La app de SOTERSA, la radio y el parte
 * escrito, primeros auxilios completos y desescalada.
 *
 * Fuentes: la propia app (src/app/guardia y src/lib/protocolos.ts); alfabeto
 * fonetico OACI/OTAN; Cruz Roja (videos verificados); OMS/OPS.
 */
export const MODULOS_OPERACION: Modulo[] = [
  // ==========================================================================
  // MODULO 6 · LA APP SOTERSA
  // ==========================================================================
  {
    id: "app-sotersa",
    codigo: "M6",
    titulo: "Cómo usar la app SOTERSA",
    resumen: "Abrir y cerrar turno, marcar rondas con QR, reportar novedades con foto, qué pasa sin conexión y cómo cuidar tu acceso. El módulo que evita los errores de las primeras semanas.",
    paraQuien: "Obligatorio para todo agente antes de su primer turno con la app.",
    color: "azul",
    lecciones: [
      {
        id: "entrar-y-perfil",
        titulo: "Entrar, cambiar el PIN y configurar el teléfono",
        minutos: 8,
        objetivo: "Instalar la app, entrar por primera vez y dejar el acceso seguro.",
        secciones: [
          {
            titulo: "Instalar",
            lista: [
              "Abre sotersa-app.vercel.app en el navegador del teléfono. En Android, Chrome ofrece «Instalar aplicación»; en iPhone, Safari → Compartir → «Agregar a pantalla de inicio».",
              "Queda el ícono del lobo. Desde ahí abre a pantalla completa y funciona aunque se corte la señal.",
            ],
          },
          {
            titulo: "Primer ingreso",
            lista: [
              "Usuario: tu número de cédula. Clave: el PIN temporal que te entregó SOTERSA.",
              "La app te obliga a crear tu PIN propio de seis números. No uses tu fecha de nacimiento ni parte de tu cédula: la app los rechaza.",
              "Luego aparece el aviso de protección de datos (LOPDP). Léelo: dice exactamente qué se registra y quién lo ve. Aceptarlo es tu consentimiento; puedes retirarlo desde la misma pantalla.",
            ],
          },
          {
            titulo: "Configurar",
            lista: [
              "Mi perfil: revisa tu nombre y teléfono; sube una foto de frente (es tu carné digital).",
              "Dispositivo: activa el acceso con huella o rostro para no escribir el PIN cada vez.",
              "El PIN es personal. Si crees que alguien lo conoce, cámbialo desde Mi perfil o pide a la administración que lo restablezca.",
            ],
          },
          {
            destacado: "Tu cédula es tu usuario y tu PIN es tu firma. Nada de lo que registres se puede borrar después: por eso importa que solo tú entres con él.",
          },
        ],
        recursos: [],
      },
      {
        id: "abrir-turno",
        titulo: "Abrir el turno y revisar el puesto",
        minutos: 8,
        objetivo: "Hacer la apertura de turno completa y dejar constancia del estado real del puesto.",
        secciones: [
          {
            parrafos: [
              "Al entrar ves «Mi puesto»: tu turno de hoy, el puesto y la hora. Si no aparece turno, la app te muestra el siguiente programado; si crees que hay un error, llama a la central desde la misma pantalla.",
            ],
          },
          {
            titulo: "La apertura",
            lista: [
              "Toca «Abrir turno». Aparece la lista de equipo: radio, cámaras, linterna, bitácora. Todo empieza marcado como conforme; toca lo que falte o esté dañado.",
              "Marcar algo como faltante NO impide abrir el turno. Al contrario: es lo correcto. Si el sistema te bloqueara, todos marcarían todo en verde y el registro no serviría.",
              "Escribe cómo recibes el puesto («limpio y ordenado», «garita con basura») y una observación si hace falta.",
              "La hora de apertura la pone tu teléfono en ese momento. Abre el turno cuando de verdad recibes el puesto, no antes ni después.",
            ],
          },
          {
            destacado: "Reportar que falta la linterna te protege. No reportarla te expone.",
            enSotersa: "Lo que marques en la apertura lo ve el supervisor en tiempo real y queda en tu ficha. Un puesto que se abre siempre con todo «conforme» y luego tiene fallas llama la atención.",
          },
        ],
        recursos: [],
      },
      {
        id: "rondas-qr",
        titulo: "Rondas con código QR y ubicación",
        minutos: 8,
        objetivo: "Marcar cada punto de ronda de forma que quede verificable.",
        secciones: [
          {
            titulo: "Cómo se marca",
            lista: [
              "Mi puesto → Ronda. La app abre la cámara: apunta al código QR pegado en el punto de control.",
              "Necesita el GPS activo: guarda la hora y la ubicación en que escaneaste. Si el GPS está apagado, actívalo; sin ubicación no se registra.",
              "Un punto solo se puede marcar dentro de tu turno y en tu puesto. Un QR de otro puesto no sirve.",
              "Al terminar cada punto, sigue el recorrido. La lista muestra cuáles ya marcaste.",
            ],
          },
          {
            titulo: "Si algo falla",
            lista: [
              "QR dañado o despegado: reporta como novedad de infraestructura y haz la ronda igual, anotando en la observación qué puntos no pudiste escanear.",
              "Sin señal: la marcación se guarda en el teléfono y sube sola cuando vuelve la conexión (ver lección de sin conexión).",
              "Cámara que no enfoca: limpia el lente, ilumina el código con la linterna.",
            ],
          },
          {
            destacado: "La ronda vale porque se puede comprobar. Hora, lugar y quién: eso es lo que el QR registra.",
          },
        ],
        recursos: [],
      },
      {
        id: "reportar-novedad",
        titulo: "Reportar una novedad: tipo, severidad, foto",
        minutos: 10,
        objetivo: "Elegir bien el tipo y la severidad, escribir un texto útil y adjuntar evidencia.",
        secciones: [
          {
            titulo: "Tipos",
            lista: [
              "Novedad general · Acceso no autorizado · Daño o falla de equipos · Infraestructura · Incidente médico · Relevo de puesto · Otro.",
              "Elige el más específico. «Otro» es la última opción, no la primera.",
            ],
          },
          {
            titulo: "Severidad: la decisión que más importa",
            lista: [
              "Informativa: quedó registrado, nadie tiene que actuar. Ej.: proveedor que llegó sin orden y se fue.",
              "Novedad: alguien debe revisar. Activa el tiempo de respuesta de supervisión (15 minutos). Ej.: puerta forzada sin ingreso, luz del perímetro apagada.",
              "Emergencia: peligro para personas o bienes ahora. Central y supervisor reciben alerta inmediata. Ej.: robo, incendio, persona herida.",
              "Ante la duda entre dos niveles, elige el mayor. Es más barato bajar una alerta que llegar tarde.",
            ],
          },
          {
            titulo: "El texto",
            lista: [
              "Mínimo diez caracteres, pero apunta a tres líneas: qué, dónde, a qué hora, qué hiciste, a quién avisaste.",
              "Hechos, no opiniones. «Vehículo gris placa ABC-123 estacionado frente al acceso 25 minutos; conductor no bajó; se retiró hacia el norte a las 22:40» sirve. «Carro sospechoso» no.",
            ],
          },
          {
            titulo: "La foto",
            lista: [
              "Toma la foto con la app, no con la cámara del teléfono: así queda con hora y en almacenamiento privado, y no en tu galería.",
              "Máximo 5 MB, formato JPG/PNG/WebP. Enfoca lo relevante: el daño, la placa, el objeto. No fotografíes personas de frente si no es necesario.",
              "Si tomar la foto es peligroso, no la tomes. La descripción escrita basta.",
            ],
          },
          {
            destacado: "Una novedad bien escrita hoy es la prueba que te defiende mañana.",
            enSotersa: "Las novedades no se editan ni se borran después de enviarlas, ni siquiera por el administrador. Si te equivocaste, envía otra que lo aclare.",
          },
        ],
        recursos: [],
      },
      {
        id: "sin-conexion",
        titulo: "Qué pasa sin conexión",
        minutos: 6,
        objetivo: "Confiar en la app cuando no hay señal, y saber qué revisar cuando vuelve.",
        secciones: [
          {
            lista: [
              "Rondas y novedades capturadas sin señal se guardan en el teléfono con la hora real de captura.",
              "Cuando vuelve la conexión, suben solas. Verás un botón «N registros pendientes» hasta que terminen; puedes tocarlo para forzar el envío.",
              "La hora que cuenta es la de captura, no la de envío. Un registro capturado a las 2:10 y enviado a las 6:00 aparece a las 2:10.",
              "La app no acepta registros con fecha futura ni de más de 7 días: si el teléfono tiene la hora mal, corrígela.",
              "La pantalla de Emergencia y los protocolos funcionan sin conexión. El botón del 911 es una llamada normal, no necesita datos.",
            ],
          },
          {
            destacado: "Sin señal se sigue trabajando igual. Lo único que cambia es cuándo llega a la central.",
          },
        ],
        recursos: [],
      },
      {
        id: "cerrar-turno",
        titulo: "Cerrar el turno y entregar con firma",
        minutos: 6,
        objetivo: "Hacer la entrega de puesto de forma que el siguiente agente y el cliente tengan claridad.",
        secciones: [
          {
            lista: [
              "Mi puesto → Cerrar turno. Escribe el estado en que entregas y las novedades pendientes para quien recibe.",
              "Firma en pantalla. Tu firma cierra tu turno; la del agente que recibe confirma que recibió. Sin las dos, la entrega queda incompleta.",
              "Cierra cuando de verdad te vas, con el relevo presente. Cerrar antes deja el puesto sin responsable en el registro.",
              "En puestos armados, la entrega del arma se verifica en este momento, frente al otro agente.",
            ],
          },
          {
            destacado: "Recibir y entregar con firma es lo que separa «yo dejé todo bien» de una discusión sin pruebas.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m6p1", texto: "Al abrir el turno, la linterna no está. ¿Qué haces en la app?", opciones: ["Marco todo conforme para poder abrir.", "Marco la linterna como faltante y abro el turno igual; queda registrado.", "No abro el turno hasta que aparezca la linterna.", "Llamo al supervisor y no registro nada."], correcta: 1, explicacion: "Marcar lo que falta no impide abrir. Dejar constancia es lo correcto y te protege." },
        { id: "m6p2", texto: "Una puerta del perímetro apareció forzada, sin señales de ingreso. ¿Qué severidad eliges?", opciones: ["Informativa.", "Novedad: alguien debe revisar y activa el tiempo de respuesta.", "Emergencia, siempre.", "No se reporta si no entró nadie."], correcta: 1, explicacion: "Requiere revisión sin peligro inmediato: novedad. Si hubiera un intruso dentro, sería emergencia." },
        { id: "m6p3", texto: "¿Por qué la foto de una novedad se toma desde la app y no con la cámara del teléfono?", opciones: ["Porque la cámara del teléfono tiene menos calidad.", "Porque así queda con hora, en almacenamiento privado, y no en tu galería personal.", "Porque la app la publica en redes.", "No hay diferencia."], correcta: 1, explicacion: "Hora de captura, almacenamiento privado y ninguna copia en tu galería: confidencialidad y evidencia." },
        { id: "m6p4", texto: "Capturas una ronda sin señal a las 2:10 y la conexión vuelve a las 6:00. ¿A qué hora aparece la ronda en la central?", opciones: ["A las 6:00.", "A las 2:10: cuenta la hora de captura.", "Se pierde.", "A la hora que decida el supervisor."], correcta: 1, explicacion: "La app guarda la hora real de captura y sube el registro cuando vuelve la señal." },
        { id: "m6p5", texto: "Enviaste una novedad con un dato equivocado. ¿Qué puedes hacer?", opciones: ["Editarla desde Mi puesto.", "Pedirle al administrador que la borre.", "Enviar otra novedad que aclare el error; las anteriores no se editan ni se borran.", "Nada; queda así para siempre."], correcta: 2, explicacion: "Las novedades son inmutables para todos. La corrección es un registro nuevo que lo aclara." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 7 · RADIO Y REDACCION DE PARTES
  // ==========================================================================
  {
    id: "radio-y-partes",
    codigo: "M7",
    titulo: "Comunicación por radio y redacción de partes",
    resumen: "Hablar por radio corto y claro, deletrear sin errores con el alfabeto fonético, y escribir novedades que el cliente y la Policía puedan usar.",
    paraQuien: "Para todo agente y supervisor.",
    color: "verde",
    lecciones: [
      {
        id: "radio-basico",
        titulo: "Radio: reglas básicas y disciplina",
        minutos: 10,
        objetivo: "Usar la radio de forma que se entienda a la primera y no estorbe a los demás.",
        secciones: [
          {
            titulo: "Antes de transmitir",
            lista: [
              "Escucha dos segundos: si hay una conversación, espera. Solo una emergencia interrumpe.",
              "Piensa el mensaje completo antes de apretar el botón. La radio no es para pensar en voz alta.",
              "Presiona, espera un segundo, habla. Si hablas al instante, se corta la primera palabra.",
            ],
          },
          {
            titulo: "Cómo hablar",
            lista: [
              "Identifícate primero: a quién llamas y quién eres. «Central, de puesto Citimed 1».",
              "Frases cortas, ritmo normal, voz clara, micrófono a cuatro dedos de la boca. Gritar distorsiona.",
              "Termina con «cambio» cuando esperas respuesta y «fuera» cuando terminas. Nunca «cambio y fuera».",
              "Confirma lo recibido repitiendo lo esencial: «Recibido, vehículo gris placa Alfa-Bravo-Charlie-uno-dos-tres, cambio».",
            ],
          },
          {
            titulo: "Lo que no va por radio",
            lista: [
              "Nombres completos de personas, cédulas, claves, montos de dinero. La frecuencia la puede escuchar cualquiera con un escáner.",
              "Conversaciones personales, chistes, discusiones.",
              "Información que ya está en la app: la radio es para lo que necesita respuesta ahora.",
            ],
          },
          {
            destacado: "Quién, a quién, qué, dónde. Y «cambio». Todo lo demás sobra.",
          },
        ],
        recursos: [],
      },
      {
        id: "alfabeto-fonetico",
        titulo: "El alfabeto fonético y los números",
        minutos: 8,
        objetivo: "Deletrear placas, nombres y códigos sin que se confundan B con D o M con N.",
        secciones: [
          {
            parrafos: [
              "El alfabeto fonético internacional (OACI/OTAN) existe porque por radio «B», «D», «P» y «T» suenan igual. Se usa en aviación, Policía y seguridad en todo el mundo, y es el que SOTERSA adopta.",
            ],
          },
          {
            titulo: "Las 26 letras",
            lista: [
              "A Alfa · B Bravo · C Charlie · D Delta · E Eco · F Foxtrot · G Golf · H Hotel · I India",
              "J Juliett · K Kilo · L Lima · M Mike · N November · O Oscar · P Papa · Q Quebec · R Romeo",
              "S Sierra · T Tango · U Uniform · V Victor · W Whiskey · X X-ray · Y Yankee · Z Zulu",
            ],
          },
          {
            titulo: "Números y placas",
            lista: [
              "Los números se dicen de uno en uno: «placa Papa-Charlie-Delta, cinco-ocho-dos-uno». Nunca «cincuenta y ocho, veintiuno».",
              "Para evitar confusiones por radio: «uno» se marca bien la «u»; el cero se dice «cero», no «o».",
              "Practica con las placas de los vehículos que entran a tu puesto. En una semana lo tienes.",
            ],
          },
          {
            destacado: "Una placa mal deletreada es un sospechoso que se escapa.",
          },
        ],
        recursos: [
          yt("X3kzabYFcKA", "Alfabeto fonético (OTAN) o aeronáutico OACI", "Arealen Supervivencia (YouTube)"),
          yt("BfBKiyq7HgE", "La OACI y el alfabeto aeronáutico internacional", "Efecto Planck (YouTube)"),
        ],
      },
      {
        id: "redactar-partes",
        titulo: "Redactar un parte de novedades que sirva",
        minutos: 15,
        objetivo: "Escribir novedades que el supervisor, el cliente y la Policía puedan usar sin llamarte a preguntar.",
        secciones: [
          {
            parrafos: [
              "El cliente no ve tu turno: ve lo que escribes. Un parte pobre hace ver pobre al servicio, aunque hayas trabajado bien. Uno claro hace ver profesional a SOTERSA, aunque la noche haya sido tranquila.",
            ],
          },
          {
            titulo: "Las seis preguntas",
            lista: [
              "Qué pasó (hecho concreto).",
              "Cuándo (hora exacta; la app pone la de captura, pero si el hecho fue antes, escríbela).",
              "Dónde (punto exacto: «acceso vehicular sur», no «afuera»).",
              "Quién (personas involucradas, descritas; vehículos con placa).",
              "Qué hiciste (acciones en orden).",
              "A quién avisaste y qué respondió.",
            ],
          },
          {
            titulo: "Estilo",
            lista: [
              "Frases cortas. Un hecho por frase. Punto.",
              "Sin opiniones ni adjetivos: «sospechoso», «raro», «agresivo» no describen. Describe lo que hizo.",
              "Sin abreviaturas inventadas ni mayúsculas sostenidas.",
              "Tercera persona o primera, pero siempre igual dentro del mismo parte.",
              "Si citas a alguien, entre comillas y textual: dijo «voy a volver con mi hermano».",
            ],
          },
          {
            titulo: "Ejemplo",
            parrafos: [
              "«22:35. Acceso peatonal principal. Hombre de unos 40 años, 1,70 m, chompa azul, gorra negra, pidió ingresar al departamento 4B sin identificarse. Se le explicó el procedimiento; se negó a mostrar documento y dijo “el dueño me conoce”. Se llamó al 4B (Sr. Paredes), quien indicó que no esperaba a nadie. Se negó el acceso; la persona se retiró a pie hacia la calle Amazonas a las 22:41. Se informó a central (operador Luis) a las 22:43.»",
            ],
          },
          {
            destacado: "Si un desconocido pudiera entender exactamente qué pasó leyendo tu parte, está bien escrito.",
            enSotersa: "El cliente ve en su portal las novedades que supervisión autoriza. Escribe cada una como si el cliente la fuera a leer, porque probablemente la leerá.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m7p1", texto: "La forma correcta de terminar una transmisión cuando esperas respuesta es:", opciones: ["«Cambio y fuera».", "«Cambio».", "«Fuera».", "No decir nada."], correcta: 1, explicacion: "«Cambio» pide respuesta; «fuera» cierra. Juntos se contradicen." },
        { id: "m7p2", texto: "¿Cómo se deletrea la placa PCD-5821 por radio?", opciones: ["«Pe-ce-de, cincuenta y ocho, veintiuno».", "«Papa-Charlie-Delta, cinco-ocho-dos-uno».", "«Pedro-Carlos-Daniel, 5821».", "«PCD 5821» rápido."], correcta: 1, explicacion: "Alfabeto OACI y números de uno en uno." },
        { id: "m7p3", texto: "¿Qué información NO debe ir por radio?", opciones: ["El punto de ronda que estás marcando.", "Cédulas, claves y montos de dinero.", "Una placa de vehículo.", "Un pedido de apoyo."], correcta: 1, explicacion: "La frecuencia la puede escuchar cualquiera. Datos sensibles van por la app o por teléfono." },
        { id: "m7p4", texto: "¿Cuál frase pertenece a un parte bien redactado?", opciones: ["«Tipo sospechoso rondando, muy raro».", "«Hombre de unos 40 años, chompa azul, pidió ingresar al 4B sin identificarse; se negó el acceso a las 22:41».", "«TODO NORMAL SIN NOVEDAD NADA QUE REPORTAR!!!».", "«El de siempre vino otra vez a molestar»."], correcta: 1, explicacion: "Hechos, hora, lugar, descripción y acción. Sin adjetivos ni mayúsculas." },
        { id: "m7p5", texto: "Antes de presionar el botón de la radio, lo primero es:", opciones: ["Hablar de inmediato para no perder tiempo.", "Escuchar dos segundos y tener el mensaje completo pensado.", "Gritar para que se oiga mejor.", "Decir tu nombre completo y cédula."], correcta: 1, explicacion: "Escuchar, pensar, presionar, esperar un segundo, hablar." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 8 · PRIMEROS AUXILIOS COMPLETO
  // ==========================================================================
  {
    id: "primeros-auxilios",
    codigo: "M8",
    titulo: "Primeros auxilios para el puesto",
    resumen: "Lo que un agente puede hacer en los primeros minutos, antes de que llegue la ambulancia: evaluar la escena, RCP, atragantamiento, hemorragias, inconsciencia, convulsiones y quemaduras.",
    paraQuien: "Para todo agente. Indispensable en puestos hospitalarios y residenciales. No reemplaza el curso presencial certificado.",
    color: "ambar",
    lecciones: [
      {
        id: "conducta-pas",
        titulo: "Antes de ayudar: Proteger, Avisar, Socorrer",
        minutos: 8,
        objetivo: "Aplicar el orden correcto para no convertirte en la segunda víctima y conseguir ayuda rápido.",
        secciones: [
          {
            titulo: "P · Proteger",
            lista: [
              "Mira antes de actuar: ¿hay tráfico, cables, fuego, un agresor, gas? Primero se asegura la escena o se saca a la persona del peligro si es posible sin riesgo.",
              "Guantes si los tienes (deberían estar en el botiquín del puesto). Si no, evita el contacto directo con sangre.",
            ],
          },
          {
            titulo: "A · Avisar",
            lista: [
              "911: qué pasa, dónde exactamente, cuántas personas, estado (consciente, respira, sangra). No cuelgues.",
              "Central de SOTERSA: para que envíen apoyo y avisen al cliente.",
              "Si hay más gente, delega: «usted, llame al 911; usted, busque el botiquín».",
            ],
          },
          {
            titulo: "S · Socorrer",
            lista: [
              "Solo lo que sabes hacer. Lo que sigue en este módulo es lo que un agente puede hacer con seguridad.",
              "No des de beber a nadie, no muevas a un herido de columna salvo peligro, no retires objetos clavados.",
            ],
          },
          {
            destacado: "Proteger, avisar, socorrer. En ese orden. Siempre.",
            enSotersa: "Todo incidente médico se reporta en la app como novedad tipo «Incidente médico», severidad emergencia si hubo riesgo de vida.",
          },
        ],
        recursos: [
          yt("uVrPD1mIRnU", "Conducta PAS | Primeros auxilios básicos", "Cruz Roja Euskadi (YouTube)"),
        ],
      },
      {
        id: "rcp",
        titulo: "RCP: cuando no respira",
        minutos: 12,
        objetivo: "Reconocer un paro cardiorrespiratorio y hacer compresiones efectivas hasta que llegue ayuda.",
        secciones: [
          {
            titulo: "Reconocer",
            lista: [
              "Toca el hombro y pregunta fuerte: «¿está bien?». Si no responde, mira el pecho 10 segundos: ¿respira normal? Jadeos ocasionales NO son respirar.",
              "No responde y no respira normal = RCP. Llama al 911 (o que alguien llame) y empieza.",
            ],
          },
          {
            titulo: "Compresiones",
            lista: [
              "Persona boca arriba sobre superficie dura. Talón de una mano en el centro del pecho, la otra encima, brazos rectos.",
              "Comprime fuerte y rápido: 5 a 6 cm de profundidad, 100 a 120 por minuto (el ritmo de una canción rápida). Deja que el pecho suba entre compresiones.",
              "Si sabes dar ventilaciones: 30 compresiones, 2 soplos. Si no, solo compresiones, sin parar.",
              "Cambia con otra persona cada 2 minutos si es posible; cansa más de lo que parece.",
            ],
          },
          {
            titulo: "DEA (desfibrilador)",
            lista: [
              "Si el edificio tiene uno (los hospitales sí), que alguien lo traiga. Enciéndelo y sigue las instrucciones de voz: el aparato decide si descarga.",
              "No detengas las compresiones mientras lo colocan, salvo cuando el aparato lo indique.",
            ],
          },
          {
            destacado: "Fuerte, rápido, sin parar. Una RCP imperfecta es infinitamente mejor que ninguna.",
          },
        ],
        recursos: [
          yt("8E_tHsTNK6g", "RCP – Reanimación cardiopulmonar", "Cruz Roja Euskadi (YouTube)"),
          yt("FEayzgNGGBQ", "Primeros auxilios: RCP en adultos", "Cruz Roja Euskadi (YouTube)"),
        ],
      },
      {
        id: "atragantamiento",
        titulo: "Atragantamiento",
        minutos: 8,
        objetivo: "Actuar ante una persona que no puede respirar por un objeto en la garganta.",
        secciones: [
          {
            lista: [
              "Si tose con fuerza: anímala a seguir tosiendo. No golpees la espalda todavía; la tos es lo más efectivo.",
              "Si no puede toser, hablar ni respirar (se lleva las manos al cuello): 5 golpes secos entre los omóplatos con el talón de la mano, inclinándola hacia adelante.",
              "Si no sale: 5 compresiones abdominales (maniobra de Heimlich): por detrás, puño sobre el estómago arriba del ombligo, la otra mano encima, presiona hacia adentro y arriba.",
              "Alterna 5 golpes y 5 compresiones hasta que expulse el objeto o pierda el conocimiento. Si pierde el conocimiento: al suelo, 911, RCP.",
              "Embarazadas y personas muy grandes: compresiones en el pecho en vez del abdomen.",
            ],
          },
          {
            destacado: "Tos fuerte: déjala toser. Sin tos ni voz: 5 golpes, 5 compresiones, repetir.",
          },
        ],
        recursos: [
          yt("HDsBQJhIRZc", "Atragantamientos en personas adultas y niños/as (maniobra de Heimlich)", "Cruz Roja Euskadi (YouTube)"),
        ],
      },
      {
        id: "hemorragias",
        titulo: "Hemorragias y heridas",
        minutos: 8,
        objetivo: "Controlar un sangrado abundante con presión directa y reconocer cuándo es grave.",
        secciones: [
          {
            lista: [
              "Guantes. Presión directa sobre la herida con gasa o un paño limpio, fuerte y sin soltar. Si se empapa, pon otro encima; no retires el primero.",
              "Eleva la extremidad si no hay fractura. Mantén la presión hasta que llegue ayuda; un sangrado importante no se suelta para «mirar».",
              "Sangre roja brillante que sale a chorro con el pulso: arterial, grave, 911 ya. Oscura y continua: venosa. Poca y superficial: capilar.",
              "Objeto clavado (vidrio, metal): no lo saques. Inmoviliza alrededor y presiona a los lados.",
              "Torniquete: solo si la presión directa no controla un sangrado de brazo o pierna que amenaza la vida, con una banda ancha, 5 cm por encima de la herida, y anota la hora en que lo pusiste.",
              "Heridas menores: lava con agua limpia, cubre, y que la persona acuda a un centro de salud si es profunda o sucia.",
            ],
          },
          {
            destacado: "Presión directa, firme, sin soltar. Eso salva más vidas que cualquier otra maniobra.",
          },
        ],
        recursos: [
          yt("IfSZl6izsFk", "Primeros auxilios: hemorragias", "Cruz Roja Euskadi (YouTube)"),
        ],
      },
      {
        id: "inconsciencia-convulsiones",
        titulo: "Inconsciencia, desmayo y convulsiones",
        minutos: 8,
        objetivo: "Colocar en posición lateral de seguridad y proteger a quien convulsiona.",
        secciones: [
          {
            titulo: "Inconsciente pero respira",
            lista: [
              "Posición lateral de seguridad: de lado, brazo de abajo estirado, pierna de arriba flexionada como apoyo, cabeza ligeramente hacia atrás para que la vía aérea quede abierta y cualquier vómito salga.",
              "911, abrigar, vigilar la respiración cada minuto. Si deja de respirar, boca arriba y RCP.",
            ],
          },
          {
            titulo: "Desmayo",
            lista: [
              "Acostar boca arriba, piernas elevadas, aflojar ropa, aire. Suele recuperarse en un minuto. Si no despierta en dos minutos, tratar como inconsciencia.",
            ],
          },
          {
            titulo: "Convulsiones",
            lista: [
              "No sujetes, no metas nada en la boca. Retira objetos con los que pueda golpearse, pon algo blando bajo la cabeza, anota la hora de inicio.",
              "Cuando termine: posición lateral de seguridad, déjala descansar, no le des nada de comer ni beber hasta que esté totalmente consciente.",
              "911 si dura más de 5 minutos, se repite, es la primera vez, o la persona está embarazada o herida.",
            ],
          },
          {
            destacado: "Inconsciente y respira: de lado. Convulsiona: protégela y cronometra. Nada en la boca.",
          },
        ],
        recursos: [
          yt("cLA-g8mWal4", "Posición lateral de seguridad", "Cruz Roja Euskadi (YouTube)"),
        ],
      },
      {
        id: "quemaduras-y-otros",
        titulo: "Quemaduras, golpes, fracturas y el botiquín",
        minutos: 8,
        objetivo: "Resolver lo frecuente sin empeorarlo, y tener el botiquín del puesto listo.",
        secciones: [
          {
            titulo: "Quemaduras",
            lista: [
              "Agua a temperatura ambiente sobre la zona, 10 a 20 minutos. Nada de hielo, pasta dental, aceite ni cremas.",
              "Retira anillos y relojes antes de que se hinche; no retires ropa pegada.",
              "Cubre con gasa limpia sin apretar. Ampollas: no las revientes.",
              "911 si es grande (más grande que la palma), en cara, manos, genitales o articulaciones, o por electricidad o químicos.",
            ],
          },
          {
            titulo: "Golpes y fracturas",
            lista: [
              "Frío local (nunca directo sobre la piel) 15 minutos, reposo, elevar.",
              "Deformidad, imposibilidad de mover o dolor intenso: inmoviliza como está, no intentes enderezar, 911.",
              "Golpe en la cabeza con pérdida de conocimiento, vómito, confusión o sangrado por oído o nariz: 911.",
            ],
          },
          {
            titulo: "El botiquín del puesto",
            lista: [
              "Guantes, gasas, vendas, esparadrapo, suero fisiológico o agua estéril, tijeras, manta térmica, mascarilla para RCP.",
              "Revísalo en la apertura de turno como parte del equipo. Lo que falte se reporta.",
              "Nada de medicamentos para dar a terceros: un agente no medica.",
            ],
          },
          {
            destacado: "Agua para la quemadura, frío para el golpe, quieto lo que parece roto. Y 911 si dudas.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "Guía de primeros auxilios (lista de reproducción)", url: "https://www.youtube.com/playlist?list=PLthQJDbnjyLmftZAFVB1CpgbO9DE64OpZ", fuente: "Cruz Roja (YouTube)" },
          { tipo: "web", titulo: "Cruz Roja Ecuatoriana: cursos certificados de primeros auxilios", url: "https://www.youtube.com/@Cruzrojaec", fuente: "Cruz Roja Ecuatoriana", nota: "Este módulo no reemplaza el curso presencial. SOTERSA puede coordinar uno para el equipo." },
        ],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m8p1", texto: "Antes de socorrer a una persona, lo primero es:", opciones: ["Correr hacia ella.", "Proteger la escena y a ti mismo, luego avisar al 911, luego socorrer.", "Darle agua.", "Tomar una foto para el reporte."], correcta: 1, explicacion: "Conducta PAS: proteger, avisar, socorrer. En ese orden." },
        { id: "m8p2", texto: "Una persona no responde y solo da jadeos ocasionales. ¿Qué haces?", opciones: ["Esperar a que respire mejor.", "Ponerla de lado.", "Iniciar RCP: no responde y no respira normal.", "Darle golpes en la espalda."], correcta: 2, explicacion: "Los jadeos no son respirar. No responde + no respira normal = RCP inmediata." },
        { id: "m8p3", texto: "Ritmo y profundidad correctos de las compresiones en un adulto:", opciones: ["60 por minuto, 2 cm.", "100 a 120 por minuto, 5 a 6 cm.", "200 por minuto, lo más suave posible.", "Lo que aguantes."], correcta: 1, explicacion: "Fuerte y rápido: 100-120/min, 5-6 cm, dejando que el pecho suba." },
        { id: "m8p4", texto: "Alguien se atraganta pero tose con fuerza. Lo correcto es:", opciones: ["Golpes en la espalda de inmediato.", "Maniobra de Heimlich de inmediato.", "Animarla a seguir tosiendo; la tos es lo más efectivo.", "Darle agua para que pase."], correcta: 2, explicacion: "Mientras tosa con fuerza, déjala toser. Golpes y compresiones solo si no puede toser ni respirar." },
        { id: "m8p5", texto: "Para una hemorragia abundante en el brazo:", opciones: ["Torniquete de inmediato.", "Presión directa firme y sin soltar; si el paño se empapa, otro encima.", "Lavar con agua hasta que pare.", "Retirar el objeto clavado si lo hay."], correcta: 1, explicacion: "Presión directa primero. El torniquete es el último recurso; los objetos clavados no se retiran." },
        { id: "m8p6", texto: "Una persona convulsiona en el lobby. Tú:", opciones: ["La sujetas fuerte para que no se lastime.", "Le metes algo en la boca para que no se muerda.", "Retiras objetos cercanos, proteges su cabeza, cronometras, y al terminar la pones de lado.", "La levantas y la sientas en una silla."], correcta: 2, explicacion: "Nunca sujetar ni meter nada en la boca. Proteger, cronometrar, posición lateral al terminar." },
        { id: "m8p7", texto: "Quemadura por agua hirviendo en la mano:", opciones: ["Hielo directo.", "Pasta dental o aceite.", "Agua a temperatura ambiente 10-20 minutos, retirar anillos, cubrir con gasa limpia.", "Reventar las ampollas para que sane."], correcta: 2, explicacion: "Agua, no hielo. Sin cremas. Retirar anillos antes de la hinchazón. Ampollas intactas." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 9 · DESESCALADA Y DEFENSA PERSONAL
  // ==========================================================================
  {
    id: "desescalada",
    codigo: "M9",
    titulo: "Desescalada y defensa personal",
    resumen: "Leer las fases de la agitación, bajar la tensión con la voz y el cuerpo, mantener la distancia, y qué hacer si aun así hay agresión física. Lo físico se practica presencial.",
    paraQuien: "Para todo agente. Complementa la formación de defensa personal del Nivel I.",
    color: "verde",
    lecciones: [
      {
        id: "fases-agitacion",
        titulo: "Leer la escalada: de la molestia a la agresión",
        minutos: 10,
        objetivo: "Identificar en qué fase está una persona alterada para responder con la herramienta correcta.",
        secciones: [
          {
            parrafos: [
              "La agresión casi nunca aparece de golpe. Hay una escalada, y en cada fase hay señales y una respuesta que funciona. Cuanto antes intervengas, más fácil.",
            ],
          },
          {
            titulo: "Las fases",
            lista: [
              "Ansiedad: habla rápido, se mueve, mira alrededor, pregunta lo mismo dos veces. Respuesta: atención, escucha, información clara.",
              "Defensiva: sube la voz, cuestiona tu autoridad, exige, usa sarcasmo. Respuesta: límites claros y calmados, sin discutir, ofrecer opciones.",
              "Agitación física: se acerca, señala con el dedo, golpea objetos, puños cerrados, respiración agitada, mira tus manos. Respuesta: distancia, postura de seguridad, pedir apoyo.",
              "Agresión: golpea, empuja, arroja objetos, saca un arma. Respuesta: protegerte, retirarte, apoyo y 911.",
            ],
          },
          {
            titulo: "Señales de que viene el golpe",
            lista: [
              "Cambio de la mirada: de tus ojos a tus manos o a un punto de tu cuerpo. Apretar la mandíbula. Quitarse la gorra o la chaqueta. Silencio repentino después de gritar.",
              "Esas señales significan: distancia ahora.",
            ],
          },
          {
            destacado: "Cada fase tiene su respuesta. Responder a la ansiedad con dureza, o a la agitación con explicaciones, acelera la escalada.",
          },
        ],
        recursos: [
          yt("oixSvM-G_q0", "Escalada de agitación y desescalada verbal: fases, indicadores y actuación", "EVO Training (YouTube)", "Está enfocado a pacientes, pero las fases son las mismas en una garita."),
        ],
      },
      {
        id: "desescalada-verbal",
        titulo: "Desescalada verbal: voz, palabras y cuerpo",
        minutos: 12,
        objetivo: "Aplicar las técnicas verbales y no verbales que bajan la tensión sin ceder en el procedimiento.",
        secciones: [
          {
            titulo: "El cuerpo habla primero",
            lista: [
              "Ángulo: no de frente como en un duelo; ligeramente de lado, pie fuerte atrás. Es menos amenazante y te deja listo para moverte.",
              "Manos visibles, abiertas, a la altura del pecho. No en los bolsillos, no cruzadas, no en el cinturón.",
              "Distancia: dos brazos extendidos como mínimo. Si la persona la acorta, tú retrocedes; no la disputes.",
              "Cara neutra, mirada a la cara sin fijarla en los ojos. Sin sonrisa burlona ni ceño.",
            ],
          },
          {
            titulo: "La voz",
            lista: [
              "Más baja y más lenta que la de la otra persona. Es contraintuitivo y es lo que más funciona.",
              "Una idea por frase. Repite la misma frase clave si hace falta: «Entiendo. Necesito que se aleje de la puerta».",
              "Nunca «cálmese»: nadie se calma porque se lo ordenen. Mejor: «vamos a resolverlo; cuénteme qué necesita».",
            ],
          },
          {
            titulo: "Las palabras",
            lista: [
              "Escucha activa: repite lo que la persona dijo con tus palabras. «Usted dice que lleva media hora esperando y nadie le responde».",
              "Reconoce la emoción, no el argumento: «Veo que está molesto» (no «tiene razón»).",
              "Ofrece dos opciones, ambas aceptables para ti: «Puede esperar aquí mientras confirmo, o puede dejarme su número y le aviso».",
              "Límite claro y consecuencia realista, sin amenaza: «Si continúa gritando, voy a tener que llamar a la Policía. Prefiero no hacerlo».",
              "Nunca: retos («¿y qué va a hacer?»), burlas, órdenes en cadena, tocar a la persona.",
            ],
          },
          {
            destacado: "Baja la voz, abre las manos, da dos opciones. Y mantén la distancia siempre.",
          },
        ],
        recursos: [
          yt("soN--XxYG7c", "Desescalada verbal: 10 técnicas de control", "EVO Training (YouTube)"),
        ],
      },
      {
        id: "defensa-fisica",
        titulo: "Si hay agresión: protegerte, salir, pedir apoyo",
        minutos: 10,
        objetivo: "Conocer los principios de la defensa personal del agente: proporción, protección y salida.",
        secciones: [
          {
            parrafos: [
              "El objetivo de la defensa personal de un agente no es ganar una pelea: es no resultar herido y no herir más de lo necesario. La ley lo dice con claridad: legítima defensa con necesidad racional del medio empleado (COIP Art. 33) y actuación bajo el principio de precaución (LOVSP Art. 47). Todo lo que hagas después de que la amenaza cesa deja de ser defensa.",
            ],
          },
          {
            titulo: "Principios",
            lista: [
              "Distancia es defensa: la mayoría de los golpes no llegan si no estás al alcance. Retroceder no es cobardía; es táctica.",
              "Obstáculos: la garita, un mostrador, un vehículo entre tú y el agresor.",
              "Guardia pasiva: manos arriba, palmas abiertas, mentón abajo. Protege y no provoca.",
              "Si te agarran: rompe el agarre hacia el pulgar del agresor y sal. No forcejees en el mismo lugar.",
              "Control físico solo si no puedes retirarte y la persona sigue atacando, con la mínima fuerza y el mínimo tiempo; y en cuanto puedas, suelta y retrocede.",
              "Arma blanca o de fuego: no enfrentes. Distancia, obstáculo, salida, 911. Ningún bien vale ese riesgo (Protocolo 03).",
            ],
          },
          {
            titulo: "Después",
            lista: [
              "Revisa si estás herido (la adrenalina esconde lesiones). Atiende a terceros.",
              "911 y central. Reporta como emergencia en la app, con todo el detalle, mientras está fresco.",
              "No persigas, no «termines» la discusión, no toques a la persona una vez controlada la situación.",
            ],
          },
          {
            destacado: "Distancia, obstáculo, salida. La fuerza física es el último recurso y termina en el instante en que la amenaza termina.",
            enSotersa: "Las técnicas físicas se aprenden con instructor, en el reentrenamiento. Este módulo te da el criterio; el curso presencial, la práctica.",
          },
        ],
        recursos: [
          yt("RXU1WLR3mT4", "Desescalada verbal y seguridad laboral", "EVO Training (YouTube)"),
        ],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m9p1", texto: "Una persona empieza a señalarte con el dedo, aprieta los puños y mira tus manos. ¿En qué fase está y qué haces?", opciones: ["Ansiedad: le explico el procedimiento con más detalle.", "Agitación física: tomo distancia, postura de seguridad y pido apoyo.", "Es normal; espero a ver.", "Agresión: la sujeto antes de que golpee."], correcta: 1, explicacion: "Señales de agitación física. Distancia y apoyo; explicar más en esa fase acelera la escalada." },
        { id: "m9p2", texto: "Para bajar la tensión, tu voz debe ser:", opciones: ["Más alta que la del otro para imponerte.", "Más baja y más lenta que la del otro.", "Igual de alta, para que sepa que no tienes miedo.", "Da lo mismo; importa lo que dices."], correcta: 1, explicacion: "Más baja y más lenta. Es contraintuitivo y es lo que más funciona." },
        { id: "m9p3", texto: "¿Cuál de estas frases ayuda a desescalar?", opciones: ["«Cálmese».", "«¿Y qué va a hacer?».", "«Veo que está molesto. Puede esperar aquí mientras confirmo, o dejarme su número y le aviso».", "«Si no se calla llamo a la Policía y se va preso»."], correcta: 2, explicacion: "Reconoce la emoción y ofrece dos opciones aceptables. Órdenes, retos y amenazas escalan." },
        { id: "m9p4", texto: "El agresor saca un cuchillo. Lo correcto es:", opciones: ["Intentar desarmarlo.", "Distancia, obstáculo, salida, 911.", "Sacar tu arma si eres armado y disparar de inmediato.", "Hablarle de cerca para tranquilizarlo."], correcta: 1, explicacion: "Ante arma blanca o de fuego no se enfrenta. Distancia, obstáculo, salida, 911. Ningún bien vale ese riesgo." },
        { id: "m9p5", texto: "Lograste controlar físicamente a una persona que te atacó y ya no ofrece resistencia. Ahora:", opciones: ["La mantienes inmovilizada con fuerza hasta que llegue la Policía, aunque tarde una hora.", "La sueltas en cuanto es seguro, retrocedes, y llamas al 911 y a la central.", "Le das una lección para que no vuelva.", "La interrogas para saber por qué te atacó."], correcta: 1, explicacion: "La defensa termina cuando termina la amenaza. Todo lo demás es exceso; interrogar además está prohibido (LOVSP Art. 48)." },
      ],
    },
  },
];
