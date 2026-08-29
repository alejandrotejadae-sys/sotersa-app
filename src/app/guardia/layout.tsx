import { NavInferior } from "@/app/componentes/nav-inferior";

/**
 * Marco de la app del guardia.
 *
 * En el telefono ocupa la pantalla completa y la navegacion va abajo, al
 * alcance del pulgar. En escritorio NO se finge un telefono: el contenido usa
 * el ancho disponible y las secciones pasan a pestañas en la cabecera.
 */
export default function LayoutGuardia({ children }: LayoutProps<"/guardia">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <NavInferior />
    </div>
  );
}
