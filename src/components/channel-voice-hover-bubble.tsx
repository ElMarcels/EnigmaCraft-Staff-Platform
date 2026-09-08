"use client";

import { useEffect, useState } from "react";
import { RoleBadge } from "@/components/role-badge";
import { IconMic, IconMicOff } from "@/components/icons";

export interface HoverVoiceUser {
  userId: string;
  displayName: string;
  role: string;
  avatarColor: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export function ActiveSpeakerSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <svg
        className={`${className} text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Speaker body */}
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.3" />
        {/* Sound waves */}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
    </span>
  );
}

export function ChannelVoiceHoverBubble({
  channelName,
  users,
  cursorPos,
  isVisible,
}: {
  channelName: string;
  users: HoverVoiceUser[];
  cursorPos: { x: number; y: number };
  isVisible: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible || users.length === 0) return null;

  // Offset slightly to the right and below cursor, and clamp to screen bounds
  const x = Math.min(cursorPos.x + 16, window.innerWidth - 280);
  const y = Math.min(cursorPos.y + 12, window.innerHeight - 240);

  return (
    <div
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-[9999] pointer-events-none select-none transition-transform duration-75 ease-out animate-in fade-in zoom-in-95"
    >
      <div className="w-64 rounded-2xl bg-[#070b16]/90 backdrop-blur-2xl border border-white/20 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(16,185,129,0.2)] text-white space-y-2.5">
        {/* Shimmer top line */}
        <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-1.5 min-w-0">
            <ActiveSpeakerSvg className="h-4 w-4" />
            <span className="text-xs font-black tracking-tight truncate text-slate-100">
              #{channelName}
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300 shrink-0 font-mono">
            {users.length} {users.length === 1 ? "conectado" : "conectados"}
          </span>
        </div>

        {/* User list */}
        <div className="space-y-1.5 max-h-48 overflow-hidden">
          {users.map((u) => (
            <div
              key={u.userId}
              className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* 3D Minecraft Head */}
                <div className="relative shrink-0">
                  <img
                    src={`https://mc-heads.net/avatar/${encodeURIComponent(u.displayName)}/24`}
                    alt={u.displayName}
                    className="h-6 w-6 rounded-md shadow-sm bg-black/40"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  {u.isSpeaking && (
                    <span className="absolute -inset-0.5 rounded-md border-2 border-emerald-400 animate-pulse pointer-events-none" />
                  )}
                </div>

                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {u.displayName}
                  </span>
                  <div className="scale-90 origin-left">
                    <RoleBadge role={u.role} showDot={false} className="py-0 px-1 text-[8px]" />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {u.isMuted ? (
                  <span className="p-1 rounded bg-rose-500/20 text-rose-400" title="Silenciado">
                    <IconMicOff className="h-3 w-3" />
                  </span>
                ) : u.isSpeaking ? (
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5" title="Hablando">
                    <span className="h-2 w-0.5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="h-3 w-0.5 bg-emerald-400 rounded-full animate-bounce delay-75" />
                    <span className="h-2 w-0.5 bg-emerald-400 rounded-full animate-bounce delay-150" />
                  </span>
                ) : (
                  <span className="p-1 rounded bg-white/[0.05] text-slate-400" title="En llamada">
                    <IconMic className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-slate-400 text-center font-mono pt-1 border-t border-white/[0.06]">
          Haz clic para entrar a la llamada
        </div>
      </div>
    </div>
  );
}
