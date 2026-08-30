import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Sin conexión — SOTERSA" };

export default function PaginaSinConexion() {
  return <main className="grid min-h-dvh place-items-center bg-[#020b18] px-5 text-white"><section className="tarjeta w-full max-w-md p-7 text-center"><Image src="/logo-sotersa.png" width={180} height={64} alt="SOTERSA" className="mx-auto h-auto w-40" priority/><span className="mx-auto mt-7 grid h-16 w-16 place-items-center rounded-full border border-amber-400/35 bg-amber-400/10 text-2xl text-amber-200">!</span><h1 className="mt-5 text-2xl font-bold">Sin conexión</h1><p className="mt-3 text-sm leading-6 text-gris-400">Las rondas y novedades que ya capturaste permanecen seguras en este dispositivo. Se enviarán automáticamente cuando vuelva Internet.</p><Link href="/" className="boton-primario mt-6 grid min-h-14 place-items-center rounded-xl font-semibold">Intentar nuevamente</Link><p className="mt-4 text-xs text-gris-500">No se almacenan paneles ni información privada en la caché.</p></section></main>;
}
