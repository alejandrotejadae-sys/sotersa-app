"use client";

import { useActionState, useEffect, useRef } from "react";
import { eliminarDocumento, subirDocumento, type EstadoDocumento } from "./documentos-acciones";

const INICIAL: EstadoDocumento = { tipo: "inicial", mensaje: "" };
const control = "mt-2 min-h-11 w-full rounded-xl border border-[#27425e] bg-[#041225] px-3 text-sm text-white outline-none focus:border-[#0788ff]";

export type DocumentoAdmin = { ruta: string; titulo: string; extension: string; tamano: string; actualizado: string | null };

/** Documentación general que se publica para todos los clientes. */
export function DocumentosAdmin({ generales }: { generales: DocumentoAdmin[] }) {
  const [estado, accion, pendiente] = useActionState(subirDocumento, INICIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.tipo === "exito") form.current?.reset(); }, [estado]);

  return (
    <div className="space-y-5">
      <form ref={form} action={accion} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="ambito" value="general" />
        <Campo etiqueta="Título" ayuda="así lo verá el cliente"><input name="titulo" required minLength={3} maxLength={80} placeholder="Permiso de funcionamiento 2026" className={control} /></Campo>
        <Campo etiqueta="Archivo" ayuda="PDF, JPG o PNG · hasta 3,5 MB"><input name="archivo" type="file" required accept="application/pdf,image/jpeg,image/png" className={`${control} file:mr-3 file:rounded-lg file:border-0 file:bg-[#0788ff]/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#65c8ff]`} /></Campo>
        {estado.mensaje && <p aria-live="polite" className={`sm:col-span-2 rounded-xl border px-3 py-2.5 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
        <button disabled={pendiente} className="min-h-11 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{pendiente ? "Publicando…" : "Publicar documento"}</button>
      </form>

      <Grupo titulo="Para todos los clientes" documentos={generales} vacio="Aún no hay documentos generales. Empieza por el permiso de funcionamiento, el RUC y la certificación BASC." />
    </div>
  );
}

/** Archivos privados de una empresa, administrados directamente en su ficha. */
export function ArchivosCliente({ empresa, documentos }: { empresa: { id: string; nombre: string }; documentos: DocumentoAdmin[] }) {
  const [estado, accion, pendiente] = useActionState(subirDocumento, INICIAL);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.tipo === "exito") form.current?.reset();
  }, [estado]);

  return (
    <details className="group mt-4 rounded-xl border border-[#27425e] bg-[#041225]/80">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <span aria-hidden="true" className="text-[#65c8ff]">▣</span>
            Archivos del cliente
            <span className="rounded-full bg-[#0788ff]/15 px-2 py-0.5 text-[0.7rem] font-medium text-[#65c8ff]">{documentos.length}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">Privados para {empresa.nombre}</p>
        </div>
        <span aria-hidden="true" className="text-lg text-[#65c8ff] transition-transform group-open:rotate-45">+</span>
      </summary>

      <div className="space-y-4 border-t border-[#20374e] p-3">
        <form ref={form} action={accion} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="ambito" value="cliente" />
          <input type="hidden" name="empresa_id" value={empresa.id} />
          <Campo etiqueta="Título" ayuda="nombre visible">
            <input name="titulo" required minLength={3} maxLength={80} placeholder="Contrato, póliza o informe" className={control} />
          </Campo>
          <Campo etiqueta="Archivo" ayuda="PDF, JPG o PNG · hasta 3,5 MB">
            <input name="archivo" type="file" required accept="application/pdf,image/jpeg,image/png" className={`${control} file:mr-3 file:rounded-lg file:border-0 file:bg-[#0788ff]/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#65c8ff]`} />
          </Campo>
          {estado.mensaje && <p aria-live="polite" className={`sm:col-span-2 rounded-xl border px-3 py-2.5 text-sm ${estado.tipo === "exito" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{estado.mensaje}</p>}
          <button disabled={pendiente} className="min-h-11 rounded-xl bg-gradient-to-r from-[#087ff0] to-[#02b9e8] px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
            {pendiente ? "Subiendo…" : "Subir archivo a este cliente"}
          </button>
        </form>

        <Grupo titulo="Archivos publicados" documentos={documentos} vacio="Este cliente todavía no tiene archivos. Los que subas aquí aparecerán únicamente en su portal." />
      </div>
    </details>
  );
}

function Grupo({ titulo, documentos, vacio }: { titulo: string; documentos: DocumentoAdmin[]; vacio: string }) {
  if (documentos.length === 0 && !vacio) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{titulo}</p>
      {documentos.length === 0 ? <p className="mt-2 text-sm text-slate-500">{vacio}</p> : (
        <ul className="mt-2 divide-y divide-[#20374e] rounded-xl border border-[#27425e] bg-[#041225]">
          {documentos.map((d) => (
            <li key={d.ruta} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0"><p className="truncate text-sm text-slate-200">{d.titulo}</p><p className="text-xs text-slate-500">{d.extension.toUpperCase()} · {d.tamano}{d.actualizado ? ` · ${d.actualizado}` : ""}</p></div>
              <form action={eliminarDocumento}>
                <input type="hidden" name="ruta" value={d.ruta} />
                <button onClick={(e) => { if (!window.confirm(`¿Retirar «${d.titulo}»? Los clientes dejarán de verlo.`)) e.preventDefault(); }} className="min-h-9 rounded-full border border-red-500/30 px-3 text-xs text-red-300">Retirar</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-300">{etiqueta}{ayuda && <span className="ml-1 text-xs font-normal text-slate-500">{ayuda}</span>}{children}</label>;
}
