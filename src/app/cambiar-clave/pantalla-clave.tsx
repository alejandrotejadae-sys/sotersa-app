import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk } from "@/app/componentes/iconos";
import { FormularioClave } from "./formulario-clave";

export function PantallaClave({ esGuardia, nombre, temporal = false, recuperacion = false }: { esGuardia: boolean; nombre: string; temporal?: boolean; recuperacion?: boolean }) {
  return <main className="grid min-h-dvh place-items-center bg-[#020b18] px-4 py-8 text-white"><section className="w-full max-w-md rounded-3xl border border-[#27425e] bg-[radial-gradient(circle_at_50%_0%,rgba(0,128,255,0.16),transparent_38%),#07172a] p-5 shadow-2xl shadow-black/40 sm:p-7"><Marca tamano="panel" /><div className="mt-7 flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#0788ff]/35 bg-[#0788ff]/12 text-[#49b6ff]"><IconoEscudoOk className="h-7 w-7" /></span><div><p className="text-sm font-medium text-[#49b6ff]">Acceso seguro</p><h1 className="mt-1 text-2xl font-bold">{recuperacion ? "Restablecer contraseña" : temporal ? "Cambia tu clave temporal" : "Cambiar contraseña"}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{temporal ? `${nombre}, debes crear una contraseña personal antes de continuar.` : "Define una nueva credencial segura para tu cuenta."}</p></div></div><div className="mt-6"><FormularioClave esGuardia={esGuardia} /></div></section></main>;
}
