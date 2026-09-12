import Link from "next/link";
import { Marca } from "@/app/componentes/marca";
import { IconoFlecha } from "@/app/componentes/iconos";

export const TONO = {
  azul: { borde: "border-[#0788ff]/40", fondo: "bg-[#0788ff]/12", texto: "text-[#65c8ff]", barra: "bg-[#0788ff]" },
  verde: { borde: "border-emerald-500/40", fondo: "bg-emerald-500/12", texto: "text-emerald-300", barra: "bg-emerald-500" },
  ambar: { borde: "border-amber-400/40", fondo: "bg-amber-500/12", texto: "text-amber-300", barra: "bg-amber-400" },
} as const;

/** Marco comun de la escuela: marca arriba, flecha de retorno, ancho de lectura. */
export function MarcoEscuela({ volver, children, ancho = "md:max-w-3xl" }: { volver: { href: string; texto: string }; children: React.ReactNode; ancho?: string }) {
  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className={`mx-auto flex min-h-dvh w-full max-w-[540px] flex-col ${ancho} bg-[radial-gradient(circle_at_50%_8%,rgba(0,140,255,0.17),transparent_32%),linear-gradient(180deg,#020b18,#03152b_62%,#020b18)] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]`}>
        <div className="flex justify-center"><Marca tamano="panel" /></div>
        <Link href={volver.href} className="mt-6 inline-flex items-center gap-1 self-start text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> {volver.texto}</Link>
        {children}
      </div>
    </main>
  );
}

export function Barra({ porcentaje, tono }: { porcentaje: number; tono: keyof typeof TONO }) {
  return <div className="h-2 w-full overflow-hidden rounded-full bg-[#0b2035]"><div className={`h-full rounded-full ${TONO[tono].barra} transition-all`} style={{ width: `${porcentaje}%` }} /></div>;
}

export function Etiqueta({ tono, children }: { tono: "verde" | "ambar" | "gris" | "azul"; children: React.ReactNode }) {
  const clase = { verde: "bg-emerald-500/12 text-emerald-300", ambar: "bg-amber-500/12 text-amber-300", gris: "bg-slate-500/10 text-slate-400", azul: "bg-[#0788ff]/15 text-[#65c8ff]" }[tono];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${clase}`}>{children}</span>;
}
