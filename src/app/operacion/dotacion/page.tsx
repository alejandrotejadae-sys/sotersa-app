import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import {
  IconoEscudoOk,
  IconoFlecha,
  IconoPersona,
} from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";
import { servicio } from "@/lib/servicios";
import { Asignador } from "./asignador";
import { alternarRelevo, liberarAgente } from "./acciones";

export const metadata = { title: "Dotación por puesto — SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Las plazas las define la modalidad contratada, no las horas sueltas: un
 * punto de 24 h son dos fijos de 12 h; los de 12 h, uno. El saca francos no
 * cuenta aquí — no tiene plaza, cubre los días libres de varios puestos.
 */
function plazasDe(tipoServicio: string | null) {
  return servicio(tipoServicio).fijos;
}

export default async function PaginaDotacion() {
  const { supabase } = await exigirPerfil(["admin"]);

  const [empresasR, puestosR, guardiasR] = await Promise.all([
    supabase
      .from("empresas_cliente")
      .select("id,nombre,activo")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("puestos")
      .select("id,empresa_cliente_id,codigo,nombre,cobertura_horas,armado,tipo_servicio,origen,destino")
      .eq("activo", true)
      .order("codigo"),
    supabase
      .from("guardias")
      .select("id,nombre,cedula,puesto_habitual_id,es_relevo")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const empresas = empresasR.data ?? [];
  const puestos = puestosR.data ?? [];
  const guardias = guardiasR.data ?? [];

  const relevos = guardias.filter((g) => g.es_relevo);
  const sinPlaza = guardias.filter((g) => !g.es_relevo && !g.puesto_habitual_id);
  const disponibles = [...sinPlaza, ...relevos];

  const plazasTotales = puestos.reduce(
    (t, p) => t + plazasDe(p.tipo_servicio),
    0,
  );
  const cubiertas = guardias.filter(
    (g) => !g.es_relevo && g.puesto_habitual_id,
  ).length;

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-16 pt-6 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <Marca tamano="panel" />
          <span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            <Pulso /> En línea
          </span>
        </header>

        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"
        >
          <span className="rotate-180">
            <IconoFlecha className="h-4 w-4" />
          </span>{" "}
          Volver al panel
        </Link>

        <section className="mt-5">
          <p className="flex items-center gap-2 text-base font-medium text-[#0788ff]">
            <IconoEscudoOk className="h-6 w-6" /> Operación
          </p>
          <h1 className="mt-2 text-3xl font-bold lg:text-4xl">
            Dotación por puesto
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Qué plazas tiene cada puesto, cuáles están cubiertas y quién falta.
          </p>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Resumen titulo="Puestos activos" valor={puestos.length} />
          <Resumen titulo="Plazas fijas" valor={plazasTotales} />
          <Resumen
            titulo="Cubiertas"
            valor={cubiertas}
            alerta={cubiertas < plazasTotales}
          />
          <Resumen titulo="Relevos" valor={relevos.length} />
        </section>

        {sinPlaza.length > 0 && (
          <section className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <h2 className="font-semibold text-amber-200">
              {sinPlaza.length} agente{sinPlaza.length === 1 ? "" : "s"} sin
              plaza asignada
            </h2>
            <p className="mt-1 text-sm text-amber-100/80">
              Están en la nómina pero no pertenecen a ningún puesto. Asígnalos
              abajo, o márcalos como relevo si cubren varios.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {sinPlaza.map((g) => (
                <li key={g.id}>
                  <form action={alternarRelevo}>
                    <input type="hidden" name="guardia_id" value={g.id} />
                    <input type="hidden" name="activar" value="1" />
                    <button className="rounded-full border border-amber-400/40 bg-[#041225] px-3 py-1.5 text-xs text-amber-100">
                      {g.nombre}
                      <span className="ml-2 text-amber-300">
                        marcar relevo
                      </span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-5 space-y-4">
          {empresas.map((empresa) => {
            const suyos = puestos.filter(
              (p) => p.empresa_cliente_id === empresa.id,
            );
            if (suyos.length === 0) return null;

            return (
              <section
                key={empresa.id}
                className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"
              >
                <div className="border-b border-[#20374e] px-4 py-3.5">
                  <h2 className="font-semibold">{empresa.nombre}</h2>
                  <p className="text-xs text-slate-500">
                    {suyos.length} puesto{suyos.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="divide-y divide-[#20374e]">
                  {suyos.map((puesto) => {
                    const plazas = plazasDe(puesto.tipo_servicio);
                    const modalidad = servicio(puesto.tipo_servicio);
                    const asignados = guardias.filter(
                      (g) => g.puesto_habitual_id === puesto.id,
                    );
                    const falta = plazas - asignados.length;

                    return (
                      <article key={puesto.id} className="px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs tracking-widest text-[#0788ff]">
                              {puesto.codigo}
                              {puesto.armado && (
                                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] text-amber-300">
                                  ARMADO
                                </span>
                              )}
                            </p>
                            <h3 className="mt-0.5 font-semibold">
                              {puesto.nombre}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {modalidad.etiqueta} · {plazas} plaza
                              {plazas === 1 ? "" : "s"} fija
                              {plazas === 1 ? "" : "s"}
                              {modalidad.requiereRelevo && " + relevo"}
                            </p>
                            {puesto.origen && puesto.destino && (
                              <p className="mt-1 text-xs text-[#65c8ff]">
                                {puesto.origen} → {puesto.destino}
                              </p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                              falta > 0
                                ? "bg-amber-500/12 text-amber-300"
                                : falta < 0
                                  ? "bg-[#0788ff]/12 text-[#65c8ff]"
                                  : "bg-emerald-500/12 text-emerald-300"
                            }`}
                          >
                            {asignados.length}/{plazas}
                            {falta > 0
                              ? ` · faltan ${falta}`
                              : falta < 0
                                ? ` · ${-falta} de más`
                                : " · completo"}
                          </span>
                        </div>

                        {asignados.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {asignados.map((g) => (
                              <li
                                key={g.id}
                                className="flex items-center gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5"
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#27425e] text-[#49b6ff]">
                                  <IconoPersona className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">
                                    {g.nombre}
                                  </span>
                                  <span className="font-mono text-xs text-slate-500">
                                    {g.cedula ?? "sin cédula"}
                                  </span>
                                </span>
                                <form action={liberarAgente}>
                                  <input
                                    type="hidden"
                                    name="guardia_id"
                                    value={g.id}
                                  />
                                  <button className="rounded-full border border-[#27425e] px-3 py-1.5 text-xs text-slate-400">
                                    Liberar
                                  </button>
                                </form>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Asignador
                          puestoId={puesto.id}
                          disponibles={disponibles.map((g) => ({
                            id: g.id,
                            nombre: g.nombre,
                            es_relevo: g.es_relevo,
                          }))}
                        />
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {relevos.length > 0 && (
          <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4">
            <h2 className="font-semibold">Personal de relevo</h2>
            <p className="mt-1 text-sm text-slate-400">
              Saca francos y saca vacaciones. No tienen plaza fija: cubren los
              días libres de distintos puestos, y su puesto de cada día se
              define en el turno.
            </p>
            <ul className="mt-3 space-y-2">
              {relevos.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {g.nombre}
                  </span>
                  <form action={alternarRelevo}>
                    <input type="hidden" name="guardia_id" value={g.id} />
                    <input type="hidden" name="activar" value="0" />
                    <button className="rounded-full border border-[#27425e] px-3 py-1.5 text-xs text-slate-400">
                      Ya no es relevo
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Resumen({
  titulo,
  valor,
  alerta,
}: {
  titulo: string;
  valor: number;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 px-4 py-3.5">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p
        className={`mt-1 text-2xl font-bold ${alerta ? "text-amber-300" : "text-white"}`}
      >
        {valor}
      </p>
    </div>
  );
}
