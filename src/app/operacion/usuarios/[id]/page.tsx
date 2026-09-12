import Link from "next/link";
import { notFound } from "next/navigation";
import { Marca, Pulso } from "@/app/componentes/marca";
import { IconoFlecha, IconoPersona } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador, uno } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";
import { AVISO_VERSION, ROLES_CON_CONSENTIMIENTO } from "@/lib/consentimiento";
import { ETIQUETA_ROL, puedeEditar } from "@/lib/roles";
import { ClaveUsuario, EditorUsuario, EstadoCuenta, type Cuenta } from "./ficha-usuario";

export const metadata = { title: "Ficha de usuario — SOTERSA" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Ficha de una cuenta: quien es, como entra, que ha hecho, y las tres acciones de control. */
export default async function PaginaUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user, perfil: quienMira } = await exigirPerfil(["admin", "operativo"]);
  const editable = puedeEditar(quienMira.rol);

  const { data: perfil } = await supabase.from("perfiles").select("id,rol,nombre,telefono,activo,empresa_cliente_id,zona_id,creado_en,empresas_cliente(nombre),zonas(nombre),guardias(id,cedula,credencial,activo,puesto_habitual_id)").eq("id", id).maybeSingle();
  if (!perfil) notFound();

  const administrador = crearClienteAdministrador();
  const [{ data: auth }, empresasR, zonasR, consentimientoR] = await Promise.all([
    administrador.auth.admin.getUserById(id),
    supabase.from("empresas_cliente").select("id,nombre").eq("activo", true).order("nombre"),
    supabase.from("zonas").select("id,nombre").order("nombre"),
    ROLES_CON_CONSENTIMIENTO.has(perfil.rol) ? supabase.from("consentimientos").select("aceptado_en,retirado_en").eq("perfil_id", id).eq("version", AVISO_VERSION).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const guardia = uno(perfil.guardias);
  const correo = auth?.user?.email ?? "";
  const usuarioIngreso = perfil.rol === "guardia" ? (guardia?.cedula ?? correo.split("@")[0]) : correo;
  const claveTemporal = auth?.user?.user_metadata?.debe_cambiar_clave === true;
  const bloqueadaAuth = Boolean(auth?.user && "banned_until" in auth.user && auth.user.banned_until && new Date(auth.user.banned_until as string) > new Date());
  const ultimoIngreso = auth?.user?.last_sign_in_at ?? null;
  const consentimiento = consentimientoR.data && !consentimientoR.data.retirado_en ? consentimientoR.data.aceptado_en : null;

  const cuenta: Cuenta = { id: perfil.id, rol: perfil.rol as Cuenta["rol"], nombre: perfil.nombre, telefono: perfil.telefono, activo: perfil.activo && !bloqueadaAuth, empresa_cliente_id: perfil.empresa_cliente_id, zona_id: perfil.zona_id, esPropia: perfil.id === user.id };

  return (
    <main className="min-h-dvh bg-[#020b18] text-white">
      <div className="mx-auto min-h-dvh w-full max-w-[1280px] bg-[radial-gradient(circle_at_50%_-5%,rgba(0,128,255,0.14),transparent_34%),linear-gradient(180deg,#020b18,#031226_55%,#020b18)] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4"><Marca tamano="panel" /><span className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"><Pulso /> En línea</span></header>
        <Link href="/operacion/usuarios" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0788ff]"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> Usuarios y permisos</Link>

        <section className="mt-5 flex flex-wrap items-center gap-4">
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl border text-lg font-semibold ${perfil.rol === "admin" ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-[#38526b] bg-gradient-to-br from-[#244868] to-[#0a1e34] text-[#8ddaff]"}`}>{iniciales(perfil.nombre)}</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-[#0788ff]"><IconoPersona className="h-5 w-5" /> {ETIQUETA_ROL[perfil.rol] ?? perfil.rol}{cuenta.esPropia ? " · tu cuenta" : ""}</p>
            <h1 className="mt-1 text-3xl font-bold lg:text-4xl">{perfil.nombre}</h1>
            <p className="mt-1 font-mono text-sm text-slate-400">{usuarioIngreso}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Etiqueta tono={cuenta.activo ? "verde" : "rojo"}>{cuenta.activo ? "Activa" : "Bloqueada"}</Etiqueta>
            <Etiqueta tono={claveTemporal ? "ambar" : "verde"}>{claveTemporal ? "Clave temporal sin cambiar" : "Clave propia"}</Etiqueta>
            {ROLES_CON_CONSENTIMIENTO.has(perfil.rol) && <Etiqueta tono={consentimiento ? "verde" : "ambar"}>{consentimiento ? "LOPDP aceptado" : "LOPDP pendiente"}</Etiqueta>}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Último ingreso" valor={ultimoIngreso ? fechaHoraEcuador(ultimoIngreso) : "Nunca"} />
          <Dato etiqueta="Cuenta creada" valor={fechaHoraEcuador(perfil.creado_en)} />
          {perfil.rol === "cliente" && <Dato etiqueta="Empresa" valor={uno(perfil.empresas_cliente)?.nombre ?? "Sin empresa"} />}
          {perfil.rol === "supervisor" && <Dato etiqueta="Zona" valor={uno(perfil.zonas)?.nombre ?? "Sin zona"} />}
          {perfil.rol === "guardia" && <Dato etiqueta="Credencial" valor={guardia?.credencial ?? "Pendiente"} />}
          {perfil.rol === "guardia" && <Dato etiqueta="Ficha operativa" valor={guardia ? (guardia.activo ? "Activo en nómina" : "Dado de baja") : "Sin ficha"} enlace={guardia ? `/operacion/personal/${guardia.id}` : undefined} />}
          {perfil.rol === "cliente" && perfil.empresa_cliente_id && <Dato etiqueta="Portal" valor="Ver como el cliente" enlace={`/portal?empresa=${perfil.empresa_cliente_id}`} />}
          {perfil.rol === "admin" && <Dato etiqueta="Alcance" valor="Acceso completo" />}
          {perfil.rol === "operativo" && <Dato etiqueta="Alcance" valor="Ve todo; no edita ni restablece claves" />}
          {perfil.rol === "operativo" && <Dato etiqueta="Alcance" valor="Ve todo; no edita ni restablece claves" />}
        </section>

        {!editable && <p className="mt-5 rounded-xl border border-[#27425e] bg-[#041225] px-4 py-3 text-sm text-slate-400">Vista de consulta. Editar datos, restablecer claves y bloquear cuentas es exclusivo del administrador.</p>}
        {editable && <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel titulo="Datos de la cuenta" detalle="Nombre, teléfono y vínculo. El rol no se cambia: para otro rol se crea otra cuenta.">
            <EditorUsuario cuenta={cuenta} empresas={empresasR.data ?? []} zonas={zonasR.data ?? []} />
          </Panel>
          <div className="space-y-5">
            <Panel titulo={perfil.rol === "guardia" ? "Restablecer PIN" : "Restablecer clave"} detalle="Cuando la persona la olvidó, o nunca cambió la temporal.">
              <ClaveUsuario cuenta={cuenta} usuarioIngreso={usuarioIngreso} />
            </Panel>
            <Panel titulo="Estado de la cuenta" detalle="Bloquear impide el ingreso sin borrar nada. Para dar de baja a un agente de la nómina, usa su ficha.">
              <EstadoCuenta cuenta={cuenta} />
            </Panel>
          </div>
        </div>}
      </div>
    </main>
  );
}

function Panel({ titulo, detalle, children }: { titulo: string; detalle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#27425e] bg-[#07172a]/95 p-4"><h2 className="font-semibold">{titulo}</h2><p className="mt-1 text-sm text-slate-400">{detalle}</p><div className="mt-4">{children}</div></section>;
}
function Dato({ etiqueta, valor, enlace }: { etiqueta: string; valor: string; enlace?: string }) {
  const cuerpo = <><p className="text-xs text-slate-500">{etiqueta}</p><p className={`mt-0.5 text-sm ${enlace ? "text-[#8ddaff]" : "text-slate-200"}`}>{valor}{enlace ? " →" : ""}</p></>;
  return enlace ? <Link href={enlace} className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5 transition hover:bg-[#0b2035]">{cuerpo}</Link> : <div className="rounded-xl border border-[#27425e] bg-[#041225] px-3 py-2.5">{cuerpo}</div>;
}
function Etiqueta({ tono, children }: { tono: "verde" | "ambar" | "rojo"; children: React.ReactNode }) {
  const clase = { verde: "bg-emerald-500/12 text-emerald-300", ambar: "bg-amber-500/12 text-amber-300", rojo: "bg-red-500/12 text-red-300" }[tono];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${clase}`}>{children}</span>;
}
function iniciales(nombre: string) { return nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }
