"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioAcceso() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ingresar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const identificador = usuario.trim().toLowerCase();
    if (identificador.length < 3 || clave.length < 6) {
      setError("Revisa el usuario y la contraseña.");
      return;
    }

    // Supabase autentica con correo. Para el personal SOTERSA se completa el
    // dominio internamente, sin obligar a escribir ni conocer el signo @.
    // Los clientes que ya usan un correo completo conservan compatibilidad.
    const email = identificador.includes("@")
      ? identificador
      : `${identificador}@sotersa.com`;

    setCargando(true);
    const { error: fallo } = await crearClienteNavegador().auth.signInWithPassword({
      email,
      password: clave,
    });
    setCargando(false);

    if (fallo) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    router.push("/perfiles");
    router.refresh();
  }

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="usuario" className="text-sm font-medium text-gris-300">
          Usuario
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          className="boton-campo rounded-xl border border-azul-900/80 bg-[#020b18]/80 px-4 text-base text-white outline-none transition focus:border-azul-400 focus:ring-4 focus:ring-azul-500/10"
          placeholder="Ingresa tu usuario"
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
