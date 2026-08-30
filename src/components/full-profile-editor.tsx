"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { updateFullProfileAction } from "@/actions/profile";
import { sounds } from "@/lib/sound-effects";
import { IconCheck, IconShield, IconUsers } from "@/components/icons";
import { RoleBadge } from "@/components/role-badge";
import type { User } from "@prisma/client";

const COLOR_PRESETS = [
  "#f43f5e", // Ruby
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#a855f7", // Amethyst
  "#f59e0b", // Amber
  "#ec4899", // Sakura
  "#3b82f6", // Sapphire
  "#84cc16", // Lime
  "#e11d48", // Crimson
];

export function FullProfileEditor({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [contactDiscord, setContactDiscord] = useState(user.contactDiscord || "");
  const [minecraftNick, setMinecraftNick] = useState(
    typeof window !== "undefined" ? localStorage.getItem("ec-minecraft-nick") || user.displayName : user.displayName
  );
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || "#f43f5e");
  const [statusText, setStatusText] = useState(user.status || "");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    const fd = new FormData();
    fd.set("displayName", displayName);
    fd.set("username", username);
    fd.set("contactDiscord", contactDiscord);
    fd.set("minecraftNick", minecraftNick);
    fd.set("avatarColor", avatarColor);
    fd.set("status", statusText);

    if (currentPassword && newPassword) {
      fd.set("currentPassword", currentPassword);
      fd.set("newPassword", newPassword);
    }

    startTransition(async () => {
      sounds.playPop();
      const res = await updateFullProfileAction(fd);
      if (res.success) {
        // Save local minecraft nick preference too
        if (minecraftNick) {
          localStorage.setItem("ec-minecraft-nick", minecraftNick.trim());
        }
        sounds.playSuccess();
        toast.success("¡Datos de perfil guardados en la Base de Datos!", {
          description: "Tu información pública y skin 3D han sido actualizadas.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Error al actualizar los datos.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Live Preview Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative">
          <div
            className="relative h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center font-extrabold text-2xl text-white shadow-xl border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${avatarColor}, rgba(15, 23, 42, 0.9))`,
              boxShadow: `0 8px 24px ${avatarColor}44`,
            }}
          >
            {minecraftNick.trim() ? (
              <Image
                src={`https://minotar.net/helm/${encodeURIComponent(minecraftNick.trim())}/64.png`}
                alt={displayName}
                width={64}
                height={64}
                unoptimized
                className="h-full w-full object-cover [image-rendering:pixelated]"
              />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#07090e] bg-emerald-500" />
          </span>
        </div>

        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="text-lg font-extrabold text-white tracking-tight">
              {displayName || "Nombre de Staff"}
            </span>
            <RoleBadge role={user.role} />
          </div>
          <div className="text-xs text-slate-400">
            @{username || "usuario"} {contactDiscord ? `· Discord: ${contactDiscord}` : ""}
          </div>
          {statusText ? (
            <div className="text-[11px] text-slate-300 mt-1 font-medium italic">
              &quot;{statusText}&quot;
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Nombre en Pantalla (Display Name)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="input text-xs"
            placeholder="Ej: Mortal / Marcel"
          />
          <p className="text-[11px] text-slate-500 mt-1">El nombre visible en chats y el dashboard.</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Nombre de Usuario (@username)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
            required
            className="input text-xs font-mono"
            placeholder="Ej: mortal_staff"
          />
          <p className="text-[11px] text-slate-500 mt-1">Identificador único para menciones (@usuario).</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Usuario de Discord
          </label>
          <input
            type="text"
            value={contactDiscord}
            onChange={(e) => setContactDiscord(e.target.value)}
            className="input text-xs"
            placeholder="Ej: mortal_pirata107"
          />
          <p className="text-[11px] text-slate-500 mt-1">Para contacto en el directorio de staff.</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            🎮 Nick de Minecraft (Skin 3D)
          </label>
          <input
            type="text"
            value={minecraftNick}
            onChange={(e) => setMinecraftNick(e.target.value)}
            className="input text-xs"
            placeholder="Ej: Mortal / Notch"
          />
          <p className="text-[11px] text-slate-500 mt-1">Se usa para generar la cabeza y avatar 3D.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Estado Personalizado
          </label>
          <input
            type="text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            className="input text-xs"
            placeholder="Ej: Desarrollando plugins de Minecraft / Atendiendo tickets"
          />
        </div>
      </div>

      {/* Avatar Color Picker */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
          Color de Resplandor de Avatar
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                sounds.playPop();
                setAvatarColor(color);
              }}
              className={`h-7 w-7 rounded-xl transition-transform cursor-pointer border ${
                avatarColor === color
                  ? "scale-110 border-white ring-2 ring-white/50"
                  : "border-white/20 hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={avatarColor}
            onChange={(e) => setAvatarColor(e.target.value)}
            className="h-7 w-9 rounded-lg bg-transparent cursor-pointer border border-white/20"
            title="Color personalizado"
          />
        </div>
      </div>

      {/* Optional Password Change Section */}
      <div className="border-t border-white/[0.08] pt-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <IconShield className="h-4 w-4 theme-text" /> Cambiar Contraseña (Opcional)
        </h4>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Contraseña Actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input text-xs"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input text-xs"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input text-xs"
              placeholder="Repite la nueva contraseña"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary text-xs font-semibold px-6 py-2.5 flex items-center gap-2"
        >
          <IconCheck className="h-4 w-4" />
          {pending ? "Guardando en la Base de Datos..." : "Guardar Todos los Cambios"}
        </button>
      </div>
    </form>
  );
}
