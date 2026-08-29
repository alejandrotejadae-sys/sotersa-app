import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import FormularioApertura from "./formulario-apertura";

export const metadata = { title: "Abrir turno — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaApertura() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: guardia } = await supabase
    .from("guardias")
    .select("id")
    .eq("perfil_id", user.id)
    .single();
  if (!guardia) redirect("/guardia");

  const ahora = new Date().toISOString();
  const { data: turno } = await supabase
    .from("turnos")
    .select("id, puesto_id")
    .eq("guardia_id", guardia.id)
    .lte("inicio_programado", ahora)
    .gte("fin_programado", ahora)
    .order("inicio_programado", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!turno) redirect("/guardia");

  const { data: puesto } = await supabase
    .from("puestos")
    .select("codigo, nombre")
    .eq("id", turno.puesto_id)
    .single();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-borde/60 bg-gris-900/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3 md:max-w-3xl md:px-6">
          <Link href="/guardia" className="text-sm text-azul-400">
            ← Volver
          </Link>
          <span className="font-mono text-xs tracking-widest text-gris-500">
            {puesto?.codigo}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6 md:max-w-3xl md:px-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Abrir turno
          </h1>
          <p className="mt-1 text-sm text-gris-400">{puesto?.nombre}</p>
        </header>

        <FormularioApertura turnoId={turno.id} />
      </main>
    </>
  );
}
