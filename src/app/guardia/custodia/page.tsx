import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca, Pulso } from "@/app/componentes/marca";
import { EstadoConexion } from "@/app/componentes/estado-conexion";
import {
  IconoCamion,
  IconoCandado,
  IconoEscudoOk,
  IconoFlecha,
  IconoMapa,
  IconoMensaje,
  IconoPersona,
  IconoRonda,
} from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Custodia armada — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaCustodia() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-azul-900/60 bg-[#020b18]/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 md:max-w-4xl md:px-6 px-4 pb-3 pt-4">
          <Link
            href="/guardia"
            aria-label="Volver al inicio"
            className="grid h-11 w-11 place-items-center rounded-xl border border-borde bg-superficie text-gris-200"
          >
            <span className="rotate-180">
              <IconoFlecha className="h-5 w-5" />
            </span>
          </Link>
          <Marca tamano="panel" />
          <EstadoConexion />
        </div>
      </header>

      <main className="guardia-render mx-auto flex w-full max-w-md md:max-w-4xl md:px-6 flex-1 flex-col gap-3.5 px-4 pb-6 pt-4">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-azul-400">
            Operaciones especiales
          </p>
          <h1 className="mt-1 text-[1.8rem] font-bold tracking-tight text-white">
            Custodia armada
          </h1>
        </header>

        <section className="panel-operativo overflow-hidden p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-azul-400/50 bg-azul-500/10 text-azul-300">
              <IconoEscudoOk className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Pulso />
                <p className="text-xs font-semibold uppercase tracking-wider text-green-300">
                  Operación en curso
                </p>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-white">Carga protegida</h2>
              <p className="mt-1 text-sm text-gris-400">Monitoreo permanente de Central</p>
            </div>
          </div>
        </section>

        <section className="tarjeta custodia-mapa relative min-h-[230px] overflow-hidden p-4">
          <div className="relative z-[1] flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-lg border border-normal/40 bg-[#06182a]/90 px-3 py-2 text-xs font-medium text-green-300">
              <IconoEscudoOk className="h-4 w-4" /> Ruta verificada
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-azul-500/50 bg-[#06182a]/90 text-azul-300">
              <IconoMapa className="h-5 w-5" />
            </span>
          </div>

          <div className="custodia-ruta" aria-hidden>
            <span className="custodia-punto custodia-punto-origen" />
            <span className="custodia-trayecto" />
            <span className="custodia-punto custodia-punto-destino" />
            <span className="custodia-camion">
              <IconoCamion className="h-7 w-7" />
            </span>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-[1] flex justify-between text-xs text-gris-300">
            <span>Ciudad origen</span>
            <span>Ciudad destino</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <section className="tarjeta p-4">
            <p className="text-xs uppercase tracking-wider text-gris-500">Línea de tiempo</p>
            <ol className="mt-4 space-y-3">
              <Paso hecho titulo="Operación iniciada" hora="07:35" />
              <Paso hecho titulo="Salida de origen" hora="07:45" />
              <Paso titulo="En tránsito" hora="09:24" />
              <Paso titulo="Llegada estimada" hora="12:18" pendiente />
            </ol>
          </section>

          <div className="flex flex-col gap-3">
            <section className="tarjeta p-4">
              <p className="text-xs uppercase tracking-wider text-gris-500">Vehículos</p>
              <EstadoVehiculo nombre="Unidad de carga" />
              <EstadoVehiculo nombre="Unidad escolta" />
            </section>
            <section className="tarjeta p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-normal/10 text-green-300">
                  <IconoCandado className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">Comunicación segura</h2>
                  <p className="mt-1 text-xs text-green-300">Canal operativo activo</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="tarjeta flex items-center gap-3 p-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-azul-600/60 bg-azul-500/10 text-azul-300">
            <IconoPersona className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gris-500">Agente asignado</p>
            <h2 className="truncate text-base font-semibold text-white">
              {perfil?.nombre ?? "Agente de seguridad"}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-green-300">
              <Pulso /> Operación activa
            </p>
          </div>
          <Link
            href="/guardia/reportar"
            aria-label="Abrir comunicación operativa"
            className="grid h-11 w-11 place-items-center rounded-xl border border-azul-500/50 text-azul-300"
          >
            <IconoMensaje className="h-5 w-5" />
          </Link>
        </section>

        <Link
          href="/guardia/reportar"
          className="boton-primario flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white"
        >
          <IconoRonda className="h-5 w-5" /> Registrar novedad de custodia
        </Link>
      </main>
    </>
  );
}

function Paso({
  titulo,
  hora,
  hecho = false,
  pendiente = false,
}: {
  titulo: string;
  hora: string;
  hecho?: boolean;
  pendiente?: boolean;
}) {
  return (
    <li className={`flex items-start gap-2 ${pendiente ? "opacity-55" : ""}`}>
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-superficie ${hecho ? "bg-normal ring-normal" : "bg-azul-400 ring-azul-500"}`} />
      <span className="min-w-0 flex-1 text-xs leading-tight text-gris-200">{titulo}</span>
      <time className="font-mono text-[0.65rem] text-gris-500">{hora}</time>
    </li>
  );
}

function EstadoVehiculo({ nombre }: { nombre: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 border-t border-borde/50 pt-3">
      <IconoCamion className="h-5 w-5 shrink-0 text-azul-300" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-white">{nombre}</p>
        <p className="mt-0.5 text-[0.68rem] text-green-300">En tránsito</p>
      </div>
    </div>
  );
}
