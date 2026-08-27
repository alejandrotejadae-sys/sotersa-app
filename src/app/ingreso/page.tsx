import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { MARCA } from "@/lib/marca";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudo } from "@/app/componentes/iconos";
import FormularioIngreso from "./formulario-ingreso";

export const metadata = { title: "Ingreso — SOTERSA" };

export default async function PaginaIngreso() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/guardia");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-10">
      <header className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-azul-500/25 blur-xl"
          />
          <div className="relative grid h-20 w-20 place-items-center rounded-[1.35rem] border border-azul-600/60 bg-gradient-to-br from-azul-900 via-azul-700 to-azul-500 shadow-2xl shadow-azul-900/60">
            <IconoEscudo className="h-10 w-10 text-azul-100" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Marca tamano="grande" />
        </div>
      </header>

      <section className="panel-operativo p-6 sm:p-7">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Bienvenido</h1>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">Ingresa para acceder a tu centro de seguridad</p>
        </div>
        <FormularioIngreso />
      </section>

      <footer className="text-center text-xs leading-relaxed text-gris-500">
        {MARCA.razonSocial}
        <br />
        Si olvidaste tu PIN, comunícate con tu supervisor de zona.
      </footer>
    </main>
  );
}
