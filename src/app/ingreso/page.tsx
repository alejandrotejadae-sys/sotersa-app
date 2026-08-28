import Image from "next/image";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import FormularioIngreso from "./formulario-ingreso";

export const metadata = { title: "Ingreso — SOTERSA" };

export default async function PaginaIngreso() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020b18]">
      <div className="relative h-dvh aspect-[941/1672] shrink-0 overflow-hidden">
        <Image
          src="/pantalla-ingreso-sotersa.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-fill"
        />
        <FormularioIngreso />
      </div>
    </main>
  );
}
