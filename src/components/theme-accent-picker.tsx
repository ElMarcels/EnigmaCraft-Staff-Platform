"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck } from "@/components/icons";

export type ThemeKey =
  | "ruby"
  | "cyan"
  | "amethyst"
  | "emerald"
  | "amber"
  | "sakura"
  | "ocean"
  | "lime"
  | "blood"
  | "void"
  | "sunset"
  | "diamond";

type ThemeOption = {
  key: ThemeKey;
  name: string;
  subtitle: string;
  gradient: string;
  glowColor: string;
  primary: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
};

const THEMES: ThemeOption[] = [
  {
    key: "ruby",
    name: "Rubí Carmesí",
    subtitle: "Obsidian Crimson · Clásico por defecto",
    gradient: "from-rose-500 to-red-700",
    glowColor: "rgba(225, 29, 72, 0.45)",
    primary: "#f43f5e",
    borderColor: "rgba(244, 63, 94, 0.8)",
    badgeBg: "rgba(225, 29, 72, 0.2)",
    badgeText: "#fda4af",
  },
  {
    key: "cyan",
    name: "Cian Glaciar",
    subtitle: "Frosted Ice · Azul holográfico",
    gradient: "from-cyan-400 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.45)",
    primary: "#06b6d4",
    borderColor: "rgba(6, 182, 212, 0.8)",
    badgeBg: "rgba(6, 182, 212, 0.2)",
    badgeText: "#67e8f9",
  },
  {
    key: "amethyst",
    name: "Amatista Mística",
    subtitle: "Nether Amethyst · Púrpura cósmico",
    gradient: "from-purple-500 to-indigo-600",
    glowColor: "rgba(168, 85, 247, 0.45)",
    primary: "#a855f7",
    borderColor: "rgba(168, 85, 247, 0.8)",
    badgeBg: "rgba(168, 85, 247, 0.2)",
    badgeText: "#d8b4fe",
  },
  {
    key: "emerald",
    name: "Esmeralda Neón",
    subtitle: "Voxel Emerald · Verde brillante",
    gradient: "from-emerald-400 to-teal-600",
    glowColor: "rgba(16, 185, 129, 0.45)",
    primary: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.8)",
    badgeBg: "rgba(16, 185, 129, 0.2)",
    badgeText: "#6ee7b7",
  },
  {
    key: "amber",
    name: "Ámbar Forja",
    subtitle: "Blaze Forge · Dorado y bronce",
    gradient: "from-amber-400 to-yellow-600",
    glowColor: "rgba(245, 158, 11, 0.45)",
    primary: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.8)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeText: "#fde68a",
  },
  {
    key: "sakura",
    name: "Flor de Cerezo",
    subtitle: "Sakura Neon · Magenta y rosa eléctrico",
    gradient: "from-pink-500 to-rose-600",
    glowColor: "rgba(236, 72, 153, 0.45)",
    primary: "#ec4899",
    borderColor: "rgba(236, 72, 153, 0.8)",
    badgeBg: "rgba(236, 72, 153, 0.2)",
    badgeText: "#f472b6",
  },
  {
    key: "ocean",
    name: "Lapislázuli Eléctrico",
    subtitle: "Deep Ocean · Azul cobalto puro",
    gradient: "from-blue-500 to-indigo-700",
    glowColor: "rgba(59, 130, 246, 0.45)",
    primary: "#3b82f6",
    borderColor: "rgba(59, 130, 246, 0.8)",
    badgeBg: "rgba(59, 130, 246, 0.2)",
    badgeText: "#93c5fd",
  },
  {
    key: "lime",
    name: "Toxic Slime",
    subtitle: "Acid Lime · Verde radiactivo",
    gradient: "from-lime-400 to-green-600",
    glowColor: "rgba(132, 204, 22, 0.45)",
    primary: "#84cc16",
    borderColor: "rgba(132, 204, 22, 0.8)",
    badgeBg: "rgba(132, 204, 22, 0.2)",
    badgeText: "#bef264",
  },
  {
    key: "blood",
    name: "Sangre Nether",
    subtitle: "Blood Red · Carmesí volcánico profundo",
    gradient: "from-red-600 to-rose-900",
    glowColor: "rgba(220, 38, 38, 0.5)",
    primary: "#dc2626",
    borderColor: "rgba(220, 38, 38, 0.8)",
    badgeBg: "rgba(220, 38, 38, 0.2)",
    badgeText: "#fca5a5",
  },
  {
    key: "void",
    name: "Obsidiana Void",
    subtitle: "Void Cyber · Índigo y púrpura oscuro",
    gradient: "from-indigo-500 to-purple-800",
    glowColor: "rgba(99, 102, 241, 0.45)",
    primary: "#6366f1",
    borderColor: "rgba(99, 102, 241, 0.8)",
    badgeBg: "rgba(99, 102, 241, 0.2)",
    badgeText: "#c7d2fe",
  },
  {
    key: "sunset",
    name: "Magma Volcánico",
    subtitle: "Sunset Forge · Naranja solar ardiente",
    gradient: "from-orange-500 to-red-600",
    glowColor: "rgba(249, 115, 22, 0.45)",
    primary: "#f97316",
    borderColor: "rgba(249, 115, 22, 0.8)",
    badgeBg: "rgba(249, 115, 22, 0.2)",
    badgeText: "#fdba74",
  },
  {
    key: "diamond",
    name: "Diamante Celestial",
    subtitle: "Sky Diamond · Cian cielo luminoso",
    gradient: "from-sky-400 to-cyan-600",
    glowColor: "rgba(56, 189, 248, 0.45)",
    primary: "#38bdf8",
    borderColor: "rgba(56, 189, 248, 0.8)",
    badgeBg: "rgba(56, 189, 248, 0.2)",
    badgeText: "#bae6fd",
  },
];

