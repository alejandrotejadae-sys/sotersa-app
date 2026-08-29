import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoEscudoOk, IconoFlecha, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { ahoraConDesfase, exigirPerfil } from "@/lib/sesion";
import { FormularioCliente } from "./formulario-cliente";

export const metadata = { title: "Clientes y servicios — SOTERSA" };
export const dynamic = "force-dynamic";

type Filtro = "todos" | "activos" | "incompletos";

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { supabase } = await exigirPerfil(["admin"]);
  const params = await searchParams;
  const filtro: Filtro = params.filtro === "activos" || params.filtro === "incompletos" ? params.filtro : "todos";
  const desde = ahoraConDesfase(-30 * 24);

  const [empresasR, puestosR, perfilesR, novedadesR] = await Promise.all([
    supabase.from("empresas_cliente").select("id,nombre,ruc,direccion,contacto_nombre,contacto_correo,contacto_telefono,activo").order("nombre"),
    supabase.from("puestos").select("id,empresa_cliente_id,codigo,nombre,cobertura_horas,armado,direccion,activo,contactos_puesto(id,tipo,nombre,telefono)").order("codigo"),
    supabase.from("perfiles").select("id,nombre,empresa_cliente_id,activo").eq("rol", "cliente"),
    supabase.from("novedades").select("id,puesto_id,estado,severidad").gte("hora_captura", desde),
  ]);

  const empresas = empresasR.data ?? [];
  const puestos = puestosR.data ?? [];
  const perfiles = perfilesR.data ?? [];
  const novedades = novedadesR.data ?? [];
  const puestosActivos = puestos.filter((puesto) => puesto.activo);
  const empresasActivas = empresas.filter((empresa) => empresa.activo).length;
  const cuentasActivas = perfiles.filter((perfil) => perfil.activo).length;
  const incompletas = empresas.filter((empresa) => faltantesEmpresa(empresa).length > 0).length;
  const visibles = empresas.filter((empresa) => {
    if (filtro === "activos") return empresa.activo;
    if (filtro === "incompletos") return faltantesEmpresa(empresa).length > 0;
    return true;
  });

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/admin" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

        <section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Administración comercial</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Clientes y servicios</h1><p className="mt-1 text-sm text-slate-400">Vista consolidada de empresas, puestos contratados y accesos al portal.</p></section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Resumen titulo="Clientes" valor={empresas.length} />
          <Resumen titulo="Activos" valor={empresasActivas} normal />
          <Resumen titulo="Puestos activos" valor={puestosActivos.length} />
          <Resumen titulo="Datos pendientes" valor={incompletas} alerta={incompletas > 0} />
        </section>

        <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4">
          <h2 className="font-semibold">Registrar cliente o puesto</h2>
          <p className="mt-1 text-sm text-slate-400">El alta desde aquí evita cargar datos por fuera de la app.</p>
          <div className="mt-4">
            <FormularioCliente empresas={empresas.filter((empresa) => empresa.activo).map((empresa) => ({ id: empresa.id, nombre: empresa.nombre }))} />
          </div>
        </section>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filtros de clientes"><FiltroEnlace filtro="todos" actual={filtro} texto="Todos" /><FiltroEnlace filtro="activos" actual={filtro} texto="Activos" /><FiltroEnlace filtro="incompletos" actual={filtro} texto="Datos pendientes" /></nav>

        {empresasR.error || puestosR.error || perfilesR.error || novedadesR.error ? (
          <p className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm text-red-200">No fue posible cargar toda la información comercial. Intenta nuevamente.</p>
        ) : visibles.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 px-5 py-10 text-center text-sm text-slate-400">No hay clientes en esta categoría.</p>
        ) : (
          <section className="mt-5 grid items-start gap-4 lg:grid-cols-2">
            {visibles.map((empresa) => {
              const servicios = puestos.filter((puesto) => puesto.empresa_cliente_id === empresa.id);
              const idsPuestos = new Set(servicios.map((puesto) => puesto.id));
              const reportes = novedades.filter((novedad) => idsPuestos.has(novedad.puesto_id));
              const pendientes = reportes.filter((novedad) => novedad.estado === "registrada").length;
              const cuentas = perfiles.filter((perfil) => perfil.empresa_cliente_id === empresa.id);
              const faltantes = faltantesEmpresa(empresa);
              return (
                <article key={empresa.id} className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95">
                  <div className="flex items-start justify-between gap-4 border-b border-[#20374e] px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3"><Avatar nombre={empresa.nombre} /><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{empresa.nombre}</h2><p className="mt-1 truncate text-sm text-slate-400">{empresa.ruc ? `RUC ${empresa.ruc}` : "RUC pendiente"}</p></div></div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${empresa.activo ? "bg-emerald-500/12 text-emerald-300" : "bg-slate-500/10 text-slate-400"}`}>{empresa.activo ? "Activo" : "Inactivo"}</span>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-[#20374e] border-b border-[#20374e] text-center"><DatoNumero valor={servicios.filter((puesto) => puesto.activo).length} etiqueta="Puestos" /><DatoNumero valor={cuentas.filter((cuenta) => cuenta.activo).length} etiqueta="Accesos" /><DatoNumero valor={pendientes} etiqueta="Alertas" alerta={pendientes > 0} /></div>

                  <div className="px-4 py-4">
                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-400 sm:grid-cols-2"><Dato icono="⌖" valor={empresa.direccion ?? "Dirección pendiente"} /><Dato icono="●" valor={empresa.contacto_nombre ?? "Contacto pendiente"} /><Dato icono="☎" valor={empresa.contacto_telefono ?? "Teléfono pendiente"} /><Dato icono="@" valor={empresa.contacto_correo ?? "Correo pendiente"} /></div>

                    {faltantes.length > 0 && <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-200">Información pendiente: {faltantes.join(", ")}.</p>}

                    <details className="group mt-4 rounded-xl border border-[#27425e] bg-[#041225]">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-sm font-medium text-slate-200"><span className="flex items-center gap-2"><IconoTurno className="h-5 w-5 text-[#0788ff]" /> Servicios contratados</span><IconoFlecha className="h-4 w-4 rotate-90 text-slate-500 transition group-open:-rotate-90" /></summary>
                      <div className="divide-y divide-[#20374e] border-t border-[#20374e]">{servicios.length === 0 ? <p className="px-3 py-4 text-sm text-slate-500">Sin puestos registrados.</p> : servicios.map((puesto) => <div key={puesto.id} className="flex items-start justify-between gap-3 px-3 py-3"><div><p className="text-sm font-medium">{puesto.codigo} · {puesto.nombre}</p><p className="mt-1 text-xs text-slate-500">{puesto.cobertura_horas} h · {puesto.armado ? "Armado" : "No armado"} · {puesto.contactos_puesto?.length ?? 0} contacto(s)</p></div><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${puesto.activo ? "bg-emerald-400" : "bg-slate-500"}`} /></div>)}</div>
                    </details>

                    <Link href={`/portal?empresa=${empresa.id}`} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30">Ver portal del cliente <IconoFlecha className="h-4 w-4" /></Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><div className="flex items-start gap-3"><IconoPersona className="mt-0.5 h-6 w-6 shrink-0 text-[#0788ff]" /><div><h2 className="font-semibold">Accesos de clientes</h2><p className="mt-1 text-sm leading-6 text-slate-400">Hay {cuentasActivas} cuenta(s) activa(s) de cliente. Cada cuenta únicamente puede consultar los puestos y novedades autorizadas de su propia empresa.</p></div></div></section>
      </div>
    </main>
  );
}

function faltantesEmpresa(empresa: { ruc: string | null; direccion: string | null; contacto_nombre: string | null; contacto_correo: string | null; contacto_telefono: string | null }) {
  return [[empresa.ruc, "RUC"], [empresa.direccion, "dirección"], [empresa.contacto_nombre, "contacto"], [empresa.contacto_correo, "correo"], [empresa.contacto_telefono, "teléfono"]].filter(([valor]) => !valor).map(([, etiqueta]) => etiqueta as string);
}

function Resumen({ titulo, valor, normal = false, alerta = false }: { titulo: string; valor: number; normal?: boolean; alerta?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${alerta ? "text-amber-300" : normal ? "text-emerald-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function FiltroEnlace({ filtro, actual, texto }: { filtro: Filtro; actual: Filtro; texto: string }) { const activo = filtro === actual; return <Link href={filtro === "todos" ? "/operacion/clientes" : `/operacion/clientes?filtro=${filtro}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${activo ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]" : "border-[#27425e] bg-[#07172a] text-slate-400"}`}>{texto}</Link>; }
function Avatar({ nombre }: { nombre: string }) { const iniciales = nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase(); return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#0788ff]/35 bg-gradient-to-br from-[#17456d] to-[#071a30] text-sm font-bold text-[#78d4ff]">{iniciales}</span>; }
function DatoNumero({ valor, etiqueta, alerta = false }: { valor: number; etiqueta: string; alerta?: boolean }) { return <div className="px-2 py-3"><p className={`text-xl font-bold ${alerta ? "text-red-400" : "text-white"}`}>{valor}</p><p className="mt-0.5 text-[0.7rem] text-slate-500">{etiqueta}</p></div>; }
function Dato({ icono, valor }: { icono: string; valor: string }) { return <p className="flex min-w-0 items-center gap-2"><span className="w-4 shrink-0 text-center text-[#0788ff]">{icono}</span><span className="truncate">{valor}</span></p>; }
