import Image from "next/image";
import { SelectorPerfil } from "./selector-perfil";

export const metadata = { title: "Selecciona tu perfil — SOTERSA" };

export default function PaginaPerfiles() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020b18]">
      <div className="relative h-dvh aspect-[941/1672] shrink-0 overflow-hidden">
        <Image
          src="/pantalla-seleccion-perfil-sotersa.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-fill"
        />
        <SelectorPerfil />
      </div>
    </main>
  );
}
