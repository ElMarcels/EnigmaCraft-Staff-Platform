"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { sounds } from "@/lib/sound-effects";
import { RoleBadge } from "@/components/role-badge";
import { IconClose, IconArrowRight, IconChat } from "@/components/icons";

export interface FloatingChatMessage {
  id: string;
  channelId: string;
  channelName: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export function ChatUnreadListener({ currentUserId }: { currentUserId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<FloatingChatMessage[]>([]);
  const alertedIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Active channel if current route is /chat/[channelId]
  const activeChannelId = pathname.startsWith("/chat/")
    ? pathname.replace("/chat/", "").split("/")[0]
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mark active channel as read whenever route changes
  useEffect(() => {
    if (!activeChannelId) return;

    try {
      const stored = localStorage.getItem(`ec_chat_read_${currentUserId}`) || "{}";
      const parsed = JSON.parse(stored);
      parsed[activeChannelId] = new Date().toISOString();
      localStorage.setItem(`ec_chat_read_${currentUserId}`, JSON.stringify(parsed));

      // Remove from unread map
      setUnreadMap((prev) => {
        if (!prev[activeChannelId]) return prev;
        const next = { ...prev };
        delete next[activeChannelId];
        window.dispatchEvent(
          new CustomEvent("ec_unread_update", { detail: { unreadMap: next } })
        );
        return next;
      });

      // Dismiss any notifications for this channel
      setNotifications((prev) => prev.filter((n) => n.channelId !== activeChannelId));
    } catch {
      // storage quiet fallback
    }
  }, [activeChannelId, currentUserId]);

  // Polling for new messages and unread channels
  useEffect(() => {
    let isSubscribed = true;

    async function checkActivity() {
      try {
        const res = await fetch("/api/chat/activity");
        if (!res.ok) return;
        const data = await res.json();
        if (!isSubscribed || !data.channels) return;

        const stored = localStorage.getItem(`ec_chat_read_${currentUserId}`) || "{}";
        let lastReadMap: Record<string, string> = {};
        try {
          lastReadMap = JSON.parse(stored);
        } catch {
          lastReadMap = {};
        }

        const nextUnread: Record<string, boolean> = {};
        const newNotifications: FloatingChatMessage[] = [];

        for (const [chId, info] of Object.entries<any>(data.channels)) {
          const latest = info.latestMessage;
          if (!latest) continue;

          // Don't mark unread for own messages
          if (latest.authorId === currentUserId) continue;

          const lastRead = lastReadMap[chId];
          const isUnread = !lastRead || new Date(latest.createdAt) > new Date(lastRead);

          if (isUnread) {
            nextUnread[chId] = true;

            // If user is not currently in this channel AND message hasn't been alerted yet
            if (activeChannelId !== chId && !alertedIdsRef.current.has(latest.id)) {
              alertedIdsRef.current.add(latest.id);

              // Don't pop sound flood on very first mount
              if (!initialLoadRef.current) {
                newNotifications.push({
                  id: latest.id,
                  channelId: chId,
                  channelName: info.channelName || chId,
                  authorName: latest.authorName,
                  authorRole: latest.authorRole,
                  content: latest.content,
                  createdAt: latest.createdAt,
                });
              }
            }
          }
        }

        if (initialLoadRef.current) {
          initialLoadRef.current = false;
        }

        setUnreadMap(nextUnread);
        window.dispatchEvent(
          new CustomEvent("ec_unread_update", { detail: { unreadMap: nextUnread } })
        );

        if (newNotifications.length > 0) {
          sounds.playPop();
          setNotifications((prev) => [...newNotifications, ...prev].slice(0, 3));
        }
      } catch {
        // quiet fallback
      }
    }

    checkActivity();
    const interval = setInterval(checkActivity, 3500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [currentUserId, activeChannelId]);

  function handleDismiss(id: string) {
    sounds.playPop();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleOpenChannel(channelId: string) {
    sounds.playPop();
    setNotifications((prev) => prev.filter((n) => n.channelId !== channelId));
    router.push(`/chat/${channelId}`);
  }

  if (!mounted || notifications.length === 0) return null;

  return createPortal(
    <div
      aria-label="Notificaciones flotantes de nuevos mensajes"
      className="fixed bottom-24 right-6 z-[999999] pointer-events-auto flex flex-col gap-2.5 max-w-sm w-full select-none animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          className="rounded-3xl border border-rose-500/40 bg-[#090d1a]/95 backdrop-blur-2xl p-4 shadow-[0_15px_45px_rgba(244,63,94,0.3)] hover:border-rose-500/60 transition-all space-y-2.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <IconChat className="h-3.5 w-3.5" />
                <span>Nuevo Mensaje</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                #{n.channelName}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDismiss(n.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Descartar notificación"
            >
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Author & Message Preview */}
          <div className="flex items-start gap-3">
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(n.authorName)}/32`}
              alt={n.authorName}
              className="h-8 w-8 rounded-xl shadow-md shrink-0 bg-black/40 border border-white/10"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-white truncate">{n.authorName}</span>
                <RoleBadge role={n.authorRole} showDot={false} className="py-0 px-1 text-[8px]" />
                <span className="text-[9px] text-slate-400 ml-auto font-mono">Ahora</span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.04]">
                {n.content}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenChannel(n.channelId)}
              className="btn-primary flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40 active:scale-95"
            >
              <span>Abrir #{n.channelName}</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDismiss(n.id)}
              className="btn-secondary py-1.5 px-3 text-xs font-medium cursor-pointer"
            >
              Ignorar
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
