import Image from "next/image";
import { ahoraConDesfase, exigirPerfil, horaEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Central operativa — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const { supabase, perfil } = await exigirPerfil(["admin"]);
  const desde = ahoraConDesfase(-24);

  const [guardiasR, rondasR, novedadesR, vaciosR] = await Promise.all([
    supabase.from("guardias").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde),
    supabase
      .from("novedades")
      .select("id, tipo, severidad, descripcion, hora_captura, estado, puestos(codigo, nombre), guardias(nombre)")
      .order("hora_captura", { ascending: false })
      .limit(3),
    supabase.from("v_puestos_sin_apertura").select("turno_id", { count: "exact", head: true }),
  ]);

  const guardias = guardiasR.count ?? 0;
  const rondas = rondasR.count ?? 0;
  const novedades = novedadesR.data ?? [];
  const alertas =
    (vaciosR.count ?? 0) + novedades.filter((novedad) => novedad.estado === "registrada").length;
  const nombre = perfil.nombre.split(" ")[0];

  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020b18]">
      <div className="relative h-dvh aspect-[941/1672] shrink-0 overflow-hidden">
        <Image
          src="/pantalla-central-operativa-sotersa.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-fill"
        />

        <section aria-label="Resumen de Central Operativa" className="absolute inset-0 z-10">
          <div className="absolute left-[18.7%] top-[7.35%] h-[3%] min-w-[28%] bg-[#020b18] px-[0.5%] text-[clamp(0.82rem,3vw,1.22rem)] text-[#079cf4]">
            {nombre}
          </div>

          {alertas > 0 && (
            <div className="absolute left-[37%] top-[17.05%] flex h-[4.6%] w-[48%] items-center bg-[#07172a] text-[clamp(1.1rem,4.2vw,1.85rem)] font-medium text-[#079cf4]">
              Atención operativa
            </div>
          )}

          <ValorMetrica left="7.2%" valor={guardias} etiqueta="Personal activo" />
          <ValorMetrica left="29.9%" valor={rondas} etiqueta="Rondas en las últimas 24 horas" />
          <ValorMetrica left="52.8%" valor={alertas} etiqueta="Alertas operativas" />
          <ValorMetrica left="75.7%" valor="—" etiqueta="Cámaras pendientes de integración" />

          <div className="absolute left-[3.3%] top-[70.35%] h-[20.35%] w-[93.4%] overflow-hidden rounded-[1.05rem] border border-[#23425e] bg-[#061528]/[0.97] px-[4.2%] py-[2.1%] shadow-[inset_0_0_45px_rgba(0,119,219,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[clamp(0.95rem,3.1vw,1.35rem)] font-medium text-white">Actividad reciente</h2>
              <span className="text-[clamp(0.7rem,2.7vw,1rem)] text-[#079cf4]">Ver todo ›</span>
            </div>

            {novedades.length === 0 ? (
              <p className="grid h-[76%] place-items-center text-[clamp(0.75rem,2.7vw,1rem)] text-white/55">
                Todavía no hay actividad registrada.
              </p>
            ) : (
              <div className="mt-[2.8%] divide-y divide-[#183047]">
                {novedades.map((novedad) => {
                  const puesto = uno(novedad.puestos);
                  const guardia = uno(novedad.guardias);
                  return (
                    <article key={novedad.id} className="grid min-h-[3.9rem] grid-cols-[2.4rem_1fr_auto] items-center gap-[3%] py-[1.8%]">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm ${
                          novedad.severidad === "emergencia"
                            ? "border-red-400 text-red-300"
                            : novedad.severidad === "novedad"
                              ? "border-[#079cf4] text-[#079cf4]"
                              : "border-green-400 text-green-300"
                        }`}
                        aria-hidden
                      >
                        {novedad.severidad === "emergencia" ? "!" : "✓"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[clamp(0.72rem,2.5vw,1rem)] text-white">{novedad.tipo}</p>
                        <p className="truncate text-[clamp(0.62rem,2.1vw,0.82rem)] text-white/55">
                          {puesto?.codigo ?? guardia?.nombre ?? "Central operativa"}
                        </p>
                      </div>
                      <time className="text-[clamp(0.62rem,2.1vw,0.82rem)] text-white/55">
                        {horaEcuador(novedad.hora_captura)}
                      </time>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" aria-label="Iniciar ronda" className="absolute left-[3.3%] top-[60.7%] h-[8.8%] w-[22.8%] rounded-xl bg-transparent" />
          <button type="button" aria-label="Reportar incidente" className="absolute left-[27.2%] top-[60.7%] h-[8.8%] w-[22.2%] rounded-xl bg-transparent" />
          <button type="button" aria-label="Ver cámaras" className="absolute left-[50.5%] top-[60.7%] h-[8.8%] w-[22.2%] rounded-xl bg-transparent" />
          <button type="button" aria-label="Activar alerta" className="absolute left-[73.8%] top-[60.7%] h-[8.8%] w-[22.9%] rounded-xl bg-transparent" />
        </section>
      </div>
    </main>
  );
}

function ValorMetrica({ left, valor, etiqueta }: { left: string; valor: string | number; etiqueta: string }) {
  return (
    <div
      aria-label={`${etiqueta}: ${valor}`}
      className="absolute top-[30.2%] grid h-[3.3%] w-[15.9%] place-items-center bg-[#07172a] text-[clamp(1.2rem,5vw,2.25rem)] font-medium leading-none text-white"
      style={{ left }}
    >
      {valor}
    </div>
  );
}
