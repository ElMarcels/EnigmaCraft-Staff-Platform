"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/founder", label: "Panel" },
  { href: "/founder/users", label: "Usuarios" },
  { href: "/founder/backups", label: "Copias de seguridad" },
  { href: "/founder/audit", label: "Registro de actividad" },
];

export function FounderNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-white/10 bg-[#0d1017] px-6">
      {TABS.map((t) => {
        const active =
          t.href === "/founder"
            ? pathname === "/founder"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${
              active
                ? "border-amber-400 font-semibold text-amber-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
