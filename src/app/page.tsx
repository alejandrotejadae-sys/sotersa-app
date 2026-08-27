import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * Reparte segun quien entra. Cada rol tiene su propia app y no deberia ver
 * ni el menu de las otras.
 */
export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingreso");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  switch (perfil?.rol) {
    case "guardia":
      redirect("/guardia");
    case "supervisor":
      redirect("/supervisor");
    case "admin":
      redirect("/admin");
    case "cliente":
      redirect("/portal");
    default:
      // Usuario sin perfil: no se adivina un rol por defecto.
      redirect("/ingreso");
  }
}
