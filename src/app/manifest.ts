import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOTERSA Seguridad Estratégica",
    short_name: "SOTERSA",
    description: "Sistema operativo y de seguridad de SOTERSA.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020b18",
    theme_color: "#020b18",
    icons: [
      {
        src: "/icono-lobo-sotersa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono-lobo-sotersa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // El enmascarable es otro archivo, con el emblema mas pequeño: el
      // sistema recorta en circulo y solo respeta el 80% central. Usar el
      // mismo que "any" le cortaria las orejas al lobo en Android.
      {
        src: "/icono-lobo-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
