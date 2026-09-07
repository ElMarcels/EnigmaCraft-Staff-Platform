"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconChat,
  IconMail,
  IconFolder,
  IconMegaphone,
  IconContact,
  IconShield,
  IconSettings,
  IconAlertTriangle,
} from "@/components/icons";

interface DockItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roleRequired?: string;
}

const DOCK_ITEMS: DockItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/chat", label: "Chat Staff", icon: IconChat },
  { href: "/dm", label: "Mensajes", icon: IconMail },
  { href: "/reports", label: "Reportes", icon: IconAlertTriangle },
  { href: "/files", label: "Drive", icon: IconFolder },
  { href: "/announcements", label: "Anuncios", icon: IconMegaphone },
  { href: "/directory", label: "Directorio", icon: IconContact },
  { href: "/founder", label: "Fundador", icon: IconShield, roleRequired: "FOUNDER" },
  { href: "/settings", label: "Ajustes", icon: IconSettings },
];

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState(active ? text : "");

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }

    setDisplayed("");
    let i = 0;
    const speed = 75; // Slower, elegant, clearly visible typewriter animation
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, 60);

    return () => clearTimeout(timeout);
  }, [active, text]);

  if (!active) return null;

  return (
    <span className="inline-flex items-center text-[13px] font-bold tracking-tight text-white whitespace-nowrap pl-0.5">
      {displayed}
      <span className="inline-block w-[1.5px] h-3.5 bg-white/90 ml-0.5 animate-pulse" />
    </span>
  );
}

export function PillDock({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  // Hide dock on auth/system pages
  if (pathname === "/login" || pathname === "/suspended" || pathname === "/onboarding") {
    return null;
  }

  const items = DOCK_ITEMS.filter((item) => {
    if (item.roleRequired && item.roleRequired !== userRole) {
      return false;
    }
    return true;
  });

  return (
    <nav className="pill-dock" aria-label="Navegación Reactiva">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`pill-dock-item group ${
              active ? "pill-dock-item-active" : ""
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-active:scale-90" />
            <TypewriterText text={item.label} active={active} />
          </Link>
        );
      })}
    </nav>
  );
}
