import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import {
  AVISO_PUNTOS,
  AVISO_TITULO,
  AVISO_VERSION,
  ROLES_CON_CONSENTIMIENTO,
} from "@/lib/consentimiento";
import { FormularioConsentimiento } from "./formulario-consentimiento";
import { retirarConsentimiento } from "./acciones";

export const metadata = { title: "Tratamiento de datos — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaConsentimiento() {
  const { supabase, user, perfil } = await exigirPerfil(
    ["guardia", "supervisor", "admin", "cliente"],
    { permitirSinConsentimiento: true },
  );

  // A quien no se le pide, no tiene nada que hacer aqui.
  if (!ROLES_CON_CONSENTIMIENTO.has(perfil.rol)) redirect("/perfiles");

  const { data: registro } = await supabase
    .from("consentimientos")
    .select("aceptado_en, retirado_en")
    .eq("perfil_id", user.id)
    .eq("version", AVISO_VERSION)
    .maybeSingle();

  const vigente = Boolean(registro && !registro.retirado_en);

  return (
    <main className="min-h-dvh bg-[#020b18] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <Marca />

        <section className="mt-7 rounded-3xl border border-[#27425e] bg-[#07172a]/95 p-5 sm:p-7">
          <p className="flex items-center gap-2 text-sm font-medium text-[#0788ff]">
            <IconoEscudoOk className="h-5 w-5" /> Protección de datos
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{AVISO_TITULO}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Antes de usar la aplicación necesitamos que sepas qué datos tuyos
            guarda y para qué. Léelo con calma: puedes retirar tu autorización
            después.
          </p>

          <dl className="mt-6 divide-y divide-[#20374e]">
            {AVISO_PUNTOS.map((punto) => (
              <div key={punto.titulo} className="py-3.5">
                <dt className="font-semibold text-white">{punto.titulo}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-300">
                  {punto.detalle}
                </dd>
              </div>
            ))}
          </dl>

          {vigente ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
                Autorizaste el {fechaHoraEcuador(registro?.aceptado_en)}.
              </p>
              <form action={retirarConsentimiento}>
                <button className="min-h-12 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-200">
                  Retirar mi autorización
                </button>
              </form>
              <p className="text-center text-xs leading-relaxed text-slate-500">
                Si la retiras dejarás de poder usar la aplicación: sin estos
                datos no hay forma de registrar tu turno ni tus novedades.
              </p>
            </div>
          ) : (
            <>
              {registro?.retirado_en && (
                <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                  Retiraste tu autorización el{" "}
                  {fechaHoraEcuador(registro.retirado_en)}. Puedes volver a
                  darla aquí cuando quieras.
                </p>
              )}
              <FormularioConsentimiento />
            </>
          )}
        </section>

        <p className="mt-4 text-center text-xs text-slate-600">
          Versión del aviso: {AVISO_VERSION}
        </p>
      </div>
    </main>
  );
}
