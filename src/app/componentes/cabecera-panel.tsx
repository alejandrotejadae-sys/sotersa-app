import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoPersona } from "@/app/componentes/iconos";
import { BotonSalir } from "@/app/guardia/perfil/boton-salir";

const ROTULOS = {
  supervisor: "Supervisor",
  admin: "Central operativa",
  cliente: "Cliente",
} as const;

export function CabeceraPanel({
  rol,
  nombre,
}: {
  rol: keyof typeof ROTULOS;
  nombre: string;
}) {
  const primerNombre = nombre.trim().split(" ")[0] || "Equipo";

  return (
    <header className="border-b border-borde/60 bg-[#020b18]/85 px-5 py-4 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Marca />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-wider text-azul-400">
              {ROTULOS[rol]}
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">{primerNombre}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-normal/30 bg-normal/10 px-3 py-2 text-xs font-medium text-green-300">
            <Pulso /> En línea
          </span>
          <Link href="/mi-perfil" aria-label="Abrir mi perfil" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#27425e] bg-[#07172a] text-[#49b6ff]"><IconoPersona className="h-5 w-5" /></Link>
          <div className="w-28 [&_button]:min-h-10 [&_button]:px-3 [&_button]:text-xs">
            <BotonSalir destino="/acceso" />
          </div>
        </div>
      </div>
    </header>
  );
}
