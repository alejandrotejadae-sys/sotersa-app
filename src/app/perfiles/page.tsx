import { Marca } from "@/app/componentes/marca";
import { SelectorPerfil } from "./selector-perfil";

export const metadata = { title: "Selecciona tu perfil — SOTERSA" };

export default function PaginaPerfiles() {
  return (
    <main className="min-h-dvh bg-[#020b18]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col bg-[radial-gradient(circle_at_50%_8%,rgba(0,140,255,0.17),transparent_32%),linear-gradient(180deg,#020b18,#03152b_62%,#020b18)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex justify-center"><Marca tamano="panel" /></div>
        <header className="mt-9 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0788ff]">Acceso personalizado</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Selecciona tu perfil</h1>
          <p className="mt-2 text-sm text-slate-400">Elige cómo deseas ingresar a la plataforma.</p>
        </header>
        <SelectorPerfil />
      </div>
    </main>
  );
}
