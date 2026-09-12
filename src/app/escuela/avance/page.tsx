import Link from "next/link";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import { MODULOS, TOTAL_LECCIONES } from "@/lib/formacion";
import { Etiqueta, MarcoEscuela, TONO } from "../ui";

export const metadata = { title: "Avance del equipo — Escuela SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Quien completo que. Sirve para dos cosas: saber a quien le falta, y tener
 * con que responder cuando un cliente o una auditoria BASC pregunte por la
 * capacitacion del personal.
 */
export default async function PaginaAvance() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);

  const [agentesR, progresoR, evaluacionesR] = await Promise.all([
    supabase.from("guardias").select("id,nombre,perfil_id,activo").eq("activo", true).not("perfil_id", "is", null).order("nombre"),
    supabase.from("formacion_progreso").select("perfil_id,leccion_id"),
    supabase.from("formacion_evaluaciones").select("perfil_id,modulo_id,puntaje,aprobado,respondido_en").order("respondido_en", { ascending: false }),
  ]);
  const disponible = progresoR.error?.code !== "PGRST205";

  const lecciones = new Map<string, Set<string>>();
  for (const p of progresoR.data ?? []) {
    if (!lecciones.has(p.perfil_id)) lecciones.set(p.perfil_id, new Set());
    lecciones.get(p.perfil_id)!.add(p.leccion_id);
  }
  const mejor = new Map<string, { puntaje: number; aprobado: boolean; respondido_en: string }>();
  for (const e of evaluacionesR.data ?? []) {
    const k = `${e.perfil_id}/${e.modulo_id}`;
    const actual = mejor.get(k);
    if (!actual || e.puntaje > actual.puntaje) mejor.set(k, { puntaje: e.puntaje, aprobado: e.aprobado, respondido_en: e.respondido_en });
  }

  const filas = (agentesR.data ?? []).map((a) => {
    const hechas = lecciones.get(a.perfil_id!) ?? new Set<string>();
    const modulos = MODULOS.map((m) => {
      const l = m.lecciones.filter((x) => hechas.has(`${m.id}/${x.id}`)).length;
      const ev = mejor.get(`${a.perfil_id}/${m.id}`) ?? null;
      return { id: m.id, codigo: m.codigo, color: m.color, hechas: l, total: m.lecciones.length, ev, completo: l === m.lecciones.length && Boolean(ev?.aprobado) };
    });
    const ultimo = [...modulos.map((m) => m.ev?.respondido_en ?? "")].filter(Boolean).sort().at(-1) ?? null;
    return { id: a.id, nombre: a.nombre, hechas: hechas.size, modulos, completos: modulos.filter((m) => m.completo).length, ultimo };
  });

  const certificados = filas.filter((f) => f.completos === MODULOS.length).length;
  const sinEmpezar = filas.filter((f) => f.hechas === 0).length;

  return (
    <MarcoEscuela volver={{ href: "/escuela", texto: "Escuela de Formación" }} ancho="md:max-w-5xl">
      <header className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0788ff]">Seguimiento</p>
        <h1 className="mt-2 text-3xl font-bold">Avance del equipo</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Agentes activos con acceso a la app. Cada módulo se da por completo cuando se leyeron todas sus lecciones y se aprobó la evaluación.</p>
      </header>

      {!disponible && <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">Las tablas de avance aún no existen en la base de datos; por eso todo aparece en cero.</p>}

      <section className="mt-5 grid grid-cols-3 gap-3">
        <Dato titulo="Agentes" valor={String(filas.length)} />
        <Dato titulo="Formación completa" valor={String(certificados)} tono="verde" />
        <Dato titulo="Sin empezar" valor={String(sinEmpezar)} tono={sinEmpezar > 0 ? "ambar" : undefined} />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95">
        <div className="hidden grid-cols-[1.4fr_repeat(3,1fr)_auto] gap-3 border-b border-[#20374e] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid">
          <span>Agente</span>{MODULOS.map((m) => <span key={m.id}>{m.codigo} · {m.titulo.split(":")[0].split(" en ")[0]}</span>)}<span>Estado</span>
        </div>
        {filas.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No hay agentes con acceso a la app.</p> : (
          <ul className="divide-y divide-[#20374e]">
            {filas.map((f) => (
              <li key={f.id} className="grid gap-3 px-4 py-3.5 md:grid-cols-[1.4fr_repeat(3,1fr)_auto] md:items-center">
                <div className="min-w-0"><Link href={perfil.rol === "admin" ? `/operacion/personal/${f.id}` : "#"} className="block truncate font-medium text-white">{f.nombre}</Link><p className="text-xs text-slate-500">{f.hechas}/{TOTAL_LECCIONES} lecciones{f.ultimo ? ` · última evaluación ${fechaHoraEcuador(f.ultimo)}` : ""}</p></div>
                {f.modulos.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <span className={`md:hidden font-mono ${TONO[m.color].texto}`}>{m.codigo}</span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#0b2035]"><div className={`h-full ${TONO[m.color].barra}`} style={{ width: `${Math.round((m.hechas / m.total) * 100)}%` }} /></div>
                    <span className="text-slate-400">{m.hechas}/{m.total}</span>
                    {m.ev && <span className={m.ev.aprobado ? "text-emerald-300" : "text-amber-300"}>{m.ev.puntaje} %</span>}
                  </div>
                ))}
                <div>{f.completos === MODULOS.length ? <Etiqueta tono="verde">Formación completa</Etiqueta> : f.hechas === 0 ? <Etiqueta tono="gris">Sin empezar</Etiqueta> : <Etiqueta tono="azul">{f.completos}/{MODULOS.length} módulos</Etiqueta>}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MarcoEscuela>
  );
}

function Dato({ titulo, valor, tono }: { titulo: string; valor: string; tono?: "verde" | "ambar" }) {
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-3 text-center"><p className={`text-2xl font-bold ${tono === "verde" ? "text-emerald-300" : tono === "ambar" ? "text-amber-300" : "text-white"}`}>{valor}</p><p className="mt-1 text-[0.7rem] text-slate-400">{titulo}</p></article>;
}
