import Link from "next/link";
import { Marca } from "@/app/componentes/marca";
import { IconoFlecha, IconoLibro } from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";

export const metadata = { title: "Escuela de Formación — SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Escuela de Formacion Sotersa. Por ahora es la puerta: el contenido
 * (modulos, evaluaciones, constancias) se define con la empresa.
 */
export default async function PaginaEscuela() {
  const { perfil } = await exigirPerfil(["guardia", "supervisor", "admin", "cliente"]);

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[540px] flex-col md:max-w-3xl bg-[radial-gradient(circle_at_50%_8%,rgba(0,140,255,0.17),transparent_32%),linear-gradient(180deg,#020b18,#03152b_62%,#020b18)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex justify-center"><Marca tamano="panel" /></div>
        <Link href="/perfiles" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver a los perfiles</Link>

        <header className="mt-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#087ff0]/15 text-[#49b6ff]"><IconoLibro className="h-8 w-8" /></span>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#0788ff]">Capacitación</p>
          <h1 className="mt-2 text-3xl font-bold">Escuela de Formación Sotersa</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Hola, {perfil.nombre.split(" ")[0]}. {perfil.rol === "cliente" ? "Aquí vas a encontrar cómo formamos a los agentes que cuidan tus instalaciones: módulos, procedimientos y constancias de capacitación." : "Aquí vas a encontrar los módulos de formación, los procedimientos del servicio y tus constancias de capacitación."}</p>
        </header>

        <section className="mt-8 rounded-2xl border border-dashed border-[#27425e] bg-[#07172a]/70 p-6 text-center">
          <p className="font-semibold">Los primeros módulos están en preparación.</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Cuando estén disponibles aparecerán en esta pantalla y recibirás el aviso en la app.</p>
        </section>

        {perfil.rol !== "cliente" && <Link href="/guardia/emergencia" className="mt-5 block rounded-2xl border border-[#27425e] bg-[#07172a]/80 p-4 text-center text-sm text-slate-300">Mientras tanto, repasa los <span className="font-semibold text-[#8ddaff]">protocolos de emergencia</span> →</Link>}
      </div>
    </main>
  );
}
