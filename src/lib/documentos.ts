import "server-only";

import { crearClienteAdministrador } from "@/lib/supabase/administrador";

/**
 * Documentacion habilitante de SOTERSA: permiso de funcionamiento, RUC,
 * certificacion BASC, polizas, permisos de armas... Lo que un cliente tiene
 * derecho a ver de la empresa que le presta el servicio.
 *
 * Vive en un contenedor PRIVADO de Storage, sin tabla aparte: el nombre del
 * archivo es el titulo, la carpeta dice a quien va. Un cliente ve la carpeta
 * "general" y la suya; nunca la de otro cliente. Los enlaces son firmados y
 * caducan en una hora.
 */
export const CONTENEDOR_DOCUMENTOS = "documentacion-habilitante";
export const TAMANO_MAXIMO = 3.5 * 1024 * 1024;
export const TIPOS_DOCUMENTO = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

export type Documento = {
  ruta: string;
  titulo: string;
  extension: string;
  tamano: number;
  actualizado: string | null;
  ambito: "general" | "cliente";
  url: string | null;
};

export function carpetaGeneral() {
  return "general";
}
export function carpetaCliente(empresaId: string) {
  return `cliente/${empresaId}`;
}

/** Un titulo escrito por el admin, convertido en nombre de archivo seguro. */
export function nombreDeArchivo(titulo: string, extension: string) {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 _()-]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return `${base || "Documento"}.${extension}`;
}

async function asegurarContenedor() {
  const administrador = crearClienteAdministrador();
  const { data } = await administrador.storage.getBucket(CONTENEDOR_DOCUMENTOS);
  if (!data) {
    await administrador.storage.createBucket(CONTENEDOR_DOCUMENTOS, { public: false, allowedMimeTypes: [...TIPOS_DOCUMENTO.keys()], fileSizeLimit: TAMANO_MAXIMO });
  }
  return administrador;
}

async function listar(carpeta: string, ambito: Documento["ambito"], firmar: boolean): Promise<Documento[]> {
  const administrador = await asegurarContenedor();
  const { data } = await administrador.storage.from(CONTENEDOR_DOCUMENTOS).list(carpeta, { limit: 100, sortBy: { column: "name", order: "asc" } });
  const archivos = (data ?? []).filter((a) => a.name && !a.name.startsWith(".") && a.id);
  const rutas = archivos.map((a) => `${carpeta}/${a.name}`);
  const firmas = firmar && rutas.length > 0 ? (await administrador.storage.from(CONTENEDOR_DOCUMENTOS).createSignedUrls(rutas, 60 * 60)).data ?? [] : [];
  return archivos.map((a, i) => {
    const punto = a.name.lastIndexOf(".");
    return {
      ruta: rutas[i],
      titulo: punto > 0 ? a.name.slice(0, punto) : a.name,
      extension: punto > 0 ? a.name.slice(punto + 1).toLowerCase() : "",
      tamano: Number((a.metadata as { size?: number } | null)?.size ?? 0),
      actualizado: a.updated_at ?? a.created_at ?? null,
      ambito,
      url: firmas[i]?.signedUrl ?? null,
    };
  });
}

/** Lo que ve un cliente: lo general y lo suyo, con enlaces firmados. */
export async function documentosParaCliente(empresaId: string) {
  const [generales, propios] = await Promise.all([listar(carpetaGeneral(), "general", true), listar(carpetaCliente(empresaId), "cliente", true)]);
  return { generales, propios };
}

/** Lo que administra el admin: todo, sin firmar (solo lista y borra). */
export async function documentosParaAdmin(empresas: { id: string; nombre: string }[]) {
  const generales = await listar(carpetaGeneral(), "general", false);
  const porCliente = await Promise.all(empresas.map(async (e) => ({ empresa: e, documentos: await listar(carpetaCliente(e.id), "cliente", false) })));
  return { generales, porCliente: porCliente.filter((c) => c.documentos.length > 0) };
}

export function tamanoLegible(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
