"use client";

export type PendienteOperativo = {
  id: string;
  tipo: "ronda" | "novedad";
  creadoEn: string;
  datos: Record<string, string | number | null>;
  foto?: Blob | null;
};

const BASE = "sotersa-operacion";
const ALMACEN = "pendientes";
export const EVENTO_COLA = "sotersa:cola-actualizada";

function abrir() {
  return new Promise<IDBDatabase>((resolver, rechazar) => {
    const solicitud = indexedDB.open(BASE, 1);
    solicitud.onupgradeneeded = () => { if (!solicitud.result.objectStoreNames.contains(ALMACEN)) solicitud.result.createObjectStore(ALMACEN, { keyPath: "id" }); };
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error);
  });
}

export async function encolarOperacion(pendiente: PendienteOperativo) {
  const base = await abrir();
  await new Promise<void>((resolver, rechazar) => {
    const transaccion = base.transaction(ALMACEN, "readwrite");
    transaccion.objectStore(ALMACEN).put(pendiente);
    transaccion.oncomplete = () => resolver();
    transaccion.onerror = () => rechazar(transaccion.error);
  });
  base.close();
  window.dispatchEvent(new Event(EVENTO_COLA));
}

export async function listarOperaciones() {
  const base = await abrir();
  const filas = await new Promise<PendienteOperativo[]>((resolver, rechazar) => {
    const solicitud = base.transaction(ALMACEN).objectStore(ALMACEN).getAll();
    solicitud.onsuccess = () => resolver(solicitud.result as PendienteOperativo[]);
    solicitud.onerror = () => rechazar(solicitud.error);
  });
  base.close();
  return filas.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
}

export async function quitarOperacion(id: string) {
  const base = await abrir();
  await new Promise<void>((resolver, rechazar) => {
    const transaccion = base.transaction(ALMACEN, "readwrite");
    transaccion.objectStore(ALMACEN).delete(id);
    transaccion.oncomplete = () => resolver();
    transaccion.onerror = () => rechazar(transaccion.error);
  });
  base.close();
  window.dispatchEvent(new Event(EVENTO_COLA));
}
