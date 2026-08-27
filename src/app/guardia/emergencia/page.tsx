import Link from "next/link";
import {
  PROTOCOLOS_EMERGENCIA,
  PRINCIPIO_EMERGENCIA,
  INSTRUCCION_911,
} from "@/lib/protocolos";
import { ECU911 } from "@/lib/marca";
import { IconoAlerta } from "@/app/componentes/iconos";

export const metadata = { title: "Emergencia — SOTERSA" };

/**
 * Los protocolos van EN EL CODIGO, no en la base de datos, y la pagina se
 * genera estatica: en una emergencia la red falla o se satura, y es justo
 * cuando esta pantalla tiene que abrir. Nada aqui depende de una consulta.
 */
export default function PaginaEmergencia() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-emergencia/30 bg-gris-900/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
          <Link href="/guardia" className="text-sm text-azul-400">
            ← Volver
          </Link>
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-300">
            <IconoAlerta className="h-4 w-4" />
            Plan de respuesta
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-5">
        <a
          href={`tel:${ECU911}`}
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-emergencia to-[#8f1a26] py-7 text-white shadow-xl shadow-emergencia/20 transition active:scale-[0.99]"
        >
          <span className="font-mono text-5xl font-bold tracking-[0.15em]">
            {ECU911}
          </span>
          <span className="mt-1.5 text-sm opacity-90">
            Llamar a emergencias · gratuito
          </span>
        </a>

        <p className="rounded-xl border border-borde bg-superficie/60 px-4 py-3 text-sm leading-relaxed text-gris-300">
          {INSTRUCCION_911}
        </p>

        {PROTOCOLOS_EMERGENCIA.map((p) => (
          <section key={p.codigo} className="tarjeta overflow-hidden">
            <h2 className="flex items-center gap-3 border-b border-borde/60 px-5 py-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-azul-500/15 font-mono text-xs font-bold text-azul-300">
                {p.codigo}
              </span>
              <span className="font-semibold text-white">{p.titulo}</span>
            </h2>
            <ol className="flex flex-col divide-y divide-borde/40">
              {p.pasos.map((paso, i) => (
                <li
                  key={paso}
                  className="flex gap-3 px-5 py-3 text-sm leading-relaxed text-gris-200"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 font-mono text-xs text-gris-600"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {paso}
                </li>
              ))}
            </ol>
          </section>
        ))}

        <p className="rounded-2xl border border-novedad/40 bg-novedad/10 px-5 py-4 text-center text-sm font-medium leading-relaxed text-amber-100">
          {PRINCIPIO_EMERGENCIA}
        </p>
      </main>
    </>
  );
}
