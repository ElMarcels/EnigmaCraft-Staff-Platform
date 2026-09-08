"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  IconSettings,
  IconVolume,
  IconChevronDown,
  IconChevronRight,
  IconBell,
  IconExternalLink,
} from "@/components/icons";
import { ChannelMemberDTO } from "@/components/channel-members-sidebar";
import { MessageDTO, MessageList } from "@/components/message-list";
import { MessageComposer } from "@/components/message-composer";
import { useVoiceCall } from "@/context/voice-context";

export function VoiceChannelView({
  channel,
  currentUserId,
  userDisplayName,
  members = [],
  messages = [],
}: {
  channel: { id: string; name: string; description: string | null; categoryName: string };
  currentUserId?: string;
  userDisplayName: string;
  members?: ChannelMemberDTO[];
  messages?: MessageDTO[];
}) {
  const {
    activeCall,
    speakingIndex,
    settings,
    joinCall,
    leaveCall,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
    updateSettings,
  } = useVoiceCall();

  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const isConnectedHere = activeCall?.isConnected && activeCall.channelId === channel.id;

  // Auto-connect to this voice channel with real current user
  useEffect(() => {
    if (!activeCall || activeCall.channelId !== channel.id) {
      joinCall(
        { id: channel.id, name: channel.name, categoryName: channel.categoryName },
        { id: currentUserId || "me", displayName: userDisplayName, role: "FOUNDER" }
      );
    }
  }, [channel.id, channel.name, channel.categoryName, currentUserId, userDisplayName]);

  const participants = activeCall?.participants || [];
  const isMuted = activeCall?.isMuted ?? false;
  const isDeafened = activeCall?.isDeafened ?? false;
  const isScreenSharing = activeCall?.isScreenSharing ?? false;

  function handleMinimizeToPip() {
    sounds.playPop();
    toast.info("Llamada minimizada a PiP", {
      description: "El audio y la ventana flotante continúan en la esquina superior mientras navegas.",
    });
    router.push("/dashboard");
  }

  function handleSoundboard(soundName: string) {
    sounds.playPop();
    toast(`Efecto de audio emitido: ${soundName}`, { icon: "🔔" });
  }

  return (
    <div className="flex flex-col h-full bg-[#05070d]/90 relative overflow-hidden select-none animate-in fade-in duration-300">
      {/* Upper Section: Voice Stage (The displaced bubble docked at the top of the chat) */}
      <div className="shrink-0 border-b border-white/[0.08] bg-[#070b14]/95 backdrop-blur-2xl transition-all duration-300 shadow-xl z-20">
        {/* Stage Header */}
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-inner shrink-0">
              <IconRadio className="h-4 w-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate">
                <h2 className="text-sm md:text-base font-black text-white truncate tracking-tight">
                  {channel.name}
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 flex items-center gap-1.5 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isConnectedHere ? "BURBUJA ACOPLADA • EN VIVO (14ms)" : "DESCONECTADO"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {channel.description || "Canal de voz de alta fidelidad para staff y moderación"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimize to floating PiP window */}
            <button
              type="button"
              onClick={handleMinimizeToPip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:text-white hover:bg-white/[0.08] text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
              title="Continuar en segundo plano con la ventana flotante PiP"
            >
              <IconExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Minimizar a PiP</span>
            </button>

            {/* Toggle + Más configuraciones */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowSettings((v) => !v);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none ${
                showSettings
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm"
                  : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <IconSettings className="h-3.5 w-3.5" />
              <span>+ Más configuraciones</span>
              {showSettings ? (
                <IconChevronDown className="h-3.5 w-3.5" />
              ) : (
                <IconChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Not connected alert */}
        {!isConnectedHere ? (
          <div className="p-5 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-slate-400">No estás conectado al audio de este canal.</p>
            <button
              type="button"
              onClick={() =>
                joinCall(
                  { id: channel.id, name: channel.name, categoryName: channel.categoryName },
                  { id: currentUserId || "me", displayName: userDisplayName, role: "FOUNDER" }
                )
              }
              className="btn-primary py-2 px-6 text-xs font-bold cursor-pointer"
            >
              Unirse al Canal de Voz
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Participants Grid (Only Real Connected Users with Real-Time Speaking Ring) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {participants.map((p) => {
                const isCurrent = p.id === currentUserId || p.name === userDisplayName;
                const isSpeaking = Boolean(p.isSpeaking);
                const pMuted = p.isMuted;
                const nick = p.minecraftNick || p.name;
                const hasError = imgErrors[p.id];

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                      isSpeaking
                        ? "bg-emerald-500/15 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-105"
                        : "glass-card border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    {/* Minecraft Face with Speaking Ring */}
                    <div className="relative">
                      <div
                        className={`h-12 w-12 rounded-xl overflow-hidden bg-black/60 border ${
                          isSpeaking ? "border-emerald-400 ring-2 ring-emerald-400" : "border-white/10"
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
                      </div>

                      {/* Mute badge */}
                      {pMuted && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
                          <IconMicOff className="h-2.5 w-2.5" />
                        </span>
                      )}

                      {/* Speaking indicator icon */}
                      {isSpeaking && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black shadow-md animate-bounce">
                          <IconMic className="h-2.5 w-2.5 text-black" />
                        </span>
                      )}
                    </div>

                    {/* Name & Role */}
                    <span className="text-[11px] font-bold text-white truncate max-w-[80px] text-center">
                      {p.name} {isCurrent ? "(Tú)" : ""}
                    </span>
                    <RoleBadge role={p.role} showDot={false} className="text-[8px] py-0 px-1.5" />
                  </div>
                );
              })}
            </div>

            {/* If only current user is in the room */}
            {participants.length === 1 && (
              <div className="flex items-center justify-center gap-2 py-2 text-slate-400 text-xs font-medium bg-white/[0.02] border border-white/[0.05] rounded-xl px-4">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Estás solo en la sala de voz. Esperando a que otros miembros del staff se conecten...</span>
              </div>
            )}

            {/* Quick Actions Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                {/* Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex h-9 px-3 items-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isMuted
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-950/60"
                      : "bg-white/[0.07] text-slate-200 hover:bg-white/[0.14] border border-white/10"
                  }`}
                >
                  {isMuted ? <IconMicOff className="h-4 w-4" /> : <IconMic className="h-4 w-4" />}
                  <span>{isMuted ? "Mutear" : "Micrófono"}</span>
                </button>

                {/* Deafen */}
                <button
                  type="button"
                  onClick={toggleDeafen}
                  className={`flex h-9 px-3 items-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDeafened
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-950/60"
                      : "bg-white/[0.07] text-slate-200 hover:bg-white/[0.14] border border-white/10"
                  }`}
                >
                  {isDeafened ? (
                    <IconHeadphonesOff className="h-4 w-4" />
                  ) : (
                    <IconHeadphones className="h-4 w-4" />
                  )}
                  <span>{isDeafened ? "Ensordecido" : "Audio"}</span>
                </button>

                {/* Screen share */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`flex h-9 px-3 items-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isScreenSharing
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/60"
                      : "bg-white/[0.07] text-slate-200 hover:bg-white/[0.14] border border-white/10"
                  }`}
                >
                  <IconGrid className="h-4 w-4" />
                  <span>{isScreenSharing ? "Dejar Pantalla" : "Compartir"}</span>
                </button>
              </div>

              {/* Disconnect */}
              <button
                type="button"
                onClick={leaveCall}
                className="flex h-9 px-3.5 items-center gap-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-950/50"
              >
                <IconPhoneOff className="h-4 w-4" />
                <span>Desconectar</span>
              </button>
            </div>

            {/* Collapsible "+ Más configuraciones" Panel */}
            {showSettings && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
                {/* Audio sliders */}
                <div className="space-y-2">
                  <label className="text-slate-300 font-bold block">
                    Volumen de Salida ({settings.outputVolume}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={settings.outputVolume}
                    onChange={(e) => updateSettings({ outputVolume: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Silencio</span>
                    <span>100%</span>
                    <span>150% Boost</span>
                  </div>
                </div>

                {/* Noise suppression & Mic sensitivity */}
                <div className="space-y-2">
                  <label className="text-slate-300 font-bold block">
                    Supresión de Ruido con IA
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({ noiseSuppression: !settings.noiseSuppression })
                    }
                    className={`w-full py-1.5 px-3 rounded-xl font-bold flex items-center justify-between border cursor-pointer ${
                      settings.noiseSuppression
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/[0.05] text-slate-400 border-white/[0.08]"
                    }`}
                  >
                    <span>Filtro Krisp / RNNoise</span>
                    <span className="text-[10px] font-mono">
                      {settings.noiseSuppression ? "ACTIVADO" : "DESACTIVADO"}
                    </span>
                  </button>
                </div>

                {/* Staff Soundboard */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Soundboard de Staff</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSoundboard("🔔 Campana")}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium text-[11px] cursor-pointer"
                    >
                      🔔 Campana
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSoundboard("👏 Aplausos")}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium text-[11px] cursor-pointer"
                    >
                      👏 Aplausos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSoundboard("⚠️ Alerta")}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium text-[11px] cursor-pointer"
                    >
                      ⚠️ Alerta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lower Section: Integrated Text Chat for this Voice Channel */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Chat Section Header */}
        <div className="px-5 py-2.5 border-b border-white/[0.06] bg-[#070a12]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <IconChat className="h-4 w-4 text-rose-400" />
            <span>Chat de Texto en Sala #{channel.name}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              (Comparte enlaces, comandos y notas mientras hablas)
            </span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            channelId={channel.id}
            channelName={channel.name}
          />
        </div>

        {/* Message Composer for Voice Channel */}
        <div className="shrink-0">
          <MessageComposer channelId={channel.id} members={members} />
        </div>
      </div>
    </div>
  );
}
