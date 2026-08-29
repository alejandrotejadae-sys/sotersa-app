"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconoPersona } from "@/app/componentes/iconos";
import { BotonAccesoBiometrico } from "@/app/componentes/boton-acceso-biometrico";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { cedulaACorreo, cedulaEsValida, normalizarCedula, PIN_LARGO } from "@/lib/auth";

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
    const { data, error: fallo } = await crearClienteNavegador().auth.signInWithPassword({ email: cedulaACorreo(cedula), password: pin });
    setCargando(false);
    if (fallo) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push(data.user?.user_metadata?.debe_cambiar_clave === true ? "/cambiar-clave" : "/perfiles");
    router.refresh();
  }

  return (
    <form onSubmit={ingresar} className="space-y-5">
      <Campo etiqueta="Usuario" icono={<IconoPersona className="h-6 w-6" />}>
        <input name="usuario" type="text" inputMode="numeric" autoComplete="username" maxLength={13} value={usuario} onChange={(evento) => setUsuario(evento.target.value)} placeholder="Ingresa tu usuario" className="mt-1 w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500" />
      </Campo>

      <Campo etiqueta="Contraseña" icono={<Candado className="h-6 w-6" />} accion={<button type="button" onClick={() => setMostrarPin((actual) => !actual)} aria-label={mostrarPin ? "Ocultar contraseña" : "Mostrar contraseña"} className="grid h-10 w-10 place-items-center rounded-full text-slate-300"><Ojo className="h-5 w-5" /></button>}>
        <input name="contrasena" type={mostrarPin ? "text" : "password"} inputMode="numeric" autoComplete="current-password" maxLength={PIN_LARGO} value={pin} onChange={(evento) => setPin(evento.target.value.replace(/\D/g, ""))} placeholder="••••••" className="mt-1 w-full bg-transparent text-lg tracking-[0.25em] text-white outline-none placeholder:text-slate-500" />
      </Campo>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button type="button" onClick={() => setRecordar((actual) => !actual)} className="flex items-center gap-2 text-slate-300"><span className={`grid h-5 w-5 place-items-center rounded border ${recordar ? "border-[#0788ff] bg-[#0788ff]" : "border-slate-600"}`}>{recordar && "✓"}</span>Recordarme</button>
        <button type="button" onClick={() => setError("Comunícate con tu supervisor para recuperar la contraseña.")} className="font-medium text-[#0788ff]">¿Olvidaste tu contraseña?</button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <button type="submit" disabled={cargando} className="boton-primario min-h-14 w-full rounded-xl text-base font-semibold text-white disabled:opacity-50">{cargando ? "Ingresando…" : "Ingresar de forma segura"}</button>
      <BotonAccesoBiometrico />
    </form>
  );
}

function Campo({ etiqueta, icono, accion, children }: { etiqueta: string; icono: React.ReactNode; accion?: React.ReactNode; children: React.ReactNode }) {
  return <label className="flex min-h-[76px] items-center gap-3 rounded-xl border border-[#087dd8] bg-[#020b18]/75 px-4 shadow-[inset_0_0_24px_rgba(0,126,220,0.05)]"><span className="shrink-0 text-slate-300">{icono}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-[#079cf4]">{etiqueta}</span>{children}</span>{accion}</label>;
}

function Candado({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/></svg>;
}

function Ojo({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.4"/></svg>;
}
