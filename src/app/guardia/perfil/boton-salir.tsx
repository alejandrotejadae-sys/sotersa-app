"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { IconoSalir } from "@/app/componentes/iconos";

export function BotonSalir({ destino = "/ingreso" }: { destino?: string }) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await crearClienteNavegador().auth.signOut();
    router.push(destino);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className="boton-campo flex w-full items-center justify-center gap-2.5 rounded-xl border border-borde text-base font-medium text-gris-300 transition active:scale-[0.99] disabled:opacity-50"
    >
      <IconoSalir className="h-5 w-5" />
      {saliendo ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
