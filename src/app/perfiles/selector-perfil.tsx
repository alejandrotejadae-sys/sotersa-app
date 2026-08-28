"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

type Perfil = "cliente" | "guardia" | "supervisor" | "central";

const perfiles: Array<{ id: Perfil; etiqueta: string; top: string }> = [
  { id: "cliente", etiqueta: "Cliente", top: "28.95%" },
  { id: "guardia", etiqueta: "Guardia", top: "40.91%" },
  { id: "supervisor", etiqueta: "Supervisor", top: "52.87%" },
  { id: "central", etiqueta: "Central operativa", top: "64.77%" },
];

const destinos: Record<Perfil, string> = {
  cliente: "/portal",
  guardia: "/guardia?desde=perfiles",
  supervisor: "/supervisor",
  central: "/admin",
};

export function SelectorPerfil() {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<Perfil>("central");
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    await crearClienteNavegador().auth.signOut();
    router.push("/ingreso?pantalla=ingreso");
    router.refresh();
  }

  return (
    <div className="absolute inset-0 z-10" role="radiogroup" aria-label="Selecciona tu perfil de acceso">
      {perfiles.map((perfil) => {
        const activo = seleccionado === perfil.id;
        const esCentral = perfil.id === "central";

        return (
          <button
            key={perfil.id}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={`Seleccionar perfil ${perfil.etiqueta}`}
            onClick={() => setSeleccionado(perfil.id)}
            className={`absolute left-[8.7%] h-[11.3%] w-[82.5%] rounded-[1.35rem] border-2 bg-transparent transition-colors ${
              activo
                ? "border-[#00cfff] shadow-[0_0_18px_rgba(0,166,255,0.15)]"
                : "border-[#3f4853]"
            }`}
            style={{ top: perfil.top }}
          >
            {esCentral && (
              <span className="absolute right-[3.8%] top-1/2 h-[3.7rem] w-[3.7rem] -translate-y-1/2 rounded-full bg-[#071527]" />
            )}
            {activo ? (
              <span className="absolute right-[4.6%] top-1/2 grid h-[3.15rem] w-[3.15rem] -translate-y-1/2 place-items-center rounded-full bg-[#087ff0] text-white shadow-[0_0_18px_rgba(0,142,255,0.35)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-[58%] w-[58%]" aria-hidden>
                  <path d="m5 12 4.2 4.2L19 6.8" />
                </svg>
              </span>
            ) : esCentral ? (
              <span className="absolute right-[5.6%] top-1/2 -translate-y-1/2 text-[2.6rem] font-light leading-none text-white/75" aria-hidden>›</span>
            ) : null}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => router.push(destinos[seleccionado])}
        aria-label={`Continuar al panel de ${perfiles.find((perfil) => perfil.id === seleccionado)?.etiqueta}`}
        className="absolute left-[8.7%] top-[78.45%] h-[7.45%] w-[82.5%] rounded-[1.25rem] bg-transparent"
      />

      <button
        type="button"
        disabled={saliendo}
        onClick={cerrarSesion}
        aria-label="Cerrar sesión"
        className="absolute left-[31%] top-[88.5%] h-[6%] w-[45%] rounded-xl bg-transparent disabled:cursor-wait"
      />
    </div>
  );
}
