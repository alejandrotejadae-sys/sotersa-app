"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { BotonAccesoBiometrico } from "@/app/componentes/boton-acceso-biometrico";
import { cedulaACorreo, cedulaEsValida, normalizarCedula } from "@/lib/auth";

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

    // La misma pantalla admite los dos esquemas que ya existen: cédula + PIN
    // para agentes y usuario/correo + contraseña para los demás perfiles.
    const esCedula = /^\d+$/.test(identificador);
    if (esCedula && !cedulaEsValida(normalizarCedula(identificador))) {
      setError("La cédula ingresada no es válida.");
      return;
    }
    const email = esCedula
      ? cedulaACorreo(normalizarCedula(identificador))
      : identificador.includes("@")
        ? identificador
        : `${identificador}@sotersa.com`;

    setCargando(true);
    const { data, error: fallo } = await crearClienteNavegador().auth.signInWithPassword({
      email,
      password: clave,
    });
    setCargando(false);

    if (fallo) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    router.push(data.user?.user_metadata?.debe_cambiar_clave === true ? "/cambiar-clave" : "/perfiles");
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
          placeholder="Usuario o cédula"
        />
      </div>
      <Link href="/recuperar" className="-mt-2 self-end text-sm font-medium text-[#0788ff]">¿Olvidaste tu contraseña?</Link>
      <div className="flex flex-col gap-2">
        <label htmlFor="clave" className="text-sm font-medium text-gris-300">
          Contraseña o PIN
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
      <p className="-mt-3 text-xs leading-5 text-slate-500">Los agentes de seguridad ingresan con su cédula y PIN. Los demás usuarios utilizan su contraseña.</p>
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
      <BotonAccesoBiometrico />
    </form>
  );
}
