import Link from "next/link";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk, IconoFlecha } from "@/app/componentes/iconos";
import { FormularioRecuperar } from "./formulario-recuperar";

export const metadata = { title: "Recuperar acceso — SOTERSA" };

export default function PaginaRecuperar() {
  return <main className="grid min-h-dvh place-items-center bg-[#020b18] px-4 py-8 text-white"><section className="w-full max-w-md rounded-3xl border border-[#27425e] bg-[radial-gradient(circle_at_50%_0%,rgba(0,128,255,0.16),transparent_38%),#07172a] p-5 shadow-2xl shadow-black/40 sm:p-7"><Marca tamano="panel" /><Link href="/acceso" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#49b6ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al ingreso</Link><div className="mt-6 flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#0788ff]/35 bg-[#0788ff]/12 text-[#49b6ff]"><IconoEscudoOk className="h-7 w-7" /></span><div><p className="text-sm font-medium text-[#49b6ff]">Cuenta corporativa</p><h1 className="mt-1 text-2xl font-bold">Recuperar acceso</h1><p className="mt-2 text-sm leading-6 text-slate-400">Enviaremos un enlace al correo registrado. No compartas ese enlace con nadie.</p></div></div><div className="mt-6"><FormularioRecuperar /></div></section></main>;
}
