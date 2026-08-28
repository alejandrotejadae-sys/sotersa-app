"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioAcceso() {
  const router = useRouter(); const [error, setError] = useState(""); const [cargando, setCargando] = useState(false);
  async function ingresar(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setCargando(true); setError(""); const datos = new FormData(e.currentTarget); const { error: fallo } = await crearClienteNavegador().auth.signInWithPassword({ email: String(datos.get("correo")).trim(), password: String(datos.get("clave")) }); if (fallo) { setError("Correo o contraseña incorrectos."); setCargando(false); return; } router.replace("/"); router.refresh(); }
  return <form onSubmit={ingresar} className="flex flex-col gap-5"><label className="text-sm text-gris-300">Correo<input required name="correo" type="email" autoComplete="email" className="boton-campo mt-2 w-full rounded-xl border border-borde bg-background px-4 text-white" /></label><label className="text-sm text-gris-300">Contraseña<input required name="clave" type="password" autoComplete="current-password" className="boton-campo mt-2 w-full rounded-xl border border-borde bg-background px-4 text-white" /></label>{error && <p role="alert" className="rounded-xl bg-emergencia/15 p-3 text-sm text-red-200">{error}</p>}<button disabled={cargando} className="boton-campo boton-primario rounded-xl font-semibold disabled:opacity-50">{cargando ? "Verificando…" : "Ingresar"}</button></form>;
}
