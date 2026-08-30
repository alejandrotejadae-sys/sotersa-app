import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { PantallaApertura } from "@/app/componentes/pantalla-apertura";
import { PantallaBienvenida } from "@/app/componentes/pantalla-bienvenida";
import { SincronizadorOperativo } from "@/app/componentes/sincronizador-operativo";
import { NotificadorOperativo } from "@/app/componentes/notificador-operativo";
import { RegistroPwa } from "@/app/componentes/registro-pwa";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOTERSA — Puesto de control",
  description:
    "Sistema de operaciones y bitácora digital de SOTERSA Seguridad Estratégica.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SOTERSA",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icono-lobo-sotersa-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icono-lobo-sotersa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icono-lobo-sotersa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  // La app del guardia se usa de noche. El tema claro deslumbra y delata la
  // posicion de quien la mira.
  themeColor: "#020b18",
  // Sin zoom accidental: el guardia opera con una mano y a veces con guantes.
  maximumScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let esAdmin = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();
    esAdmin = perfil?.rol === "admin";
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gris-900 text-gris-50">
        <PantallaApertura />
        <PantallaBienvenida />
        <SincronizadorOperativo />
        <NotificadorOperativo />
        <RegistroPwa />
        {children}
        {esAdmin && (
          <Link
            href="/perfiles"
            aria-label="Volver al selector de perfiles"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-3 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#0788ff]/45 bg-[#031226]/95 px-4 py-2 text-sm font-semibold text-[#8ddaff] shadow-xl shadow-black/35 backdrop-blur-xl transition hover:border-[#49b6ff] hover:bg-[#08203a] md:bottom-5 md:right-5"
          >
            <span aria-hidden="true">←</span>
            Perfiles
          </Link>
        )}
      </body>
    </html>
  );
}
