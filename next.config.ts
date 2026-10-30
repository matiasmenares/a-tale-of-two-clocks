import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite correr un segundo servidor (pruebas) sin compartir la caché `.next` con el principal.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
