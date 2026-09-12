import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * La raiz no muestra nada: reparte.
 *
 * Sin sesion, al ingreso. Con sesion, a la pantalla del rol de la cuenta. No
 * se le pregunta a nadie "que perfil eres": eso lo dice la cuenta, y un menu
 * publico con central, custodia y supervisores le contaba a cualquiera con
 * el enlace como esta organizada SOTERSA por dentro.
 */
const DESTINO_POR_ROL: Record<string, string> = {
  admin: "/admin",
  supervisor: "/supervisor",
  // Agente y cliente tienen varias puertas: eligen en el menu.
  cliente: "/perfiles",
  guardia: "/perfiles",
};

export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
  redirect(DESTINO_POR_ROL[perfil?.rol ?? ""] ?? "/perfiles");
}
