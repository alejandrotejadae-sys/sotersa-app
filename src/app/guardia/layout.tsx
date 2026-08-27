import { NavInferior } from "@/app/componentes/nav-inferior";

/**
 * La navegacion inferior es comun a todas las pantallas del guardia.
 * Cada pantalla trae su propia cabecera, porque no todas llevan la misma
 * (la de emergencia, por ejemplo, va en rojo).
 */
export default function LayoutGuardia({ children }: LayoutProps<"/guardia">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <NavInferior />
    </div>
  );
}
