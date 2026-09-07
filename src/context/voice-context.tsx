"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { sounds } from "@/lib/sound-effects";
import { toast } from "sonner";

export interface VoiceParticipant {
  id: string;
  name: string;
  username?: string;
  role: string;
  avatarColor: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  ping: number;
  minecraftNick?: string;
}

export interface VoiceSettings {
  noiseSuppression: boolean;
  inputSensitivity: number;
  outputVolume: number;
  echoCancellation: boolean;
  activeMicDevice: string;
}

export interface ActiveCallState {
  channelId: string;
  channelName: string;
  categoryName?: string;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  participants: VoiceParticipant[];
}

export interface VoiceMemberInput {
  id: string;
  displayName: string;
  role: string;
  avatarColor?: string | null;
  minecraftNick?: string;
}

interface VoiceContextType {
  activeCall: ActiveCallState | null;
  speakingIndex: number | null;
  settings: VoiceSettings;
  joinCall: (
    channel: { id: string; name: string; categoryName?: string },
    user?: VoiceMemberInput,
    otherMembers?: VoiceMemberInput[]
  ) => void;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;
  updateSettings: (partial: Partial<VoiceSettings>) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(0);
  const [settings, setSettings] = useState<VoiceSettings>({
    noiseSuppression: true,
    inputSensitivity: 75,
    outputVolume: 100,
    echoCancellation: true,
    activeMicDevice: "Micrófono Predeterminado (Realtek Audio)",
  });

  // Dynamic speaking alternation to simulate life on stage when in call
  useEffect(() => {
    if (!activeCall?.isConnected || !activeCall.participants.length) return;
    const interval = setInterval(() => {
      setSpeakingIndex((prev) => {
        const next = prev === null ? 0 : (prev + 1) % activeCall.participants.length;
        return Math.random() > 0.25 ? next : null;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [activeCall?.isConnected, activeCall?.participants.length]);

  function joinCall(
    channel: { id: string; name: string; categoryName?: string },
    currentUser?: VoiceMemberInput,
    otherMembers?: VoiceMemberInput[]
  ) {
    sounds.playSuccess();
    const myUser = currentUser || {
      id: "me",
      displayName: "mortal_pirata107",
      role: "FOUNDER",
      avatarColor: "#f43f5e",
    };

    const extraParticipants: VoiceParticipant[] =
      otherMembers && otherMembers.length > 0
        ? otherMembers
            .filter((m) => m.id !== myUser.id && m.displayName !== myUser.displayName)
            .slice(0, 5)
            .map((m, i) => ({
              id: m.id,
              name: m.displayName,
              username: m.displayName.toLowerCase().replace(/\s+/g, "_"),
              minecraftNick: m.minecraftNick || m.displayName,
              role: m.role,
              avatarColor: m.avatarColor || "#f43f5e",
              isMuted: i === 1,
              isDeafened: false,
              isSpeaking: false,
              ping: 14 + i * 3,
            }))
        : [
            {
              id: "elmarcels",
              name: "ElMarcels",
              username: "elmarcels",
              minecraftNick: "ElMarcels",
              role: "FOUNDER",
              avatarColor: "#f43f5e",
              isMuted: false,
              isDeafened: false,
              isSpeaking: false,
              ping: 14,
            },
            {
              id: "ale256",
              name: "Ale256",
              username: "ale256",
              minecraftNick: "Ale256",
              role: "FOUNDER",
              avatarColor: "#f59e0b",
              isMuted: false,
              isDeafened: false,
              isSpeaking: false,
              ping: 18,
            },
            {
              id: "mamut_feliz",
              name: "Mamut_Feliz",
              username: "mamut_feliz",
              minecraftNick: "Mamut_Feliz",
              role: "STAFF",
              avatarColor: "#06b6d4",
              isMuted: true,
              isDeafened: false,
              isSpeaking: false,
              ping: 22,
            },
            {
              id: "cobaltj",
              name: "CobaltJ",
              username: "cobaltj",
              minecraftNick: "CobaltJ",
              role: "STAFF",
              avatarColor: "#10b981",
              isMuted: false,
              isDeafened: false,
              isSpeaking: false,
              ping: 20,
            },
          ];

    const initialParticipants: VoiceParticipant[] = [
      {
        id: myUser.id,
        name: myUser.displayName,
        username: myUser.displayName.toLowerCase().replace(/\s+/g, "_"),
        minecraftNick: myUser.displayName,
        role: myUser.role,
        avatarColor: myUser.avatarColor || "#f43f5e",
        isMuted: false,
        isDeafened: false,
        isSpeaking: true,
        ping: 14,
      },
      ...extraParticipants,
    ];

    setActiveCall({
      channelId: channel.id,
      channelName: channel.name,
      categoryName: channel.categoryName || "SALAS DE VOZ",
      isConnected: true,
      isMuted: false,
      isDeafened: false,
      isScreenSharing: false,
      participants: initialParticipants,
    });

    toast.success(`Conectado a ${channel.name} (Voz WebRTC 14ms)`);
  }

  function leaveCall() {
    sounds.playPop();
    setActiveCall(null);
    toast.info("Te has desconectado de la sala de voz.");
  }

  function toggleMute() {
    sounds.playPop();
    if (!activeCall) return;
    const nextMuted = !activeCall.isMuted;
    setActiveCall((prev) => (prev ? { ...prev, isMuted: nextMuted } : null));
    toast(nextMuted ? "Micrófono silenciado" : "Micrófono activado", {
      icon: nextMuted ? "🔇" : "🎙️",
    });
  }

  function toggleDeafen() {
    sounds.playPop();
    if (!activeCall) return;
    const nextDeafened = !activeCall.isDeafened;
    setActiveCall((prev) =>
      prev
        ? {
            ...prev,
            isDeafened: nextDeafened,
            isMuted: nextDeafened ? true : prev.isMuted,
          }
        : null
    );
    toast(nextDeafened ? "Audio ensordecido" : "Audio restablecido", {
      icon: nextDeafened ? "🔇" : "🔊",
    });
  }

  function toggleScreenShare() {
    sounds.playPop();
    if (!activeCall) return;
    const nextShare = !activeCall.isScreenSharing;
    setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: nextShare } : null));
    if (nextShare) {
      toast.success("Transmitiendo pantalla a 60 FPS (Simulado WebRTC)");
    } else {
      toast.info("Transmisión finalizada");
    }
  }

  function updateSettings(partial: Partial<VoiceSettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
    sounds.playPop();
  }

  return (
    <VoiceContext.Provider
      value={{
        activeCall,
        speakingIndex,
        settings,
        joinCall,
        leaveCall,
        toggleMute,
        toggleDeafen,
        toggleScreenShare,
        updateSettings,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoiceCall() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error("useVoiceCall must be used within a VoiceProvider");
  }
  return ctx;
}
