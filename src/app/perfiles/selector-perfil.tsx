"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconoCamion, IconoEscudoOk, IconoPersona, IconoSalir, IconoTurno } from "@/app/componentes/iconos";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

type Perfil = "cliente" | "guardia" | "custodia" | "supervisor" | "central";

const perfiles: Array<{ id: Perfil; etiqueta: string; detalle: string; icono: React.ReactNode }> = [
  { id: "cliente", etiqueta: "Cliente", detalle: "Estado del servicio y reportes", icono: <IconoPersona className="h-7 w-7" /> },
  { id: "guardia", etiqueta: "Agente de seguridad", detalle: "Turno, asistencia y rondas", icono: <IconoTurno className="h-7 w-7" /> },
  { id: "custodia", etiqueta: "Custodia armada", detalle: "Operación, ruta y comunicación segura", icono: <IconoCamion className="h-7 w-7" /> },
  { id: "supervisor", etiqueta: "Supervisor", detalle: "Personal, puestos y novedades", icono: <IconoEscudoOk className="h-7 w-7" /> },
  { id: "central", etiqueta: "Central operativa", detalle: "Control general de la operación", icono: <Central className="h-7 w-7" /> },
];

const destinos: Record<Perfil, string> = { cliente: "/portal", guardia: "/guardia?desde=perfiles", custodia: "/guardia/custodia", supervisor: "/supervisor", central: "/admin" };

export function SelectorPerfil() {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<Perfil>("central");
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    await crearClienteNavegador().auth.signOut();
    router.push("/acceso");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-1 flex-col">
      <div className="space-y-3" role="radiogroup" aria-label="Selecciona tu perfil de acceso">
        {perfiles.map((perfil) => {
          const activo = seleccionado === perfil.id;
          return (
            <button key={perfil.id} type="button" role="radio" aria-checked={activo} onClick={() => setSeleccionado(perfil.id)} className={`flex min-h-[92px] w-full items-center gap-4 rounded-2xl border-2 px-4 text-left transition ${activo ? "border-[#00cfff] bg-[#08213a] shadow-[0_0_24px_rgba(0,166,255,0.12)]" : "border-[#344659] bg-[#07172a]/80"}`}>
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${activo ? "bg-[#087ff0] text-white" : "bg-[#0b2137] text-[#0788ff]"}`}>{perfil.icono}</span>
              <span className="min-w-0 flex-1"><span className="block text-lg font-semibold text-white">{perfil.etiqueta}</span><span className="mt-1 block text-sm text-slate-400">{perfil.detalle}</span></span>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${activo ? "border-[#087ff0] bg-[#087ff0] text-white" : "border-slate-600 text-transparent"}`}>✓</span>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={() => router.push(destinos[seleccionado])} className="boton-primario mt-7 min-h-14 w-full rounded-xl text-base font-semibold text-white">Continuar</button>
      <div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={() => router.push("/mi-perfil")} className="min-h-12 rounded-xl border border-[#27425e] bg-[#07172a]/80 text-sm font-medium text-[#8ddaff]">Mi perfil</button><button type="button" onClick={() => router.push("/configuracion/dispositivo")} className="min-h-12 rounded-xl border border-[#27425e] bg-[#07172a]/80 text-sm font-medium text-[#8ddaff]">Dispositivo</button></div>
      <button type="button" disabled={saliendo} onClick={cerrarSesion} className="mt-4 flex min-h-12 items-center justify-center gap-2 text-sm font-medium text-slate-400 disabled:opacity-50"><IconoSalir className="h-5 w-5" /> {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}</button>
    </div>
  );
}

function Central({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M4 20V8l8-4 8 4v12"/><path d="M8 20v-7h8v7M3 20h18"/><circle cx="12" cy="9" r="1.5"/></svg>;
}
