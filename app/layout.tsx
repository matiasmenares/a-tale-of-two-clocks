import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const sans = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jet", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gemelos relativistas",
  description: "Simulador educativo de la paradoja de los gemelos: relatividad especial y general.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
