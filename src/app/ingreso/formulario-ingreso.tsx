"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import {
  cedulaACorreo,
  cedulaEsValida,
  normalizarCedula,
  PIN_LARGO,
} from "@/lib/auth";

export default function FormularioIngreso() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [pin, setPin] = useState("");
  const [mostrarPin, setMostrarPin] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ingresar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const cedula = normalizarCedula(usuario);
    if (!cedulaEsValida(cedula)) {
      setError("El usuario ingresado no es válido.");
      return;
    }
    if (pin.length !== PIN_LARGO) {
      setError(`La contraseña debe tener ${PIN_LARGO} dígitos.`);
      return;
    }

    setCargando(true);
    const { error: fallo } = await crearClienteNavegador().auth.signInWithPassword({
      email: cedulaACorreo(cedula),
      password: pin,
    });
    setCargando(false);

    if (fallo) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    router.push("/guardia");
    router.refresh();
  }

  function ayuda(mensaje: string) {
    setError(mensaje);
  }

  return (
    <form onSubmit={ingresar} className="absolute inset-0 z-10">
      <label className="absolute left-[11%] top-[39.85%] flex h-[7.85%] w-[78%] items-center gap-[3.5%] rounded-[1.15rem] border border-[#078ce8] bg-[#020b18] px-[4%] shadow-[inset_0_0_28px_rgba(0,126,220,0.06)]">
        <IconoUsuario />
        <span className="min-w-0 flex-1">
          <span className="block text-[clamp(0.72rem,2.7vw,1rem)] font-medium text-[#039cf8]">
            Usuario
          </span>
          <input
            name="usuario"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            maxLength={13}
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            placeholder="Ingresa tu usuario"
            aria-label="Usuario"
            className="mt-[2%] block w-full bg-transparent text-[clamp(0.9rem,3.5vw,1.35rem)] text-white outline-none placeholder:text-white/55"
          />
        </span>
      </label>

      <label className="absolute left-[11%] top-[49.45%] flex h-[7.85%] w-[78%] items-center gap-[3.5%] rounded-[1.15rem] border border-[#078ce8] bg-[#020b18] px-[4%] shadow-[inset_0_0_28px_rgba(0,126,220,0.06)]">
        <IconoCandado />
        <span className="min-w-0 flex-1">
          <span className="block text-[clamp(0.72rem,2.7vw,1rem)] font-medium text-[#039cf8]">
            Contraseña
          </span>
          <input
            name="contrasena"
            type={mostrarPin ? "text" : "password"}
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={PIN_LARGO}
            value={pin}
            onChange={(evento) => setPin(evento.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            aria-label="Contraseña"
            className="mt-[2%] block w-full bg-transparent text-[clamp(1rem,4vw,1.5rem)] tracking-[0.35em] text-white outline-none placeholder:text-white/70"
          />
        </span>
        <button
          type="button"
          onClick={() => setMostrarPin((actual) => !actual)}
          aria-label={mostrarPin ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white"
        >
          <IconoOjo />
        </button>
      </label>

      <button
        type="button"
        onClick={() => setRecordar((actual) => !actual)}
        aria-pressed={recordar}
        aria-label="Recordarme"
        className="absolute left-[11%] top-[58.8%] h-[4.5%] w-[28%] bg-transparent"
      />

      <button
        type="button"
        onClick={() => ayuda("Comunícate con tu supervisor para recuperar la contraseña.")}
        aria-label="Recuperar contraseña"
        className="absolute right-[11%] top-[58.8%] h-[4.5%] w-[39%] bg-transparent"
      />

      {error && (
        <p role="alert" className="absolute left-[18%] top-[62.3%] z-20 w-[64%] rounded-xl border border-emergencia/50 bg-[#2a0912]/95 px-3 py-2 text-center text-[clamp(0.65rem,2.4vw,0.85rem)] text-red-100 shadow-xl">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        aria-label="Ingresar de forma segura"
        className="absolute left-[11%] top-[64.05%] h-[6.9%] w-[78%] rounded-[1.15rem] bg-transparent disabled:cursor-wait"
      >
        {cargando && (
          <span className="absolute inset-0 grid place-items-center rounded-[1.15rem] bg-[#087fe9]/90 text-sm font-semibold text-white">
            Ingresando…
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => ayuda("El ingreso con huella se habilitará después del primer acceso seguro.")}
        aria-label="Ingresar con huella"
        className="absolute left-[11%] top-[77.75%] h-[6.3%] w-[78%] rounded-[1.15rem] bg-transparent"
      />

      <button
        type="button"
        onClick={() => ayuda("Solicita asistencia a la central operativa de SOTERSA.")}
        aria-label="Contactar soporte"
        className="absolute left-[43%] top-[86.7%] h-[4.5%] w-[36%] bg-transparent"
      />
    </form>
  );
}

function IconoUsuario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[28%] min-h-6 w-[8%] min-w-6 shrink-0 text-white/90" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[28%] min-h-6 w-[8%] min-w-6 shrink-0 text-white/90" aria-hidden>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" />
    </svg>
  );
}

function IconoOjo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden>
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}
