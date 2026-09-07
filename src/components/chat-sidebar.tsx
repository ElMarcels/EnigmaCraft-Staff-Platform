"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ChannelCategory, Channel } from "@prisma/client";
import {
  createCategory,
  createChannel,
  deleteChannel,
} from "@/actions/messaging";
import {
  IconPlus,
  IconHash,
  IconVolume,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconMic,
  IconMicOff,
  IconHeadphones,
  IconHeadphonesOff,
  IconSettings,
} from "@/components/icons";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { sounds } from "@/lib/sound-effects";
import { toast } from "sonner";

type CatWithChannels = ChannelCategory & { channels: Channel[] };

interface CurrentUserSummary {
  id: string;
  displayName: string;
  role: string;
  avatarColor?: string | null;
}

function getChannelIcon(channel: Channel) {
  if (channel.type === "VOICE") {
    return <span className="text-sm">🔊</span>;
  }
  const n = channel.name.toLowerCase();
  if (n.includes("anuncio")) return <span className="text-sm">📢</span>;
  if (n.includes("norma")) return <span className="text-sm">📜</span>;
  if (n.includes("guardia")) return <span className="text-sm">🛡️</span>;
  if (n.includes("hack") || n.includes("sospech")) return <span className="text-sm">👁️</span>;
  if (n.includes("sancion") || n.includes("ban")) return <span className="text-sm">⚖️</span>;
  if (n.includes("bug") || n.includes("report")) return <span className="text-sm">🐛</span>;
  if (n.includes("build")) return <span className="text-sm">🧱</span>;
  if (n.includes("actualiz")) return <span className="text-sm">🚀</span>;
  if (n.includes("casual")) return <span className="text-sm">☕</span>;
  return <IconHash className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-200" />;
}

