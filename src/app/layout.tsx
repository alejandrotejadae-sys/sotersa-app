import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
};

export const viewport: Viewport = {
  // La app del guardia se usa de noche. El tema claro deslumbra y delata la
  // posicion de quien la mira.
  themeColor: "#191d21",
  // Sin zoom accidental: el guardia opera con una mano y a veces con guantes.
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gris-900 text-gris-50">
        {children}
      </body>
    </html>
  );
}
