import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { TarjetaMetrica } from "@/app/componentes/tarjeta-metrica";
import {
  IconoAlerta,
  IconoCiclo,
  IconoEscudoOk,
  IconoLista,
  IconoRonda,
  IconoTurno,
} from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil, fechaHoraEcuador, horaEcuador, uno } from "@/lib/sesion";

export const metadata = { title: "Portal del cliente — SOTERSA" };
export const dynamic = "force-dynamic";

export default async function PaginaPortal() {
  const { supabase, perfil } = await exigirPerfil(["cliente", "admin"]);
  const desde = ahoraConDesfase(-30 * 24);

  const empresaConsulta = supabase
    .from("empresas_cliente")
    .select("id, nombre, direccion, contacto_nombre, contacto_telefono");
  const empresaPromesa = perfil.empresa_cliente_id
    ? empresaConsulta.eq("id", perfil.empresa_cliente_id).single()
    : empresaConsulta.order("nombre").limit(1).maybeSingle();

  const [empresaR, puestosR, novedadesR, slaR] = await Promise.all([
    empresaPromesa,
    supabase.from("puestos").select("id, codigo, nombre, cobertura_horas, armado").eq("activo", true),
    supabase
      .from("novedades")
      .select("id, tipo, severidad, descripcion, foto_url, hora_captura, estado, nota_supervisor, puestos(codigo, nombre)")
      .order("hora_captura", { ascending: false })
      .limit(12),
    supabase
      .from("v_sla_novedades")
      .select("id, hora_captura, notificada_en, minutos_aviso, cumple_sla")
      .gte("hora_captura", desde),
  ]);

  const empresa = empresaR.data;
  const puestos = puestosR.data ?? [];
  const novedades = novedadesR.data ?? [];
  const sla = slaR.data ?? [];
  const medidos = sla.filter((fila) => fila.cumple_sla !== null);
  const cumplidos = medidos.filter((fila) => fila.cumple_sla).length;
  const puntaje = medidos.length ? Math.round((cumplidos / medidos.length) * 100) : 100;
  const pendientes = novedades.filter((novedad) => novedad.estado !== "cerrada").length;

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="cliente" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <section>
          <p className="text-sm font-medium text-azul-400">Cliente</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Buenos días, {perfil.nombre.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-gris-400">Gracias por confiar en SOTERSA.</p>
        </section>

        <section className="panel-operativo grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-azul-500/50 bg-azul-500/10 text-azul-400"><IconoEscudoOk className="h-9 w-9" /></span>
            <div><h2 className="text-2xl font-bold text-white">Servicio protegido</h2><p className="mt-1 text-lg text-gris-300">{empresa?.nombre ?? "Cuenta corporativa"}</p><span className="mt-3 inline-flex rounded-full border border-normal/30 bg-normal/10 px-3 py-1.5 text-sm font-medium text-green-300">Operación normal</span><p className="mt-3 text-sm text-gris-400">{puestos.length} puesto(s) activo(s) bajo supervisión.</p></div>
          </div>
          <div className="border-t border-borde/60 pt-5 text-center sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"><p className="text-sm text-gris-400">Cumplimiento SLA</p><p className="mt-2 text-5xl font-bold text-azul-400">{puntaje}%</p><p className="mt-1 text-xs text-gris-500">últimos 30 días</p></div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaMetrica titulo="Puestos protegidos" valor={puestos.length} detalle="servicios activos" icono={<IconoTurno className="h-7 w-7" />} tono="normal" />
          <TarjetaMetrica titulo="SLA medido" valor={medidos.length} detalle="avisos evaluados" icono={<IconoCiclo className="h-7 w-7" />} />
          <TarjetaMetrica titulo="Novedades" valor={novedades.length} detalle="visibles en bitácora" icono={<IconoLista className="h-7 w-7" />} />
          <TarjetaMetrica titulo="Por revisar" valor={pendientes} detalle="seguimiento abierto" icono={<IconoAlerta className="h-7 w-7" />} tono={pendientes ? "novedad" : "normal"} />
        </section>

        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="font-semibold text-white">Puestos protegidos</h2><span className="text-xs text-gris-500">Cobertura contratada</span></div>
          {puestos.length === 0 ? <Vacio texto="No hay puestos activos asociados a esta cuenta." /> : <div className="divide-y divide-borde/50">{puestos.map((puesto) => <article key={puesto.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium text-white">{puesto.codigo} · {puesto.nombre}</p><p className="mt-1 text-sm text-gris-500">Cobertura {puesto.cobertura_horas} h · {puesto.armado ? "servicio armado" : "servicio no armado"}</p></div><span className="rounded-full bg-normal/15 px-3 py-1 text-xs font-medium text-green-300">Protegido</span></article>)}</div>}
        </section>

        <section className="tarjeta overflow-hidden">
          <div className="flex items-center justify-between border-b border-borde/60 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-white"><IconoRonda className="h-5 w-5 text-azul-400" /> Bitácora reciente</h2><span className="text-xs text-gris-500">Validada por SOTERSA</span></div>
          {novedades.length === 0 ? <Vacio texto="No hay novedades publicadas para tu cuenta." /> : (
            <div className="divide-y divide-borde/50">
              {novedades.map((novedad) => (
                <article key={novedad.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-white">{novedad.tipo}</p><p className="mt-1 text-xs text-gris-500">{uno(novedad.puestos)?.codigo} · {fechaHoraEcuador(novedad.hora_captura)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${novedad.severidad === "emergencia" ? "bg-emergencia/15 text-red-200" : novedad.severidad === "novedad" ? "bg-novedad/15 text-amber-200" : "bg-azul-500/15 text-azul-300"}`}>{novedad.estado}</span></div>
                  <p className="mt-3 text-sm leading-relaxed text-gris-300">{novedad.descripcion}</p>
                  {novedad.nota_supervisor && <p className="mt-3 rounded-xl bg-azul-500/10 px-4 py-3 text-sm text-azul-100"><strong>Supervisión:</strong> {novedad.nota_supervisor}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tarjeta p-5">
          <h2 className="font-semibold text-white">Transparencia del servicio</h2>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">El indicador SLA mide el tiempo entre el registro de una novedad y su notificación. Solo ves registros validados y autorizados para tu empresa; los datos de otros clientes permanecen aislados por las políticas de seguridad.</p>
          {sla.length > 0 && <p className="mt-3 text-xs text-gris-500">Último aviso medido: {horaEcuador(sla[0].hora_captura)}</p>}
        </section>
      </main>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="px-5 py-8 text-center text-sm text-gris-500">{texto}</p>;
}
