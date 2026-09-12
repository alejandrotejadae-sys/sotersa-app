import { yt, type Modulo } from "./tipos";

/** M1-M3: servicio al cliente, seguridad privada y seguridad ciudadana. */
export const MODULOS_BASE: Modulo[] = [
  // ==========================================================================
  // MODULO 1 · SERVICIO AL CLIENTE
  // ==========================================================================
  {
    id: "servicio-al-cliente",
    codigo: "M1",
    titulo: "Servicio al cliente en seguridad",
    resumen: "El agente es la primera y la última persona que ve quien entra a un edificio o una empresa. Este módulo enseña a proteger sin dejar de servir.",
    paraQuien: "Obligatorio para todo agente. Recomendado para supervisores.",
    color: "azul",
    lecciones: [
      {
        id: "primera-imagen",
        titulo: "El agente es la imagen del cliente y de SOTERSA",
        minutos: 12,
        objetivo: "Entender por qué el trato al público es parte del servicio de seguridad, no un extra.",
        secciones: [
          {
            parrafos: [
              "Un residente, un proveedor o un visitante no ven al gerente de la empresa ni al supervisor: ven al agente de la garita. Lo que ese agente dice, cómo lo dice y cómo se presenta es, para esa persona, la calidad de todo el servicio.",
              "La seguridad y la buena atención no compiten. Un agente cortés obtiene más cooperación: la gente se identifica sin discutir, espera mientras se verifica y avisa cuando ve algo raro. Un agente hosco genera discusiones que distraen del control y terminan en quejas al cliente.",
            ],
          },
          {
            titulo: "Los tres momentos que el público recuerda",
            lista: [
              "El saludo: los primeros cinco segundos definen el tono de todo lo que sigue.",
              "La espera: mientras verificas, la persona no sabe qué pasa. Explícalo.",
              "La despedida: quien sale con un «que tenga buen día» vuelve a cooperar mañana.",
            ],
          },
          {
            destacado: "Firmeza en el procedimiento, amabilidad en el trato. Nunca se negocia la primera; nunca se pierde la segunda.",
            enSotersa: "Reglamento de garita, norma 04 «Conducta en el puesto»: trato cordial y respetuoso con clientes, visitantes y personal. Está en la app, en Mi puesto → Normas.",
          },
        ],
        recursos: [
          yt("t5VVJU7k5TU", "5 claves de la atención al cliente en seguridad privada", "ISSEGUR (YouTube, 1 min)", "Video corto: ideal para verlo antes del turno."),
          yt("oGDtKrE0tP4", "Calidad de servicio de los vigilantes de seguridad", "fremm20 (YouTube)", "Ejemplos de buen y mal trato en un puesto real."),
        ],
      },
      {
        id: "comunicacion",
        titulo: "Cómo hablar: saludo, control de acceso y explicar el procedimiento",
        minutos: 15,
        objetivo: "Aplicar un guion de comunicación claro para el control de acceso y las verificaciones.",
        secciones: [
          {
            titulo: "El guion básico de la garita",
            lista: [
              "Saludo con la hora: «Buenos días / buenas tardes / buenas noches, bienvenido a …».",
              "Identificarse: «Soy el agente de seguridad del edificio». La credencial visible (LOVSP Art. 60) hace el resto.",
              "Pedir, no exigir: «¿Me permite su cédula, por favor?» en lugar de «Cédula».",
              "Explicar mientras verificas: «Voy a confirmar con el departamento; me toma un minuto».",
              "Cerrar: «Listo, puede pasar. Que tenga buen día» / «Lo siento, no está autorizado; puedo avisar a … para que lo confirme».",
            ],
          },
          {
            titulo: "Lo que nunca se dice",
            lista: [
              "«No sé» sin más. Se dice: «Lo consulto y le respondo».",
              "«Eso no es mi problema». Todo lo que pasa en la puerta es tu problema hasta que lo entregas a quien corresponde.",
              "Tutear a quien no te tutea. El «usted» es la regla; el tuteo lo decide el otro.",
              "Comentarios sobre la apariencia, el origen o la forma de hablar de una persona. Además de descortés, es discriminación (LOVSP Art. 47 numeral 12).",
            ],
          },
          {
            destacado: "Postura, mirada al frente y voz clara. Sin celular en la mano mientras hablas con alguien.",
            enSotersa: "Cada verificación de acceso que genere duda se anota como novedad informativa en la app (Mi puesto → Reportar). Así el supervisor sabe qué pasó aunque no haya habido incidente.",
          },
        ],
        recursos: [
          yt("ErkpVQnuyQY", "Curso de atención al cliente para guardias de seguridad", "Cursos IntegrA (YouTube)", "Curso completo; puedes verlo por partes."),
        ],
      },
      {
        id: "personas-dificiles",
        titulo: "Personas molestas, reclamos y cómo no escalar",
        minutos: 15,
        objetivo: "Manejar una queja o una persona alterada sin perder el control del acceso ni la calma.",
        secciones: [
          {
            parrafos: [
              "La mayoría de las discusiones en una garita no son por seguridad: son porque alguien tiene prisa, está cansado o ya venía molesto. Tu trabajo no es ganar la discusión; es que la persona cumpla el procedimiento y se vaya tranquila.",
            ],
          },
          {
            titulo: "Técnica en cuatro pasos",
            lista: [
              "Escucha sin interrumpir. Deja que termine; la mayoría se calma al sentirse escuchada.",
              "Reconoce sin ceder: «Entiendo que tiene prisa y lamento la demora. El procedimiento es el mismo para todos».",
              "Ofrece una salida: «Puedo llamar a … para agilizarlo» o «Puede esperar aquí mientras confirmo».",
              "Si no cede, escala: avisa a la administración del cliente o al supervisor. No es debilidad; es el procedimiento.",
            ],
          },
          {
            titulo: "Señales para pasar de «molesto» a «riesgo»",
            lista: [
              "Amenazas directas, intento de forzar el paso, agresión física o mostrar un arma.",
              "En ese momento deja de ser servicio al cliente y pasa a ser un incidente de seguridad: aplica el módulo 2 y reporta como novedad o emergencia.",
            ],
          },
          {
            destacado: "Baja la voz cuando el otro la sube. Es la herramienta más efectiva que tienes y no cuesta nada.",
            enSotersa: "Los contactos del puesto (administración del cliente, supervisor, central) están en la app con botón de llamada. Úsalos antes de que la situación crezca.",
          },
        ],
        recursos: [
          yt("432kxHM6bEk", "Capacitación en servicio al cliente: construyendo experiencia de usuario", "Sevicol Colombia (YouTube)", "Empresa de seguridad colombiana; el enfoque aplica igual en Ecuador."),
        ],
      },
      {
        id: "presentacion",
        titulo: "Presentación personal, uniforme y garita",
        minutos: 8,
        objetivo: "Cumplir el estándar de imagen que exige la ley y el reglamento de garita.",
        secciones: [
          {
            parrafos: [
              "La ley obliga a usar el uniforme y los distintivos autorizados de la compañía, y a portar el carné de identificación laboral durante toda la jornada (LOVSP Art. 47 numerales 5 y 9, Art. 60 y 64). No es una preferencia de la empresa: es un requisito legal y el cliente lo sabe.",
            ],
          },
          {
            titulo: "Lista de control antes de salir a la garita",
            lista: [
              "Uniforme completo y limpio, con los parches de SOTERSA.",
              "Credencial visible, de frente, sin cubrir.",
              "Calzado lustrado, cabello ordenado, afeitado o barba cuidada.",
              "Equipo de protección individual entregado por la empresa, en buen estado (LOVSP Art. 65).",
              "Garita limpia y ordenada: se recibe y se entrega impecable.",
            ],
          },
          {
            enSotersa: "La apertura de turno en la app registra el estado del puesto y del equipo. Marca lo que falte: dejar constancia es lo correcto, no un problema.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m1p1", texto: "Un visitante llega con prisa y se molesta porque le pides la cédula. ¿Qué haces?", opciones: ["Lo dejo pasar para evitar problemas.", "Le explico que el procedimiento es igual para todos, verifico rápido y le agradezco la espera.", "Le respondo en el mismo tono para que entienda quién manda.", "Le digo que ese no es mi problema."], correcta: 1, explicacion: "Firmeza en el procedimiento, amabilidad en el trato. El control de acceso no se negocia, pero se explica." },
        { id: "m1p2", texto: "¿Cuál es la forma correcta de pedir un documento?", opciones: ["«Cédula.»", "«¿Me permite su cédula, por favor?»", "«Muéstreme algo, rápido.»", "«Sin documento no entra.»"], correcta: 1, explicacion: "Pedir, no exigir. La cortesía consigue más cooperación que la orden." },
        { id: "m1p3", texto: "Una persona empieza a gritarte. Lo más efectivo es:", opciones: ["Gritar más fuerte.", "Ignorarla por completo.", "Bajar la voz, escuchar hasta que termine y ofrecer una salida.", "Amenazarla con llamar a la Policía."], correcta: 2, explicacion: "Bajar la voz cuando el otro la sube desactiva la escalada. Escuchar y ofrecer una salida resuelve la mayoría de los casos." },
        { id: "m1p4", texto: "Portar el carné de identificación durante la jornada es:", opciones: ["Opcional, depende del cliente.", "Una obligación legal del agente (LOVSP Art. 60).", "Solo necesario en puestos armados.", "Responsabilidad del supervisor."], correcta: 1, explicacion: "LOVSP Art. 60: el personal tiene la obligación de portar su carné de identificación laboral durante su jornada." },
        { id: "m1p5", texto: "Una persona molesta intenta forzar el paso y te amenaza. Esto es:", opciones: ["Un reclamo de servicio al cliente.", "Un incidente de seguridad: se aplica el procedimiento y se reporta.", "Algo que se resuelve dejándola pasar.", "Un asunto personal entre tú y ella."], correcta: 1, explicacion: "Amenaza o intento de forzar el paso convierten la situación en un incidente de seguridad. Se reporta como novedad o emergencia." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 2 · SEGURIDAD PRIVADA
  // ==========================================================================
  {
    id: "seguridad-privada",
    codigo: "M2",
    titulo: "Seguridad privada: ley, procedimiento y emergencias",
    resumen: "Qué puede y qué no puede hacer un agente en Ecuador, cómo se controla un acceso, cómo se hace una ronda y qué se hace cuando algo sale mal.",
    paraQuien: "Obligatorio para todo agente. La lección de armas, solo para personal de puestos armados.",
    color: "verde",
    lecciones: [
      {
        id: "marco-legal",
        titulo: "Tu marco legal: la LOVSP y lo que dice de ti",
        minutos: 20,
        objetivo: "Conocer las funciones, deberes y prohibiciones del agente según la ley vigente.",
        secciones: [
          {
            parrafos: [
              "Desde febrero de 2024 rige la Ley Orgánica de Vigilancia y Seguridad Privada (LOVSP). Reemplazó a la ley de 2003 y es la que define qué eres, qué debes hacer y qué te está prohibido. Conocerla te protege: la mayoría de los problemas legales de un agente vienen de hacer algo que la ley no le permite.",
            ],
          },
          {
            titulo: "Funciones y deberes (LOVSP Art. 47)",
            lista: [
              "Cumplir el marco jurídico vigente.",
              "Proteger a las personas, bienes y valores puestos a tu cuidado, conforme al servicio contratado.",
              "Prevenir el cometimiento de actos delictivos.",
              "Colaborar con las entidades de seguridad del Estado.",
              "Usar los documentos de identificación, uniforme y equipo entregados.",
              "Formarte y capacitarte de manera permanente.",
              "Realizar comprobaciones, registros y acciones de prevención necesarias para tu labor.",
              "Aprehender y poner a disposición de la Policía Nacional, de manera inmediata, a los presuntos delincuentes.",
              "Cumplir tus deberes bajo el principio de precaución, legítima defensa, respeto a la dignidad humana y sin discriminación.",
            ],
          },
          {
            titulo: "Prohibiciones (LOVSP Art. 48)",
            lista: [
              "Realizar registros fuera de las instalaciones autorizadas para el servicio.",
              "Emplear medios, armas o recursos no autorizados, o fuera del lugar y horario del servicio.",
              "Interrogar a las personas aprehendidas.",
              "Manipular las evidencias encontradas.",
              "Alterar la escena de un delito.",
            ],
          },
          {
            titulo: "Requisitos y formación (LOVSP Art. 50, 52, 62)",
            parrafos: [
              "Para trabajar como agente se exige haber aprobado el curso de formación Nivel I (sin arma) o Nivel II (con arma) en un centro acreditado, además de los exámenes médicos y psicológicos y la acreditación del ente rector. Cada dos años es obligatorio aprobar un programa de reentrenamiento. Esta escuela interna complementa esa formación; no la reemplaza.",
            ],
          },
          {
            destacado: "No eres policía. Puedes prevenir, controlar, registrar en tu área y aprehender en flagrancia para entregar de inmediato. No puedes interrogar, retener por tu cuenta ni tocar evidencias.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "Ley Orgánica de Vigilancia y Seguridad Privada (texto vigente)", url: "https://www.ministeriodelinterior.gob.ec/wp-content/uploads/downloads/2025/08/LOVSP.pdf", fuente: "Ministerio del Interior", nota: "Lee al menos los Art. 47, 48, 60 y 62." },
          { tipo: "web", titulo: "Ficha de la LOVSP en la Guía Oficial de Trámites", url: "https://www.gob.ec/regulaciones/ley-organica-vigilancia-seguridad-privada", fuente: "gob.ec" },
          yt("Tao_klx_IFI", "Capacitación al personal de vigilancia y seguridad privada", "Ministerio del Interior (YouTube)"),
        ],
      },
      {
        id: "flagrancia-y-fuerza",
        titulo: "Flagrancia, legítima defensa y uso de la fuerza",
        minutos: 20,
        objetivo: "Saber exactamente cuándo puedes aprehender, cuándo puedes defenderte y cuánta fuerza es legal.",
        secciones: [
          {
            titulo: "Aprehensión en flagrancia (COIP Art. 526 y 527)",
            parrafos: [
              "Cualquier persona —y por tanto cualquier agente— puede aprehender a quien sea sorprendido en delito flagrante y entregarlo de inmediato a la Policía Nacional. Hay flagrancia cuando el delito se comete en presencia de una o más personas, cuando se descubre inmediatamente después, o cuando hay persecución ininterrumpida desde el hecho hasta la aprehensión.",
              "La palabra clave es «de inmediato». Aprehender no es detener: no puedes retenerlo para «investigar», ni interrogarlo (LOVSP Art. 48), ni esperar a que llegue el cliente. Se llama al 911, se lo entrega a la Policía y se registra todo.",
            ],
          },
          {
            titulo: "Legítima defensa (COIP Art. 33)",
            parrafos: [
              "Actúas en legítima defensa cuando defiendes un derecho propio o ajeno y se cumplen las tres condiciones a la vez: agresión actual e ilegítima; necesidad racional de la defensa empleada; y falta de provocación suficiente de tu parte. Si falta una, deja de ser legítima defensa.",
            ],
          },
          {
            titulo: "Uso progresivo de la fuerza",
            lista: [
              "Presencia: el uniforme y la postura ya disuaden. La mayoría de los incidentes terminan aquí.",
              "Verbalización: órdenes claras, firmes y cortas. «Deténgase. Retírese del área.»",
              "Control físico: solo si hay resistencia y solo la fuerza necesaria para controlar, nunca para castigar.",
              "Medios y armas: exclusivamente el personal autorizado, con el equipo autorizado, en el puesto autorizado (LOVSP Art. 48 numeral 2). Y solo ante una amenaza que lo justifique.",
              "En cada escalón: si la amenaza baja, tú bajas. La fuerza es proporcional a la amenaza actual, no a lo que pasó hace un minuto.",
            ],
          },
          {
            destacado: "Ante un robo o asalto con arma, el protocolo de SOTERSA es claro: no opongas resistencia. La vida vale más que cualquier bien. Observa, memoriza y reporta.",
            enSotersa: "Protocolo 03 «Robo o asalto» en Mi puesto → Emergencia. Cualquier aprehensión se reporta en la app como emergencia, con hora exacta, y se preserva la escena.",
          },
        ],
        recursos: [
          yt("aef4zWEvyEU", "Uso progresivo de la fuerza para guardias de seguridad privada", "ESLASEG (YouTube)"),
          yt("vhlgWX7-Jsk", "Uso racional de la fuerza en la seguridad privada", "Security Advisors (YouTube)"),
          { tipo: "web", titulo: "¿En qué casos se configura la legítima defensa?", url: "https://www.defensoria.gob.ec/?epkb_post_type_1=en-que-casos-procede-el-ejercicio-privado-de-la-accion", fuente: "Defensoría Pública del Ecuador" },
          { tipo: "documento", titulo: "Código Orgánico Integral Penal (COIP)", url: "https://www.defensa.gob.ec/wp-content/uploads/downloads/2021/03/COIP_act_feb-2021.pdf", fuente: "Ministerio de Defensa", nota: "Art. 33 (legítima defensa), Art. 526 y 527 (flagrancia)." },
        ],
      },
      {
        id: "control-de-accesos",
        titulo: "Control de accesos y registro",
        minutos: 15,
        objetivo: "Ejecutar un control de acceso completo: personas, vehículos y paquetes, con registro.",
        secciones: [
          {
            titulo: "Personas",
            lista: [
              "Identifica: documento con foto. Compara la foto con la persona, no solo leas el nombre.",
              "Verifica el motivo y el destino: ¿a quién visita? ¿está autorizado? Confirma con el residente o el departamento.",
              "Registra: nombre, documento, hora de entrada, destino, y luego la hora de salida.",
              "Entrega la credencial de visitante si el puesto la usa, y recupérala a la salida.",
            ],
          },
          {
            titulo: "Vehículos",
            lista: [
              "Placa, tipo, color y conductor. Revisa que el vehículo corresponda a quien dice ser.",
              "Inspección visual del interior y del baúl solo dentro de las instalaciones y con consentimiento; nunca fuera del predio (LOVSP Art. 48 numeral 1).",
              "Vehículo o paquete sospechoso: no lo manipules, aísla el área y reporta (Protocolo 04).",
            ],
          },
          {
            titulo: "Paquetería y proveedores",
            lista: [
              "Paquete cerrado: destinatario, remitente y hora. No lo abras; quien lo recibe firma.",
              "Proveedores: orden de trabajo o autorización previa. Sin autorización, no ingresan herramientas ni materiales.",
              "Salida de bienes: solo con autorización escrita del cliente. Anota qué sale, quién lo saca y quién autorizó.",
            ],
          },
          {
            destacado: "Lo que no está registrado no ocurrió. Si mañana falta algo, la bitácora es la única prueba de que hiciste tu trabajo.",
            enSotersa: "En la app, cada ingreso irregular, salida de bienes o negativa de acceso se reporta como novedad. Con foto si aplica: la evidencia queda en un almacenamiento privado, visible solo para SOTERSA.",
          },
        ],
        recursos: [],
      },
      {
        id: "rondas-y-bitacora",
        titulo: "Rondas, puntos de control y bitácora",
        minutos: 12,
        objetivo: "Hacer rondas que sirvan: con recorrido, observación y registro verificable.",
        secciones: [
          {
            parrafos: [
              "Una ronda no es caminar: es comprobar. Puertas, cerraduras, luces, cámaras, cercos, áreas oscuras, vehículos estacionados, personas en lugares donde no deberían estar. Y hacerlo en horarios que no sean predecibles: la ronda de «siempre a las 2:00» se la aprende cualquiera.",
            ],
          },
          {
            titulo: "Qué revisar en cada punto",
            lista: [
              "Accesos: puertas y ventanas cerradas y sin señales de forzamiento.",
              "Iluminación y cámaras: funcionando; lo que no funcione se reporta esa misma noche.",
              "Perímetro: cercos, muros, zonas de sombra.",
              "Instalaciones: fugas de agua, olor a gas, cables sueltos, equipos encendidos sin razón.",
              "Personas y vehículos: quién está, dónde y por qué.",
            ],
          },
          {
            titulo: "La bitácora",
            lista: [
              "Hora exacta, qué se observó, qué se hizo, a quién se avisó.",
              "Hechos, no opiniones: «puerta de bodega abierta, sin daños, cerrada a las 02:14» en lugar de «todo raro».",
              "Nunca se borra ni se corrige después. Si te equivocaste, agregas una nota nueva.",
            ],
          },
          {
            destacado: "Variar el horario de la ronda es seguridad. Registrarla es tu respaldo.",
            enSotersa: "Las rondas se marcan escaneando el código QR de cada punto con la app, que guarda hora y ubicación. Las novedades quedan con hora de captura inmutable: nadie puede editarlas después, ni siquiera el administrador.",
          },
        ],
        recursos: [],
      },
      {
        id: "emergencias",
        titulo: "Emergencias: 911, incendio, sismo, robo y emergencia médica",
        minutos: 20,
        objetivo: "Reaccionar bien en los primeros dos minutos de cualquier emergencia.",
        secciones: [
          {
            titulo: "La llamada al 9-1-1",
            parrafos: [
              "El ECU 911 atiende llamadas gratuitas, 24 horas, desde cualquier teléfono. Lo que necesita, en orden: qué pasa (descripción clara), dónde (ciudad, calle, referencia) y quién llama. Cuanto más precisa la ubicación, más rápida la respuesta.",
            ],
            lista: [
              "Dirección exacta y una referencia visible.",
              "Tipo de emergencia y número de personas afectadas.",
              "Tu nombre y que eres el agente de seguridad del lugar.",
              "No cuelgues hasta que el operador te lo indique.",
            ],
          },
          {
            titulo: "Los cuatro protocolos de SOTERSA",
            lista: [
              "Sismo: agáchate, cúbrete, sujétate. No corras mientras tiembla. Evacúa al punto de encuentro cuando termine.",
              "Incendio: alarma y 911 primero. Extintor solo si el fuego recién empieza y tienes la salida libre. Cierra puertas al salir; sin ascensores.",
              "Robo o asalto: no opongas resistencia. Manos visibles. Observa y memoriza. Al retirarse: 911, central y no persigas. No toques nada.",
              "Emergencia médica: 911, no muevas al herido salvo riesgo mayor. Si sabes RCP y no respira, empieza.",
            ],
          },
          {
            titulo: "Primeros auxilios: lo mínimo",
            lista: [
              "Antes de ayudar, asegura la escena: no te conviertas en la segunda víctima.",
              "Hemorragia: presión directa con un paño limpio, sin soltar.",
              "Persona inconsciente que respira: de lado (posición lateral de seguridad).",
              "No respira: RCP (compresiones fuertes y rápidas en el centro del pecho) hasta que llegue ayuda.",
              "Quemadura: agua a temperatura ambiente varios minutos; nada de cremas ni hielo.",
            ],
          },
          {
            destacado: "Primero la vida, luego los bienes. Toda emergencia se reporta a la central y se registra.",
            enSotersa: "Mi puesto → Emergencia tiene los protocolos completos y el botón del 911; funciona aunque no haya conexión. Los contactos del puesto están ahí con botón de llamada.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "¿Cuándo llamar al 9-1-1?", url: "https://www.ecu911.gob.ec/como-reportar-al-9-1-1/", fuente: "ECU 911" },
          { tipo: "web", titulo: "Reportar de forma adecuada una emergencia disminuye tiempos de respuesta", url: "https://www.ecu911.gob.ec/reportar-de-forma-adecuada-una-emergencia-disminuye-tiempos-de-respuesta/", fuente: "ECU 911" },
          yt("znC98zEQUzY", "Usa la app del ECU 911 para reportar una emergencia", "Teleamazonas (YouTube, 1 min)"),
          yt("8E_tHsTNK6g", "RCP – Reanimación cardiopulmonar | Primeros auxilios básicos", "Cruz Roja Euskadi (YouTube)"),
          yt("FEayzgNGGBQ", "Primeros auxilios: RCP en adultos", "Cruz Roja Euskadi (YouTube)"),
          { tipo: "web", titulo: "Canal oficial de Cruz Roja Ecuatoriana", url: "https://www.youtube.com/@Cruzrojaec", fuente: "Cruz Roja Ecuatoriana", nota: "Cursos presenciales y en línea de primeros auxilios certificados en Ecuador." },
        ],
      },
      {
        id: "armas",
        titulo: "Puestos armados: reglas de seguridad con el arma",
        minutos: 10,
        objetivo: "Cumplir las reglas universales de seguridad con armas y las obligaciones legales del Nivel II.",
        secciones: [
          {
            parrafos: [
              "Solo puede prestar servicio con arma quien aprobó el Nivel II y su reentrenamiento cada dos años (LOVSP Art. 51 y 52). El arma es de la compañía, está registrada, y se usa únicamente en el puesto y horario autorizados (Art. 48 numeral 2). Sacarla del puesto, prestarla o guardarla en casa es una infracción grave.",
            ],
          },
          {
            titulo: "Las cuatro reglas, siempre",
            lista: [
              "Trata toda arma como si estuviera cargada.",
              "Nunca apuntes a nada que no estés dispuesto a destruir.",
              "Dedo fuera del disparador hasta que hayas decidido disparar.",
              "Identifica tu objetivo y lo que hay detrás.",
            ],
          },
          {
            titulo: "En el relevo",
            lista: [
              "Entrega y recepción del arma con verificación de estado y munición, frente al otro agente.",
              "Cualquier anomalía (golpe, óxido, munición faltante) se reporta antes de firmar.",
            ],
          },
          {
            destacado: "El arma disuade por su presencia. Si llegaste a usarla, algo antes falló: revisa qué.",
            enSotersa: "El cierre de turno en la app incluye la firma de entrega y recepción del puesto. En puestos armados, esa firma respalda que el arma cambió de manos en orden.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m2p1", texto: "Sorprendes a alguien saliendo con un equipo del cliente escondido en la mochila. Según el COIP y la LOVSP, tú puedes:", opciones: ["Retenerlo en la garita y hacerle preguntas hasta que confiese.", "Aprehenderlo y entregarlo de inmediato a la Policía Nacional, sin interrogarlo.", "Revisarle la mochila en la vereda, fuera del predio.", "Dejarlo ir y anotar la placa."], correcta: 1, explicacion: "COIP Art. 526: cualquier persona puede aprehender en flagrancia y entregar de inmediato a la Policía. LOVSP Art. 48 prohíbe interrogar y registrar fuera de las instalaciones." },
        { id: "m2p2", texto: "¿Cuál de estas es una prohibición expresa al personal de seguridad privada (LOVSP Art. 48)?", opciones: ["Usar uniforme.", "Manipular las evidencias encontradas.", "Colaborar con la Policía.", "Registrar novedades en la bitácora."], correcta: 1, explicacion: "Manipular evidencias y alterar la escena están prohibidos. Se preserva y se entrega a la Policía." },
        { id: "m2p3", texto: "La legítima defensa (COIP Art. 33) requiere:", opciones: ["Solo que te hayan insultado.", "Agresión actual e ilegítima, necesidad racional de la defensa y falta de provocación suficiente.", "Que el agresor sea desconocido.", "Que haya un arma de por medio."], correcta: 1, explicacion: "Las tres condiciones a la vez. Si falta una, no es legítima defensa." },
        { id: "m2p4", texto: "Durante un asalto con arma de fuego en tu puesto, el protocolo de SOTERSA indica:", opciones: ["Enfrentar al asaltante para proteger los bienes.", "No oponer resistencia, manos visibles, observar y memorizar, reportar al retirarse.", "Perseguirlo apenas salga.", "Recoger lo que dejó para guardarlo."], correcta: 1, explicacion: "La vida vale más que cualquier bien. Observa, memoriza, llama al 911 y a la central, preserva la escena." },
        { id: "m2p5", texto: "Al llamar al 9-1-1 lo primero que debes dar es:", opciones: ["Tu número de cédula.", "Una descripción clara de qué pasa y la ubicación exacta con referencia.", "El nombre del cliente.", "La hora en que empezó tu turno."], correcta: 1, explicacion: "Qué pasa, dónde (ciudad, calle, referencia) y quién llama. La ubicación precisa acorta la respuesta." },
        { id: "m2p6", texto: "Una ronda bien hecha se caracteriza por:", opciones: ["Hacerse siempre a la misma hora para no olvidarla.", "Recorrer rápido sin detenerse.", "Comprobar accesos, luces, perímetro e instalaciones, en horarios variables, y registrarla.", "Hacerla solo cuando el cliente lo pide."], correcta: 2, explicacion: "Una ronda es comprobación con registro. El horario variable evita que sea predecible." },
        { id: "m2p7", texto: "Encuentras un paquete abandonado junto a la puerta del cliente. Lo correcto es:", opciones: ["Abrirlo para ver qué es.", "Moverlo a la garita.", "No manipularlo, aislar el área y reportar.", "Tirarlo a la basura."], correcta: 2, explicacion: "Protocolo 04: objeto sospechoso no se manipula; se aísla y se reporta." },
        { id: "m2p8", texto: "El reentrenamiento del personal de seguridad privada es obligatorio:", opciones: ["Cada cinco años.", "Cada dos años (LOVSP Art. 52).", "Solo si cambias de empresa.", "Nunca, con el Nivel I basta."], correcta: 1, explicacion: "LOVSP Art. 52: reentrenamiento cada dos años, tanto para Nivel I como para Nivel II." },
      ],
    },
  },

  // ==========================================================================
  // MODULO 3 · SEGURIDAD CIUDADANA
  // ==========================================================================
  {
    id: "seguridad-ciudadana",
    codigo: "M3",
    titulo: "Seguridad ciudadana y convivencia",
    resumen: "El agente privado es parte del sistema de seguridad del país: coordina con la Policía, previene con observación y trata a todas las personas con los mismos derechos.",
    paraQuien: "Obligatorio para todo agente. Útil también para clientes que quieran entender el rol del servicio.",
    color: "ambar",
    lecciones: [
      {
        id: "rol-en-el-sistema",
        titulo: "Tu lugar en el sistema de seguridad del Ecuador",
        minutos: 12,
        objetivo: "Entender cómo se articula la seguridad privada con la Policía Nacional, el ECU 911 y el ente rector.",
        secciones: [
          {
            parrafos: [
              "La LOVSP crea el Sistema de Vigilancia y Seguridad Privada bajo la rectoría del Ministerio del Interior (ente rector de seguridad ciudadana, protección interna y orden público), y lo declara complementario a la seguridad pública (Art. 6 a 9). En la práctica: la Policía Nacional tiene el monopolio de la investigación y la detención; el agente privado previene, controla su área, observa, reporta y colabora.",
              "Esa colaboración es un deber legal (Art. 47 numeral 4), y funciona en dos direcciones: el agente aporta ojos en el territorio; la Policía aporta la respuesta. El ECU 911 es el puente entre ambos.",
            ],
          },
          {
            titulo: "Qué hace cada quien",
            lista: [
              "Agente privado: previene, controla acceso, hace rondas, registra, aprehende en flagrancia y entrega, reporta.",
              "Policía Nacional: investiga, detiene, procesa, atiende el delito en la vía pública.",
              "ECU 911: recibe la alerta, la clasifica y despacha Policía, bomberos o ambulancia.",
              "Policía Comunitaria (UPC): enlace de barrio; programas como Barrio Seguro, Local Seguro y alarmas comunitarias.",
            ],
          },
          {
            destacado: "En la vía pública no eres autoridad. Tu ámbito es el predio del cliente. Fuera de él, eres un ciudadano que reporta.",
            enSotersa: "SOTERSA es empresa certificada BASC: la trazabilidad de rondas, novedades y accesos que registras en la app es parte de ese estándar de control.",
          },
        ],
        recursos: [
          { tipo: "web", titulo: "Policía Comunitaria y cultura de seguridad ciudadana", url: "https://www.ministeriodegobierno.gob.ec/policia-comunitaria-fomenta-la-construccion-de-una-cultura-de-seguridad-ciudadana/", fuente: "Ministerio de Gobierno" },
          { tipo: "web", titulo: "Servicio Integrado de Seguridad ECU 911", url: "https://www.ecu911.gob.ec/servicio-integrado-de-seguridad-ecu-911/", fuente: "ECU 911" },
        ],
      },
      {
        id: "prevencion-y-observacion",
        titulo: "Prevención situacional: observar, describir y reportar",
        minutos: 15,
        objetivo: "Detectar conductas y condiciones de riesgo antes del hecho, y describirlas de forma útil para la Policía.",
        secciones: [
          {
            parrafos: [
              "El delito necesita tres cosas: alguien dispuesto, un objetivo atractivo y la ausencia de un vigilante capaz. Tú eres el tercero. La prevención situacional consiste en quitar oportunidades: iluminación, control de accesos, visibilidad, presencia y rondas impredecibles.",
            ],
          },
          {
            titulo: "Conductas que merecen atención (no acusación)",
            lista: [
              "Personas que observan el predio repetidamente sin motivo aparente, toman fotos de accesos o cámaras, o preguntan por horarios y rutinas.",
              "Vehículos que pasan varias veces despacio, estacionan con ocupantes esperando, o tienen placas cubiertas.",
              "Intentos de ingresar «por equivocación», probar puertas o seguir a un residente para entrar detrás.",
              "Lo que corresponde: observar, describir, reportar a la central y, si hay riesgo inminente, al 911. No confrontar en la vía pública.",
            ],
          },
          {
            titulo: "Cómo describir a una persona o vehículo",
            lista: [
              "Persona: sexo, edad aproximada, estatura, contextura, color de piel, cabello, vestimenta de arriba a abajo, señas particulares, hacia dónde fue.",
              "Vehículo: tipo, marca, color, placa (aunque sea parcial), daños o adhesivos, número de ocupantes, dirección.",
              "Hora exacta y lugar. Sin adjetivos: «sospechoso» no describe nada; «hombre de unos 30 años, gorra roja, chompa negra, esperó 20 minutos frente al acceso vehicular» sí.",
            ],
          },
          {
            destacado: "Observar no es discriminar. Se reporta lo que alguien hace, nunca cómo se ve o de dónde viene.",
            enSotersa: "Estas observaciones se reportan como novedad informativa en la app, con foto si es seguro tomarla. El supervisor decide si escala. Con el tiempo, ese registro muestra patrones que una sola noche no deja ver.",
          },
        ],
        recursos: [],
      },
      {
        id: "derechos-y-trato",
        titulo: "Derechos humanos, no discriminación y trato a grupos de atención prioritaria",
        minutos: 12,
        objetivo: "Aplicar el principio de respeto a la dignidad humana y sin discriminación que exige la ley.",
        secciones: [
          {
            parrafos: [
              "La LOVSP obliga a cumplir los deberes «bajo el principio de precaución, legítima defensa, respeto a la dignidad humana y sin discriminación de ninguna naturaleza» (Art. 47 numeral 12), y la Constitución garantiza igualdad de derechos y atención prioritaria a ciertos grupos. Para un agente esto se traduce en decisiones concretas en la puerta.",
            ],
          },
          {
            titulo: "En la práctica",
            lista: [
              "El control es el mismo para todos: no se relaja por apariencia ni se endurece por origen, acento, vestimenta o color de piel.",
              "Personas con discapacidad, adultos mayores, mujeres embarazadas, niños: prioridad en la atención, ayuda para el acceso, paciencia con los tiempos.",
              "Trabajadoras y trabajadores del cliente (limpieza, mantenimiento, delivery): el mismo respeto que a un gerente. Son parte del servicio.",
              "Nunca comentarios ni bromas sobre cuerpo, género, orientación, nacionalidad o religión. Ni entre agentes en la garita: el público escucha.",
              "Violencia contra una mujer o menor dentro del predio: es emergencia. 911, central, y no dejes sola a la persona afectada si es seguro acompañarla.",
            ],
          },
          {
            destacado: "Tratar bien a todos no es una cortesía: es una obligación legal y la razón por la que el cliente confía en SOTERSA.",
          },
        ],
        recursos: [
          { tipo: "documento", titulo: "LOVSP Art. 47 numeral 12 y Art. 63 numeral 3 (inhabilidad por violencia contra la mujer o el núcleo familiar)", url: "https://www.ministeriodelinterior.gob.ec/wp-content/uploads/downloads/2025/08/LOVSP.pdf", fuente: "Ministerio del Interior" },
        ],
      },
      {
        id: "coordinacion-policia",
        titulo: "Coordinación con la Policía y preservación de la escena",
        minutos: 10,
        objetivo: "Entregar a la Policía lo que necesita: personas, escena y datos, sin contaminar nada.",
        secciones: [
          {
            titulo: "Cuando llega la Policía",
            lista: [
              "Identifícate: nombre, empresa, credencial. Tú eres el testigo principal.",
              "Entrega a la persona aprehendida y relata los hechos en orden: hora, qué viste, qué hiciste.",
              "No opines sobre culpabilidad. Describe.",
              "Facilita las grabaciones y el registro de bitácora que te pidan, con conocimiento del cliente.",
            ],
          },
          {
            titulo: "Preservar la escena",
            lista: [
              "No toques, no muevas, no limpies. Ni siquiera «para ordenar».",
              "Delimita el área y evita que entren curiosos, incluido el personal del cliente.",
              "Anota quién entró y salió del área desde el hecho hasta la llegada de la Policía.",
              "Si tomaste fotos antes de que llegaran, son evidencia: guárdalas, no las compartas por WhatsApp.",
            ],
          },
          {
            destacado: "Alterar la escena o manipular evidencias es una prohibición legal (LOVSP Art. 48). Y arruina el caso que tú mismo iniciaste.",
            enSotersa: "Las fotos de una novedad en la app quedan con hora de captura y ubicación, en almacenamiento privado. Es la cadena de custodia digital que la Policía y el cliente pueden verificar.",
          },
        ],
        recursos: [],
      },
    ],
    evaluacion: {
      minimoAprobar: 70,
      preguntas: [
        { id: "m3p1", texto: "Ves a un hombre en la vereda, fuera del predio, tomando fotos del acceso vehicular durante varios minutos. Lo correcto es:", opciones: ["Salir a confrontarlo y pedirle el celular.", "Observar, describirlo con detalle, reportar a la central y, si hay riesgo, al 911.", "Ignorarlo: está en la vía pública.", "Tomarle una foto y publicarla en el grupo del barrio."], correcta: 1, explicacion: "Fuera del predio no eres autoridad. Observar, describir y reportar es tu función; confrontar no." },
        { id: "m3p2", texto: "¿Cuál descripción es útil para la Policía?", opciones: ["«Un tipo sospechoso.»", "«Alguien raro con mala pinta.»", "«Hombre de unos 30 años, gorra roja, chompa negra, esperó 20 minutos frente al acceso vehicular, se fue hacia el norte a las 22:40.»", "«Un extranjero.»"], correcta: 2, explicacion: "Se describe lo que la persona hace y cómo viste, con hora y dirección. Nunca su origen ni juicios de valor." },
        { id: "m3p3", texto: "Un residente te pide que dejes pasar sin registro a su visita «porque es de confianza» y que en cambio revises más a los repartidores. Tú:", opciones: ["Haces lo que pide: el residente manda.", "Aplicas el mismo control a todos y explicas que es el procedimiento y la ley.", "Revisas solo a los repartidores.", "Dejas pasar a todos sin registro para no discutir."], correcta: 1, explicacion: "LOVSP Art. 47 numeral 12: sin discriminación de ninguna naturaleza. El control es igual para todos." },
        { id: "m3p4", texto: "Tras un robo en el predio, antes de que llegue la Policía debes:", opciones: ["Ordenar el área para que se vea presentable.", "Recoger las evidencias y guardarlas en la garita.", "Delimitar el área, no tocar nada y anotar quién entra y sale.", "Compartir las fotos en el grupo de WhatsApp del edificio."], correcta: 2, explicacion: "Preservar la escena es obligación legal (LOVSP Art. 48). Las evidencias no se manipulan ni se difunden." },
        { id: "m3p5", texto: "La relación entre seguridad privada y Policía Nacional, según la LOVSP, es:", opciones: ["De competencia: cada uno por su lado.", "Complementaria: el agente previene y colabora; la Policía investiga y detiene.", "De subordinación total: el agente hace lo que cualquier policía le ordene.", "Inexistente."], correcta: 1, explicacion: "El sistema es complementario a la seguridad pública (LOVSP Art. 6-9) y colaborar con las entidades del Estado es un deber (Art. 47 numeral 4)." },
      ],
    },
  },
];
