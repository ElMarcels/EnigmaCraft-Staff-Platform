"use client";

import Link from "next/link";
import type { User } from "@prisma/client";
import { logoutAction } from "@/actions/auth";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { GlobalSearch } from "@/components/global-search";
import { CommandPalette } from "@/components/command-palette";
import {
  IconLogout,
  IconBell,
} from "@/components/icons";

export function AppShell({
  user,
  unreadCount,
  children,
}: {
  user: User;
  unreadCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-rose-500/30">
      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette />
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#07090e]/85 backdrop-blur-2xl px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand Left */}
        <Link href="/dashboard" className="flex items-center gap-3 group select-none">
          <div
            style={{
              background: "linear-gradient(135deg, var(--ruby-light) 0%, var(--ruby-primary) 100%)",
              boxShadow: "0 4px 18px var(--ruby-glow)",
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold text-white border border-white/20 transition-transform group-hover:scale-105"
          >
            EC
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Enigma<span style={{ color: "var(--ruby-light)" }}>Craft</span>
            </div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Staff Network
            </div>
          </div>
        </Link>

        {/* Center Global Search */}
        <div className="hidden md:block w-72 max-w-sm">
          <GlobalSearch userId={user.id} />
        </div>

        {/* Right User & Actions Profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Notificaciones"
          >
            <IconBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </Link>

          {/* User Badge */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
            <Avatar
              name={user.displayName}
              color={user.avatarColor}
              isOnline={true}
              className="h-7 w-7 text-xs"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white leading-tight">
                {user.displayName}
              </div>
              <div className="text-[10px] text-slate-400">
                <RoleBadge role={user.role} showDot={false} className="py-0 px-1.5 text-[9px]" />
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <form action={logoutAction}>
            <button
              title="Cerrar sesión"
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300 cursor-pointer active:scale-95 border border-white/[0.08]"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Global Notification Banner if Unread */}
      {unreadCount > 0 ? (
        <Link
          href="/notifications"
          className="flex items-center justify-center gap-2.5 border-b border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-red-900/30 to-rose-950/40 px-5 py-2 text-xs font-semibold text-rose-200 backdrop-blur-md transition-colors hover:bg-rose-900/40"
        >
          <IconBell className="h-4 w-4 text-rose-400 animate-pulse" />
          <span>Tienes {unreadCount} notificación{unreadCount > 1 ? "es" : ""} sin leer en el sistema.</span>
        </Link>
      ) : null}

      {/* Main Full-Width Content Container */}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
