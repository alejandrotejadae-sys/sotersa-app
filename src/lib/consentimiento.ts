import "server-only";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * Consentimiento para el tratamiento de datos personales (LOPDP, Ecuador).
 *
 * SOTERSA eligió el CONSENTIMIENTO como base legal. Eso obliga a pedirlo antes
 * de tratar los datos, poder demostrar quién lo dio y sobre qué texto, y
 * permitir retirarlo.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ESTE TEXTO NO ES ASESORÍA LEGAL Y ESTÁ PENDIENTE DE REVISIÓN.
 *
 * Lo redacté a partir de lo que la aplicación hace de verdad —revisando el
 * esquema y el código, no una plantilla—, para que el abogado no tenga que
 * adivinar qué se recoge. Lo que falta y solo puede decidir un abogado:
 *   - Plazos de conservación de cada dato (hoy dice "mientras dure la
 *     relación laboral", que es una respuesta provisional).
 *   - Redacción definitiva y datos del responsable del tratamiento.
 *
 * Al cambiar el texto hay que subir AVISO_VERSION. Los que ya aceptaron
 * volverán a ver la pantalla, que es justamente lo correcto: aceptaron otro
 * texto, no este.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const AVISO_VERSION = "2026-08-30-borrador";

export const AVISO_TITULO =
  "Tratamiento de tus datos personales";

export const AVISO_PUNTOS: { titulo: string; detalle: string }[] = [
  {
    titulo: "Qué datos tuyos guarda la app",
    detalle:
      "Tu nombre, cédula, teléfono y credencial. La cédula además es tu usuario para entrar.",
  },
  {
    titulo: "Tu ubicación, solo cuando tú reportas",
    detalle:
      "La app toma tu ubicación en el momento en que envías una novedad o marcas un punto de ronda. No te rastrea de forma continua ni sabe dónde estás el resto del turno.",
  },
  {
    titulo: "Fotografías",
    detalle:
      "Las fotos que adjuntas a una novedad y, si la subes, tu foto de perfil. Se guardan en un almacenamiento privado: no son accesibles con un enlace público.",
  },
  {
    titulo: "Tu jornada",
    detalle:
      "La hora en que abres y cierras el turno, el estado del equipo que reportas y tu firma de entrega y recepción del puesto.",
  },
  {
    titulo: "Para qué se usa",
    detalle:
      "Para operar el servicio de seguridad: control de turnos, rondas, bitácora de novedades y los informes que SOTERSA entrega a sus clientes. No se usa para otra cosa ni se vende a nadie.",
  },
  {
    titulo: "Quién lo ve",
    detalle:
      "Tu supervisor de zona y la central operativa de SOTERSA. El cliente ve solo las novedades de su propio puesto que supervisión haya autorizado, nunca tus datos personales.",
  },
  {
    titulo: "Dónde se guarda",
    detalle:
      "En servidores de Supabase y Vercel ubicados en Estados Unidos. Esto es una transferencia internacional de datos y por eso se te informa.",
  },
  {
    titulo: "Por cuánto tiempo",
    detalle:
      "Mientras dure tu relación laboral con SOTERSA y el tiempo que exija la ley para respaldar el servicio prestado. (Plazo exacto pendiente de definir.)",
  },
  {
    titulo: "Tus derechos",
    detalle:
      "Puedes pedir acceso a tus datos, que se corrijan, o retirar este consentimiento en cualquier momento, desde tu perfil o pidiéndolo a operaciones.",
  },
  {
    titulo: "Si retiras el consentimiento",
    detalle:
      "No podrás seguir usando la app, porque sin estos datos no hay forma de registrar tu turno ni tus novedades. Habla con operaciones antes de hacerlo.",
  },
];

/** Lo que se guarda como prueba de qué texto se aceptó. */
export function resumenAviso(): string {
  return AVISO_PUNTOS.map((p) => `${p.titulo}: ${p.detalle}`).join("\n");
}

/**
 * Roles a los que se les pide consentimiento.
 *
 * Por ahora solo el agente de seguridad: es de quien se procesa ubicación,
 * fotografías y firma. Supervisor, central y cliente necesitan su propio
 * aviso, con otro contenido, y se agregarán cuando el abogado lo revise.
 */
export const ROLES_CON_CONSENTIMIENTO = new Set(["guardia"]);

/** ¿Este usuario ya aceptó la versión vigente y no la ha retirado? */
export async function tieneConsentimientoVigente(
  perfilId: string,
): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("consentimientos")
    .select("id, retirado_en")
    .eq("perfil_id", perfilId)
    .eq("version", AVISO_VERSION)
    .maybeSingle();

  return Boolean(data && !data.retirado_en);
}
