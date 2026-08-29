import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoEscudoOk, IconoFlecha, IconoPersona } from "@/app/componentes/iconos";
import { exigirPerfil, uno } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { FormularioUsuario } from "./formulario-usuario";

export const metadata = { title: "Usuarios y permisos — SOTERSA" };
export const dynamic = "force-dynamic";

type Filtro = "todos" | "admin" | "supervisor" | "guardia" | "cliente";

export default async function PaginaUsuarios({ searchParams }: { searchParams: Promise<{ rol?: string }> }) {
  const { supabase } = await exigirPerfil(["admin"]);
  const params = await searchParams;
  const filtro: Filtro = ["admin", "supervisor", "guardia", "cliente"].includes(params.rol ?? "") ? params.rol as Filtro : "todos";
  const [perfilesR, empresasR, zonasR, guardiasR] = await Promise.all([
    supabase.from("perfiles").select("id,rol,nombre,activo,empresa_cliente_id,zona_id,empresas_cliente(nombre),zonas(nombre),guardias(id,cedula,credencial)").order("nombre"),
    supabase.from("empresas_cliente").select("id,nombre").eq("activo", true).order("nombre"),
    supabase.from("zonas").select("id,nombre").order("nombre"),
    supabase.from("guardias").select("id,nombre,cedula,perfil_id").eq("activo", true).order("nombre"),
  ]);

  const perfiles = perfilesR.data ?? [];
  const disponibles = (guardiasR.data ?? []).filter((guardia) => !guardia.perfil_id);
  const correos = await obtenerCorreos();
  const visibles = perfiles.filter((perfil) => filtro === "todos" || perfil.rol === filtro);
  const activos = perfiles.filter((perfil) => perfil.activo).length;

  return (
    <main className="min-h-dvh bg-[#020b18] text-white"><div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
      <Link href="/admin" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Volver al panel</Link>

      <section className="mt-5"><p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoEscudoOk className="h-6 w-6" /> Control de acceso</p><h1 className="mt-2 text-3xl font-bold lg:text-4xl">Usuarios y permisos</h1><p className="mt-1 text-sm text-slate-400">Cuentas autorizadas para ingresar a los distintos perfiles de la app.</p></section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Resumen titulo="Cuentas" valor={perfiles.length} /><Resumen titulo="Activas" valor={activos} normal /><Resumen titulo="Agentes sin acceso" valor={disponibles.length} alerta={disponibles.length > 0} /><Resumen titulo="Clientes con acceso" valor={perfiles.filter((perfil) => perfil.rol === "cliente" && perfil.activo).length} /></section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="overflow-hidden rounded-2xl border border-[#27425e] bg-[#07172a]/95"><div className="border-b border-[#20374e] px-4 py-4"><h2 className="font-semibold">Cuentas registradas</h2><nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar usuarios"><FiltroEnlace filtro="todos" actual={filtro} texto="Todos" /><FiltroEnlace filtro="admin" actual={filtro} texto="Admin" /><FiltroEnlace filtro="supervisor" actual={filtro} texto="Supervisores" /><FiltroEnlace filtro="guardia" actual={filtro} texto="Agentes de seguridad" /><FiltroEnlace filtro="cliente" actual={filtro} texto="Clientes" /></nav></div><div className="divide-y divide-[#20374e]">{visibles.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No hay cuentas en esta categoría.</p> : visibles.map((perfil) => { const empresa = uno(perfil.empresas_cliente); const zona = uno(perfil.zonas); const guardia = uno(perfil.guardias); const correo = correos.get(perfil.id); return <article key={perfil.id} className="grid grid-cols-[2.8rem_1fr_auto] items-center gap-3 px-4 py-3.5"><Avatar nombre={perfil.nombre} rol={perfil.rol} /><div className="min-w-0"><p className="truncate font-semibold">{perfil.nombre}</p><p className="truncate text-sm text-slate-400">{correoVisible(correo, guardia?.cedula)}</p><p className="mt-1 truncate text-xs text-slate-500">{empresa?.nombre ?? zona?.nombre ?? etiquetaRol(perfil.rol)}</p></div><div className="text-right"><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${perfil.activo ? "bg-emerald-500/12 text-emerald-300" : "bg-slate-500/10 text-slate-400"}`}>{perfil.activo ? "Activo" : "Inactivo"}</span><p className="mt-1.5 text-[0.65rem] uppercase tracking-wide text-slate-500">{etiquetaRol(perfil.rol)}</p></div></article>; })}</div></section>

        <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 lg:sticky lg:top-5"><div className="mb-4 flex items-center gap-3 border-b border-[#20374e] pb-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0788ff]/12 text-[#49b6ff]"><IconoPersona className="h-6 w-6" /></span><div><h2 className="font-semibold">Crear nuevo acceso</h2><p className="text-xs text-slate-500">No modifica las cuentas existentes.</p></div></div><FormularioUsuario empresas={empresasR.data ?? []} zonas={zonasR.data ?? []} guardias={disponibles} /></section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><h2 className="font-semibold">Alcance de cada rol</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Permiso rol="Agente de seguridad" detalle="Solo su turno, rondas, apertura y novedades." /><Permiso rol="Supervisor" detalle="Personal, puestos y novedades de su zona." /><Permiso rol="Cliente" detalle="Únicamente servicios y reportes de su empresa." /></div></section>
    </div></main>
  );
}

async function obtenerCorreos() { const mapa = new Map<string, string>(); try { const administrador = crearClienteAdministrador(); const { data } = await administrador.auth.admin.listUsers({ page: 1, perPage: 1000 }); for (const usuario of data.users) if (usuario.email) mapa.set(usuario.id, usuario.email); } catch { /* El panel conserva los perfiles aunque la lista de Auth no esté disponible. */ } return mapa; }
function correoVisible(correo?: string, cedula?: string | null) { if (cedula) return `Usuario ${cedula}`; if (!correo) return "Correo no disponible"; return correo.endsWith("@guardias.sotersa.app") ? `Usuario ${correo.split("@")[0]}` : correo; }
function etiquetaRol(rol: string) { return ({ admin: "Administrador", supervisor: "Supervisor", guardia: "Agente de seguridad", cliente: "Cliente" } as Record<string, string>)[rol] ?? rol; }
function Resumen({ titulo, valor, normal = false, alerta = false }: { titulo: string; valor: number; normal?: boolean; alerta?: boolean }) { return <article className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4 text-center"><p className={`text-3xl font-bold ${alerta ? "text-amber-300" : normal ? "text-emerald-400" : "text-white"}`}>{valor}</p><p className="mt-1 text-xs text-slate-400">{titulo}</p></article>; }
function FiltroEnlace({ filtro, actual, texto }: { filtro: Filtro; actual: Filtro; texto: string }) { const activo = filtro === actual; return <Link href={filtro === "todos" ? "/operacion/usuarios" : `/operacion/usuarios?rol=${filtro}`} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${activo ? "border-[#0788ff] bg-[#0788ff]/15 text-[#65c8ff]" : "border-[#27425e] bg-[#041225] text-slate-400"}`}>{texto}</Link>; }
function Avatar({ nombre, rol }: { nombre: string; rol: string }) { const iniciales = nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase(); return <span className={`grid h-11 w-11 place-items-center rounded-full border text-xs font-bold ${rol === "admin" ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-[#38526b] bg-gradient-to-br from-[#244868] to-[#0a1e34] text-[#8ddaff]"}`}>{iniciales}</span>; }
function Permiso({ rol, detalle }: { rol: string; detalle: string }) { return <article className="rounded-xl border border-[#27425e] bg-[#041225] p-3"><p className="font-medium text-[#65c8ff]">{rol}</p><p className="mt-1 text-sm leading-5 text-slate-400">{detalle}</p></article>; }
