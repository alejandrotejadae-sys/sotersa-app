"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconoHuella } from "@/app/componentes/iconos";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

type Estado = "comprobando" | "permitido" | "denegado" | "pendiente" | "no-disponible";

export function ConfiguracionDispositivo() {
  const [ubicacion, setUbicacion] = useState<Estado>("comprobando");
  const [camara, setCamara] = useState<Estado>("comprobando");
  const [notificaciones, setNotificaciones] = useState<Estado>("comprobando");
  const [biometria, setBiometria] = useState<Estado>("comprobando");
  const [llaves, setLlaves] = useState(0);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const comprobar = useCallback(async () => {
    setNotificaciones("Notification" in window ? estadoPermiso(Notification.permission) : "no-disponible");

    if (!("PublicKeyCredential" in window)) setBiometria("no-disponible");
    else {
      try {
        const disponible = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometria(disponible ? "pendiente" : "no-disponible");
        if (disponible) {
          const { data } = await crearClienteNavegador().auth.passkey.list();
          setLlaves(data?.length ?? 0);
          if (data?.length) setBiometria("permitido");
        }
      } catch { setBiometria("no-disponible"); }
    }

    if (!navigator.permissions) {
      setUbicacion("pendiente");
      setCamara(camaraDisponible() ? "pendiente" : "no-disponible");
      return;
    }
    try {
      const permiso = await navigator.permissions.query({ name: "geolocation" });
      setUbicacion(estadoPermiso(permiso.state));
    } catch { setUbicacion("pendiente"); }
    try {
      const permiso = await navigator.permissions.query({ name: "camera" as PermissionName });
      setCamara(estadoPermiso(permiso.state));
    } catch { setCamara(camaraDisponible() ? "pendiente" : "no-disponible"); }
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(() => { void comprobar(); }, 0);
    return () => window.clearTimeout(temporizador);
  }, [comprobar]);

  async function pedirUbicacion() {
    setOcupado("ubicacion"); setMensaje(null);
    if (!navigator.geolocation) { setUbicacion("no-disponible"); setOcupado(null); return; }
    navigator.geolocation.getCurrentPosition(
      () => { setUbicacion("permitido"); setOcupado(null); setMensaje("Ubicación autorizada correctamente."); },
      () => { setUbicacion("denegado"); setOcupado(null); setMensaje("La ubicación fue rechazada. Puedes habilitarla desde los ajustes del navegador."); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function pedirCamara() {
    setOcupado("camara"); setMensaje(null);
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      flujo.getTracks().forEach((pista) => pista.stop());
      setCamara("permitido"); setMensaje("Cámara autorizada correctamente.");
    } catch { setCamara("denegado"); setMensaje("La cámara fue rechazada. Puedes habilitarla desde los ajustes del navegador."); }
    setOcupado(null);
  }

  async function pedirNotificaciones() {
    setOcupado("notificaciones"); setMensaje(null);
    if (!("Notification" in window)) { setNotificaciones("no-disponible"); setOcupado(null); return; }
    const permiso = await Notification.requestPermission();
    setNotificaciones(estadoPermiso(permiso));
    setMensaje(permiso === "granted" ? "Notificaciones autorizadas correctamente." : "Las notificaciones no fueron autorizadas en este dispositivo.");
    setOcupado(null);
  }

  async function activarBiometria() {
    setOcupado("biometria"); setMensaje(null);
    try {
      const { error } = await crearClienteNavegador().auth.registerPasskey();
      if (error) throw error;
      const { data } = await crearClienteNavegador().auth.passkey.list();
      setLlaves(data?.length ?? 1); setBiometria("permitido");
      setMensaje("Huella o Face ID activado para futuros ingresos.");
    } catch (error) {
      const detalle = error instanceof Error ? error.message.toLowerCase() : "";
      setMensaje(detalle.includes("cancel") || detalle.includes("abort") || detalle.includes("notallowed") ? "La activación biométrica fue cancelada o rechazada." : "La biometría todavía no está habilitada en el servicio de acceso. Las demás funciones del dispositivo sí están disponibles.");
    }
    setOcupado(null);
  }

  return (
    <section className="mt-7 space-y-3">
      <Permiso titulo="Ubicación" detalle="Registra la posición de rondas, aperturas e incidentes." estado={ubicacion} ocupado={ocupado === "ubicacion"} onClick={pedirUbicacion} icono={<Pin />} />
      <Permiso titulo="Cámara" detalle="Permite adjuntar evidencia y leer códigos QR." estado={camara} ocupado={ocupado === "camara"} onClick={pedirCamara} icono={<Camara />} />
      <Permiso titulo="Notificaciones" detalle="Recibe alertas y novedades operativas en el dispositivo." estado={notificaciones} ocupado={ocupado === "notificaciones"} onClick={pedirNotificaciones} icono={<Campana />} />
      <Permiso titulo="Huella o Face ID" detalle={llaves ? `${llaves} acceso biométrico registrado.` : "Ingresa la próxima vez sin escribir tu contraseña."} estado={biometria} ocupado={ocupado === "biometria"} onClick={activarBiometria} icono={<IconoHuella className="h-7 w-7" />} />

      {mensaje && <p role="status" className="rounded-xl border border-[#27425e] bg-[#07172a] px-4 py-3 text-sm leading-5 text-slate-300">{mensaje}</p>}
      <div className="flex flex-col gap-3 pt-3 sm:flex-row">
        <Link href="/perfiles" className="boton-primario grid min-h-13 flex-1 place-items-center rounded-xl px-5 font-semibold text-white">Volver a los perfiles</Link>
        <Link href="/guardia?desde=perfiles" className="grid min-h-13 flex-1 place-items-center rounded-xl border border-[#27425e] bg-[#07172a] px-5 font-medium text-slate-200">Ir al panel operativo</Link>
      </div>
      <p className="pt-2 text-center text-xs leading-5 text-slate-500">Los permisos se guardan en este dispositivo y puedes revocarlos desde los ajustes del navegador o del teléfono.</p>
    </section>
  );
}

function Permiso({ titulo, detalle, estado, ocupado, onClick, icono }: { titulo: string; detalle: string; estado: Estado; ocupado: boolean; onClick: () => void | Promise<void>; icono: React.ReactNode }) {
  const terminado = estado === "permitido";
  return <article className="flex items-center gap-4 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0788ff]/12 text-[#49b6ff]">{icono}</span><div className="min-w-0 flex-1"><h2 className="font-semibold">{titulo}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{detalle}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide ${terminado ? "bg-emerald-500/12 text-emerald-300" : estado === "denegado" ? "bg-red-500/12 text-red-300" : "bg-slate-500/10 text-slate-400"}`}>{rotuloEstado(estado)}</span></div><button type="button" onClick={onClick} disabled={ocupado || estado === "no-disponible"} className="min-h-11 shrink-0 rounded-xl border border-[#0788ff]/60 px-3 text-xs font-semibold text-[#49b6ff] disabled:border-slate-700 disabled:text-slate-600">{ocupado ? "Espera…" : terminado ? "Revisar" : "Activar"}</button></article>;
}

function estadoPermiso(estado: PermissionState | NotificationPermission): Estado { return estado === "granted" ? "permitido" : estado === "denied" ? "denegado" : "pendiente"; }
function camaraDisponible() { return "mediaDevices" in navigator && typeof navigator.mediaDevices.getUserMedia === "function"; }
function rotuloEstado(estado: Estado) { return ({ comprobando: "Comprobando", permitido: "Autorizado", denegado: "Bloqueado", pendiente: "Pendiente", "no-disponible": "No disponible" } as const)[estado]; }
function Pin() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>; }
function Camara() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4Z"/><circle cx="12" cy="13" r="3"/></svg>; }
function Campana() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden><path d="M6 16.5h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v4.5Z"/><path d="M10 19h4"/></svg>; }
