import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/** Entrada de la app: después de autenticar, muestra la selección aprobada. */
export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  redirect("/perfiles");
}
