import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import FormularioIngreso from "./formulario-ingreso";

export const metadata = { title: "Ingreso — SOTERSA" };

export default async function PaginaIngreso() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="min-h-dvh bg-[#020b18]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col justify-center bg-[radial-gradient(circle_at_50%_12%,rgba(0,140,255,0.18),transparent_34%),linear-gradient(180deg,#020b18,#03152b_65%,#020b18)] px-6 py-10">
        <header className="text-center">
          <div className="flex justify-center"><Marca tamano="grande" /></div>
          <p className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#0788ff]"><IconoEscudoOk className="h-5 w-5" /> Acceso seguro</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Bienvenido</h1>
          <p className="mt-2 text-sm text-slate-400">Ingresa tus credenciales para continuar.</p>
        </header>

        <section className="mt-8 rounded-2xl border border-[#27425e] bg-[#07172a]/90 p-6 shadow-2xl shadow-black/30">
          <FormularioIngreso />
        </section>

        <a href="/acceso" className="mt-6 text-center text-sm font-medium text-[#0788ff]">Acceso para administración y clientes</a>
      </div>
    </main>
  );
}
