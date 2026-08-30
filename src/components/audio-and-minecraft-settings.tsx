"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { IconCheck } from "@/components/icons";

export function AudioAndMinecraftSettings({
  defaultNick,
}: {
  defaultNick?: string | null;
}) {
  const [nick, setNick] = useState(defaultNick || "");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const soundPref = localStorage.getItem("ec-sound-effects");
    setSoundEnabled(soundPref !== "disabled");
    const savedNick = localStorage.getItem("ec-minecraft-nick");
    if (savedNick && !defaultNick) {
      setNick(savedNick);
    }
  }, [defaultNick]);

  function toggleSounds() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      localStorage.removeItem("ec-sound-effects");
      sounds.playSuccess();
      toast.success("Efectos de sonido activados");
    } else {
      localStorage.setItem("ec-sound-effects", "disabled");
      toast.info("Efectos de sonido silenciados");
    }
  }

  function saveNick(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim()) return;
    localStorage.setItem("ec-minecraft-nick", nick.trim());
    sounds.playSuccess();
    toast.success(`Nick de Minecraft vinculado: ${nick.trim()}`, {
      description: "Tu avatar ahora mostrará la skin 3D de tu cuenta de Minecraft.",
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Minecraft 3D Skin Link */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          🎮 Skin de Minecraft en tu Perfil
        </h3>
        <p className="text-xs text-slate-400">
          Introduce tu usuario de Minecraft Java/Bedrock para mostrar tu cabeza 3D en chats y directorios.
        </p>

        <form onSubmit={saveNick} className="space-y-3">
          <div className="flex items-center gap-3">
            {/* Live 3D Head Preview */}
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-black/40 border border-white/20 shrink-0 flex items-center justify-center shadow-md">
              {nick.trim() ? (
                <Image
                  src={`https://minotar.net/helm/${encodeURIComponent(nick.trim())}/64.png`}
                  alt={nick}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-full w-full object-cover [image-rendering:pixelated]"
                />
              ) : (
                <span className="text-xs text-slate-500 font-mono">3D</span>
              )}
            </div>

            <input
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Ej: Marcel / Notch"
              className="input text-xs flex-1"
            />
          </div>

          <button
            type="submit"
            className="btn-secondary text-xs font-semibold px-4 py-2 flex items-center gap-2"
          >
            <IconCheck className="h-3.5 w-3.5" /> Vincular Skin Minecraft
          </button>
        </form>
      </div>

      {/* Audio & Haptic Feedback */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          🔊 Efectos de Sonido & Audio UI
        </h3>
        <p className="text-xs text-slate-400">
          Micro-sonidos interactivos sintetizados al enviar mensajes, pulsar botones o cambiar de tema.
        </p>

        <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-white">Sonidos de Interfaz</div>
            <div className="text-[11px] text-slate-400">
              {soundEnabled ? "Activados (Audio Web API)" : "Silenciados"}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSounds}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? "theme-badge shadow-sm"
                : "bg-white/[0.05] text-slate-400 border border-white/[0.08]"
            }`}
          >
            {soundEnabled ? "ACTIVADO" : "MUTEAR"}
          </button>
        </div>

        {soundEnabled && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => sounds.playMessage()}
              className="btn-secondary text-[11px] py-1 px-2.5"
            >
              Probar Mensaje 💬
            </button>
            <button
              type="button"
              onClick={() => sounds.playReaction()}
              className="btn-secondary text-[11px] py-1 px-2.5"
            >
              Probar Reacción 🎉
            </button>
            <button
              type="button"
              onClick={() => sounds.playSuccess()}
              className="btn-secondary text-[11px] py-1 px-2.5"
            >
              Probar Éxito ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
