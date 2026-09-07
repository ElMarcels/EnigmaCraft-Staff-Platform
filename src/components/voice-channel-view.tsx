"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { Avatar, RoleBadge } from "@/components/role-badge";
import {
  IconMic,
  IconMicOff,
  IconHeadphones,
  IconHeadphonesOff,
  IconPhoneOff,
  IconRadio,
  IconSparkles,
  IconGrid,
  IconChat,
} from "@/components/icons";
import { ChannelMemberDTO } from "@/components/channel-members-sidebar";

interface VoiceParticipant {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  ping: number;
}

export function VoiceChannelView({
  channel,
  currentUserId,
  userDisplayName,
  members = [],
}: {
  channel: { id: string; name: string; description: string | null; categoryName: string };
  currentUserId?: string;
  userDisplayName: string;
  members?: ChannelMemberDTO[];
}) {
  const [isConnected, setIsConnected] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [speakingUserIndex, setSpeakingUserIndex] = useState<number | null>(0);

  // Default participants simulated from members or presets
  const initialParticipants: VoiceParticipant[] = members.slice(0, 5).map((m, idx) => ({
    id: m.id,
    name: m.displayName,
    role: m.role,
    avatarColor: m.avatarColor || "#f43f5e",
    isMuted: idx === 2,
    isDeafened: false,
    isSpeaking: idx === 0,
    ping: 12 + idx * 4,
  }));

  // Ensure current user is in participants if connected
  const [participants, setParticipants] = useState<VoiceParticipant[]>(
    initialParticipants.length > 0
      ? initialParticipants
      : [
          {
            id: currentUserId || "me",
            name: userDisplayName,
            role: "FOUNDER",
            avatarColor: "#f43f5e",
            isMuted: false,
            isDeafened: false,
            isSpeaking: true,
            ping: 14,
          },
          {
            id: "alex",
            name: "AlexAdmin",
            role: "ADMIN",
            avatarColor: "#e11d48",
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            ping: 18,
          },
          {
            id: "lucas",
            name: "LucasMod",
            role: "MOD",
            avatarColor: "#06b6d4",
            isMuted: true,
            isDeafened: false,
            isSpeaking: false,
            ping: 22,
          },
        ]
  );

  // Subtle simulated speaking alternation for life in the voice stage
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setSpeakingUserIndex((prev) => {
        const next = prev === null ? 0 : (prev + 1) % participants.length;
        return Math.random() > 0.3 ? next : null;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isConnected, participants.length]);

  function toggleConnect() {
    if (isConnected) {
      sounds.playPop();
      setIsConnected(false);
      toast.info("Te has desconectado de la sala de voz.");
    } else {
      sounds.playSuccess();
      setIsConnected(true);
      toast.success(`Conectado a #${channel.name} con baja latencia (14ms).`);
    }
  }

  function toggleMute() {
    sounds.playPop();
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      toast("Micrófono silenciado", { icon: "🔇" });
    } else {
      toast("Micrófono activado", { icon: "🎙️" });
    }
  }

  function toggleDeafen() {
    sounds.playPop();
    const next = !isDeafened;
    setIsDeafened(next);
    if (next) {
      setIsMuted(true);
      toast("Audio ensordecido", { icon: "🔇" });
    } else {
      toast("Audio restablecido", { icon: "🔊" });
    }
  }

  function toggleScreenShare() {
    sounds.playPop();
    const next = !isScreenSharing;
    setIsScreenSharing(next);
    if (next) {
      toast.success("Transmitiendo pantalla a 60 FPS (Simulado WebRTC)");
    } else {
      toast.info("Transmisión finalizada");
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#05070d]/90 relative overflow-hidden select-none">
      {/* Voice Room Header */}
      <div className="border-b border-white/[0.08] px-6 py-4 bg-[#080c16]/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-inner">
            <IconRadio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {channel.name}
              </h2>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {isConnected ? "EN VIVO" : "SALA VACÍA"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {channel.description || "Canal de voz de alta fidelidad para staff y moderación"}
            </p>
          </div>
        </div>

        {/* Network & Codec stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Opus 64kbps</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">14ms ping</span>
          </div>
        </div>
      </div>

      {/* Main Voice Stage */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
        {!isConnected ? (
          <div className="text-center max-w-md space-y-4 p-8 rounded-3xl glass-card border-white/10 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 text-slate-400">
              <IconHeadphones className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No estás conectado al canal</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Únete a la sala para hablar con el equipo de staff, coordinar eventos o atender incidencias en directo.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleConnect}
              className="btn-primary w-full py-3 text-sm font-bold justify-center cursor-pointer shadow-lg shadow-rose-950/50"
            >
              Unirse a #{channel.name}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl space-y-6">
            {/* Screen share simulation if enabled */}
            {isScreenSharing && (
              <div className="relative aspect-video w-full rounded-2xl border border-rose-500/30 bg-black/80 overflow-hidden shadow-2xl flex flex-col items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="relative z-10 text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                    <IconSparkles className="h-3.5 w-3.5" />
                    Transmisión en vivo de {userDisplayName}
                  </div>
                  <p className="text-xs text-slate-400">Vista previa de pantalla compartida (60 FPS)</p>
                </div>
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-mono text-emerald-400 border border-white/10">
                    1080p @ 60fps
                  </span>
                </div>
              </div>
            )}

            {/* Participants Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {participants.map((p, idx) => {
                const isCurrent = p.name === userDisplayName;
                const isSpeaking = isCurrent
                  ? !isMuted && speakingUserIndex === idx
                  : !p.isMuted && speakingUserIndex === idx;

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 min-h-[160px] ${
                      isSpeaking
                        ? "bg-emerald-500/10 border-2 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)] scale-[1.02]"
                        : "glass-card border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    {/* Speaking Sound Ring */}
                    <div className="relative">
                      <Avatar
                        name={p.name}
                        color={p.avatarColor}
                        className={`h-16 w-16 text-lg font-extrabold shadow-lg transition-all ${
                          isSpeaking ? "ring-4 ring-emerald-400/80 ring-offset-2 ring-offset-black" : ""
                        }`}
                      />
                      {/* Minecraft head texture fallback / visual badge */}
                      {isSpeaking && (
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-black shadow-md animate-bounce">
                          <IconMic className="h-3.5 w-3.5 text-black" />
                        </span>
                      )}
                      {(isCurrent ? isMuted : p.isMuted) && (
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
                          <IconMicOff className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Name and Role */}
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-slate-400">(Tú)</span>
                        )}
                      </div>
                      <div className="mt-1 flex justify-center">
                        <RoleBadge role={p.role} />
                      </div>
                    </div>

                    {/* Ping badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{p.ping}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Voice Bottom Control Bar */}
      <div className="border-t border-white/[0.08] bg-[#070a12]/95 backdrop-blur-2xl p-4 flex items-center justify-between z-20 shadow-2xl">
        {/* Connection info */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-3 w-3 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
            }`}
          />
          <div className="text-xs">
            <span className="font-bold text-white">
              {isConnected ? "Voz conectada" : "Desconectado"}
            </span>
            <span className="text-slate-400 block text-[11px]">
              {channel.name} / {channel.categoryName}
            </span>
          </div>
        </div>

        {/* Center Actions */}
        <div className="flex items-center gap-2">
          {/* Mute toggle */}
          <button
            type="button"
            disabled={!isConnected}
            onClick={toggleMute}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-900/40"
                : "bg-white/[0.07] text-white hover:bg-white/[0.14] border border-white/10"
            }`}
            title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
          >
            {isMuted ? <IconMicOff className="h-5 w-5" /> : <IconMic className="h-5 w-5" />}
          </button>

          {/* Deafen toggle */}
          <button
            type="button"
            disabled={!isConnected}
            onClick={toggleDeafen}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
              isDeafened
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-900/40"
                : "bg-white/[0.07] text-white hover:bg-white/[0.14] border border-white/10"
            }`}
            title={isDeafened ? "Restablecer audio" : "Ensordecer (Deafen)"}
          >
            {isDeafened ? (
              <IconHeadphonesOff className="h-5 w-5" />
            ) : (
              <IconHeadphones className="h-5 w-5" />
            )}
          </button>

          {/* Screen Share toggle */}
          <button
            type="button"
            disabled={!isConnected}
            onClick={toggleScreenShare}
            className={`flex h-11 px-3.5 items-center gap-2 rounded-2xl transition-all cursor-pointer text-xs font-semibold ${
              isScreenSharing
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/40"
                : "bg-white/[0.07] text-slate-200 hover:bg-white/[0.14] border border-white/10"
            }`}
            title="Compartir pantalla"
          >
            <IconGrid className="h-4 w-4" />
            <span className="hidden md:inline">
              {isScreenSharing ? "Dejar de compartir" : "Pantalla"}
            </span>
          </button>

          {/* Disconnect or Connect button */}
          <button
            type="button"
            onClick={toggleConnect}
            className={`flex h-11 px-4 items-center gap-2 rounded-2xl transition-all font-bold text-xs cursor-pointer ${
              isConnected
                ? "bg-rose-600/90 text-white hover:bg-rose-700 shadow-lg shadow-rose-950/60"
                : "btn-primary"
            }`}
          >
            {isConnected ? (
              <>
                <IconPhoneOff className="h-4 w-4" />
                <span>Desconectar</span>
              </>
            ) : (
              <>
                <IconRadio className="h-4 w-4" />
                <span>Conectarse</span>
              </>
            )}
          </button>
        </div>

        {/* Right side helper info */}
        <div className="hidden lg:block text-right text-[11px] text-slate-500">
          <span>Sincronizado con Staff Network</span>
        </div>
      </div>
    </div>
  );
}
