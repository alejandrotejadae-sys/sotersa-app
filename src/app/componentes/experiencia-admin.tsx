"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotonSalir } from "@/app/guardia/perfil/boton-salir";
import {
  IconoAlerta,
  IconoCamion,
  IconoCasa,
  IconoCiclo,
  IconoEscudoOk,
  IconoLibro,
  IconoLista,
  IconoMapa,
  IconoPersona,
  IconoTurno,
} from "@/app/componentes/iconos";
import { Marca, Pulso } from "@/app/componentes/marca";

type Props = {
  activo: boolean;
  nombre: string;
  rol: string;
  children: React.ReactNode;
};

const RUTAS_SHELL = ["/admin", "/central", "/supervisor", "/operacion", "/configuracion", "/escuela"];

const NAVEGACION = [
  { href: "/admin", texto: "Panel general", icono: IconoCasa },
  { href: "/operacion/clientes", texto: "Clientes", icono: IconoPersona },
  { href: "/operacion/personal", texto: "Agentes", icono: IconoEscudoOk },
  { href: "/operacion/turnos", texto: "Turnos", icono: IconoTurno },
  { href: "/operacion/rondas", texto: "Rondas", icono: IconoCiclo },
  { href: "/operacion/custodias", texto: "Custodias", icono: IconoCamion },
  { href: "/supervisor", texto: "Supervisión", icono: IconoMapa },
  { href: "/central", texto: "Central operativa", icono: IconoMapa },
  { href: "/operacion/novedades", texto: "Novedades", icono: IconoAlerta },
  { href: "/operacion/reportes", texto: "Reportes", icono: IconoLista },
  { href: "/escuela", texto: "Escuela", icono: IconoLibro },
];

export function ExperienciaAdmin({ activo, nombre, rol, children }: Props) {
  const ruta = usePathname();
  const usarShell = activo && RUTAS_SHELL.some((base) => ruta === base || ruta.startsWith(`${base}/`));

  if (!usarShell) return children;

  return (
    <div className="sot-app-shell min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sot-sidebar hidden h-dvh flex-col border-r border-[#16334e] bg-[#041122]/95 px-4 py-5 lg:sticky lg:top-0 lg:flex">
        <Link href="/admin" className="px-2" aria-label="Ir al panel general">
          <Marca tamano="panel" />
        </Link>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-xs text-emerald-300">
          <Pulso /> Sistema operativo
        </div>

        <nav aria-label="Navegación administrativa" className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {NAVEGACION.map((item) => {
            const Icono = item.icono;
            const seleccionado = item.href === "/admin"
              ? ruta === "/admin" || ruta.startsWith("/admin/")
              : ruta === item.href || ruta.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} aria-current={seleccionado ? "page" : undefined} className={`sot-nav-item ${seleccionado ? "sot-nav-item-activo" : ""}`}>
                <Icono className="h-5 w-5" />
                <span>{item.texto}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-[#16334e] pt-4">
          <Link href="/mi-perfil" className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#23628c] bg-[#09233d] text-xs font-bold text-azul-300">{iniciales(nombre)}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{nombre}</span><span className="block text-xs capitalize text-slate-500">{rol}</span></span>
          </Link>
          <div className="mt-2 [&_button]:min-h-10 [&_button]:border-0 [&_button]:text-sm hover:[&_button]:bg-white/[0.04]">
            <BotonSalir destino="/acceso" />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#16334e] bg-[#031022]/92 px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
          <Link href="/admin" aria-label="Ir al inicio"><Marca /></Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1.5 text-[0.68rem] text-emerald-300"><Pulso /> En línea</span>
            <Link href="/mi-perfil" aria-label="Mi perfil" className="grid h-10 w-10 place-items-center rounded-full border border-[#23628c] bg-[#09233d] text-xs font-bold text-azul-300">{iniciales(nombre)}</Link>
          </div>
        </header>

        <div className="sot-shell-content">{children}</div>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[#1a3a57] bg-[#031022]/96 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <Movil href="/admin" texto="Inicio" icono={<IconoCasa className="h-6 w-6" />} activo={ruta.startsWith("/admin")} />
        <Movil href="/central" texto="Operación" icono={<IconoMapa className="h-6 w-6" />} activo={ruta === "/central" || ruta === "/supervisor" || ruta.includes("turnos") || ruta.includes("rondas")} />
        <Movil href="/operacion/novedades" texto="Alertas" icono={<IconoAlerta className="h-6 w-6" />} activo={ruta.includes("novedades")} />
        <Movil href="/mi-perfil" texto="Perfil" icono={<IconoPersona className="h-6 w-6" />} activo={ruta === "/mi-perfil"} />
      </nav>
    </div>
  );
}

function Movil({ href, texto, icono, activo }: { href: string; texto: string; icono: React.ReactNode; activo: boolean }) {
  return <Link href={href} aria-current={activo ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium ${activo ? "text-azul-300" : "text-slate-500"}`}>{icono}<span>{texto}</span></Link>;
}

function iniciales(nombre: string) {
  return nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase() || "SO";
}