export function ChatSidebar({
  categories,
  canManage,
  currentUser,
}: {
  categories: CatWithChannels[];
  canManage: boolean;
  currentUser?: CurrentUserSummary | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Quick mic & audio state for the bottom bar
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  function toggleCollapse(catId: string) {
    sounds.playPop();
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  async function removeChannel(id: string, name: string) {
    if (!confirm(`¿Eliminar el canal #${name}?`)) return;
    sounds.playPop();
    await deleteChannel(id);
    toast.success(`Canal #${name} eliminado.`);
    router.refresh();
  }

  function handleQuickMic() {
    sounds.playPop();
    const next = !isMicMuted;
    setIsMicMuted(next);
    toast(next ? "Micrófono silenciado" : "Micrófono activado", {
      icon: next ? "🔇" : "🎙️",
    });
  }

  function handleQuickDeafen() {
    sounds.playPop();
    const next = !isDeafened;
    setIsDeafened(next);
    if (next) setIsMicMuted(true);
    toast(next ? "Audio ensordecido" : "Audio activado", {
      icon: next ? "🔇" : "🔊",
    });
  }

  return (
    <aside className="flex h-full w-64 md:w-72 shrink-0 flex-col border-r border-white/[0.08] bg-[#070a12]/95 backdrop-blur-2xl relative select-none">
      {/* Top Header: Server / Network Title */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5 bg-white/[0.01]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-xs">
            EC
          </div>
          <div className="truncate">
            <h1 className="text-xs font-black tracking-wide uppercase text-white truncate">
              EnigmaCraft Staff
            </h1>
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Red Online
            </span>
          </div>
        </div>

        {canManage ? (
          <button
            onClick={() => {
              sounds.playPop();
              setAddingCategory((v) => !v);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer"
            title="Nueva categoría"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Inline Category Creation */}
      {addingCategory ? (
        <form
          action={async (fd) => {
            await createCategory(fd);
            setAddingCategory(false);
            sounds.playSuccess();
            toast.success("Categoría creada con éxito");
          }}
          className="border-b border-white/[0.08] p-3 bg-white/[0.03] space-y-2 animate-in fade-in duration-200"
        >
          <input
            name="name"
            placeholder="NOMBRE DE CATEGORÍA"
            className="input text-xs py-1.5 uppercase font-bold"
            required
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary flex-1 py-1 text-xs justify-center font-bold"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setAddingCategory(false)}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No hay canales disponibles todavía.
          </div>
        ) : (
          categories.map((cat) => {
            const isCatCollapsed = collapsed[cat.id];
            return (
              <div key={cat.id} className="space-y-0.5">
                {/* Category Header */}
                <div className="group/cat flex items-center justify-between px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(cat.id)}
                    className="flex flex-1 items-center gap-1.5 text-left truncate cursor-pointer"
                  >
                    {isCatCollapsed ? (
                      <IconChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <IconChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.2 rounded-full bg-white/[0.04]">
                      {cat.channels.length}
                    </span>
                  </button>

                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setAddingTo(addingTo === cat.id ? null : cat.id);
                      }}
                      className="opacity-0 group-hover/cat:opacity-100 rounded p-1 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                      title="Crear canal en esta categoría"
                    >
                      <IconPlus className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>

                {/* Add Channel Modal/Inline Form */}
                {addingTo === cat.id ? (
                  <form
                    action={async (fd) => {
                      await createChannel(fd);
                      setAddingTo(null);
                      sounds.playSuccess();
                      toast.success("Canal creado con éxito");
                    }}
                    className="mx-1 my-2 rounded-xl border border-rose-500/30 bg-[#0d121f] p-3 space-y-2.5 shadow-xl animate-in zoom-in-95 duration-150"
                  >
                    <input type="hidden" name="categoryId" value={cat.id} />
                    <input
                      name="name"
                      placeholder="nombre-del-canal"
                      className="input text-xs py-1.5 font-medium"
                      required
                      autoFocus
                    />
                    <select
                      name="type"
                      className="input text-xs py-1.5 cursor-pointer bg-[#121826]"
                    >
                      <option value="TEXT">💬 Canal de Texto</option>
                      <option value="VOICE">🔊 Canal de Voz (WebRTC)</option>
                    </select>
                    <input
                      name="description"
                      placeholder="Descripción del canal"
                      className="input text-xs py-1.5"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="btn-primary flex-1 py-1 text-xs justify-center font-bold"
                      >
                        Crear Canal
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingTo(null)}
                        className="btn-secondary py-1 px-2.5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* Channels in this category */}
                {!isCatCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {cat.channels.map((ch) => {
                      const active = pathname === `/chat/${ch.id}`;
                      const isVoice = ch.type === "VOICE";

                      return (
                        <div
                          key={ch.id}
                          className={`group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all text-xs font-medium cursor-pointer ${
                            active
                              ? "bg-rose-500/15 border border-rose-500/30 text-white font-bold shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                          }`}
                        >
                          <Link
                            href={`/chat/${ch.id}`}
                            onClick={() => sounds.playPop()}
                            className="flex min-w-0 flex-1 items-center gap-2"
                            title={ch.description || undefined}
                          >
                            <span className="shrink-0">{getChannelIcon(ch)}</span>
                            <span className="truncate">{ch.name}</span>
                            {isVoice && (
                              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                VOZ
                              </span>
                            )}
                          </Link>

                          {canManage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeChannel(ch.id, ch.name);
                              }}
                              className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer ml-1"
                              title={`Eliminar #${ch.name}`}
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom User Profile & Voice Quick Controls */}
      <div className="border-t border-white/[0.08] bg-[#05070d]/90 p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative">
            <Avatar
              name={currentUser?.displayName || "Staff"}
              color={currentUser?.avatarColor || "#f43f5e"}
              className="h-8 w-8 text-[11px] font-extrabold"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
          </div>
          <div className="truncate min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {currentUser?.displayName || "Staff Member"}
            </p>
            <div className="mt-0.5">
              <RoleBadge role={currentUser?.role || "STAFF"} className="text-[9px] py-0 px-1.5" />
            </div>
          </div>
        </div>

        {/* Audio quick toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleQuickMic}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isMicMuted
                ? "bg-rose-600/30 text-rose-400 border border-rose-500/40"
                : "text-slate-400 hover:text-white hover:bg-white/[0.08]"
            }`}
            title={isMicMuted ? "Activar micro" : "Silenciar micro"}
          >
            {isMicMuted ? <IconMicOff className="h-4 w-4" /> : <IconMic className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleQuickDeafen}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isDeafened
                ? "bg-rose-600/30 text-rose-400 border border-rose-500/40"
                : "text-slate-400 hover:text-white hover:bg-white/[0.08]"
            }`}
            title={isDeafened ? "Activar sonido" : "Ensordecer"}
          >
            {isDeafened ? (
              <IconHeadphonesOff className="h-4 w-4" />
            ) : (
              <IconHeadphones className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Ajustes de audio y cuenta"
          >
            <IconSettings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
