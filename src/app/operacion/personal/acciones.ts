"use server";

import { revalidatePath } from "next/cache";
import { cedulaEsValida } from "@/lib/auth";
import { exigirPerfil } from "@/lib/sesion";
import { crearClienteAdministrador } from "@/lib/supabase/administrador";

export type EstadoRegistroAgente = { tipo: "inicial" | "error" | "exito"; mensaje: string };

export async function registrarAgente(_: EstadoRegistroAgente, formData: FormData): Promise<EstadoRegistroAgente> {
  await exigirPerfil(["admin"]);

  const nombre = String(formData.get("nombre") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  const cedula = String(formData.get("cedula") ?? "").replace(/\D/g, "").slice(0, 10);
  const telefono = String(formData.get("telefono") ?? "").trim().replace(/[^\d+]/g, "").slice(0, 15) || null;
  const credencial = String(formData.get("credencial") ?? "").trim().slice(0, 40) || null;

  if (nombre.length < 3) return fallo("Escribe el nombre completo del agente.");
  if (!cedulaEsValida(cedula)) return fallo("La cédula ecuatoriana no es válida.");
  if (telefono && telefono.length < 7) return fallo("El teléfono ingresado no es válido.");

  const administrador = crearClienteAdministrador();
  const { data: guardiaExistente } = await administrador
    .from("guardias")
    .select("id,perfil_id,activo")
    .eq("cedula", cedula)
    .maybeSingle();

  if (guardiaExistente?.perfil_id) return fallo("Este agente ya existe y tiene cuenta. Edítalo desde su ficha.");

  // Solo la ficha operativa. El acceso a la app (cuenta, PIN) se crea en
  // Usuarios y permisos, que es el unico lugar autorizado para eso.
  const datosGuardia = { nombre, cedula, telefono, credencial, activo: true };
  const resultadoGuardia = guardiaExistente
    ? await administrador.from("guardias").update(datosGuardia).eq("id", guardiaExistente.id)
    : await administrador.from("guardias").insert(datosGuardia);
  if (resultadoGuardia.error) return fallo("No fue posible registrar al agente en el equipo operativo.");

  revalidatePath("/operacion/personal");
  revalidatePath("/operacion/usuarios");
  revalidatePath("/admin");
  return { tipo: "exito", mensaje: "Ficha creada. Para darle acceso a la app, crea su cuenta en Usuarios y permisos." };
}

function fallo(mensaje: string): EstadoRegistroAgente { return { tipo: "error", mensaje }; }

