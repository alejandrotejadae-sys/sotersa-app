import Image from "next/image";
import { ahoraConDesfase, exigirPerfil, uno } from "@/lib/sesion";

export const metadata = { title: "Supervisión — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaSupervisor() {
  const { supabase, perfil } = await exigirPerfil(["supervisor", "admin"]);
  const desde = ahoraConDesfase(-24);
  const hasta = ahoraConDesfase(16);

  const [puestosR, turnosR, novedadesR, rondasR] = await Promise.all([
    supabase.from("puestos").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase
      .from("turnos")
      .select("id, estado, guardias(nombre), puestos(nombre), aperturas_turno(id)")
      .gte("fin_programado", desde)
      .lte("inicio_programado", hasta)
      .order("inicio_programado"),
    supabase
      .from("novedades")
      .select("id", { count: "exact", head: true })
      .eq("estado", "registrada"),
    supabase.from("rondas").select("id", { count: "exact", head: true }).gte("hora_captura", desde),
  ]);

  const turnos = turnosR.data ?? [];
  const conApertura = turnos.filter((turno) => (turno.aperturas_turno?.length ?? 0) > 0);
  const cobertura = turnos.length ? Math.round((conApertura.length / turnos.length) * 100) : 100;
  const filas = Array.from({ length: 3 }, (_, indice) => turnos[indice] ?? null);
  const nombre = perfil.nombre.split(" ")[0];

  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020b18]">
      <div className="relative h-dvh aspect-[941/1672] shrink-0 overflow-hidden">
        <Image
          src="/pantalla-supervisor-sotersa.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-fill"
        />

        <section aria-label="Panel de Supervisor" className="absolute inset-0 z-10">
          <div className="absolute left-[34.7%] top-[12.15%] flex h-[3.2%] min-w-[42%] items-center bg-[#020b18] px-[0.7%] text-[clamp(1.2rem,5vw,2rem)] font-bold text-white">
            {nombre}
          </div>

          <div className="absolute left-[27.4%] top-[21.95%] grid h-[4.2%] w-[22%] place-items-center bg-[#07172a] text-[clamp(2rem,8vw,3.7rem)] font-bold leading-none text-white">
            {cobertura}%
          </div>
          <div className={`absolute left-[27.4%] top-[26.8%] flex h-[2.2%] w-[37%] items-center bg-[#07172a] text-[clamp(0.75rem,3vw,1.05rem)] ${cobertura >= 90 ? "text-emerald-400" : "text-red-400"}`}>
            {cobertura >= 90 ? "bajo control" : "requiere atención"}
          </div>

          <ValorMetrica left="8.1%" valor={`${conApertura.length}/${turnos.length}`} />
          <ValorMetrica left="31.1%" valor={puestosR.count ?? 0} />
          <ValorMetrica left="54.3%" valor={rondasR.count ?? 0} />
          <ValorMetrica left="77.2%" valor={novedadesR.count ?? 0} emergencia={(novedadesR.count ?? 0) > 0} />

          {filas.map((turno, indice) => {
            const guardia = turno ? uno(turno.guardias) : null;
            const puesto = turno ? uno(turno.puestos) : null;
            const abierto = turno ? (turno.aperturas_turno?.length ?? 0) > 0 : false;
            const top = `${46.35 + indice * 5.02}%`;

            return (
              <div
                key={turno?.id ?? `vacio-${indice}`}
                className="absolute left-[14.8%] grid h-[4.75%] w-[78.2%] grid-cols-[1.25fr_1fr_auto] items-center gap-[3%] bg-[#071426] pr-[1%]"
                style={{ top }}
              >
                <div className="min-w-0">
                  <p className="truncate text-[clamp(0.72rem,2.65vw,1.02rem)] font-medium text-white">
                    {guardia?.nombre ?? "Sin turno programado"}
                  </p>
                  <p className="truncate text-[clamp(0.61rem,2.25vw,0.87rem)] text-white/55">
                    {puesto?.nombre ?? "Disponible"}
                  </p>
                </div>
                <p className="truncate text-[clamp(0.62rem,2.3vw,0.9rem)] text-white/60">
                  {puesto?.nombre ?? "—"}
                </p>
                <p className={`whitespace-nowrap text-[clamp(0.62rem,2.3vw,0.9rem)] ${abierto ? "text-emerald-400" : turno ? "text-red-400" : "text-white/40"}`}>
                  {abierto ? "● En puesto" : turno ? "● Pendiente" : "—"} <span className="ml-2 text-white/55">›</span>
                </p>
              </div>
            );
          })}

          <button type="button" aria-label="Ver personal" className="absolute left-[6.1%] top-[66.3%] h-[6.4%] w-[20.4%] rounded-xl bg-transparent" />
          <button type="button" aria-label="Asignar puesto" className="absolute left-[28.3%] top-[66.3%] h-[6.4%] w-[20.4%] rounded-xl bg-transparent" />
          <button type="button" aria-label="Crear ronda" className="absolute left-[50.5%] top-[66.3%] h-[6.4%] w-[20.4%] rounded-xl bg-transparent" />
          <button type="button" aria-label="Reportar novedad" className="absolute left-[72.7%] top-[66.3%] h-[6.4%] w-[20.4%] rounded-xl bg-transparent" />
        </section>
      </div>
    </main>
  );
}

function ValorMetrica({ left, valor, emergencia = false }: { left: string; valor: string | number; emergencia?: boolean }) {
  return (
    <div
      className={`absolute top-[35.9%] grid h-[3.3%] w-[14.5%] place-items-center bg-[#071426] text-[clamp(1.15rem,4.7vw,2rem)] leading-none ${emergencia ? "text-red-400" : "text-white"}`}
      style={{ left }}
    >
      {valor}
    </div>
  );
}
