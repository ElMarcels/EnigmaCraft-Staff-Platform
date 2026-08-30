"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import {
  IconSearch,
  IconDashboard,
  IconChat,
  IconMail,
  IconFolder,
  IconMegaphone,
  IconContact,
  IconShield,
  IconSettings,
  IconBell,
  IconPlus,
} from "@/components/icons";

export type PaletteItem = {
  id: string;
  category: "Navegación" | "Acciones Rápidas" | "Temas & Glow" | "Staff";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        sounds.playPop();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const items: PaletteItem[] = [
    // Navigation
    {
      id: "nav-dash",
      category: "Navegación",
      title: "Ir al Dashboard",
      subtitle: "Vista general y métricas de la network",
      icon: <IconDashboard className="h-4 w-4" />,
      action: () => {
        router.push("/dashboard");
        setOpen(false);
      },
    },
    {
      id: "nav-chat",
      category: "Navegación",
      title: "Ir al Chat de Staff",
      subtitle: "Canales de texto y coordinación",
      icon: <IconChat className="h-4 w-4" />,
      action: () => {
        router.push("/chat");
        setOpen(false);
      },
    },
    {
      id: "nav-files",
      category: "Navegación",
      title: "Ir al Drive & Archivos",
      subtitle: "Plugins, esquemáticos y configs",
      icon: <IconFolder className="h-4 w-4" />,
      action: () => {
        router.push("/files");
        setOpen(false);
      },
    },
    {
      id: "nav-announcements",
      category: "Navegación",
      title: "Tablón de Anuncios",
      subtitle: "Comunicados oficiales de administración",
      icon: <IconMegaphone className="h-4 w-4" />,
      action: () => {
        router.push("/announcements");
        setOpen(false);
      },
    },
    {
      id: "nav-directory",
      category: "Navegación",
      title: "Directorio de Staff",
      subtitle: "Contactos y roles del equipo",
      icon: <IconContact className="h-4 w-4" />,
      action: () => {
        router.push("/directory");
        setOpen(false);
      },
    },
    {
      id: "nav-founder",
      category: "Navegación",
      title: "Panel de Fundador",
      subtitle: "Consola de control, usuarios y auditoría",
      icon: <IconShield className="h-4 w-4" />,
      action: () => {
        router.push("/founder");
        setOpen(false);
      },
    },
    {
      id: "nav-settings",
      category: "Navegación",
      title: "Ajustes de Perfil & Temas",
      subtitle: "Personalización y seguridad",
      icon: <IconSettings className="h-4 w-4" />,
      action: () => {
        router.push("/settings");
        setOpen(false);
      },
    },
    {
      id: "nav-dm",
      category: "Navegación",
      title: "Mensajes Directos",
      subtitle: "Conversaciones privadas",
      icon: <IconMail className="h-4 w-4" />,
      action: () => {
        router.push("/dm");
        setOpen(false);
      },
    },

    // Quick Actions
    {
      id: "act-sync",
      category: "Acciones Rápidas",
      title: "Vincular Carpeta Local de PC (Git Sync)",
      subtitle: "Sincronizar plugins y configs locales con la nube",
      icon: <IconPlus className="h-4 w-4" />,
      action: () => {
        router.push("/files");
        setOpen(false);
      },
    },
    {
      id: "act-notif",
      category: "Acciones Rápidas",
      title: "Ver Notificaciones",
      subtitle: "Alertas y menciones pendientes",
      icon: <IconBell className="h-4 w-4" />,
      action: () => {
        router.push("/notifications");
        setOpen(false);
      },
    },

    // Themes
    {
      id: "th-ruby",
      category: "Temas & Glow",
      title: "Cambiar a Rubí Carmesí",
      subtitle: "Obsidian Crimson (Clásico)",
      icon: <span className="h-3.5 w-3.5 rounded-full bg-rose-500 shadow-sm" />,
      action: () => {
        document.documentElement.removeAttribute("data-theme");
        document.body.removeAttribute("data-theme");
        localStorage.setItem("ec-theme-accent", "ruby");
        sounds.playTheme();
        toast.success("Acento cambiado a Rubí Carmesí");
        setOpen(false);
      },
    },
    {
      id: "th-cyan",
      category: "Temas & Glow",
      title: "Cambiar a Cian Glaciar",
      subtitle: "Frosted Ice · Azul holográfico",
      icon: <span className="h-3.5 w-3.5 rounded-full bg-cyan-400 shadow-sm" />,
      action: () => {
        document.documentElement.setAttribute("data-theme", "cyan");
        document.body.setAttribute("data-theme", "cyan");
        localStorage.setItem("ec-theme-accent", "cyan");
        sounds.playTheme();
        toast.success("Acento cambiado a Cian Glaciar");
        setOpen(false);
      },
    },
    {
      id: "th-emerald",
      category: "Temas & Glow",
      title: "Cambiar a Esmeralda Neón",
      subtitle: "Voxel Emerald · Verde brillante",
      icon: <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-sm" />,
      action: () => {
        document.documentElement.setAttribute("data-theme", "emerald");
        document.body.setAttribute("data-theme", "emerald");
        localStorage.setItem("ec-theme-accent", "emerald");
        sounds.playTheme();
        toast.success("Acento cambiado a Esmeralda Neón");
        setOpen(false);
      },
    },
    {
      id: "th-amethyst",
      category: "Temas & Glow",
      title: "Cambiar a Amatista Mística",
      subtitle: "Nether Amethyst · Púrpura cósmico",
      icon: <span className="h-3.5 w-3.5 rounded-full bg-purple-500 shadow-sm" />,
      action: () => {
        document.documentElement.setAttribute("data-theme", "amethyst");
        document.body.setAttribute("data-theme", "amethyst");
        localStorage.setItem("ec-theme-accent", "amethyst");
        sounds.playTheme();
        toast.success("Acento cambiado a Amatista Mística");
        setOpen(false);
      },
    },
    {
      id: "th-amber",
      category: "Temas & Glow",
      title: "Cambiar a Ámbar Forja",
      subtitle: "Blaze Forge · Dorado y bronce",
      icon: <span className="h-3.5 w-3.5 rounded-full bg-amber-400 shadow-sm" />,
      action: () => {
        document.documentElement.setAttribute("data-theme", "amber");
        document.body.setAttribute("data-theme", "amber");
        localStorage.setItem("ec-theme-accent", "amber");
        sounds.playTheme();
        toast.success("Acento cambiado a Ámbar Forja");
        setOpen(false);
      },
    },
    {
      id: "th-sakura",
      category: "Temas & Glow",
      title: "Cambiar a Flor de Cerezo",
      subtitle: "Sakura Neon · Magenta eléctrico",
      icon: <span className="h-3.5 w-3.5 rounded-full bg-pink-500 shadow-sm" />,
      action: () => {
        document.documentElement.setAttribute("data-theme", "sakura");
        document.body.setAttribute("data-theme", "sakura");
        localStorage.setItem("ec-theme-accent", "sakura");
        sounds.playTheme();
        toast.success("Acento cambiado a Flor de Cerezo");
        setOpen(false);
      },
    },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#090d16]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_var(--ruby-glow-soft)] backdrop-blur-3xl flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <IconSearch className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe un comando o busca en EnigmaCraft... (Esc para salir)"
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block rounded-lg border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No se encontraron resultados para &quot;{query}&quot;.
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {cat}
                </div>
                {filtered
                  .filter((item) => item.category === cat)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        item.action();
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.06] hover:translate-x-1 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 group-hover:text-white group-hover:border-white/20 transition-colors">
                          {item.icon}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300">
                        ↵
                      </span>
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-2.5 bg-white/[0.01] text-[11px] text-slate-500">
          <span>
            Pulsa <kbd className="font-mono text-slate-400">Ctrl + K</kbd> en cualquier parte
          </span>
          <span>Navegación instantánea</span>
        </div>
      </div>
    </div>
  );
}
