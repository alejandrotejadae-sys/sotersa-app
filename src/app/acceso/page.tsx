import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/app/componentes/marca";
import { IconoEscudoOk } from "@/app/componentes/iconos";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FormularioAcceso } from "./formulario-acceso";

export const metadata = { title: "Ingreso — SOTERSA" };

type PerfilIngreso = "admin" | "supervisor" | "guardia" | "custodia" | "central" | "cliente";

const opciones: Record<PerfilIngreso, { etiqueta: string; destino: string; detalle: string }> = {
  admin: { etiqueta: "Administrador", destino: "/admin", detalle: "Acceso administrativo y configuración general." },
  supervisor: { etiqueta: "Supervisor", destino: "/supervisor", detalle: "Supervisión de personal, puestos y novedades." },
  guardia: { etiqueta: "Agente de seguridad", destino: "/guardia?desde=perfiles", detalle: "Turno, asistencia, rondas y novedades." },
  custodia: { etiqueta: "Custodia armada", destino: "/guardia/custodia", detalle: "Ruta, evidencias y operación de custodia." },
  central: { etiqueta: "Central operativa", destino: "/admin", detalle: "Monitoreo y control central de la operación." },
  cliente: { etiqueta: "Cliente", destino: "/portal", detalle: "Consulta de servicios e información autorizada." },
};

export default async function PaginaAcceso({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const parametros = await searchParams;
  const perfil = esPerfil(parametros.perfil) ? parametros.perfil : null;
  const opcion = perfil ? opciones[perfil] : null;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(opcion?.destino ?? "/perfiles");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-7 px-6 py-10">
      <header className="flex flex-col items-center gap-5 text-center">
        <Marca tamano="grande" />
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-azul-400">
            <IconoEscudoOk className="h-5 w-5" /> Acceso seguro{opcion ? ` · ${opcion.etiqueta}` : ""}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">{opcion ? `Ingreso ${opcion.etiqueta}` : "Centro de seguridad"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-gris-400">
            {opcion?.detalle ?? "Ingresa con tus credenciales asignadas para acceder a las funciones autorizadas de SOTERSA."}
          </p>
        </div>
      </header>
      <section className="panel-operativo p-6 sm:p-7">
        <FormularioAcceso destino={opcion?.destino ?? "/perfiles"} />
      </section>
      <Link href="/" className="text-center text-sm font-medium text-[#0788ff]">← Cambiar perfil de ingreso</Link>
    </main>
  );
}

function esPerfil(valor: string | undefined): valor is PerfilIngreso {
  return Boolean(valor && valor in opciones);
}
