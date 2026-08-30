"use client";

import { useState } from "react";
import Image from "next/image";
import { Role } from "@prisma/client";
import { ROLE_META } from "@/lib/role-meta";

export function RoleBadge({
  role,
  showDot = true,
  className = "",
}: {
  role: Role;
  showDot?: boolean;
  className?: string;
}) {
  const meta = ROLE_META[role] || ROLE_META.STAFF;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide backdrop-blur-md transition-all shadow-sm ${meta.color} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${meta.gradient}`}
          style={{ boxShadow: `0 0 8px ${meta.glow}` }}
        />
      )}
      {meta.label}
    </span>
  );
}

export function Avatar({
  name,
  color,
  minecraftNick,
  className,
  isOnline = false,
}: {
  name: string;
  color?: string | null;
  minecraftNick?: string | null;
  className?: string;
  isOnline?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();
  const bg = color || "#e11d48";
  const nick = minecraftNick || (name && !name.includes(" ") ? name : null);

  return (
    <div className="relative shrink-0 select-none">
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden font-bold text-white shadow-md transition-transform duration-200 border border-white/20 ${className || ""}`}
        style={{
          background: `linear-gradient(135deg, ${bg}, rgba(15, 23, 42, 0.9))`,
          boxShadow: `0 4px 14px ${bg}44`,
        }}
      >
        {nick && !imgError ? (
          <Image
            src={`https://minotar.net/helm/${encodeURIComponent(nick)}/64.png`}
            alt={name}
            width={64}
            height={64}
            unoptimized
            onError={() => setImgError(true)}
            className="h-full w-full object-cover [image-rendering:pixelated]"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#07090e] bg-emerald-500" />
        </span>
      )}
    </div>
  );
}
