import Link from "next/link";
import { CabeceraPanel } from "@/app/componentes/cabecera-panel";
import { IconoEscudoOk, IconoFlecha, IconoLibro } from "@/app/componentes/iconos";
import { exigirPerfil, fechaHoraEcuador } from "@/lib/sesion";
import { esLector } from "@/lib/roles";
import { documentosParaCliente, tamanoLegible, type Documento } from "@/lib/documentos";

export const metadata = { title: "Documentación habilitante — SOTERSA" };
export const dynamic = "force-dynamic";

/**
 * Documentacion habilitante vista por el cliente: lo que respalda que SOTERSA
 * puede prestar el servicio (permisos, RUC, BASC, polizas) y lo especifico de
 * su contrato. Los enlaces caducan en una hora; al volver a entrar se firman
 * de nuevo.
 */
export default async function PaginaDocumentos({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { perfil } = await exigirPerfil(["cliente", "admin", "operativo"]);
  const params = await searchParams;
  const empresaId = perfil.empresa_cliente_id ?? (esLector(perfil.rol) && /^[0-9a-f-]{36}$/i.test(params.empresa ?? "") ? params.empresa! : null);
  const { generales, propios } = empresaId ? await documentosParaCliente(empresaId) : { generales: [], propios: [] };

  return (
    <div className="min-h-dvh pb-12">
      <CabeceraPanel rol="cliente" nombre={perfil.nombre} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
        <Link href={esLector(perfil.rol) ? `/portal${empresaId ? `?empresa=${empresaId}` : ""}` : "/perfiles"} className="inline-flex items-center gap-1 self-start text-sm font-medium text-azul-400"><span className="rotate-180"><IconoFlecha className="h-4 w-4" /></span> {esLector(perfil.rol) ? "Volver al portal" : "Menú principal"}</Link>

        <section>
          <p className="flex items-center gap-2 text-sm font-medium text-azul-400"><IconoEscudoOk className="h-5 w-5" /> Transparencia</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Documentación habilitante</h1>
          <p className="mt-1 text-sm text-gris-400">Los documentos que respaldan la operación de SOTERSA y los específicos de tu contrato. Puedes abrirlos o descargarlos cuando los necesites.</p>
        </section>

        <Grupo titulo="Documentos de SOTERSA" detalle="Permisos, registros y certificaciones de la empresa." documentos={generales} vacio="SOTERSA está cargando su documentación. Aparecerá aquí en cuanto esté publicada." />
        <Grupo titulo="Documentos de tu contrato" detalle="Publicados únicamente para tu empresa." documentos={propios} vacio="No hay documentos específicos de tu contrato por ahora." />

        <p className="text-xs leading-5 text-gris-500">Los enlaces de descarga son personales y caducan en una hora. Si necesitas un documento que no ves aquí, solicítalo a la central operativa de SOTERSA.</p>
      </main>
    </div>
  );
}

function Grupo({ titulo, detalle, documentos, vacio }: { titulo: string; detalle: string; documentos: Documento[]; vacio: string }) {
  return (
    <section className="tarjeta overflow-hidden">
      <div className="border-b border-borde/60 px-5 py-4"><h2 className="font-semibold text-white">{titulo}</h2><p className="mt-1 text-xs text-gris-500">{detalle}</p></div>
      {documentos.length === 0 ? <p className="px-5 py-8 text-center text-sm text-gris-400">{vacio}</p> : (
        <ul className="divide-y divide-borde/50">
          {documentos.map((d) => (
            <li key={d.ruta} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-azul-500/40 bg-azul-500/10 text-azul-300"><IconoLibro className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="truncate font-medium text-white">{d.titulo}</p><p className="text-xs text-gris-500">{d.extension.toUpperCase()} · {tamanoLegible(d.tamano)}{d.actualizado ? ` · actualizado ${fechaHoraEcuador(d.actualizado)}` : ""}</p></div>
              </div>
              {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full border border-azul-500/40 bg-azul-500/10 px-4 py-2 text-xs font-semibold text-azul-300">Abrir</a> : <span className="text-xs text-gris-500">No disponible</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
