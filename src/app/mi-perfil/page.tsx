import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk, IconoHuella } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FormularioPerfil } from "./formulario-perfil";

export const metadata = { title: "Mi perfil — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaMiPerfil() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: perfil } = await supabase.from("perfiles").select("nombre,telefono,rol").eq("id", user.id).single();
  if (!perfil) redirect("/perfiles");
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  return <main className="min-h-dvh bg-[#020b18] px-4 py-6 text-white sm:px-6"><section className="mx-auto w-full max-w-lg rounded-3xl border border-[#27425e] bg-[radial-gradient(circle_at_50%_0%,rgba(0,128,255,0.14),transparent_35%),#07172a] p-5 shadow-2xl shadow-black/35 sm:p-7"><div className="flex justify-center"><Marca tamano="panel" /></div><header className="mt-7 text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0788ff]">{etiquetaRol(perfil.rol)}</p><h1 className="mt-2 text-3xl font-bold">Mi perfil</h1><p className="mt-2 text-sm text-slate-400">Actualiza tus datos y la imagen de tu cuenta.</p></header><FormularioPerfil nombre={perfil.nombre} telefono={perfil.telefono ?? ""} avatarUrl={avatarUrl} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/cambiar-clave" className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#041225] px-4 text-sm font-semibold text-slate-200"><IconoEscudoOk className="h-5 w-5 text-[#49b6ff]" /> Cambiar contraseña</Link><Link href="/configuracion/dispositivo" className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#27425e] bg-[#041225] px-4 text-sm font-semibold text-slate-200"><IconoHuella className="h-5 w-5 text-[#49b6ff]" /> Configurar dispositivo</Link></div><Link href="/perfiles" className="mt-5 block text-center text-sm font-medium text-[#49b6ff]">Volver a los perfiles</Link></section></main>;
}

function etiquetaRol(rol: string) { return ({ admin: "Administrador", supervisor: "Supervisor", guardia: "Agente de seguridad", cliente: "Cliente" } as Record<string, string>)[rol] ?? rol; }
