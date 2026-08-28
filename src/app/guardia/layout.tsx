import { NavInferior } from "@/app/componentes/nav-inferior";

/**
 * Marco de la app del guardia.
 *
 * En el telefono ocupa la pantalla completa, que es como se va a usar. En
 * escritorio, en vez de dejar una columna angosta flotando en un vacio negro,
 * se encuadra como un dispositivo: asi se entiende que es una app movil y no
 * una web rota.
 */
export default function LayoutGuardia({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:items-center md:justify-center md:py-8">
      <div className="flex min-h-dvh w-full flex-1 flex-col md:min-h-0 md:h-[860px] md:max-h-[92vh] md:w-[400px] md:flex-none md:overflow-hidden md:rounded-[2.25rem] md:border md:border-azul-900/70 md:shadow-2xl md:shadow-black/60">
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        <NavInferior />
      </div>
    </div>
  );
}
