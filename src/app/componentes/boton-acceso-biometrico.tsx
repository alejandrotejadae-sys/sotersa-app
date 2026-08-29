"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconoHuella } from "@/app/componentes/iconos";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export function BotonAccesoBiometrico({ destino = "/perfiles" }: { destino?: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function ingresar() {
    setMensaje(null);
    if (!("PublicKeyCredential" in window)) {
      setMensaje("Este dispositivo no admite acceso con huella o Face ID.");
      return;
    }

    setCargando(true);
    try {
      const { data, error } = await crearClienteNavegador().auth.signInWithPasskey();
      if (error || !data?.user) {
        setMensaje(mensajeBiometria(error?.message));
        return;
      }
      router.push(data.user.user_metadata?.debe_cambiar_clave === true ? "/cambiar-clave" : destino);
      router.refresh();
    } catch (error) {
      setMensaje(mensajeBiometria(error instanceof Error ? error.message : undefined));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <button type="button" disabled={cargando} onClick={ingresar} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#27425e] bg-[#061426] text-sm font-medium text-slate-200 transition hover:border-[#0788ff]/70 disabled:opacity-50">
        <IconoHuella className="h-6 w-6 text-[#0788ff]" />
        {cargando ? "Verificando dispositivo…" : "Ingresar con huella o Face ID"}
      </button>
      {mensaje && <p role="alert" className="mt-3 rounded-xl border border-[#27425e] bg-[#041225] px-4 py-3 text-sm leading-5 text-slate-300">{mensaje}</p>}
    </div>
  );
}

function mensajeBiometria(detalle?: string) {
  const normalizado = detalle?.toLowerCase() ?? "";
  if (normalizado.includes("cancel") || normalizado.includes("abort") || normalizado.includes("notallowed")) return "La verificación fue cancelada o no fue autorizada.";
  if (normalizado.includes("passkey") || normalizado.includes("webauthn") || normalizado.includes("not found")) return "Primero activa la biometría desde Configuración del dispositivo después de ingresar con tu contraseña.";
  return "No fue posible usar la biometría. Ingresa con tu contraseña e inténtalo desde Configuración del dispositivo.";
}
