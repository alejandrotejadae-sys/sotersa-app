import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Marca, Pulso } from "@/app/componentes/marca";
import { EstadoConexion } from "@/app/componentes/estado-conexion";
import { CronometroTurno } from "@/app/componentes/cronometro-turno";
import { NORMAS_GARITA } from "@/lib/protocolos";
import {
  IconoAlerta,
  IconoCiclo,
  IconoEscudoOk,
  IconoFlecha,
  IconoLibro,
  IconoLista,
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
  if (!user) redirect("/ingreso");

  const { data: guardia } = await supabase
    .from("guardias")
    .select("id, nombre, cedula")
    .eq("perfil_id", user.id)
    .single();

  if (!guardia) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5">
        <div className="tarjeta filo-emergencia p-5">
          <h1 className="font-semibold text-white">Cuenta sin puesto asignado</h1>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">
            Tu usuario existe pero no está vinculado a una ficha de guardia.
            Comunícate con operaciones.
          </p>
        </div>
      </main>
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
    return (
      <>
        <Cabecera />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-5">
          <Saludo nombre={primerNombre} />
          <section className="tarjeta p-5">
            <h2 className="font-semibold text-white">Sin turno activo</h2>
            <p className="mt-2 text-sm leading-relaxed text-gris-400">
              No tienes un turno programado para este momento. Si crees que es
              un error, avisa a tu supervisor de zona.
            </p>
          </section>
          <BotonSOS />
        </main>
      </>
    );
  }

  const [{ data: puesto }, { data: apertura }, { data: puntos }, { data: rondas }, { data: contactos }] =
    await Promise.all([
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

  const contacto = (t: string) => (contactos ?? []).find((c) => c.tipo === t);
  const supervisor = contacto("supervisor_zona");
  const central = contacto("central_monitoreo");

  const faltantes = apertura
    ? Object.entries((apertura.checklist ?? {}) as Record<string, boolean>)
        .filter(([, ok]) => !ok)
        .map(([clave]) => clave)
    : [];

  // "Instrucción del día": el diseño la muestra como texto libre por puesto,
  // pero no existe ese campo todavía. En vez de inventarlo, se muestra la
  // norma de conducta del reglamento, que es la que rige todos los días.
  const conducta = NORMAS_GARITA.find((n) => n.codigo === "04");

  return (
    <>
      <Cabecera />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-5">
        <Saludo nombre={primerNombre} />

        {/* --- Turno activo --- */}
        <section className="panel-operativo overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-azul-600/50 text-azul-300">
              <IconoTurno className="h-7 w-7" />
              {apertura && (
                <span className="absolute -bottom-0.5 -right-0.5">
                  <Pulso />
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold leading-tight text-white">
                {apertura ? "Turno activo" : "Turno por abrir"}
              </h2>
              <p className="mt-0.5 truncate text-sm text-gris-300">
                {puesto?.nombre}
              </p>
              <p className="mt-1 font-mono text-sm text-gris-400">
                {soloHora(turno.inicio_programado)} –{" "}
                {soloHora(turno.fin_programado)}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[0.68rem] uppercase tracking-wider text-gris-500">
                {puesto?.codigo}
              </p>
              {apertura && (
                <>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    <CronometroTurno desde={apertura.hora_captura} />
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-normal/40 bg-normal/10 px-2.5 py-1 text-xs font-medium text-green-300">
                    En puesto
                  </span>
                </>
              )}
              {puesto?.armado && (
                <span className="mt-1 block rounded-full border border-novedad/40 bg-novedad/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                  Armado
                </span>
              )}
            </div>
          </div>
        </section>

        {/* --- Asistencia y QR --- */}
        <div className="grid grid-cols-2 gap-3">
          {apertura ? (
            <div className="tarjeta flex flex-col justify-center gap-1 px-4 py-4 opacity-80">
              <IconoEscudoOk className="h-6 w-6 text-normal" />
              <span className="text-sm font-semibold text-white">
                Asistencia marcada
              </span>
              <span className="font-mono text-xs text-gris-400">
                {soloHora(apertura.hora_captura)}
              </span>
            </div>
          ) : (
            <Link
              href="/guardia/apertura"
              className="boton-primario flex min-h-[92px] flex-col justify-center gap-1.5 rounded-2xl px-4 py-4 text-white transition active:scale-[0.99]"
            >
              <IconoLista className="h-6 w-6" />
              <span className="text-base font-semibold leading-tight">
                Marcar asistencia
              </span>
            </Link>
          )}

          <Pendiente
            icono={<IconoQR className="h-6 w-6" />}
            titulo="Escanear QR"
          />
        </div>

        {faltantes.length > 0 && (
          <p className="rounded-xl border border-novedad/40 bg-novedad/10 px-4 py-3 text-sm text-amber-100">
            Reportado en falta al abrir:{" "}
            <strong className="font-semibold">{faltantes.join(", ")}</strong>
          </p>
        )}

        {/* --- Ronda --- */}
        <section className="tarjeta p-5">
          <div className="flex items-center gap-2.5">
            <IconoCiclo className="h-5 w-5 text-azul-400" />
            <h2 className="font-semibold text-white">Ronda del turno</h2>
          </div>

          {total === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-gris-400">
              Este puesto todavía no tiene puntos de control cargados.
              Operaciones debe registrarlos y colocar los códigos QR en sitio.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-gris-400">Progreso</span>
                <span className="text-sm text-gris-200">
                  <strong className="font-mono text-base font-bold text-white">
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
                className="mt-2 h-2 overflow-hidden rounded-full bg-gris-700/60"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-azul-600 to-azul-400"
                  style={{ width: `${Math.round((completados / total) * 100)}%` }}
                />
              </div>

              {siguiente ? (
                <div className="mt-4 flex items-center gap-2.5 text-sm">
                  <IconoRonda className="h-5 w-5 shrink-0 text-azul-400" />
                  <span className="text-gris-400">Siguiente:</span>
                  <span className="truncate font-medium text-white">
                    {siguiente.nombre}
                  </span>
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium text-green-300">
                  Ronda completa.
                </p>
              )}
            </>
          )}
        </section>

        {/* --- Mi puesto asignado --- */}
        <section className="tarjeta overflow-hidden">
          <h2 className="border-b border-borde/60 px-5 py-3.5 font-semibold text-white">
            Mi puesto asignado
          </h2>

          <dl className="divide-y divide-borde/40">
            <Contacto
              rotulo="Supervisor de zona"
              nombre={supervisor?.nombre}
              telefono={supervisor?.telefono}
            />
            <Contacto
              rotulo="Central de monitoreo"
              nombre={central?.nombre}
              telefono={central?.telefono}
            />
          </dl>

          {conducta && (
            <div className="border-t border-borde/60 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-gris-500">
                Conducta en el puesto · reglamento
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {conducta.pasos.slice(0, 3).map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-gris-300">
                    <span aria-hidden className="text-azul-500">
                      •
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/guardia/emergencia"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-azul-400"
              >
                Ver protocolo completo
                <IconoFlecha className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* --- Acciones --- */}
        <div className="grid grid-cols-3 gap-3">
          <Pendiente
            icono={<IconoAlerta className="h-6 w-6" />}
            titulo="Reportar incidente"
          />
          <Pendiente
            icono={<IconoLista className="h-6 w-6" />}
            titulo="Enviar novedad"
          />
          <Link
            href="/guardia/emergencia"
            className="tarjeta flex min-h-[92px] flex-col items-center justify-center gap-2 px-2 py-4 text-center transition active:scale-[0.99]"
          >
            <IconoLibro className="h-6 w-6 text-azul-300" />
            <span className="text-xs font-medium leading-tight text-white">
              Ver protocolo
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
    <header className="sticky top-0 z-10 border-b border-azul-900/60 bg-[#020b18]/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3">
        <Marca />
        <EstadoConexion />
      </div>
    </header>
  );
}

function Saludo({ nombre }: { nombre: string }) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-azul-400">
        Guardia
      </p>
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-white">
        Hola, {nombre}
      </h1>
      <p className="mt-1 text-sm text-gris-400">
        Mantente atento y reporta cualquier novedad.
      </p>
    </header>
  );
}

function Contacto({
  rotulo,
  nombre,
  telefono,
}: {
  rotulo: string;
  nombre?: string | null;
  telefono?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wider text-gris-500">
          {rotulo}
        </dt>
        <dd className="truncate text-sm font-medium text-white">
          {nombre ?? "Por asignar"}
        </dd>
      </div>
      {telefono ? (
        <a
          href={`tel:${telefono.replace(/\s/g, "")}`}
          aria-label={`Llamar a ${nombre ?? rotulo}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-azul-700/60 bg-azul-500/10 text-azul-300 active:bg-azul-500/20"
        >
          <IconoTelefono className="h-5 w-5" />
        </a>
      ) : (
        <span className="text-xs text-gris-600">sin número</span>
      )}
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
      className="flex items-center gap-4 rounded-2xl border border-emergencia/60 bg-emergencia/15 px-4 py-4 transition active:scale-[0.99]"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emergencia font-bold tracking-wider text-white">
        SOS
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-white">
          Emergencia
        </span>
        <span className="block text-sm text-red-200/80">
          911, protocolos y contactos del puesto
        </span>
      </span>
      <IconoFlecha className="h-5 w-5 shrink-0 text-red-300" />
    </Link>
  );
}

/** Destino aun no construido: se ve, pero no engaña con un enlace muerto. */
function Pendiente({
  icono,
  titulo,
}: {
  icono: React.ReactNode;
  titulo: string;
}) {
  return (
    <div className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-borde px-2 py-4 text-center opacity-45">
      <span className="text-gris-400">{icono}</span>
      <span className="text-xs font-medium leading-tight text-gris-300">
        {titulo}
      </span>
      <span className="text-[0.6rem] uppercase tracking-wider text-gris-600">
        Pronto
      </span>
    </div>
  );
}
