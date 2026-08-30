import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AmbientParticles } from "@/components/ambient-particles";
import { PillDock } from "@/components/pill-dock";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EnigmaCraft Staff · Network Platform",
    template: "%s · EnigmaCraft Staff",
  },
  description:
    "Plataforma interna de gestión, comunicación y control para el staff de la network de Minecraft EnigmaCraft.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ec-theme-accent');if(t&&t!=='ruby'){document.documentElement.setAttribute('data-theme',t);document.body&&document.body.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased selection:bg-rose-500/30 selection:text-rose-200 relative pb-16 lg:pb-0">
        <AmbientParticles />
        <div className="relative z-10">{children}</div>
        <PillDock />
        <Toaster
          theme="dark"
          richColors
          closeButton
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(15, 20, 30, 0.9)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#f8fafc",
              boxShadow: "0 16px 36px -4px rgba(0,0,0,0.5), 0 0 20px -2px rgba(225, 29, 72, 0.15)",
              borderRadius: "12px",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
