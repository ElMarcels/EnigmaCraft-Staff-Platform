"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/founder", label: "Consola" },
  { href: "/founder/users", label: "Usuarios & Rangos" },
  { href: "/founder/backups", label: "Copias de Seguridad" },
  { href: "/founder/audit", label: "Auditoría" },
];

export function FounderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-x-auto max-w-full">
      {TABS.map((t) => {
        const active =
          t.href === "/founder"
            ? pathname === "/founder"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={
              active
                ? {
                    background: "linear-gradient(135deg, var(--ruby-light) 0%, var(--ruby-primary) 100%)",
                    boxShadow: "0 4px 16px var(--ruby-glow)",
                  }
                : undefined
            }
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer select-none ${
              active
                ? "text-white border border-white/20"
                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
