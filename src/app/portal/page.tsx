import Link from "next/link";
import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { MapaPuestos } from "@/app/componentes/mapa-puestos";
import { IconoAlerta, IconoEscudoOk, IconoFlecha, IconoLista, IconoRonda, IconoTelefono, IconoTurno } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador, horaEcuador } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { SelectorEmpresa } from "./selector-empresa";
import { NavCliente } from "./nav-cliente";
import { BotonPanico } from "./boton-panico";
import { enlaceWhatsapp, resumenDeEmpresa, telefonoLimpio, type Contacto, type EstadoPuesto, type PuestoAhora } from "./datos";

export const metadata = { title: "Mi servicio — SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Pantalla inicial del cliente. Responde, en este orden, lo que un
 * administrador de edificio se pregunta: hay alguien en mi puesto ahora, se
 * cumplio la semana, paso algo, a quien llamo, y que contrate.
 */
export default async function PaginaPortal({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { supabase, perfil } = await exigirPerfil(["cliente", "admin", "operativo"]);
  const params = await searchParams;
  const lector = esLector(perfil.rol);
  const empresaSolicitada = lector && /^[0-9a-f-]{36}$/i.test(params.empresa ?? "") ? params.empresa! : null;

  let empresaId: string | null = perfil.empresa_cliente_id ?? empresaSolicitada;
  let todas: { id: string; nombre: string }[] = [];
  if (lector) {
    todas = (await supabase.from("empresas_cliente").select("id, nombre").eq("activo", true).order("nombre")).data ?? [];
    if (!empresaId) empresaId = todas[0]?.id ?? null;
  }

  const r = await resumenDeEmpresa(empresaId);
  const sufijo = lector && empresaId ? `?empresa=${empresaId}` : "";
  const ubicados = r.puestos.filter((p) => p.lat != null && p.lng != null);
  const cubiertos = r.puestos.filter((p) => p.estado === "cubierto" || p.estado === "por_cerrar" || p.estado === "sin_ronda").length;
  const enApp = r.puestos.filter((p) => p.estado !== "sin_programar").length;
  const pctCobertura = r.semana.turnosPlanificados ? Math.round((r.semana.turnosCubiertos / r.semana.turnosPlanificados) * 100) : null;
  const pctRondas = r.semana.turnosCubiertos ? Math.round((r.semana.turnosConRonda / r.semana.turnosCubiertos) * 100) : null;
  const pctPuntualidad = r.semana.aperturasTotales ? Math.round((r.semana.aperturasPuntuales / r.semana.aperturasTotales) * 100) : null;
  const contactos: Contacto[] = [...r.supervisores, ...(r.central ? [r.central] : []), ...(r.jefeOperaciones ? [r.jefeOperaciones] : [])];
  const contactoPrincipal = r.central ?? r.supervisores[0] ?? r.jefeOperaciones;
  const ahoraIso = new Date().toISOString();

  const OPERACION = {
    normal: { texto: "Operación normal", clase: "border-normal/30 bg-normal/10 text-green-300", detalle: "Todos los puestos cubiertos y sin novedades abiertas." },
    atencion: { texto: "Requiere atención", clase: "border-amber-400/40 bg-amber-400/10 text-amber-200", detalle: "Hay novedades en seguimiento o un puesto sin ronda reciente." },
    critica: { texto: "Atención inmediata", clase: "border-red-500/40 bg-red-500/10 text-red-200", detalle: "Un puesto está sin cobertura o hay una emergencia abierta. SOTERSA ya está al tanto." },
  }[r.operacion];

  return (
    <div className="min-h-dvh pb-24 md:pb-12">
      <CabeceraPanel rol="cliente" nombre={perfil.nombre} />
      <main className="portal-cliente mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-5 sm:py-6">
        <Link href={lector ? "/admin" : "/perfiles"} className="hidden items-center gap-1 self-start text-sm font-medium text-azul-400 md:inline-flex"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> {lector ? "Panel administrativo" : "Menú principal"}</Link>
        {lector && <SelectorEmpresa empresas={todas} actual={empresaId} />}

        <section className="px-1">
          <p className="hidden text-sm font-medium text-azul-400 sm:block">Mi servicio</p>
          <h1 className="mt-1 text-[1.75rem] font-bold tracking-tight text-white sm:text-3xl">{saludo()}, {perfil.nombre.split(" ")[0]}</h1>
          <p className="mt-1 text-base text-gris-400 sm:text-sm">{r.empresa?.nombre ?? "Cuenta corporativa"}<span className="hidden sm:inline"> · {fechaHoraEcuador(ahoraIso)}</span></p>
          {lector && empresaId && <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/portal/agentes${sufijo}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-azul-500/40 bg-azul-500/10 px-4 text-sm font-semibold text-azul-300">Agentes de seguridad <IconoFlecha className="h-4 w-4" /></Link>
            <Link href={`/portal/documentos${sufijo}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-borde/60 bg-white/[0.03] px-4 text-sm font-medium text-gris-300">Documentación habilitante</Link>
            <Link href={`/portal/custodia${sufijo}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-borde/60 bg-white/[0.03] px-4 text-sm font-medium text-gris-300">Custodia armada</Link>
          </div>}
        </section>

        <BotonPanico puestos={r.puestos.map((puesto) => ({ id: puesto.id, codigo: puesto.codigo, nombre: puesto.nombre }))} />

        {/* 1. Estado real, calculado */}
        <section className={`panel-operativo grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8 ${r.operacion === "critica" ? "ring-1 ring-red-500/45" : ""}`}>
          <div className="flex items-start gap-4">
            <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border ${r.operacion === "normal" ? "border-azul-500/50 bg-azul-500/10 text-azul-400" : r.operacion === "atencion" ? "border-amber-400/50 bg-amber-400/10 text-amber-300" : "border-red-500/50 bg-red-500/10 text-red-300"}`}>{r.operacion === "normal" ? <IconoEscudoOk className="h-9 w-9" /> : <IconoAlerta className="h-9 w-9" />}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gris-400">Estado de tu servicio</p>
              <h2 className={`mt-1 text-2xl font-bold ${r.operacion === "critica" ? "text-red-300" : r.operacion === "atencion" ? "text-amber-200" : "text-white"}`}>{enApp === 0 ? `${r.puestos.length} puesto${r.puestos.length === 1 ? "" : "s"} bajo supervisión` : `${cubiertos} de ${enApp} puesto${enApp === 1 ? "" : "s"} con agente ahora`}</h2>
              <span className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${OPERACION.clase}`}>{OPERACION.texto}</span>
              <p className="mt-3 text-sm text-gris-400">{OPERACION.detalle}</p>
            </div>
          </div>
          <div className="border-t border-borde/60 pt-5 text-center sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"><p className="text-sm text-gris-400">Cumplimiento SLA</p><p className="mt-2 text-4xl font-bold text-azul-400 sm:text-5xl">{r.sla.medidos ? `${r.sla.puntaje}%` : "—"}</p><p className="mt-1 text-xs text-gris-500">{r.sla.medidos ? `${r.sla.cumplidos} de ${r.sla.medidos} avisos en ≤ 15 min · 30 días` : "Sin datos medibles todavía"}</p></div>
          {contactoPrincipal && <a href={`tel:${telefonoLimpio(contactoPrincipal.telefono)}`} className="boton-primario col-span-full inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold text-white sm:hidden"><IconoTelefono className="h-5 w-5" /> Contactar a SOTERSA</a>}
        </section>

        {/* 1b. En este momento, por puesto */}
        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-white"><IconoTurno className="h-5 w-5 text-azul-400" /> En este momento</h2><span className="text-xs text-gris-500">Actualizado {horaEcuador(ahoraIso)}</span></div>
          {r.puestos.length === 0 ? <Vacio texto="No hay puestos activos asociados a esta cuenta." /> : <div className="divide-y divide-borde/50">{r.puestos.map((p) => <FilaPuesto key={p.id} puesto={p} />)}</div>}
        </section>

        {/* 2. Semana */}
        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-white"><IconoRonda className="h-5 w-5 text-azul-400" /> Cobertura de los últimos 7 días</h2><Link href={`/portal/reporte${sufijo}`} className="text-xs font-medium text-azul-300">Reporte mensual →</Link></div>
          <div className="grid grid-cols-2 gap-px bg-borde/40 sm:grid-cols-4">
            <Metrica titulo="Turnos cubiertos" valor={pctCobertura == null ? "—" : `${pctCobertura}%`} detalle={`${r.semana.turnosCubiertos} de ${r.semana.turnosPlanificados} planificados`} tono={pctCobertura == null ? "gris" : pctCobertura >= 95 ? "verde" : pctCobertura >= 80 ? "ambar" : "rojo"} />
            <Metrica titulo="Turnos con ronda" valor={pctRondas == null ? "—" : `${pctRondas}%`} detalle={`${r.semana.rondasRegistradas} rondas registradas`} tono={pctRondas == null ? "gris" : pctRondas >= 90 ? "verde" : "ambar"} />
            <Metrica titulo="Apertura puntual" valor={pctPuntualidad == null ? "—" : `${pctPuntualidad}%`} detalle={`${r.semana.aperturasPuntuales} de ${r.semana.aperturasTotales} dentro de 15 min`} tono={pctPuntualidad == null ? "gris" : pctPuntualidad >= 90 ? "verde" : "ambar"} />
            <Metrica titulo="Novedades 30 días" valor={String(r.novedades.lista.length)} detalle={`${r.novedades.emergencias} emergencia${r.novedades.emergencias === 1 ? "" : "s"} · ${r.novedades.novedades} novedad${r.novedades.novedades === 1 ? "" : "es"} · ${r.novedades.informativas} informativa${r.novedades.informativas === 1 ? "" : "s"}`} tono={r.novedades.emergencias ? "rojo" : r.novedades.abiertas ? "ambar" : "gris"} />
          </div>
        </section>

        {/* 3. Novedades */}
        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-white"><IconoLista className="h-5 w-5 text-azul-400" /> Bitácora de novedades</h2><span className="text-xs text-gris-500">{r.novedades.abiertas ? `${r.novedades.abiertas} en seguimiento` : "Validadas por SOTERSA"}</span></div>
          {r.novedades.lista.length === 0 ? <Vacio texto="Sin novedades publicadas en los últimos 30 días." /> : (
            <div className="divide-y divide-borde/50">
              {r.novedades.lista.slice(0, 12).map((n) => (
                <article key={n.id} className={`p-5 ${n.estado !== "cerrada" ? "bg-amber-400/[0.04]" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.severidad === "emergencia" ? "bg-red-400" : n.severidad === "novedad" ? "bg-amber-300" : "bg-azul-400"}`} />
                      <div><p className="font-medium text-white">{n.tipo}</p><p className="mt-1 text-xs text-gris-500">{n.puesto} · {fechaHoraEcuador(n.hora_captura)} · {SEVERIDAD[n.severidad]}</p></div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${n.estado === "cerrada" ? "bg-white/[0.06] text-gris-300" : "bg-amber-400/15 text-amber-200"}`}>{n.estado === "cerrada" ? "Cerrada" : "En seguimiento"}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gris-300">{n.descripcion}</p>
                  {n.nota_supervisor && <p className="mt-3 rounded-xl bg-azul-500/10 px-4 py-3 text-sm text-azul-100"><strong>Supervisión:</strong> {n.nota_supervisor}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 4. Equipo y contacto */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="tarjeta overflow-hidden">
            <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-white"><IconoTelefono className="h-5 w-5 text-azul-400" /> A quién llamar</h2><span className="text-xs text-gris-500">SOTERSA</span></div>
            {contactos.length === 0 ? <Vacio texto="SOTERSA aún no ha registrado los contactos de tu servicio." /> : (
              <div className="divide-y divide-borde/50">
                {contactos.map((c, i) => (
                  <div key={`${c.telefono}-${i}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div><p className="font-medium text-white">{c.nombre ?? c.etiqueta}</p><p className="text-xs text-gris-500">{c.nombre ? c.etiqueta : "Atención permanente"} · {c.telefono}</p></div>
                    <div className="flex gap-2">
                      <a href={`tel:${telefonoLimpio(c.telefono)}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-azul-500/40 bg-azul-500/10 px-3.5 text-sm font-semibold text-azul-300"><IconoTelefono className="h-4 w-4" /> Llamar</a>
                      <a href={enlaceWhatsapp(c.telefono)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 text-sm font-semibold text-emerald-300">WhatsApp</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="border-t border-borde/50 px-5 py-3 text-xs text-gris-500">Ante una emergencia en curso llama primero al <a href="tel:911" className="font-semibold text-red-300">911</a> y después a SOTERSA.</p>
          </div>

          <div className="tarjeta overflow-hidden">
            <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="font-semibold text-white">Tu equipo</h2><Link href={`/portal/agentes${sufijo}`} className="text-xs font-medium text-azul-300">Ver agentes →</Link></div>
            <div className="divide-y divide-borde/50">
              {r.puestos.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{p.agente ? p.agente.nombre : "Sin agente en turno"}</p><p className="truncate text-xs text-gris-500">{p.codigo} · {p.nombre}{p.agente?.credencial ? ` · credencial ${p.agente.credencial}` : ""}</p></div>
                  <Estado estado={p.estado} compacto />
                </div>
              ))}
              {r.puestos.length === 0 && <Vacio texto="Sin puestos activos." />}
            </div>
          </div>
        </section>

        {/* 5. Servicio contratado */}
        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="font-semibold text-white">Servicio contratado</h2><span className="text-xs text-gris-500">{r.empresa ? `Cliente desde ${fechaCorta(r.empresa.clienteDesde)}` : ""}</span></div>
          {r.puestos.length === 0 ? <Vacio texto="No hay puestos activos asociados a esta cuenta." /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gris-500"><th className="px-5 py-3 font-medium">Puesto</th><th className="px-3 py-3 font-medium">Modalidad</th><th className="px-3 py-3 font-medium">Cobertura</th><th className="px-3 py-3 font-medium">Armado</th><th className="px-5 py-3 font-medium">Desde</th></tr></thead>
              <tbody className="divide-y divide-borde/50">
                {r.puestos.map((p) => <tr key={p.id}><td className="px-5 py-3 text-white">{p.codigo} · {p.nombre}{p.direccion ? <span className="block text-xs text-gris-500">{p.direccion}</span> : null}</td><td className="px-3 py-3 text-gris-300">{p.servicio}</td><td className="px-3 py-3 text-gris-300">{p.coberturaHoras} h/día</td><td className="px-3 py-3 text-gris-300">{p.armado ? "Sí" : "No"}</td><td className="px-5 py-3 text-gris-300">{fechaCorta(p.desde)}</td></tr>)}
              </tbody>
            </table></div>
          )}
        </section>

        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="font-semibold text-white">Ubicación de tus puestos</h2><span className="text-xs text-gris-500">{ubicados.length} de {r.puestos.length} ubicado{r.puestos.length === 1 ? "" : "s"}</span></div>
          {ubicados.length ? <MapaPuestos alto="h-64 sm:h-80" puntos={ubicados.map((p) => ({ id: p.id, lat: p.lat as number, lng: p.lng as number, cliente: r.empresa?.nombre ?? "Tu empresa", codigo: p.codigo, puesto: p.nombre, activo: true }))} /> : <Vacio texto="SOTERSA aún no ha registrado las coordenadas de tus puestos. Aparecerán aquí en cuanto estén cargadas." />}
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-semibold text-white">Cómo leer esta pantalla</h2>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">Un puesto está <strong className="text-gris-200">cubierto</strong> cuando el agente abrió su turno desde la app con checklist y hora. El <strong className="text-gris-200">SLA</strong> mide el tiempo entre que se registra una novedad y SOTERSA la notifica; el compromiso es 15 minutos. Solo ves registros validados y autorizados para tu empresa.{r.sla.ultimo ? ` Último aviso medido: ${fechaHoraEcuador(r.sla.ultimo)}.` : ""}</p>
        </section>
      </main>
      <NavCliente sufijo={sufijo} />
    </div>
  );
}

const SEVERIDAD = { emergencia: "Emergencia", novedad: "Novedad", informativa: "Informativa" } as const;

const ESTADOS: Record<EstadoPuesto, { texto: string; clase: string }> = {
  cubierto: { texto: "Cubierto", clase: "bg-normal/15 text-green-300" },
  sin_ronda: { texto: "Sin ronda reciente", clase: "bg-amber-400/15 text-amber-200" },
  por_cerrar: { texto: "Cubierto · relevo pronto", clase: "bg-normal/15 text-green-300" },
  sin_apertura: { texto: "Turno sin abrir", clase: "bg-red-500/15 text-red-200" },
  sin_cobertura: { texto: "Sin cobertura", clase: "bg-red-500/15 text-red-200" },
  sin_turno_hoy: { texto: "Fuera de horario", clase: "bg-white/[0.06] text-gris-300" },
  sin_programar: { texto: "Cuadrante pendiente", clase: "bg-white/[0.06] text-gris-300" },
};

function Estado({ estado, compacto = false }: { estado: EstadoPuesto; compacto?: boolean }) {
  const e = ESTADOS[estado];
  return <span className={`shrink-0 whitespace-nowrap rounded-full font-medium ${compacto ? "px-2.5 py-1 text-[0.7rem]" : "px-3 py-1 text-xs"} ${e.clase}`}>{e.texto}</span>;
}

function FilaPuesto({ puesto: p }: { puesto: PuestoAhora }) {
  return (
    <article className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{p.codigo} · {p.nombre}</p><Estado estado={p.estado} /></div>
        {p.agente ? (
          <p className="mt-1.5 text-sm text-gris-300">{p.agente.nombre}{p.agente.credencial ? <span className="text-gris-500"> · credencial {p.agente.credencial}</span> : null}</p>
        ) : (
          <p className="mt-1.5 text-sm text-gris-500">{p.estado === "sin_turno_hoy" ? `Servicio de ${p.coberturaHoras} h; no corresponde turno en este momento.` : p.estado === "sin_programar" ? "SOTERSA aún no ha cargado el cuadrante de este puesto en la app; el servicio se presta con normalidad." : "No hay un turno asignado en este momento."}{p.proximoTurno ? ` Próximo turno: ${fechaHoraEcuador(p.proximoTurno)}.` : ""}</p>
        )}
      </div>
      {p.agente && (
        <dl className="grid grid-cols-3 gap-3 text-center text-xs sm:min-w-[19rem]">
          <div><dt className="text-gris-500">Turno</dt><dd className="mt-0.5 font-medium text-gris-200">{horaEcuador(p.inicioTurno)}–{horaEcuador(p.finTurno)}</dd></div>
          <div><dt className="text-gris-500">Apertura</dt><dd className={`mt-0.5 font-medium ${p.apertura ? "text-gris-200" : "text-red-300"}`}>{p.apertura ? horaEcuador(p.apertura) : "Pendiente"}</dd></div>
          <div><dt className="text-gris-500">Última ronda</dt><dd className={`mt-0.5 font-medium ${p.estado === "sin_ronda" ? "text-amber-300" : "text-gris-200"}`}>{p.tienePuntosRonda ? (p.ultimaRonda ? `${horaEcuador(p.ultimaRonda)} (${p.rondasEnTurno})` : "Aún ninguna") : "Sin puntos QR"}</dd></div>
        </dl>
      )}
    </article>
  );
}

function Metrica({ titulo, valor, detalle, tono }: { titulo: string; valor: string; detalle: string; tono: "verde" | "ambar" | "rojo" | "gris" }) {
  const color = { verde: "text-green-300", ambar: "text-amber-300", rojo: "text-red-300", gris: "text-white" }[tono];
  return <div className="bg-[#07172a] px-5 py-4"><p className="text-xs text-gris-500">{titulo}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{valor}</p><p className="mt-0.5 text-xs text-gris-500">{detalle}</p></div>;
}

function Vacio({ texto }: { texto: string }) {
  return <p className="px-5 py-8 text-center text-sm text-gris-500">{texto}</p>;
}

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("es-EC", { hour: "numeric", hour12: false, timeZone: "America/Guayaquil" }).format(new Date()));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

function fechaCorta(fecha: string) {
  return new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Guayaquil" }).format(new Date(fecha));
}
