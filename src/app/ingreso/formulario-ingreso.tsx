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

/**
 * Ingreso del guardia: cedula + PIN.
 *
 * Decisiones de interfaz, todas por la misma razon — esto se usa de pie, de
 * noche, a la intemperie y a veces con guantes:
 *   - inputMode="numeric" para que el telefono abra el teclado de numeros.
 *   - Campos altos (56px) y texto grande.
 *   - La cedula se valida ANTES de llamar al servidor: no tiene sentido
 *     gastar un intento de ingreso en un numero mal tecleado.
 */
export default function FormularioIngreso() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ced = normalizarCedula(cedula);

    if (!cedulaEsValida(ced)) {
      setError("Esa cédula no es válida. Revise los 10 dígitos.");
      return;
    }
    if (pin.length !== PIN_LARGO) {
      setError(`El PIN tiene ${PIN_LARGO} dígitos.`);
      return;
    }

    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: cedulaACorreo(ced),
      password: pin,
    });
    setCargando(false);

    if (err) {
      // A proposito NO se dice si fallo la cedula o el PIN: decirlo permite
      // averiguar que cedulas existen en el sistema probando una por una.
      setError("Cédula o PIN incorrectos.");
      return;
    }

    router.push("/guardia");
    router.refresh();
  }

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="cedula" className="text-sm font-medium text-gris-300">
          Cédula
        </label>
        <input
          id="cedula"
          name="cedula"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          maxLength={13}
          placeholder="1710034065"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          className="boton-campo rounded-xl border border-azul-900/80 bg-[#020b18]/80 px-4 text-xl tracking-wider text-white outline-none transition focus:border-azul-400 focus:ring-4 focus:ring-azul-500/10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pin" className="text-sm font-medium text-gris-300">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={PIN_LARGO}
          placeholder="••••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="boton-campo rounded-xl border border-azul-900/80 bg-[#020b18]/80 px-4 text-2xl tracking-[0.4em] text-white outline-none transition focus:border-azul-400 focus:ring-4 focus:ring-azul-500/10"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-emergencia/15 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="boton-campo boton-primario mt-2 rounded-xl text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
      >
        {cargando ? "Ingresando…" : "Ingresar de forma segura"}
      </button>
    </form>
  );
}
