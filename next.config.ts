import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // El formulario de perfil admite una imagen de 3 MB. Next limita las
    // Server Actions a 1 MB por omisión y bloqueaba la foto antes de llegar
    // a la validación de la app. Se deja margen solo para el multipart.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
