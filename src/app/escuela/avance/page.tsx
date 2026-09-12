import Link from "next/link";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import { MODULOS, MODULOS_BASICOS, TOTAL_LECCIONES } from "@/lib/formacion";
import { esLector } from "@/lib/roles";
import { Etiqueta, MarcoEscuela, TONO } from "../ui";

export const metadata = { title: "Avance del equipo — Escuela SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Quien completo que. Sirve para dos cosas: saber a quien le falta, y tener
 * con que responder cuando un cliente o una auditoria BASC pregunte por la
 * capacitacion del personal.
 *
 * "Formacion basica completa" = todos los modulos de alcance general
 * aprobados. Los modulos por tipo de cliente y el de supervision se muestran
 * pero no cuentan para ese estado.
 */
export default async function PaginaAvance() {
  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor", "operativo"]);

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

  const idsBasicos = new Set(MODULOS_BASICOS.map((m) => m.id));
  const filas = (agentesR.data ?? []).map((a) => {
    const hechas = lecciones.get(a.perfil_id!) ?? new Set<string>();
    const modulos = MODULOS.map((m) => {
      const l = m.lecciones.filter((x) => hechas.has(`${m.id}/${x.id}`)).length;
      const ev = mejor.get(`${a.perfil_id}/${m.id}`) ?? null;
      return { id: m.id, codigo: m.codigo, titulo: m.titulo, color: m.color, basico: idsBasicos.has(m.id), hechas: l, total: m.lecciones.length, ev, completo: l === m.lecciones.length && Boolean(ev?.aprobado) };
    });
    const ultimo = modulos.map((m) => m.ev?.respondido_en ?? "").filter(Boolean).sort().at(-1) ?? null;
    const basicosCompletos = modulos.filter((m) => m.basico && m.completo).length;
    return { id: a.id, nombre: a.nombre, hechas: hechas.size, modulos, basicosCompletos, completos: modulos.filter((m) => m.completo).length, ultimo };
  });

  const formacionCompleta = filas.filter((f) => f.basicosCompletos === MODULOS_BASICOS.length).length;
  const sinEmpezar = filas.filter((f) => f.hechas === 0).length;

  return (
    <MarcoEscuela volver={{ href: "/escuela", texto: "Escuela de Formación" }} ancho="md:max-w-5xl">
      <header className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0788ff]">Seguimiento</p>
        <h1 className="mt-2 text-3xl font-bold">Avance del equipo</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Agentes activos con acceso a la app. Un módulo cuenta como completo cuando se leyeron todas sus lecciones y se aprobó la evaluación. La formación básica son los {MODULOS_BASICOS.length} módulos generales; los de tipo de cliente y supervisión se muestran aparte.</p>
      </header>

      {!disponible && <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">Las tablas de avance aún no existen en la base de datos; por eso todo aparece en cero.</p>}

      <section className="mt-5 grid grid-cols-3 gap-3">
        <Dato titulo="Agentes" valor={String(filas.length)} />
        <Dato titulo="Formación básica completa" valor={String(formacionCompleta)} tono="verde" />
        <Dato titulo="Sin empezar" valor={String(sinEmpezar)} tono={sinEmpezar > 0 ? "ambar" : undefined} />
      </section>

      <section className="mt-5 space-y-3">
        {filas.length === 0 ? <p className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 px-4 py-8 text-center text-sm text-slate-500">No hay agentes con acceso a la app.</p> : filas.map((f) => (
          <details key={f.id} className="group rounded-2xl border border-[#27425e] bg-[#07172a]/95">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{f.nombre}</p>
                <p className="text-xs text-slate-500">{f.hechas}/{TOTAL_LECCIONES} lecciones · {f.completos}/{MODULOS.length} módulos{f.ultimo ? ` · última evaluación ${fechaHoraEcuador(f.ultimo)}` : ""}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {f.basicosCompletos === MODULOS_BASICOS.length ? <Etiqueta tono="verde">Formación básica completa</Etiqueta> : f.hechas === 0 ? <Etiqueta tono="gris">Sin empezar</Etiqueta> : <Etiqueta tono="azul">Básica {f.basicosCompletos}/{MODULOS_BASICOS.length}</Etiqueta>}
                <span className="text-slate-500 transition group-open:rotate-180">⌄</span>
              </div>
            </summary>
            <div className="grid gap-2 border-t border-[#20374e] px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
              {f.modulos.map((m) => (
                <div key={m.id} title={m.titulo} className="flex items-center gap-2 rounded-xl border border-[#20374e] bg-[#041225] px-3 py-2 text-xs">
                  <span className={`w-9 shrink-0 font-mono ${TONO[m.color].texto}`}>{m.codigo}</span>
                  <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-[#0b2035]"><div className={`h-full ${TONO[m.color].barra}`} style={{ width: `${Math.round((m.hechas / m.total) * 100)}%` }} /></div>
                  <span className="shrink-0 text-slate-400">{m.hechas}/{m.total}</span>
                  <span className={`ml-auto shrink-0 ${m.ev ? (m.ev.aprobado ? "text-emerald-300" : "text-amber-300") : "text-slate-600"}`}>{m.ev ? `${m.ev.puntaje} %` : "—"}</span>
                </div>
              ))}
            </div>
            {esLector(perfil.rol) && <div className="border-t border-[#20374e] px-4 py-2 text-right"><Link href={`/operacion/personal/${f.id}`} className="text-xs font-medium text-[#8ddaff]">Ver ficha del agente →</Link></div>}
          </details>
        ))}
      </section>
    </MarcoEscuela>
  );
}

function Dato({ titulo, valor, tono }: { titulo: string; valor: string; tono?: "verde" | "ambar" }) {
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-3 text-center"><p className={`text-2xl font-bold ${tono === "verde" ? "text-emerald-300" : tono === "ambar" ? "text-amber-300" : "text-white"}`}>{valor}</p><p className="mt-1 text-[0.7rem] text-slate-400">{titulo}</p></article>;
}
