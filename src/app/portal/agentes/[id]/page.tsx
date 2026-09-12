import Link from "next/link";
import { notFound } from "next/navigation";
import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { IconoFlecha, IconoPersona } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { servicio } from "@/lib/servicios";
import { agentesDeEmpresa, turnosDeAgenteEnEmpresa } from "../datos";
import { Estado, Resumen, iniciales } from "../ui";

export const metadata = { title: "Ficha de servicio — SOTERSA" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ficha de servicio de un agente vista por el cliente. Solo se abre si el
 * agente esta hoy en la plantilla de ESTA empresa; pedir la ficha de otro
 * agente por su id devuelve "no encontrado", no un error que revele que existe.
 */
export default async function PaginaFichaServicio({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ empresa?: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { perfil } = await exigirPerfil(["cliente", "admin", "operativo"]);
  const query = await searchParams;
  const empresaId = perfil.empresa_cliente_id ?? (esLector(perfil.rol) && /^[0-9a-f-]{36}$/i.test(query.empresa ?? "") ? query.empresa! : null);
  if (!empresaId) notFound();

  const { agentes } = await agentesDeEmpresa(empresaId);
  const agente = agentes.find((a) => a.id === id);
  if (!agente) notFound();

  const turnos = await turnosDeAgenteEnEmpresa(id, empresaId);
  const ahora = new Date().toISOString();
  const pasados = turnos.filter((t) => t.fin_programado <= ahora);
  const proximos = turnos.filter((t) => t.fin_programado > ahora).sort((a, b) => a.inicio_programado.localeCompare(b.inicio_programado));
  const abiertos = pasados.filter((t) => (t.aperturas_turno?.length ?? 0) > 0).length;
  const sufijo = esLector(perfil.rol) ? `?empresa=${empresaId}` : "";

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="cliente" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href={`/portal/agentes${sufijo}`} className="inline-flex items-center gap-1 text-sm font-medium text-azul-400"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver a los agentes</Link>
          {!esLector(perfil.rol) && <Link href="/perfiles" className="inline-flex items-center gap-1 text-sm font-medium text-gris-400"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Menú principal</Link>}
        </div>

        <section className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-azul-500/40 bg-azul-500/10 text-lg font-semibold text-azul-300">{iniciales(agente.nombre)}</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-azul-400"><IconoPersona className="h-5 w-5" /> Agente de seguridad SOTERSA</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{agente.nombre}</h1>
            <p className="mt-1 text-sm text-gris-400">Credencial {agente.credencial ?? "pendiente"}{agente.puesto ? ` · ${agente.puesto.codigo} ${agente.puesto.nombre}` : ""}{agente.esRelevo ? " · relevo" : ""}</p>
          </div>
          <Estado estado={agente.estado} />
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Resumen titulo="Turnos · 30 días" valor={pasados.length} />
          <Resumen titulo="Con apertura" valor={abiertos} normal />
          <Resumen titulo="Próximos" valor={proximos.length} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="panel-operativo p-5">
            <h2 className="font-semibold text-white">Ficha de servicio</h2>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <Dato etiqueta="Credencial SOTERSA" valor={agente.credencial ?? "Pendiente"} />
              <Dato etiqueta="En SOTERSA desde" valor={fechaEcuador(agente.desde)} />
              <Dato etiqueta="Puesto que cubre" valor={agente.puesto ? `${agente.puesto.codigo} · ${agente.puesto.nombre}` : "Por asignar"} />
              <Dato etiqueta="Modalidad" valor={agente.puesto ? servicio(agente.puesto.tipo_servicio).etiqueta : "—"} />
              <Dato etiqueta="Función" valor={agente.esRelevo ? "Relevo · cubre días libres del puesto" : "Agente fijo del puesto"} />
              <Dato etiqueta="Formación" valor="Constancias disponibles próximamente en la Escuela de Formación" />
            </dl>
          </div>
          <div className="panel-operativo p-5">
            <h2 className="font-semibold text-white">Cómo comunicarte</h2>
            <p className="mt-1 text-sm text-gris-400">Cualquier gestión sobre el agente o el puesto se canaliza por SOTERSA, no directamente con el agente.</p>
            {agente.puesto && agente.puesto.contactos.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {agente.puesto.contactos.filter((c) => c.tipo !== "administracion_cliente").map((c) => (
                  <li key={c.tipo} className="flex items-center justify-between gap-3 rounded-xl border border-borde/60 bg-white/[0.03] px-3 py-2.5 text-sm">
                    <div className="min-w-0"><p className="text-white">{etiquetaContacto(c.tipo)}</p>{c.nombre && <p className="truncate text-xs text-gris-500">{c.nombre}</p>}</div>
                    <a href={`tel:${c.telefono.replace(/[^\d+]/g, "")}`} className="shrink-0 rounded-full border border-azul-500/40 bg-azul-500/10 px-3 py-1.5 text-xs font-semibold text-azul-300">{c.telefono}</a>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-gris-500">SOTERSA está completando los contactos operativos de este puesto.</p>}
          </div>
        </section>

        <section className="panel-operativo p-5">
          <h2 className="font-semibold text-white">Próximos turnos en tus puestos</h2>
          <div className="mt-3"><ListaTurnos turnos={proximos.slice(0, 6)} /></div>
        </section>
        <section className="panel-operativo p-5">
          <h2 className="font-semibold text-white">Turnos recientes en tus puestos</h2>
          <p className="mt-1 text-sm text-gris-400">Últimos 30 días. La hora de apertura es la que el agente registró al recibir el puesto.</p>
          <div className="mt-3"><ListaTurnos turnos={pasados.slice(0, 10)} /></div>
        </section>

        <p className="text-xs leading-5 text-gris-500">Por protección de datos personales, esta ficha muestra únicamente la información de servicio del agente. Para cualquier gestión sobre el personal, comunícate con la central operativa de SOTERSA.</p>
      </main>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <div className="rounded-xl border border-borde/60 bg-white/[0.03] px-3 py-2"><dt className="text-xs text-gris-500">{etiqueta}</dt><dd className="mt-0.5 text-sm text-white">{valor}</dd></div>;
}
function etiquetaContacto(tipo: string) {
  return ({ central_monitoreo: "Central de monitoreo 24/7", supervisor_zona: "Supervisor de zona", jefe_operaciones: "Jefe de operaciones" } as Record<string, string>)[tipo] ?? tipo;
}
function fechaEcuador(iso: string) {
  return new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Guayaquil" }).format(new Date(iso));
}

function ListaTurnos({ turnos }: { turnos: { id: string; inicio_programado: string; fin_programado: string; estado: string; puestos: unknown; aperturas_turno: { hora_captura: string }[] | null }[] }) {
  if (turnos.length === 0) return <p className="text-sm text-gris-500">Sin turnos.</p>;
  return (
    <ul className="divide-y divide-borde/50">
      {turnos.map((t) => {
        const puesto = uno(t.puestos as { codigo: string; nombre: string } | { codigo: string; nombre: string }[] | null);
        const apertura = t.aperturas_turno?.[0]?.hora_captura ?? null;
        const [texto, clase] = t.estado === "abierto" ? ["En curso", "bg-normal/15 text-green-300"] : t.estado === "cerrado" ? ["Cumplido", "bg-azul-500/15 text-azul-300"] : t.estado === "ausente" ? ["Ausente", "bg-emergencia/15 text-red-300"] : ["Programado", "bg-slate-500/10 text-gris-400"];
        return (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0"><p className="truncate text-white">{puesto ? `${puesto.codigo} · ${puesto.nombre}` : "Puesto"}</p><p className="text-xs text-gris-500">{fechaHoraEcuador(t.inicio_programado)} → {fechaHoraEcuador(t.fin_programado)}{apertura ? ` · abierto ${fechaHoraEcuador(apertura)}` : ""}</p></div>
            <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${clase}`}>{texto}</span>
          </li>
        );
      })}
    </ul>
  );
}
