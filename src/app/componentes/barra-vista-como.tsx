import { volverAMiCuenta } from "@/app/admin/ver-como/acciones";
import { ETIQUETA_ROL } from "@/lib/roles";
import type { VistaComo } from "@/lib/vista-como";

/** Recordatorio permanente de que la sesion es prestada, con la salida a mano. */
export function BarraVistaComo({ vista }: { vista: VistaComo }) {
  return (
    <div className="sticky top-0 z-[60] border-b border-amber-400/40 bg-[#3a2a06]/95 px-4 py-2 text-amber-100 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs sm:text-sm">
        <p className="min-w-0"><span className="font-semibold">Viendo como {vista.comoNombre}</span> · {ETIQUETA_ROL[vista.comoRol] ?? vista.comoRol}. Lo que hagas queda a su nombre.</p>
        <form action={volverAMiCuenta}><button type="submit" className="rounded-full border border-amber-300/50 bg-amber-300/15 px-3 py-1.5 font-semibold text-amber-50 transition hover:bg-amber-300/25">← Volver a mi cuenta</button></form>
      </div>
    </div>
  );
}
