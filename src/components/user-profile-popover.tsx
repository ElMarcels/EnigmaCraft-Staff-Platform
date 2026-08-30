"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { RoleBadge } from "@/components/role-badge";
import {
  IconClose,
  IconCopy,
  IconCheck,
  IconMail,
  IconSettings,
} from "@/components/icons";
import type { Role } from "@prisma/client";

export type PopoverUserData = {
  id: string;
  displayName: string;
  username: string;
  avatarColor: string;
  role: Role;
  discord?: string | null;
  minecraftNick?: string | null;
  status?: string | null;
  isOnline?: boolean;
};

export function UserProfilePopover({
  user,
  currentUserId,
  onClose,
}: {
  user: PopoverUserData | null;
  currentUserId?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const isMe = user.id === currentUserId;
  const nick = user.minecraftNick || (!user.displayName.includes(" ") ? user.displayName : null);

  function copyDiscord() {
    if (!user?.discord) return;
    navigator.clipboard.writeText(user.discord);
    setCopied(true);
    sounds.playPop();
    toast.success(`Discord "${user.discord}" copiado al portapapeles`);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.12] bg-[#090d16]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_var(--ruby-glow-soft)] backdrop-blur-3xl p-6 space-y-5 animate-scaleUp"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
        >
          <IconClose className="h-4 w-4" />
        </button>

        {/* Avatar & Head Card */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="relative h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center font-extrabold text-2xl text-white shadow-xl border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${user.avatarColor || "#f43f5e"}, rgba(15, 23, 42, 0.9))`,
                boxShadow: `0 8px 24px ${user.avatarColor || "#f43f5e"}44`,
              }}
            >
              {nick ? (
                <Image
                  src={`https://minotar.net/helm/${encodeURIComponent(nick)}/64.png`}
                  alt={user.displayName}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-cover [image-rendering:pixelated]"
                />
              ) : (
                <span>{user.displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {user.isOnline && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#07090e] bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-extrabold text-white tracking-tight truncate">
                {user.displayName}
              </h3>
            </div>
            <RoleBadge role={user.role} />
            <div className="text-xs text-slate-400 font-mono mt-1">
              @{user.username || "usuario"}
            </div>
          </div>
        </div>

        {/* Status Bio */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Estado & Actividad
          </div>
          <div className="text-xs text-slate-200 font-medium">
            {user.status || (user.isOnline ? "🟢 En línea en la plataforma" : "⚪ Desconectado")}
          </div>
        </div>

        {/* Discord Tag */}
        {user.discord && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Discord</div>
              <div className="text-xs font-mono text-slate-300 font-semibold">{user.discord}</div>
            </div>
            <button
              type="button"
              onClick={copyDiscord}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <IconCopy className="h-3.5 w-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pt-2 flex gap-2">
          {isMe ? (
            <Link
              href="/settings"
              onClick={onClose}
              className="btn-primary text-xs font-semibold w-full py-2.5 flex items-center justify-center gap-2"
            >
              <IconSettings className="h-4 w-4" />
              Editar Mi Perfil
            </Link>
          ) : (
            <Link
              href="/dm"
              onClick={onClose}
              className="btn-primary text-xs font-semibold w-full py-2.5 flex items-center justify-center gap-2"
            >
              <IconMail className="h-4 w-4" />
              Enviar Mensaje Directo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
