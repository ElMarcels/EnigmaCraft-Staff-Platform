"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User, Role } from "@prisma/client";
import { logoutAction } from "@/actions/auth";
import { ROLE_META } from "@/lib/role-meta";
import { Avatar } from "@/components/role-badge";
import {
  IconDashboard,
  IconChat,
  IconFolder,
  IconMegaphone,
  IconShield,
  IconUsers,
  IconBackup,
  IconSettings,
  IconLogout,
  IconBell,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactNode;
  roles?: Role[];
  section?: string;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: IconDashboard },
  { href: "/chat", label: "Chat", icon: IconChat },
  { href: "/files", label: "Archivos", icon: IconFolder },
  { href: "/announcements", label: "Anuncios", icon: IconMegaphone },
  {
    href: "/founder",
    label: "Panel de Fundadores",
    icon: IconShield,
    roles: ["FOUNDER"],
    section: "Fundadores",
  },
  {
    href: "/founder/users",
    label: "Usuarios",
    icon: IconUsers,
    roles: ["FOUNDER"],
    section: "Fundadores",
  },
  {
    href: "/founder/backups",
    label: "Copias de seguridad",
    icon: IconBackup,
    roles: ["FOUNDER"],
    section: "Fundadores",
  },
  {
    href: "/founder/audit",
    label: "Registro",
    icon: IconBell,
    roles: ["FOUNDER"],
    section: "Fundadores",
  },
  {
    href: "/notifications",
    label: "Notificaciones",
    icon: IconBell,
    section: "Cuenta",
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: IconSettings,
    section: "Cuenta",
  },
];

function NavLink({
  item,
  currentPath,
}: {
  item: NavItem;
  currentPath: string;
}) {
  const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-indigo-500/15 font-semibold text-indigo-300"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
      {item.label}
    </Link>
  );
}

export function AppShell({
  user,
  unreadCount,
  children,
}: {
  user: User;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const founderVisible = user.role === "FOUNDER";
  const roleMeta = ROLE_META[user.role];

  const visibleNav = NAV.filter(
    (item) => !item.roles || (founderVisible && item.roles.includes("FOUNDER"))
  );

  const sections: { title?: string; items: NavItem[] }[] = [];
  for (const item of visibleNav) {
    const last = sections[sections.length - 1];
    if (last && last.title === item.section) {
      last.items.push(item);
    } else {
      sections.push({ title: item.section, items: [item] });
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0d1017]">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white">
            EC
          </div>
          <div>
            <div className="text-sm font-bold text-white">EnigmaCraft</div>
            <div className="text-[11px] text-white/40">Staff Platform</div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {sections.map((section, i) => (
            <div key={i}>
              {section.title ? (
                <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  {section.title}
                </div>
              ) : null}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} currentPath={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user.displayName} color={user.avatarColor} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {user.displayName}
              </div>
              <div className="truncate text-xs text-white/40">
                <span className={roleMeta.color}>{roleMeta.label}</span>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                title="Cerrar sesión"
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {unreadCount > 0 ? (
          <Link
            href="/notifications"
            className="flex items-center gap-2 border-b border-amber-400/20 bg-amber-500/10 px-5 py-2 text-sm text-amber-300 transition-colors hover:bg-amber-500/20"
          >
            <IconBell className="h-4 w-4" />
            Tienes {unreadCount} notificación{unreadCount > 1 ? "es" : ""} sin
            leer.
            <span className="ml-auto text-xs underline-offset-2 hover:underline">
              Ver
            </span>
          </Link>
        ) : null}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
