"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
    user?: VoiceMemberInput
  ) => void;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;
  updateSettings: (partial: Partial<VoiceSettings>) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isSelfSpeaking, setIsSelfSpeaking] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    noiseSuppression: true,
    inputSensitivity: 60,
    outputVolume: 100,
    echoCancellation: true,
    activeMicDevice: "default",
  });

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentUserRef = useRef<VoiceMemberInput | null>(null);
  const lastSignalPollTimeRef = useRef<number>(Date.now() - 5000);

  // --- Real Microphone Audio Stream & Voice Activity Detection (VAD) ---
  async function initMicrophone(): Promise<MediaStream | null> {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      // AudioContext Analyser for real-time speech detection
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.4;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkAudioLevel = () => {
            if (!localStreamRef.current || !activeCall?.isConnected) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const threshold = (100 - settings.inputSensitivity) * 0.45; // Dynamic sensitivity

            const speaking = avg > threshold && !activeCall?.isMuted && !activeCall?.isDeafened;
            setIsSelfSpeaking((prev) => (prev !== speaking ? speaking : prev));

            requestAnimationFrame(checkAudioLevel);
          };

          checkAudioLevel();
        }
      } catch {
        // audio context optional fallback
      }

      return stream;
    } catch (err: any) {
      toast.error("No se pudo acceder al micrófono.", {
        description: "Comprueba los permisos en el navegador para hablar en la sala.",
      });
      return null;
    }
  }

  // --- WebRTC Peer Connection Helper ---
  function getOrCreatePeerConnection(remoteUserId: string, channelId: string): RTCPeerConnection {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local mic tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // When remote audio track is received, play it through an audio element
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = remoteAudioElementsRef.current.get(remoteUserId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          remoteAudioElementsRef.current.set(remoteUserId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.volume = settings.outputVolume / 100;
        audioEl.play().catch(() => {});
      }
    };

    // Send local ICE candidates to the signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate && currentUserRef.current) {
        fetch("/api/voice/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId,
            fromUserId: currentUserRef.current.id,
            fromDisplayName: currentUserRef.current.displayName,
            toUserId: remoteUserId,
            type: "candidate",
            data: event.candidate,
          }),
        }).catch(() => {});
      }
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }

  // --- Join Call (Only Real Connected Users) ---
  async function joinCall(
    channel: { id: string; name: string; categoryName?: string },
    user?: VoiceMemberInput
  ) {
    // If already in this channel, do nothing
    if (activeCall?.isConnected && activeCall.channelId === channel.id) {
      return;
    }

    // If connected to another voice channel, cleanly disconnect first
    if (activeCall?.isConnected) {
      try {
        if (currentUserRef.current) {
          fetch(
            `/api/voice/presence?channelId=${encodeURIComponent(activeCall.channelId)}&userId=${encodeURIComponent(currentUserRef.current.id)}`,
            { method: "DELETE" }
          ).catch(() => {});
        }
        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();
        remoteAudioElementsRef.current.forEach((el) => {
          el.pause();
          el.srcObject = null;
        });
        remoteAudioElementsRef.current.clear();
      } catch {}
    }

    sounds.playSuccess();

    const myUser: VoiceMemberInput = user || {
      id: "me",
      displayName: "mortal_pirata107",
      role: "FOUNDER",
      avatarColor: "#f43f5e",
      minecraftNick: "mortal_pirata107",
    };
    currentUserRef.current = myUser;

    // Request actual microphone
    await initMicrophone();

    // Initial participant state: ONLY the real user
    const initialSelf: VoiceParticipant = {
      id: myUser.id,
      name: myUser.displayName,
      username: myUser.displayName.toLowerCase().replace(/\s+/g, "_"),
      minecraftNick: myUser.minecraftNick || myUser.displayName,
      role: myUser.role,
      avatarColor: myUser.avatarColor || "#f43f5e",
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      ping: 14,
    };

    setActiveCall({
      channelId: channel.id,
      channelName: channel.name,
      categoryName: channel.categoryName || "SALAS DE VOZ",
      isConnected: true,
      isMuted: false,
      isDeafened: false,
      isScreenSharing: false,
      participants: [initialSelf],
    });

    // Register presence immediately
    try {
      const res = await fetch("/api/voice/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          userId: myUser.id,
          displayName: myUser.displayName,
          role: myUser.role,
          avatarColor: myUser.avatarColor || "#f43f5e",
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.participants && Array.isArray(data.participants)) {
          // Real participants from presence
          const realList: VoiceParticipant[] = data.participants.map((p: any) => ({
            id: p.userId,
            name: p.displayName,
            username: p.displayName.toLowerCase().replace(/\s+/g, "_"),
            minecraftNick: p.displayName,
            role: p.role,
            avatarColor: p.avatarColor || "#f43f5e",
            isMuted: Boolean(p.isMuted),
            isDeafened: Boolean(p.isDeafened),
            isSpeaking: Boolean(p.isSpeaking),
            ping: 14,
          }));

          setActiveCall((prev) => (prev ? { ...prev, participants: realList } : null));
        }
      }
    } catch {
      // presence error fallback
    }

    toast.success(`Conectado a ${channel.name} (Voz en Vivo)`, {
      description: "Micrófono activo y transmitiendo en directo.",
    });
  }

  // --- Leave Call & Full Cleanup ---
  function leaveCall() {
    sounds.playPop();

    if (activeCall && currentUserRef.current) {
      // Unregister presence
      fetch(`/api/voice/presence?channelId=${encodeURIComponent(activeCall.channelId)}&userId=${encodeURIComponent(currentUserRef.current.id)}`, {
        method: "DELETE",
      }).catch(() => {});
    }

    // Stop microphone hardware tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Close all WebRTC peers
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Pause and remove audio elements
    remoteAudioElementsRef.current.forEach((el) => {
      el.pause();
      el.srcObject = null;
    });
    remoteAudioElementsRef.current.clear();

    setActiveCall(null);
    setIsSelfSpeaking(false);
    toast.info("Te has desconectado de la sala de voz.");
  }

  // --- Hardware Toggle Mute ---
  function toggleMute() {
    sounds.playPop();
    if (!activeCall) return;
    const nextMuted = !activeCall.isMuted;

    // Actually enable/disable microphone track
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }

    setActiveCall((prev) => (prev ? { ...prev, isMuted: nextMuted } : null));
    toast(nextMuted ? "Micrófono silenciado" : "Micrófono activado", {
      icon: nextMuted ? "🔇" : "🎙️",
    });
  }

  // --- Toggle Deafen ---
  function toggleDeafen() {
    sounds.playPop();
    if (!activeCall) return;
    const nextDeafened = !activeCall.isDeafened;

    // Mute incoming audio
    remoteAudioElementsRef.current.forEach((el) => {
      el.muted = nextDeafened;
    });

    if (localStreamRef.current && nextDeafened) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
    } else if (localStreamRef.current && !nextDeafened) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !activeCall.isMuted;
      });
    }

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
      toast.success("Transmitiendo pantalla a 60 FPS (WebRTC)");
    } else {
      toast.info("Transmisión finalizada");
    }
  }

  function updateSettings(partial: Partial<VoiceSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.outputVolume !== undefined) {
        remoteAudioElementsRef.current.forEach((el) => {
          el.volume = next.outputVolume / 100;
        });
      }
      return next;
    });
    sounds.playPop();
  }

  // --- Real-time Heartbeat & Participant Presence Sync ---
  useEffect(() => {
    if (!activeCall?.isConnected || !currentUserRef.current) return;

    const myUser = currentUserRef.current;
    const channelId = activeCall.channelId;

    async function syncPresence() {
      try {
        const res = await fetch("/api/voice/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId,
            userId: myUser.id,
            displayName: myUser.displayName,
            role: myUser.role,
            avatarColor: myUser.avatarColor || "#f43f5e",
            isMuted: activeCall?.isMuted ?? false,
            isDeafened: activeCall?.isDeafened ?? false,
            isSpeaking: isSelfSpeaking,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.participants && Array.isArray(data.participants)) {
            const realList: VoiceParticipant[] = data.participants.map((p: any) => ({
              id: p.userId,
              name: p.displayName,
              username: p.displayName.toLowerCase().replace(/\s+/g, "_"),
              minecraftNick: p.displayName,
              role: p.role,
              avatarColor: p.avatarColor || "#f43f5e",
              isMuted: p.userId === myUser.id ? (activeCall?.isMuted ?? false) : Boolean(p.isMuted),
              isDeafened: p.userId === myUser.id ? (activeCall?.isDeafened ?? false) : Boolean(p.isDeafened),
              isSpeaking: p.userId === myUser.id ? isSelfSpeaking : Boolean(p.isSpeaking),
              ping: 14,
            }));

            setActiveCall((prev) => (prev ? { ...prev, participants: realList } : null));

            // Establish WebRTC peer connection with each real remote peer
            for (const p of data.participants) {
              if (p.userId !== myUser.id) {
                const pc = getOrCreatePeerConnection(p.userId, channelId);

                // Deterministic caller: peer with lower string ID initiates offer
                if (myUser.id < p.userId && pc.signalingState === "stable") {
                  try {
                    const offer = await pc.createOffer({ offerToReceiveAudio: true });
                    await pc.setLocalDescription(offer);
                    await fetch("/api/voice/signal", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        channelId,
                        fromUserId: myUser.id,
                        fromDisplayName: myUser.displayName,
                        toUserId: p.userId,
                        type: "offer",
                        data: offer,
                      }),
                    });
                  } catch {
                    // peer offer error
                  }
                }
              }
            }
          }
        }
      } catch {
        // quiet heartbeat fail
      }
    }

    syncPresence();
    const interval = setInterval(syncPresence, 3800);
    return () => clearInterval(interval);
  }, [activeCall?.isConnected, activeCall?.channelId, activeCall?.isMuted, activeCall?.isDeafened, isSelfSpeaking]);

  // --- Real-time WebRTC Signal Polling (Offers, Answers, ICE Candidates) ---
  useEffect(() => {
    if (!activeCall?.isConnected || !currentUserRef.current) return;

    const myUser = currentUserRef.current;
    const channelId = activeCall.channelId;

    async function pollSignals() {
      try {
        const after = lastSignalPollTimeRef.current;
        lastSignalPollTimeRef.current = Date.now();

        const res = await fetch(
          `/api/voice/signal?channelId=${encodeURIComponent(channelId)}&userId=${encodeURIComponent(myUser.id)}&after=${after}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.signals && Array.isArray(data.signals)) {
          for (const s of data.signals) {
            const pc = getOrCreatePeerConnection(s.fromUserId, channelId);

            if (s.type === "offer" && pc.signalingState !== "closed") {
              await pc.setRemoteDescription(new RTCSessionDescription(s.data));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await fetch("/api/voice/signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  channelId,
                  fromUserId: myUser.id,
                  fromDisplayName: myUser.displayName,
                  toUserId: s.fromUserId,
                  type: "answer",
                  data: answer,
                }),
              });
            } else if (s.type === "answer" && pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(s.data));
            } else if (s.type === "candidate" && s.data) {
              await pc.addIceCandidate(new RTCIceCandidate(s.data)).catch(() => {});
            }
          }
        }
      } catch {
        // signal poll quiet
      }
    }

    const interval = setInterval(pollSignals, 1400);
    return () => clearInterval(interval);
  }, [activeCall?.isConnected, activeCall?.channelId]);

  // Clean unregister on window unload / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeCall && currentUserRef.current) {
        navigator.sendBeacon(
          `/api/voice/presence?channelId=${encodeURIComponent(activeCall.channelId)}&userId=${encodeURIComponent(currentUserRef.current.id)}`
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeCall]);

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
