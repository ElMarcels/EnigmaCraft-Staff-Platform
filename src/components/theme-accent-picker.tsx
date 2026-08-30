"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck } from "@/components/icons";

export type ThemeKey = "ruby" | "amethyst" | "emerald" | "cyan" | "amber";

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
    glowColor: "rgba(225, 29, 72, 0.4)",
    primary: "#f43f5e",
    borderColor: "rgba(244, 63, 94, 0.8)",
    badgeBg: "rgba(225, 29, 72, 0.2)",
    badgeText: "#fda4af",
  },
  {
    key: "amethyst",
    name: "Amatista Mística",
    subtitle: "Nether Amethyst · Púrpura cósmico",
    gradient: "from-purple-500 to-indigo-600",
    glowColor: "rgba(168, 85, 247, 0.4)",
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
    glowColor: "rgba(16, 185, 129, 0.4)",
    primary: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.8)",
    badgeBg: "rgba(16, 185, 129, 0.2)",
    badgeText: "#6ee7b7",
  },
  {
    key: "cyan",
    name: "Cian Glaciar",
    subtitle: "Frosted Ice · Azul holográfico",
    gradient: "from-cyan-400 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.4)",
    primary: "#06b6d4",
    borderColor: "rgba(6, 182, 212, 0.8)",
    badgeBg: "rgba(6, 182, 212, 0.2)",
    badgeText: "#67e8f9",
  },
  {
    key: "amber",
    name: "Ámbar Forja",
    subtitle: "Blaze Forge · Dorado y bronce",
    gradient: "from-amber-400 to-yellow-600",
    glowColor: "rgba(245, 158, 11, 0.4)",
    primary: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.8)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeText: "#fde68a",
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
      description: "El nuevo esquema de color y resplandor se ha aplicado en toda la plataforma.",
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
