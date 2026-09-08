"use client";

import { usePathname, useRouter } from "next/navigation";
import { useVoiceCall } from "@/context/voice-context";
import {
  IconMic,
  IconMicOff,
  IconHeadphones,
  IconHeadphonesOff,
  IconPhoneOff,
  IconExternalLink,
  IconRadio,
} from "@/components/icons";
import { sounds } from "@/lib/sound-effects";
import { useState } from "react";

export function FloatingVoiceOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeCall, speakingIndex, toggleMute, toggleDeafen, leaveCall } = useVoiceCall();
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Only show floating PIP window when in a call AND not directly on the active voice channel page
  if (!activeCall || !activeCall.isConnected) return null;
  const isInsideVoicePage = pathname === `/chat/${activeCall.channelId}`;
  if (isInsideVoicePage) return null;

  function handleNavigateToRoom() {
    sounds.playPop();
    router.push(`/chat/${activeCall?.channelId}`);
  }

  return (
    <aside
      aria-label="Ventana flotante de chat de voz"
      className="fixed top-18 right-6 z-50 select-none animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="w-68 sm:w-72 rounded-3xl border border-rose-500/40 bg-[#080c16]/95 backdrop-blur-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-rose-500/60 transition-all flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-black text-white truncate block">
                {activeCall.channelName}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">14ms • PiP Flotante</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNavigateToRoom}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] font-bold text-rose-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            title="Abrir sala completa con chat integrado"
          >
            <span>Expandir</span>
            <IconExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Participants Minecraft Faces Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3.5 my-auto">
          {activeCall.participants.slice(0, 4).map((p, idx) => {
            const isSpeaking = Boolean(p.isSpeaking);
            const isMuted = p.isMuted;
            const nick = p.minecraftNick || p.name;
            const hasError = imgErrors[p.id];

            return (
              <div
                key={p.id}
                onClick={handleNavigateToRoom}
                className={`p-2 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-emerald-500/15 border border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08]"
                }`}
              >
                <div
                  className={`relative h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-black/60 border transition-all ${
                    isSpeaking
                      ? "border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105"
                      : "border-white/10"
                  }`}
                >
                  {!hasError ? (
                    <img
                      src={`https://minotar.net/helm/${nick}/64.png`}
                      alt={p.name}
                      onError={() => setImgErrors((prev) => ({ ...prev, [p.id]: true }))}
                      className="w-full h-full object-cover pixelated"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Muted overlay badge */}
                  {isMuted && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
                      <IconMicOff className="h-2 w-2" />
                    </span>
                  )}

                  {/* Speaking badge */}
                  {isSpeaking && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-black shadow-md animate-bounce">
                      <IconMic className="h-2 w-2 text-black" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-white truncate block">
                    {p.name}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate block">
                    {idx === 0 ? "Tú" : p.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Control Bar */}
        <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Mic toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                activeCall.isMuted
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                  : "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/10"
              }`}
              title={activeCall.isMuted ? "Activar micrófono" : "Silenciar micrófono"}
            >
              {activeCall.isMuted ? (
                <IconMicOff className="h-4 w-4" />
              ) : (
                <IconMic className="h-4 w-4" />
              )}
            </button>

            {/* Deafen toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDeafen();
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                activeCall.isDeafened
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                  : "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/10"
              }`}
              title={activeCall.isDeafened ? "Activar sonido" : "Ensordecer"}
            >
              {activeCall.isDeafened ? (
                <IconHeadphonesOff className="h-4 w-4" />
              ) : (
                <IconHeadphones className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Disconnect button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              leaveCall();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-950/50 active:scale-95"
            title="Desconectar llamada de voz"
          >
            <IconPhoneOff className="h-3.5 w-3.5" />
            <span>Colgar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
