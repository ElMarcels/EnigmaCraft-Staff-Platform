import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EnigmaCraft Staff",
    template: "%s · EnigmaCraft Staff",
  },
  description:
    "Plataforma interna de gestión y comunicación para el staff de la network de Minecraft EnigmaCraft.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
