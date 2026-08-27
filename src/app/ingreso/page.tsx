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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-9 px-6 py-12">
      <header className="flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-azul-500/25 blur-xl"
          />
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-azul-700/60 bg-gradient-to-br from-azul-800 to-azul-600">
            <IconoEscudo className="h-8 w-8 text-azul-100" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Marca tamano="grande" />
        </div>
      </header>

      <section className="tarjeta p-6">
        <p className="mb-5 text-center text-xs uppercase tracking-[0.2em] text-gris-500">
          Puesto de control
        </p>
        <FormularioIngreso />
      </section>

      <footer className="text-center text-xs leading-relaxed text-gris-500">
        {MARCA.razonSocial}
        <br />
        Si olvidó su PIN, comuníquese con su supervisor de zona.
      </footer>
    </main>
  );
}
