import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Marca } from "@/app/componentes/marca";
import { EstadoConexion } from "@/app/componentes/estado-conexion";
import { CronometroTurno } from "@/app/componentes/cronometro-turno";
import {
  IconoAlerta,
  IconoCiclo,
  IconoCamion,
  IconoEscudo,
  IconoEscudoOk,
  IconoFlecha,
  IconoHuella,
  IconoLibro,
  IconoLista,
  IconoPersona,
  IconoQR,
  IconoRonda,
  IconoTelefono,
  IconoTurno,
} from "@/app/componentes/iconos";

export const metadata = { title: "Mi puesto — SOTERSA" };
export const dynamic = "force-dynamic";

function soloHora(iso: string) {
  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guayaquil",
  }).format(new Date(iso));
}

export default async function PaginaGuardia() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: perfilActual } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  const guardiaConsulta = supabase
    .from("guardias")
    .select("id, nombre, cedula");
  const { data: guardia } = perfilActual?.rol === "admin"
    ? await guardiaConsulta.eq("activo", true).order("nombre").limit(1).maybeSingle()
    : await guardiaConsulta.eq("perfil_id", user.id).maybeSingle();

  if (!guardia) {
    return (
      <>
        <Cabecera />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5">
          <div className="tarjeta filo-emergencia p-5">
            <h1 className="font-semibold text-white">
              Cuenta sin puesto asignado
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gris-400">
              Tu usuario existe pero no está vinculado a una ficha de agente de seguridad.
              Comunícate con operaciones.
            </p>
          </div>
        </main>
      </>
    );
  }

  const ahora = new Date().toISOString();
  const { data: turno } = await supabase
    .from("turnos")
    .select("id, inicio_programado, fin_programado, puesto_id")
    .eq("guardia_id", guardia.id)
    .lte("inicio_programado", ahora)
    .gte("fin_programado", ahora)
    .order("inicio_programado", { ascending: false })
    .limit(1)
    .maybeSingle();

  const primerNombre = guardia.nombre.split(" ")[0];

  if (!turno) {
    // Sin turno la pantalla se queda casi vacia. Se dice por que, y se deja a
    // mano lo unico que sigue importando: la emergencia.
    const { data: proximo } = await supabase
      .from("turnos")
      .select("inicio_programado, puesto_id")
      .eq("guardia_id", guardia.id)
      .gt("inicio_programado", ahora)
      .order("inicio_programado")
      .limit(1)
      .maybeSingle();

    return (
      <>
        <Cabecera />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-5">
          <Saludo nombre={primerNombre} />
          <section className="tarjeta flex flex-col items-center gap-3 px-5 py-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-borde bg-gris-800/60 text-gris-500">
              <IconoTurno className="h-8 w-8" />
            </span>
            <h2 className="text-lg font-semibold text-white">
              Sin turno activo
            </h2>
            <p className="max-w-[15rem] text-sm leading-relaxed text-gris-400">
              {proximo
                ? `Tu próximo turno empieza a las ${soloHora(proximo.inicio_programado)}.`
                : "No tienes un turno programado. Si crees que es un error, avisa a tu supervisor de zona."}
            </p>
          </section>
          <BotonSOS />
        </main>
      </>
    );
  }

  const [
    { data: puesto },
    { data: apertura },
    { data: puntos },
    { data: rondas },
    { data: contactos },
  ] = await Promise.all([
    supabase
      .from("puestos")
      .select("codigo, nombre, armado")
      .eq("id", turno.puesto_id)
      .single(),
    supabase
      .from("aperturas_turno")
      .select("hora_captura, checklist")
      .eq("turno_id", turno.id)
      .maybeSingle(),
    supabase
      .from("puntos_ronda")
      .select("id, codigo, nombre, orden")
      .eq("puesto_id", turno.puesto_id)
      .eq("activo", true)
      .order("orden"),
    supabase.from("rondas").select("punto_id").eq("turno_id", turno.id),
    supabase
      .from("contactos_puesto")
      .select("tipo, nombre, telefono")
      .eq("puesto_id", turno.puesto_id),
  ]);

  const hechos = new Set((rondas ?? []).map((r) => r.punto_id));
  const total = puntos?.length ?? 0;
  const completados = (puntos ?? []).filter((p) => hechos.has(p.id)).length;
  const siguiente = (puntos ?? []).find((p) => !hechos.has(p.id));
  const pct = total ? Math.round((completados / total) * 100) : 0;

  const contacto = (t: string) => (contactos ?? []).find((c) => c.tipo === t);
  const supervisor = contacto("supervisor_zona");
  const central = contacto("central_monitoreo");

  const faltantes = apertura
    ? Object.entries((apertura.checklist ?? {}) as Record<string, boolean>)
        .filter(([, ok]) => !ok)
        .map(([clave]) => clave)
    : [];

  return (
    <>
      <Cabecera />

      <main className="guardia-render mx-auto flex w-full max-w-md flex-1 flex-col gap-3.5 px-4 pb-5 pt-2">
        <Saludo nombre={primerNombre} />

        {/* ---------------- Turno ---------------- */}
        <section className="panel-operativo relative overflow-hidden p-4.5">
          <div className="flex items-start gap-4">
            <span className="relative grid h-[5.4rem] w-[5.4rem] shrink-0 place-items-center rounded-full border-2 border-azul-500 text-azul-400 shadow-[0_0_35px_rgba(27,156,216,0.12)]">
              <IconoTurno className="h-10 w-10" />
              <span
                aria-hidden
                className={`absolute bottom-1 right-1 h-3 w-3 rounded-full ring-4 ring-[#07182b] ${
                  apertura ? "bg-normal" : "bg-novedad"
                }`}
              />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-[1.65rem] font-bold leading-tight text-white">
                {apertura ? "Turno activo" : "Turno por abrir"}
              </h2>
              <p className="mt-1 truncate text-base text-gris-400">
                {puesto?.nombre}
              </p>
              <p className="mt-1.5 text-lg font-medium text-white">
                {soloHora(turno.inicio_programado)} –{" "}
                {soloHora(turno.fin_programado)}
              </p>
            </div>

            <div className="shrink-0 border-l border-borde/70 pl-3 text-right">
              <p className="text-xs leading-tight text-gris-400">
                {apertura ? "Tiempo transcurrido" : "Puesto"}
              </p>
              {apertura ? (
                <>
                  <p className="mt-2 font-mono text-[1.55rem] font-bold leading-none text-white">
                    <CronometroTurno desde={apertura.hora_captura} />
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-normal bg-normal/10 px-3 py-1.5 text-xs font-medium text-green-300">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-normal"
                    />
                    En puesto
                  </span>
                </>
              ) : (
                <p className="mt-1 font-mono text-2xl font-bold leading-none text-azul-300">
                  {puesto?.codigo}
                </p>
              )}
              {puesto?.armado && (
                <span className="mt-2 block rounded-full border border-novedad/50 bg-novedad/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                  Armado
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- Asistencia / QR ---------------- */}
        <div className="grid grid-cols-2 gap-3">
          {apertura ? (
            <div className="boton-primario flex min-h-[88px] items-center gap-3 rounded-2xl px-4 py-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white">
                <IconoHuella className="h-8 w-8" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold leading-tight text-white">
                  Asistencia
                  <br />
                  marcada
                </span>
                <span className="font-mono text-xs text-blue-100/80">
                  {soloHora(apertura.hora_captura)}
                </span>
              </span>
            </div>
          ) : (
            <Link
              href="/guardia/apertura"
              className="boton-primario flex min-h-[88px] items-center gap-3 rounded-2xl px-4 py-4 text-white transition active:scale-[0.99]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10">
                <IconoHuella className="h-8 w-8" />
              </span>
              <span className="text-lg font-bold leading-tight">
                Marcar
                <br />
                asistencia
              </span>
            </Link>
          )}

          <TilePendienteAncho
            icono={<IconoQR className="h-6 w-6" />}
            titulo={
              <>
                Escanear
                <br />
                QR
              </>
            }
          />
        </div>

        {faltantes.length > 0 && (
          <p className="rounded-xl border border-novedad/40 bg-novedad/10 px-4 py-3 text-sm text-amber-100">
            Reportado en falta al abrir:{" "}
            <strong className="font-semibold">{faltantes.join(", ")}</strong>
          </p>
        )}

        {/* ---------------- Ronda ---------------- */}
        <section className="tarjeta relative overflow-hidden p-4.5">
          <IconoEscudo
            aria-hidden
            className="pointer-events-none absolute -right-6 top-1/2 h-36 w-36 -translate-y-1/2 text-azul-500/[0.07]"
          />

          <div className="relative flex items-center gap-2.5">
            <IconoCiclo className="h-6 w-6 text-azul-400" />
            <h2 className="text-xl font-semibold text-white">Ronda activa</h2>
          </div>

          {total === 0 ? (
            <p className="relative mt-3 text-sm leading-relaxed text-gris-400">
              Este puesto todavía no tiene puntos de control cargados.
              Operaciones debe registrarlos y colocar los códigos QR en sitio.
            </p>
          ) : (
            <div className="relative">
              <p className="mt-2 text-xl font-semibold text-azul-400">
                Ronda exterior
              </p>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-gris-400">Progreso</span>
                <span className="text-sm text-gris-300">
                  <strong className="font-mono text-lg font-bold text-white">
                    {completados}
                  </strong>
                  /{total} puntos
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={completados}
                aria-valuemin={0}
                aria-valuemax={total}
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-gris-700/70"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-azul-600 to-azul-400"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gris-500">
                    {siguiente ? "Siguiente punto" : "Estado"}
                  </p>
                  {siguiente ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white">
                      <IconoRonda className="h-4 w-4 shrink-0 text-azul-400" />
                      <span className="truncate">{siguiente.nombre}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-green-300">
                      Ronda completa
                    </p>
                  )}
                </div>
                <Link href="/guardia/ronda" className="boton-primario shrink-0 rounded-xl border border-azul-400/60 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99]">
                  Continuar ronda
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ---------------- Mi puesto asignado ---------------- */}
        <section className="tarjeta overflow-hidden">
          <h2 className="flex items-center gap-2.5 px-5 pb-2 pt-4 text-xl font-semibold text-white">
            <IconoEscudoOk className="h-6 w-6 text-azul-400" />
            Mi puesto asignado
          </h2>

          <div className="grid grid-cols-2 divide-x divide-borde/50">
            <PersonaContacto
              rotulo="Supervisor"
              nombre={supervisor?.nombre}
              telefono={supervisor?.telefono}
              avatar
            />
            <PersonaContacto
              rotulo="Contacto de emergencia"
              nombre={central?.nombre}
              telefono={central?.telefono}
            />
          </div>

          <div className="flex gap-3 border-t border-borde/60 px-5 py-4">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-azul-500/12 text-azul-300">
              <IconoLista className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gris-500">Instrucción del día</p>
              <p className="mt-1 text-sm leading-relaxed text-gris-200">
                Verifica accesos, realiza tu ronda cada 60 minutos y reporta
                cualquier novedad.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- Acciones ---------------- */}
        {puesto?.armado && (
          <Link
            href="/guardia/custodia"
            className="panel-operativo flex min-h-[96px] items-center gap-4 p-4 transition active:scale-[0.99]"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-azul-400/60 bg-azul-500/10 text-azul-300">
              <IconoCamion className="h-8 w-8" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-azul-400">
                Servicio asignado
              </span>
              <span className="mt-1 block text-xl font-bold text-white">
                Custodia armada
              </span>
              <span className="mt-1 block text-sm text-gris-400">
                Ver operación, ruta y comunicación segura
              </span>
            </span>
            <IconoFlecha className="h-5 w-5 shrink-0 text-azul-300" />
          </Link>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Link href="/guardia/reportar?severidad=emergencia" className="tarjeta flex min-h-[104px] flex-col items-center justify-center gap-2 px-2 py-4 text-center transition active:scale-[0.99]">
            <IconoAlerta className="h-7 w-7 text-red-300" />
            <span className="text-xs font-medium leading-tight text-white">Reportar<br />incidente</span>
          </Link>
          <Link href="/guardia/reportar" className="tarjeta flex min-h-[104px] flex-col items-center justify-center gap-2 px-2 py-4 text-center transition active:scale-[0.99]">
            <IconoLista className="h-7 w-7 text-azul-300" />
            <span className="text-xs font-medium leading-tight text-white">Enviar<br />novedad</span>
          </Link>
          <Link
            href="/guardia/emergencia"
            className="tarjeta flex min-h-[104px] flex-col items-center justify-center gap-2 px-2 py-4 text-center transition active:scale-[0.99]"
          >
            <IconoLibro className="h-7 w-7 text-azul-300" />
            <span className="text-xs font-medium leading-tight text-white">
              Ver
              <br />
              protocolo
            </span>
          </Link>
        </div>

        <BotonSOS />
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Cabecera() {
  return (
    <header className="sticky top-0 z-10 border-b border-azul-900/60 bg-[#020b18]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-5 pb-3 pt-5">
        <Marca tamano="panel" />
        <EstadoConexion />
      </div>
    </header>
  );
}

function Saludo({ nombre }: { nombre: string }) {
  return (
    <header className="flex items-start gap-3 px-0.5 pb-1">
      <span className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-[0.9rem] border border-azul-500/80 bg-azul-500/5 text-azul-400">
        <IconoTurno className="h-6 w-6" />
      </span>
      <div>
        <p className="text-base font-semibold text-azul-400">Agente de seguridad</p>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-white">
          Hola, {nombre}
        </h1>
        <p className="mt-1 text-sm leading-snug text-gris-400">
          Buen día, mantente atento y reporta cualquier novedad.
        </p>
      </div>
    </header>
  );
}

function PersonaContacto({
  rotulo,
  nombre,
  telefono,
  avatar,
}: {
  rotulo: string;
  nombre?: string | null;
  telefono?: string | null;
  avatar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <p className="text-[0.7rem] uppercase tracking-wider text-gris-500">
        {rotulo}
      </p>
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-azul-700/50 bg-azul-500/10 text-azul-300">
          {avatar ? (
            <IconoPersona className="h-5 w-5" />
          ) : (
            <IconoTelefono className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">
            {nombre ?? "Por asignar"}
          </span>
          {telefono ? (
            <a
              href={`tel:${telefono.replace(/\s/g, "")}`}
              className="block truncate font-mono text-xs text-azul-400"
            >
              {telefono}
            </a>
          ) : (
            <span className="text-xs text-gris-600">sin número</span>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * SOS. Por ahora lleva a los protocolos y al 911, que es lo que de verdad
 * salva a alguien en el minuto uno. El aviso automatico a la central todavia
 * no existe: prometerlo con un boton que no envia nada seria peor que no
 * tenerlo.
 */
function BotonSOS() {
  return (
    <Link
      href="/guardia/emergencia"
      className="flex items-center gap-4 rounded-2xl border border-emergencia/60 bg-gradient-to-r from-emergencia/25 to-emergencia/10 px-4 py-4 transition active:scale-[0.99]"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emergencia text-base font-bold tracking-wider text-white shadow-lg shadow-emergencia/30">
        SOS
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-bold text-white">SOS · Activar alerta</span>
        <span className="block text-sm text-red-100/70">
          Usar solo en caso de emergencia
        </span>
      </span>
      <IconoFlecha className="h-5 w-5 shrink-0 text-red-300" />
    </Link>
  );
}

function TilePendienteAncho({
  icono,
  titulo,
}: {
  icono: React.ReactNode;
  titulo: React.ReactNode;
}) {
  return (
    <div className="tarjeta flex min-h-[88px] items-center gap-3 rounded-2xl px-4 py-4">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-azul-500/70 bg-azul-500/5 text-white">
        {icono}
      </span>
      <span className="text-lg font-bold leading-tight text-white">
        {titulo}
      </span>
    </div>
  );
}
