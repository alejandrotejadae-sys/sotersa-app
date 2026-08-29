"use client";

import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioRecuperar() {
  const [usuario, setUsuario] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault(); setError(null); setMensaje(null);
    const identificador = usuario.trim().toLowerCase();
    if (/^\d{10}$/.test(identificador)) { setMensaje("Los guardias deben solicitar un nuevo PIN a su supervisor o al administrador."); return; }
    const correo = identificador.includes("@") ? identificador : `${identificador}@sotersa.com`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { setError("Escribe un usuario o correo válido."); return; }
    setCargando(true);
    const { error: fallo } = await crearClienteNavegador().auth.resetPasswordForEmail(correo, { redirectTo: `${window.location.origin}/auth/callback?next=/restablecer-clave` });
    setCargando(false);
    if (fallo) { setError("No fue posible enviar el enlace. Espera unos minutos e intenta nuevamente."); return; }
    setMensaje("Si la cuenta existe, recibirás un enlace seguro para restablecer la contraseña.");
  }

  return <form onSubmit={enviar} className="space-y-4"><label className="block text-sm font-medium text-slate-300">Usuario o correo<input value={usuario} onChange={(evento) => setUsuario(evento.target.value)} required autoCapitalize="none" autoComplete="username" className="mt-2 min-h-12 w-full rounded-xl border border-[#27425e] bg-[#020b18] px-3 text-sm text-white outline-none focus:border-[#0788ff]" placeholder="usuario@sotersa.com" /></label>{mensaje && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm leading-6 text-emerald-200">{mensaje}</p>}{error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">{error}</p>}<button disabled={cargando} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50">{cargando ? "Enviando..." : "Enviar enlace de recuperación"}</button></form>;
}