export function ThemeAccentPicker() {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("ruby");

  useEffect(() => {
    const saved = localStorage.getItem("ec-theme-accent") as ThemeKey | null;
    if (saved && THEMES.some((t) => t.key === saved)) {
      setCurrentTheme(saved);
      if (saved === "ruby") {
        document.documentElement.removeAttribute("data-theme");
        document.body.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", saved);
        document.body.setAttribute("data-theme", saved);
      }
    }
  }, []);

  function selectTheme(key: ThemeKey, name: string) {
    setCurrentTheme(key);
    localStorage.setItem("ec-theme-accent", key);
    if (key === "ruby") {
      document.documentElement.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", key);
      document.body.setAttribute("data-theme", key);
    }
    toast.success(`Acento cambiado a ${name}`, {
      description: "Toda la atmósfera, resplandores y elementos de la plataforma se han transformado.",
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {THEMES.map((theme) => {
          const isSelected = currentTheme === theme.key;
          return (
            <button
              key={theme.key}
              type="button"
              onClick={() => selectTheme(theme.key, theme.name)}
              style={
                isSelected
                  ? {
                      borderColor: theme.borderColor,
                      boxShadow: `0 0 24px -4px ${theme.glowColor}`,
                    }
                  : undefined
              }
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden select-none group ${
                isSelected
                  ? "bg-white/[0.07]"
                  : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.2] hover:bg-white/[0.05]"
              }`}
            >
              {/* Dynamic Glow Background */}
              <div
                className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-2xl opacity-25 transition-opacity group-hover:opacity-50"
                style={{ backgroundColor: theme.primary }}
              />

              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-md border border-white/20 flex items-center justify-center`}
                  >
                    {isSelected ? (
                      <IconCheck className="h-4 w-4 text-white drop-shadow" />
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-tight">
                      {theme.name}
                    </div>
                  </div>
                </div>
                {isSelected ? (
                  <span
                    style={{
                      backgroundColor: theme.badgeBg,
                      borderColor: theme.borderColor,
                      color: theme.badgeText,
                    }}
                    className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Activo
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-slate-400 mt-1">{theme.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
