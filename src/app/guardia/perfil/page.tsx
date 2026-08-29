import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { MARCA } from "@/lib/marca";
import { Marca } from "@/app/componentes/marca";
import { IconoPersona } from "@/app/componentes/iconos";
import { BotonSalir } from "./boton-salir";
import Link from "next/link";

export const metadata = { title: "Mi perfil — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingreso");

  const { data: guardia } = await supabase
    .from("guardias")
    .select("nombre, cedula, credencial, telefono")
    .eq("perfil_id", user.id)
    .single();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-azul-900/60 bg-[#020b18]/88 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-md px-5 py-3">
          <Marca />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full border border-azul-700/60 bg-azul-500/10 text-azul-300">
            <IconoPersona className="h-10 w-10" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">
              {guardia?.nombre ?? "Sin ficha"}
            </h1>
            <p className="text-sm text-gris-400">Agente de seguridad</p>
          </div>
        </div>

        <dl className="tarjeta divide-y divide-borde/40">
          <Fila rotulo="Cédula" valor={guardia?.cedula} mono />
          <Fila rotulo="Credencial" valor={guardia?.credencial} mono />
          <Fila rotulo="Teléfono" valor={guardia?.telefono} />
        </dl>

        <Link href="/configuracion/dispositivo" className="flex min-h-14 items-center justify-center rounded-xl border border-[#0788ff]/60 bg-[#0788ff]/10 px-4 text-sm font-semibold text-[#8ddaff]">Configurar permisos, avisos y biometría</Link>

        <BotonSalir />

        <p className="text-center text-xs leading-relaxed text-gris-600">
          {MARCA.razonSocial}
          <br />
          Para cambiar tu PIN o tus datos, comunícate con tu supervisor de zona.
        </p>
      </main>
    </>
  );
}

function Fila({
  rotulo,
  valor,
  mono,
}: {
  rotulo: string;
  valor?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-gris-400">{rotulo}</dt>
      <dd
        className={`text-sm font-medium text-white ${mono ? "font-mono" : ""}`}
      >
        {valor || <span className="text-gris-600">—</span>}
      </dd>
    </div>
  );
}
