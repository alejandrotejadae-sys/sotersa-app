import Link from "next/link";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoCamion, IconoEscudoOk, IconoFlecha, IconoLista, IconoPersona, IconoTurno } from "@/app/componentes/iconos";
import { exigirPerfil, uno } from "@/lib/sesion";
import { entrarComo } from "./acciones";

export const metadata = { title: "Ver como — SOTERSA" };
export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  "sin-correo": "Tu cuenta de administrador no tiene correo; no es posible volver a ella después.",
  datos: "La selección no es válida.",
  "no-existe": "Esa cuenta ya no existe.",
  admin: "No se puede entrar como otro administrador.",
  bloqueada: "Esa cuenta está bloqueada. Desbloquéala en Usuarios y permisos si quieres verla.",
  enlace: "Supabase no pudo generar el acceso. Inténtalo de nuevo.",
  sesion: "No se pudo abrir la sesión. Inténtalo de nuevo.",
};

type Cuenta = { id: string; nombre: string; detalle: string };

/**
 * Cinco puertas, una por tipo de usuario. Cada una lista las cuentas reales
 * de ese tipo; al elegir una, la app pasa a ser esa sesion.
 */
export default async function PaginaVerComo({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await exigirPerfil(["admin"]);
  const { error } = await searchParams;

  const [perfilesR, guardiasR] = await Promise.all([
    supabase.from("perfiles").select("id,nombre,rol,activo,empresas_cliente(nombre),zonas(nombre)").eq("activo", true).in("rol", ["cliente", "supervisor", "operativo", "guardia"]).order("nombre"),
    supabase.from("guardias").select("perfil_id,credencial,puestos:puesto_habitual_id(codigo,nombre,tipo_servicio)").not("perfil_id", "is", null),
  ]);
  const perfiles = perfilesR.data ?? [];
  const fichas = new Map((guardiasR.data ?? []).map((g) => [g.perfil_id as string, g]));

  const de = (rol: string): Cuenta[] => perfiles.filter((p) => p.rol === rol).map((p) => {
    const ficha = fichas.get(p.id);
    const puesto = ficha ? uno(ficha.puestos) : null;
    const detalle = p.rol === "cliente" ? (uno(p.empresas_cliente)?.nombre ?? "Sin empresa")
      : p.rol === "supervisor" ? (uno(p.zonas)?.nombre ?? "Sin zona")
      : p.rol === "guardia" ? [ficha?.credencial, puesto ? `${puesto.codigo} · ${puesto.nombre}` : "Sin puesto"].filter(Boolean).join(" · ")
      : "Ve todo, no edita";
    return { id: p.id, nombre: p.nombre, detalle };
  });
  const agentes = de("guardia");
  const custodias = agentes.filter((a) => { const f = fichas.get(a.id); return uno(f?.puestos)?.tipo_servicio === "custodia_armada"; });

  const puertas: Array<{ titulo: string; detalle: string; icono: React.ReactNode; cuentas: Cuenta[]; destino: string; vacio: string }> = [
    { titulo: "Clientes", detalle: "Menú del cliente: Mi servicio, agentes, custodia, documentación y escuela.", icono: <IconoEscudoOk className="h-6 w-6" />, cuentas: de("cliente"), destino: "/", vacio: "Ningún cliente tiene cuenta todavía." },
    { titulo: "Supervisor", detalle: "Panel de supervisión de su zona.", icono: <IconoPersona className="h-6 w-6" />, cuentas: de("supervisor"), destino: "/", vacio: "No hay supervisores con cuenta." },
    { titulo: "Custodias", detalle: "Custodia armada tal como la abre el agente.", icono: <IconoCamion className="h-6 w-6" />, cuentas: custodias.length ? custodias : agentes, destino: "/guardia/custodia", vacio: "No hay agentes con cuenta." },
    { titulo: "Operativos", detalle: "Panel completo en modo consulta.", icono: <IconoLista className="h-6 w-6" />, cuentas: de("operativo"), destino: "/", vacio: "No hay cuentas operativo. Créala en Usuarios y permisos." },
    { titulo: "Agente de seguridad", detalle: "Menú del agente: mi puesto, custodia y escuela.", icono: <IconoTurno className="h-6 w-6" />, cuentas: agentes, destino: "/", vacio: "No hay agentes con cuenta." },
  ];

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/admin" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Panel administrativo</Link>

        <section className="mt-5">
          <p className="flex items-center gap-2 text-base font-medium text-[#0788ff]"><IconoPersona className="h-6 w-6" /> Vista de cada usuario</p>
          <h1 className="mt-2 text-3xl font-bold lg:text-4xl">Ver la app como la ven ellos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Elige el tipo de usuario y luego la cuenta. La app pasa a ser esa sesión, con sus mismos permisos y pantallas. Arriba verás una barra para volver a tu cuenta cuando termines.</p>
        </section>

        {error && <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{ERRORES[error] ?? "No se pudo abrir la vista."}</p>}

        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100"><strong>Es una sesión real.</strong> Todo lo que hagas mientras la ves queda a nombre de esa persona: abrir un turno, reportar una novedad, aceptar el aviso LOPDP, marcar una lección. Úsala para mirar, no para actuar por ellos.</p>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {puertas.map((puerta) => (
            <details key={puerta.titulo} className="group rounded-2xl border border-[#27425e] bg-[#07172a]/95 open:border-[#0788ff]/60">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0788ff]/12 text-[#49b6ff]">{puerta.icono}</span>
                <span className="min-w-0 flex-1"><span className="block text-lg font-semibold">{puerta.titulo}</span><span className="mt-0.5 block text-sm text-slate-400">{puerta.detalle}</span></span>
                <span className="shrink-0 rounded-full bg-[#0b2035] px-2.5 py-1 text-xs text-slate-300">{puerta.cuentas.length}</span>
                <span className="text-slate-500 transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-t border-[#20374e]">
                {puerta.cuentas.length === 0 ? <p className="px-5 py-6 text-center text-sm text-slate-500">{puerta.vacio}</p> : (
                  <ul className="max-h-80 divide-y divide-[#20374e] overflow-y-auto">
                    {puerta.cuentas.map((c) => (
                      <li key={c.id}>
                        <form action={entrarComo} className="flex items-center gap-3 px-5 py-3">
                          <input type="hidden" name="perfil_id" value={c.id} />
                          <input type="hidden" name="destino" value={puerta.destino} />
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{c.nombre}</span><span className="block truncate text-xs text-slate-500">{c.detalle}</span></span>
                          <button type="submit" className="shrink-0 rounded-full border border-[#0788ff]/45 bg-[#0788ff]/10 px-4 py-2 text-xs font-semibold text-[#8ddaff] transition hover:bg-[#0788ff]/20">Ver como</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </section>
      </div>
    </main>
  );
}
