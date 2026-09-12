import Link from "next/link";
import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { IconoFlecha, IconoPersona } from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";
import { agentesDeEmpresa } from "./datos";
import { Estado, Resumen, iniciales } from "./ui";

export const metadata = { title: "Agentes de seguridad — SOTERSA" };
export const dynamic = "force-dynamic";

/** Plantilla que cubre los puestos del cliente. Un admin puede verla con ?empresa=. */
export default async function PaginaAgentesCliente({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { perfil } = await exigirPerfil(["cliente", "admin"]);
  const params = await searchParams;
  const empresaId = perfil.empresa_cliente_id ?? (perfil.rol === "admin" && /^[0-9a-f-]{36}$/i.test(params.empresa ?? "") ? params.empresa! : null);

  const { agentes, puestos } = empresaId ? await agentesDeEmpresa(empresaId) : { agentes: [], puestos: [] };
  const enPuesto = agentes.filter((a) => a.estado === "en_puesto").length;
  const sufijo = perfil.rol === "admin" && empresaId ? `?empresa=${empresaId}` : "";

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="cliente" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <Link href={`/portal${sufijo}`} className="inline-flex items-center gap-1 self-start text-sm font-medium text-azul-400"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al portal</Link>

        <section>
          <p className="flex items-center gap-2 text-sm font-medium text-azul-400"><IconoPersona className="h-5 w-5" /> Tu servicio</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Agentes de seguridad</h1>
          <p className="mt-1 text-sm text-gris-400">El personal de SOTERSA asignado a tus puestos. Toca un agente para ver su ficha de servicio.</p>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Resumen titulo="Agentes" valor={agentes.length} />
          <Resumen titulo="En puesto ahora" valor={enPuesto} normal />
          <Resumen titulo="Puestos" valor={puestos.length} />
        </section>

        <section className="panel-operativo overflow-hidden">
          <div className="border-b border-borde/50 px-5 py-4"><h2 className="text-lg font-semibold text-white">Plantilla asignada</h2></div>
          {agentes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gris-400">Todavía no hay agentes asignados a tus puestos.</p>
          ) : (
            <div className="divide-y divide-borde/50">
              {agentes.map((a) => (
                <Link key={a.id} href={`/portal/agentes/${a.id}${sufijo}`} className="grid grid-cols-[3rem_1fr_auto_1.25rem] items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-none">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-azul-500/40 bg-azul-500/10 text-xs font-semibold text-azul-300">{iniciales(a.nombre)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{a.nombre}</p>
                    <p className="truncate text-sm text-gris-400">{a.puesto ? `${a.puesto.codigo} · ${a.puesto.nombre}` : "Puesto por asignar"}{a.esRelevo ? " · relevo" : ""}</p>
                    <p className="mt-1 text-xs text-gris-500">Credencial {a.credencial ?? "pendiente"}</p>
                  </div>
                  <Estado estado={a.estado} />
                  <IconoFlecha className="h-4 w-4 text-gris-500" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
