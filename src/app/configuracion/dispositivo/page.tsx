import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { ConfiguracionDispositivo } from "./configuracion-dispositivo";

export const metadata = { title: "Configuración del dispositivo — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaConfiguracionDispositivo() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  return (
    <main className="min-h-dvh bg-[#020b18] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex justify-center"><Marca tamano="panel" /></div>
        <header className="mt-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0788ff]">Aplicación móvil</p>
          <h1 className="mt-2 text-3xl font-bold">Configura este dispositivo</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Autoriza únicamente las funciones que SOTERSA necesita para rondas, evidencia y avisos operativos.</p>
        </header>
        <ConfiguracionDispositivo />
      </div>
    </main>
  );
}
