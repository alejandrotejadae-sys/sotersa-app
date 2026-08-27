import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { BarraSuperior, Pulso } from "@/app/componentes/marca";
import {
  IconoAlerta,
  IconoFlecha,
  IconoLista,
  IconoRonda,
} from "@/app/componentes/iconos";

export const metadata = { title: "Mi puesto — SOTERSA" };

// Siempre datos frescos: un turno abierto hace un minuto no puede quedar
// escondido detras de una pagina cacheada.
export const dynamic = "force-dynamic";

/** Solo la hora, sin fecha: el guardia ya sabe en que dia esta parado. */
function soloHora(iso: string) {
  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
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
      <>
        <BarraSuperior />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5">
          <div className="tarjeta filo-emergencia p-5">
            <h1 className="font-semibold text-white">
              Cuenta sin puesto asignado
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gris-400">
              Su usuario existe pero no está vinculado a una ficha de guardia.
              Comuníquese con operaciones.
            </p>
          </div>
        </main>
      </>
    );
  }

  const ahora = new Date().toISOString();
  const { data: turno } = await supabase
    .from("turnos")
    .select("id, tipo, estado, inicio_programado, fin_programado, puesto_id")
    .eq("guardia_id", guardia.id)
    .lte("inicio_programado", ahora)
    .gte("fin_programado", ahora)
    .order("inicio_programado", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: puesto } = turno
    ? await supabase
        .from("puestos")
        .select("codigo, nombre, armado")
        .eq("id", turno.puesto_id)
        .single()
    : { data: null };

  const { data: apertura } = turno
    ? await supabase
        .from("aperturas_turno")
        .select("id, hora_captura, checklist")
        .eq("turno_id", turno.id)
        .maybeSingle()
    : { data: null };

  const primerNombre = guardia.nombre.split(" ")[0];

  // Equipos reportados en falta al abrir. Se muestran para que no se olviden
  // a mitad del turno.
  const faltantes = apertura
    ? Object.entries((apertura.checklist ?? {}) as Record<string, boolean>)
        .filter(([, ok]) => !ok)
        .map(([clave]) => clave)
    : [];

  return (
    <>
      <BarraSuperior
        derecha={
          <span className="text-xs text-gris-500">
            CI {guardia.cedula}
          </span>
        }
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6 pb-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-azul-400">Guardia · En línea</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Hola, {primerNombre}</h1>
          <p className="mt-1 text-sm text-gris-400">Mantente atento y reporta cualquier novedad.</p>
        </header>

        {!turno ? (
          <section className="tarjeta p-5">
            <h2 className="font-semibold text-white">Sin turno activo</h2>
            <p className="mt-2 text-sm leading-relaxed text-gris-400">
              No tiene un turno programado para este momento. Si cree que es un
              error, avise a su supervisor de zona.
            </p>
          </section>
        ) : (
          <>
            <section className="panel-operativo filo-azul overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="font-mono text-xs tracking-widest text-azul-400">
                    {puesto?.codigo}
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold leading-snug text-white">
                    {puesto?.nombre}
                  </h2>
                  <p className="mt-3 font-mono text-sm text-gris-300">
                    {soloHora(turno.inicio_programado)} –{" "}
                    {soloHora(turno.fin_programado)}
                  </p>
                </div>
                {puesto?.armado && (
                  <span className="shrink-0 rounded-full border border-novedad/40 bg-novedad/10 px-3 py-1 text-xs font-medium text-azul-100">
                    Armado
                  </span>
                )}
              </div>

              {apertura ? (
                <div className="flex items-center gap-2.5 border-t border-borde/60 bg-normal/5 px-5 py-3">
                  <Pulso />
                  <span className="text-sm text-gris-200">
                    Turno abierto a las{" "}
                    <span className="font-mono">
                      {soloHora(apertura.hora_captura)}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="border-t border-borde/60 p-4">
                  <Link
                    href="/guardia/apertura"
                    className="boton-campo boton-primario flex items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition active:scale-[0.99]"
                  >
                    <IconoLista className="h-5 w-5" />
                    Abrir turno
                  </Link>
                </div>
              )}
            </section>

            {faltantes.length > 0 && (
              <p className="rounded-xl border border-novedad/40 bg-novedad/10 px-4 py-3 text-sm text-azul-100">
                Reportado en falta al abrir:{" "}
                <strong className="font-semibold">
                  {faltantes.join(", ")}
                </strong>
              </p>
            )}
          </>
        )}

        <nav className="grid gap-3 pt-1">
          <Tile
            href="/guardia/emergencia"
            icono={<IconoAlerta className="h-6 w-6" />}
            titulo="Emergencia"
            detalle="Protocolos, 911 y contactos"
            tono="emergencia"
          />
          <TilePendiente
            icono={<IconoLista className="h-6 w-6" />}
            titulo="Novedad"
            detalle="Registrar con foto y hora"
          />
          <TilePendiente
            icono={<IconoRonda className="h-6 w-6" />}
            titulo="Ronda"
            detalle="Escanear punto de control"
          />
        </nav>
      </main>
    </>
  );
}

function Tile({
  href,
  icono,
  titulo,
  detalle,
  tono,
}: {
  href: string;
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
  tono: "emergencia" | "azul";
}) {
  const esEmergencia = tono === "emergencia";
  return (
    <Link
      href={href}
      className={`tarjeta flex items-center gap-4 px-5 py-4 transition active:scale-[0.99] ${
        esEmergencia ? "filo-emergencia" : "filo-azul"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          esEmergencia
            ? "bg-emergencia/15 text-red-300"
            : "bg-azul-500/15 text-azul-300"
        }`}
      >
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-white">{titulo}</span>
        <span className="block text-sm text-gris-400">{detalle}</span>
      </span>
      <IconoFlecha className="h-5 w-5 shrink-0 text-gris-600" />
    </Link>
  );
}

/** Todavia no construido. Apagado, en vez de llevar a un enlace roto. */
function TilePendiente({
  icono,
  titulo,
  detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-borde px-5 py-4 opacity-45">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gris-700/40 text-gris-400">
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gris-300">{titulo}</span>
        <span className="block text-sm text-gris-500">{detalle}</span>
      </span>
      <span className="shrink-0 rounded-full border border-borde px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-gris-500">
        Pronto
      </span>
    </div>
  );
}
