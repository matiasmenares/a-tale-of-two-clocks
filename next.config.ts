import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  // Export estático (`next build` genera `out/`), listo para subir a S3 u otro hosting estático.
  output: "export",
  // Desarrollo y build no pueden escribir en la misma caché: se pierden chunks del servidor.
  // Se mantiene el override para servidores de prueba y exportaciones.
  distDir: process.env.NEXT_DIST_DIR ?? (phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"),
});

export default nextConfig;
