"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioAcceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ingresar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const email = correo.trim().toLowerCase();
    if (!email.includes("@") || clave.length < 6) {
      setError("Revisa el correo y la contraseña.");
      return;
    }

    setCargando(true);
    const { error: fallo } = await crearClienteNavegador().auth.signInWithPassword({
      email,
      password: clave,
    });
    setCargando(false);

    if (fallo) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="correo" className="text-sm font-medium text-gris-300">
          Correo corporativo
        </label>
        <input
          id="correo"
          type="email"
          autoComplete="username"
          value={correo}
          onChange={(evento) => setCorreo(evento.target.value)}
          className="boton-campo rounded-xl border border-azul-900/80 bg-[#020b18]/80 px-4 text-base text-white outline-none transition focus:border-azul-400 focus:ring-4 focus:ring-azul-500/10"
          placeholder="nombre@empresa.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="clave" className="text-sm font-medium text-gris-300">
          Contraseña
        </label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          className="boton-campo rounded-xl border border-azul-900/80 bg-[#020b18]/80 px-4 text-lg text-white outline-none transition focus:border-azul-400 focus:ring-4 focus:ring-azul-500/10"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-emergencia/15 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando}
        className="boton-campo boton-primario rounded-xl text-base font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
      >
        {cargando ? "Verificando…" : "Ingresar al panel"}
      </button>
    </form>
  );
}
