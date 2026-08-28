"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { IconoSalir } from "./iconos";

/**
 * Salir, siempre a un toque desde la cabecera.
 *
 * Pide confirmacion porque un toque accidental a mitad de turno saca al
 * guardia de la app y lo obliga a volver a teclear cedula y PIN, posiblemente
 * de noche y con guantes. El boton completo, con el nombre y los datos, sigue
 * estando en Perfil.
 */
export function BotonSalirIcono({ rutaRetorno = "/ingreso" }: { rutaRetorno?: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await crearClienteNavegador().auth.signOut();
    router.push(rutaRetorno);
    router.refresh();
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label="Salir de la aplicación"
        title="Salir"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-borde text-gris-400 transition active:bg-gris-800"
      >
        <IconoSalir className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={salir}
        disabled={saliendo}
        className="rounded-full bg-emergencia px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {saliendo ? "Saliendo…" : "Salir"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="rounded-full border border-borde px-3 py-2 text-xs font-medium text-gris-400"
      >
        No
      </button>
    </div>
  );
}
