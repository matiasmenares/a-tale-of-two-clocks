import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export estático (`next build` genera `out/`), listo para subir a S3 u otro hosting estático.
  output: "export",
  // Permite correr un segundo servidor (pruebas) sin compartir la caché `.next` con el principal.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
