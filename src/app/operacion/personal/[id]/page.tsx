import Link from "next/link";
import { notFound } from "next/navigation";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoFlecha, IconoPersona } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { AVISO_VERSION } from "@/lib/consentimiento";
import { AccesoAgente, EditorAgente, PlazaAgente } from "./ficha-agente";

export const metadata = { title: "Ficha del agente — SOTERSA" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ficha completa de un agente: sus datos, donde trabaja, su acceso a la app y
 * lo que ha hecho en el ultimo mes. El admin edita; el supervisor consulta.
 */
export default async function PaginaFichaAgente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase, perfil } = await exigirPerfil(["admin", "supervisor"]);
  const esAdmin = perfil.rol === "admin";
  const hace30d = ahoraConDesfase(-30 * 24);
  const en7d = ahoraConDesfase(7 * 24);
  const ahora = new Date().toISOString();

  const { data: agente } = await supabase
    .from("guardias")
    .select("id,nombre,cedula,telefono,credencial,activo,es_relevo,puesto_habitual_id,perfil_id,creado_en")
    .eq("id", id)
    .maybeSingle();
  if (!agente) notFound();

  const [puestoR, puestosR, turnosR, rondasR, novedadesR] = await Promise.all([
    agente.puesto_habitual_id
      ? supabase.from("puestos").select("codigo,nombre,empresas_cliente(nombre)").eq("id", agente.puesto_habitual_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("puestos").select("id,codigo,nombre,empresas_cliente(nombre)").eq("activo", true).order("codigo"),
    supabase.from("turnos").select("id,inicio_programado,fin_programado,estado,puestos(codigo,nombre),aperturas_turno(hora_captura)").eq("guardia_id", id).gte("fin_programado", hace30d).lte("inicio_programado", en7d).order("inicio_programado", { ascending: false }),
    supabase.from("rondas").select("id", { count: "exact", head: true }).eq("guardia_id", id).gte("hora_captura", hace30d),
    supabase.from("novedades").select("id,tipo,severidad,hora_captura,estado,puestos(codigo)").eq("guardia_id", id).gte("hora_captura", hace30d).order("hora_captura", { ascending: false }).limit(8),
  ]);

  const puestoActual = puestoR.data ? `${uno(puestoR.data.empresas_cliente)?.nombre ?? ""} · ${puestoR.data.codigo} ${puestoR.data.nombre}`.replace(/^ · /, "") : null;
  const puestos = (puestosR.data ?? []).map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, cliente: uno(p.empresas_cliente)?.nombre ?? "" }));
  const turnos = turnosR.data ?? [];
  const pasados = turnos.filter((t) => t.fin_programado <= ahora);
  const proximos = turnos.filter((t) => t.fin_programado > ahora).sort((a, b) => a.inicio_programado.localeCompare(b.inicio_programado));
  const abiertos = pasados.filter((t) => (t.aperturas_turno?.length ?? 0) > 0).length;
  const novedades = novedadesR.data ?? [];

  // Estado de la cuenta: solo el admin lo ve, y sale de Auth, no de la base.
  let cuenta: { ultimoIngreso: string | null; claveTemporal: boolean; bloqueada: boolean; consentimiento: string | null } | null = null;
  if (esAdmin && agente.perfil_id) {
    const administrador = crearClienteAdministrador();
    const [{ data: auth }, { data: consentimiento }] = await Promise.all([
      administrador.auth.admin.getUserById(agente.perfil_id),
      supabase.from("consentimientos").select("aceptado_en,retirado_en").eq("perfil_id", agente.perfil_id).eq("version", AVISO_VERSION).maybeSingle(),
    ]);
    cuenta = {
      ultimoIngreso: auth?.user?.last_sign_in_at ?? null,
      claveTemporal: auth?.user?.user_metadata?.debe_cambiar_clave === true,
      bloqueada: Boolean(auth?.user && "banned_until" in auth.user && auth.user.banned_until && new Date(auth.user.banned_until as string) > new Date()),
      consentimiento: consentimiento && !consentimiento.retirado_en ? consentimiento.aceptado_en : null,
    };
  }

  const ficha = { id: agente.id, nombre: agente.nombre, cedula: agente.cedula, telefono: agente.telefono, credencial: agente.credencial, activo: agente.activo, es_relevo: agente.es_relevo, puesto_habitual_id: agente.puesto_habitual_id, tieneCuenta: Boolean(agente.perfil_id) };

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/operacion/personal" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al equipo</Link>

        <section className="mt-5 flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[#38526b] bg-gradient-to-br from-[#244868] to-[#0a1e34] text-lg font-semibold text-[#8ddaff]">{iniciales(agente.nombre)}</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-[#0788ff]"><IconoPersona className="h-5 w-5" /> Agente de seguridad</p>
            <h1 className="mt-1 text-3xl font-bold lg:text-4xl">{agente.nombre}</h1>
            <p className="mt-1 text-sm text-slate-400">{agente.cedula ? `Cédula ${agente.cedula}` : "Cédula pendiente"}{agente.credencial ? ` · Credencial ${agente.credencial}` : ""}{agente.telefono ? ` · ${agente.telefono}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Etiqueta tono={agente.activo ? "verde" : "gris"}>{agente.activo ? "Activo" : "Dado de baja"}</Etiqueta>
            {agente.es_relevo && <Etiqueta tono="ambar">Relevo</Etiqueta>}
            <Etiqueta tono={agente.perfil_id ? "azul" : "gris"}>{agente.perfil_id ? "Con acceso" : "Sin acceso"}</Etiqueta>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Resumen titulo="Turnos · 30 días" valor={pasados.length} />
          <Resumen titulo="Con apertura" valor={abiertos} alerta={pasados.length > 0 && abiertos < pasados.length} />
          <Resumen titulo="Rondas · 30 días" valor={rondasR.count ?? 0} />
          <Resumen titulo="Novedades · 30 días" valor={novedades.length} alerta={novedades.some((n) => n.severidad === "emergencia")} />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Panel titulo="Ficha" detalle={esAdmin ? "Datos personales y de contacto." : "Solo el administrador edita estos datos."}>
              {esAdmin ? <EditorAgente agente={ficha} /> : (
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <Dato etiqueta="Cédula" valor={agente.cedula ?? "Pendiente"} />
                  <Dato etiqueta="Teléfono" valor={agente.telefono ?? "Pendiente"} />
                  <Dato etiqueta="Credencial" valor={agente.credencial ?? "Pendiente"} />
                  <Dato etiqueta="En nómina desde" valor={fechaHoraEcuador(agente.creado_en)} />
                </dl>
              )}
            </Panel>

            <Panel titulo="Plaza y estado" detalle="Dónde trabaja y si sigue en la nómina.">
              {esAdmin ? <PlazaAgente agente={ficha} puestos={puestos} puestoActual={puestoActual} /> : (
                <p className="text-sm text-slate-300">{agente.es_relevo ? "Relevo · cubre los días libres de varios puestos" : puestoActual ?? "Sin plaza asignada"}</p>
              )}
            </Panel>

            {esAdmin && (
              <Panel titulo="Acceso a la app" detalle={cuenta ? `Último ingreso: ${cuenta.ultimoIngreso ? fechaHoraEcuador(cuenta.ultimoIngreso) : "nunca"}` : "Todavía no tiene cuenta."}>
                {cuenta && (
                  <ul className="mb-3 flex flex-wrap gap-2 text-xs">
                    <li><Etiqueta tono={cuenta.claveTemporal ? "ambar" : "verde"}>{cuenta.claveTemporal ? "PIN temporal sin cambiar" : "PIN propio"}</Etiqueta></li>
                    <li><Etiqueta tono={cuenta.consentimiento ? "verde" : "ambar"}>{cuenta.consentimiento ? `LOPDP aceptado ${fechaHoraEcuador(cuenta.consentimiento)}` : "LOPDP pendiente"}</Etiqueta></li>
                    {cuenta.bloqueada && <li><Etiqueta tono="rojo">Cuenta bloqueada</Etiqueta></li>}
                  </ul>
                )}
                <AccesoAgente agente={ficha} />
              </Panel>
            )}
          </div>

          <div className="space-y-5">
            <Panel titulo="Próximos turnos" detalle={proximos.length === 0 ? "Nada programado en los próximos 7 días." : `${proximos.length} en los próximos 7 días.`}>
              <ListaTurnos turnos={proximos.slice(0, 6)} />
            </Panel>
            <Panel titulo="Turnos recientes" detalle="Últimos 30 días, del más reciente al más antiguo.">
              <ListaTurnos turnos={pasados.slice(0, 8)} />
            </Panel>
            <Panel titulo="Novedades recientes" detalle="Lo que reportó en los últimos 30 días.">
              {novedades.length === 0 ? <p className="text-sm text-slate-500">Sin novedades reportadas.</p> : (
                <ul className="divide-y divide-[#20374e]">
                  {novedades.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0"><p className="truncate">{n.tipo}</p><p className="text-xs text-slate-500">{uno(n.puestos)?.codigo ?? "—"} · {fechaHoraEcuador(n.hora_captura)}</p></div>
                      <Etiqueta tono={n.severidad === "emergencia" ? "rojo" : n.severidad === "novedad" ? "ambar" : "gris"}>{n.severidad}</Etiqueta>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

function ListaTurnos({ turnos }: { turnos: { id: string; inicio_programado: string; fin_programado: string; estado: string; puestos: unknown; aperturas_turno: { hora_captura: string }[] | null }[] }) {
  if (turnos.length === 0) return <p className="text-sm text-slate-500">Sin turnos.</p>;
  return (
    <ul className="divide-y divide-[#20374e]">
      {turnos.map((t) => {
        const puesto = uno(t.puestos as { codigo: string; nombre: string } | { codigo: string; nombre: string }[] | null);
        const apertura = t.aperturas_turno?.[0]?.hora_captura ?? null;
        return (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0"><p className="truncate">{puesto ? `${puesto.codigo} · ${puesto.nombre}` : "Puesto"}</p><p className="text-xs text-slate-500">{fechaHoraEcuador(t.inicio_programado)} → {fechaHoraEcuador(t.fin_programado)}{apertura ? ` · abierto ${fechaHoraEcuador(apertura)}` : ""}</p></div>
            <Etiqueta tono={t.estado === "abierto" ? "verde" : t.estado === "cerrado" ? "azul" : t.estado === "ausente" ? "rojo" : "gris"}>{t.estado}</Etiqueta>
          </li>
        );
      })}
    </ul>
  );
}

function Panel({ titulo, detalle, children }: { titulo: string; detalle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><h2 className="font-semibold">{titulo}</h2><p className="mt-1 text-sm text-slate-400">{detalle}</p><div className="mt-4">{children}</div></section>;
}
function Resumen({ titulo, valor, alerta = false }: { titulo: string; valor: number; alerta?: boolean }) {
  return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${alerta ? "text-amber-300" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>;
}
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <div className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2"><dt className="text-xs text-slate-500">{etiqueta}</dt><dd className="mt-0.5 text-slate-200">{valor}</dd></div>;
}
function Etiqueta({ tono, children }: { tono: "verde" | "ambar" | "rojo" | "azul" | "gris"; children: React.ReactNode }) {
  const clase = { verde: "bg-emerald-500/12 text-emerald-300", ambar: "bg-amber-500/12 text-amber-300", rojo: "bg-red-500/12 text-red-300", azul: "bg-[#0788ff]/15 text-[#65c8ff]", gris: "bg-slate-500/10 text-slate-400" }[tono];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${clase}`}>{children}</span>;
}
function iniciales(nombre: string) { return nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase(); }
