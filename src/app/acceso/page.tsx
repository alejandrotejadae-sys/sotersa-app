import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FormularioAcceso } from "./formulario-acceso";

export const metadata = { title: "Ingreso — SOTERSA" };

export default async function PaginaAcceso() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-7 px-6 py-10">
      <header className="flex flex-col items-center gap-5 text-center">
        <Marca tamano="grande" />
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-azul-400">
            <IconoEscudoOk className="h-5 w-5" /> Acceso seguro
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">Centro de seguridad</h1>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">
            Un solo ingreso para agentes de seguridad, supervisores, clientes y administración.
          </p>
        </div>
      </header>
      <section className="panel-operativo p-6 sm:p-7">
        <FormularioAcceso />
      </section>
    </main>
  );
}
