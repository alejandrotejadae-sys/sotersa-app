import Link from "next/link";
import { IconoFlecha, IconoLibro } from "@/app/componentes/iconos";
import { exigirPerfil } from "@/lib/sesion";
import { GRUPOS, MODULOS, MODULOS_BASICOS, TOTAL_LECCIONES } from "@/lib/formacion";
import { avanceDe, resumenModulo } from "./datos";
import { Barra, Etiqueta, MarcoEscuela, TONO } from "./ui";

export const metadata = { title: "Escuela de Formación — SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Catalogo de la Escuela de Formacion SOTERSA con el avance de quien entra.
 * El contenido es el mismo para todos los roles; lo que cambia es de donde
 * se vuelve y si el admin ve el resumen del equipo.
 */
export default async function PaginaEscuela() {
  const { supabase, user, perfil } = await exigirPerfil(["guardia", "supervisor", "admin", "cliente"]);
  const avance = await avanceDe(supabase, user.id);
  const hechas = avance.completadas.size;
  const aprobados = MODULOS.filter((m) => avance.evaluaciones.get(m.id)?.aprobado).length;
  const basicosCompletos = MODULOS_BASICOS.filter((m) => resumenModulo(avance, m.id).completo).length;
  const volver = perfil.rol === "admin" ? { href: "/admin", texto: "Panel administrativo" } : perfil.rol === "supervisor" ? { href: "/supervisor", texto: "Panel de supervisión" } : { href: "/perfiles", texto: "Menú principal" };

  return (
    <MarcoEscuela volver={volver}>
      <header className="mt-6 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#087ff0]/15 text-[#49b6ff]"><IconoLibro className="h-8 w-8" /></span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#0788ff]">Capacitación</p>
        <h1 className="mt-2 text-3xl font-bold">Escuela de Formación Sotersa</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {perfil.rol === "cliente"
            ? "Así formamos a los agentes que cuidan tus instalaciones. Puedes recorrer los mismos módulos que ellos."
            : `Hola, ${perfil.nombre.split(" ")[0]}. ${MODULOS.length} módulos, ${TOTAL_LECCIONES} lecciones cortas y una evaluación por módulo. Empieza por la base; lo demás, a tu ritmo, desde el teléfono, entre turnos.`}
        </p>
      </header>

      {perfil.rol !== "cliente" && (
        <section className="mt-6 grid grid-cols-3 gap-3">
          <Dato titulo="Lecciones" valor={`${hechas}/${TOTAL_LECCIONES}`} />
          <Dato titulo="Módulos aprobados" valor={`${aprobados}/${MODULOS.length}`} />
          <Dato titulo="Formación básica" valor={`${basicosCompletos}/${MODULOS_BASICOS.length}`} />
        </section>
      )}

      {!avance.disponible && <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">El registro de avance aún no está activo en la base de datos. Puedes estudiar y rendir las evaluaciones; el resultado se muestra pero no se guarda todavía.</p>}

      {GRUPOS.map((g) => (
        <section key={g.titulo} className="mt-7">
          <h2 className="text-lg font-semibold">{g.titulo}</h2>
          <p className="mt-1 text-sm text-slate-500">{g.detalle}</p>
          <div className="mt-3 space-y-4">
            {g.modulos.map((m) => {
              const r = resumenModulo(avance, m.id);
              const t = TONO[m.color];
              return (
                <Link key={m.id} href={`/escuela/${m.id}`} className={`block rounded-2xl border ${t.borde} bg-[#07172a]/90 p-4 transition hover:bg-[#08203a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0788ff]`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-mono text-xs tracking-widest ${t.texto}`}>{m.codigo}</p>
                      <h3 className="mt-1 text-lg font-semibold">{m.titulo}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{m.resumen}</p>
                    </div>
                    <IconoFlecha className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{m.lecciones.length} lecciones · {m.lecciones.reduce((n, l) => n + l.minutos, 0)} min</span>
                    {perfil.rol !== "cliente" && (r.completo ? <Etiqueta tono="verde">Completado</Etiqueta> : r.evaluacion ? <Etiqueta tono={r.evaluacion.aprobado ? "verde" : "ambar"}>{r.evaluacion.aprobado ? `Aprobado ${r.evaluacion.puntaje} %` : `Última evaluación ${r.evaluacion.puntaje} %`}</Etiqueta> : r.hechas > 0 ? <Etiqueta tono="azul">En curso</Etiqueta> : <Etiqueta tono="gris">Sin empezar</Etiqueta>)}
                  </div>
                  {perfil.rol !== "cliente" && <div className="mt-3"><Barra porcentaje={r.porcentaje} tono={m.color} /></div>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {(perfil.rol === "admin" || perfil.rol === "supervisor") && (
        <Link href="/escuela/avance" className="mt-6 flex items-center justify-between rounded-2xl border border-[#27425e] bg-[#041225] px-4 py-4 text-sm"><span><span className="block font-semibold">Avance del equipo</span><span className="text-slate-400">Quién completó qué, y con qué puntaje.</span></span><IconoFlecha className="h-5 w-5 text-[#0788ff]" /></Link>
      )}

      <p className="mt-8 text-center text-xs leading-5 text-slate-500">Formación interna de SOTERSA. No sustituye los cursos de Nivel I y II ni el reentrenamiento bienal que exige la Ley Orgánica de Vigilancia y Seguridad Privada, que solo imparten centros acreditados.</p>
    </MarcoEscuela>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-3 text-center"><p className="text-xl font-bold">{valor}</p><p className="mt-1 text-[0.7rem] text-slate-400">{titulo}</p></article>;
}
