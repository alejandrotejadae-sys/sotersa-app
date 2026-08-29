/**
 * ¿Estamos en la web de escritorio, o en la app instalada / un teléfono?
 *
 * El splash de marca y el carrusel de bienvenida son lenguaje de app móvil, y
 * ahí están bien: la app instalada arranca con su pantalla, igual que
 * cualquier app del teléfono.
 *
 * En un navegador de escritorio no. Una web que recibe con una animación de
 * marca a pantalla completa y un onboarding de tres pasos se siente como un
 * teléfono estirado — que es justo lo que no queremos.
 *
 * Se considera "app" si está instalada (`display-mode: standalone`) o si la
 * pantalla es de teléfono. Todo lo demás es web de escritorio.
 */
export function esWebEscritorio(): boolean {
  if (typeof window === "undefined") return false;

  const instalada =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS no soporta display-mode; expone su propia bandera.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (instalada) return false;

  return window.matchMedia?.("(min-width: 768px)").matches ?? false;
}
