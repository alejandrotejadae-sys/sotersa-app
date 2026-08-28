import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOTERSA — Puesto de control",
  description:
    "Sistema de operaciones y bitácora digital de SOTERSA Seguridad Estratégica.",
};

export const viewport: Viewport = {
  // La app del guardia se usa de noche. El tema claro deslumbra y delata la
  // posicion de quien la mira.
  themeColor: "#191d21",
  // Sin zoom accidental: el guardia opera con una mano y a veces con guantes.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col bg-gris-900 text-gris-50">
        {children}
      </body>
    </html>
  );
}
