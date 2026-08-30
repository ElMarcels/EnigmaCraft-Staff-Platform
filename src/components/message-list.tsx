"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteMessage, toggleReaction } from "@/actions/messaging";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { IconTrash, IconPlus, IconChat, IconCheck } from "@/components/icons";
import { statusOf, isOnline } from "@/lib/role-meta";
import { sounds } from "@/lib/sound-effects";
import type { Role } from "@prisma/client";

export type ReactionDTO = {
  emoji: string;
  count: number;
  mine: boolean;
  users: string[];
};

export type MessageDTO = {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  author: {
    id: string;
    displayName: string;
    avatarColor: string;
    role: Role;
    discord?: string | null;
    minecraftNick?: string | null;
    lastSeenAt?: string | null;
    status?: string | null;
  };
  canDelete: boolean;
  reactions: ReactionDTO[];
};

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "🎉", "💎", "⚔️", "✅", "🚀"];

function Mentioned({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-Z0-9_]{2,32})/g);
  return (
    <>
      {parts.map((p, i) =>
        i === 0 || !p.startsWith("@") ? (
          p
        ) : (
          <span key={i} className="rounded-md theme-badge px-1.5 py-0.5 font-semibold">
            {p}
          </span>
        )
      )}
    </>
  );
}

export function MessageList({
  messages,
  currentUserId,
}: {
  messages: MessageDTO[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function react(messageId: string, emoji: string) {
    sounds.playReaction();
    toggleReaction(messageId, emoji).then(() => router.refresh());
    setPalette(null);
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl theme-icon-box mb-3">
          <IconChat className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-200">No hay mensajes todavía</p>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Sé el primero en enviar un mensaje en este canal de coordinación del staff.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6 select-text">
      {messages.map((msg, index) => {
        const isMe = msg.author.id === currentUserId;
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const isSameAuthor = prevMsg && prevMsg.author.id === msg.author.id;
        const isWithinFiveMin =
          prevMsg &&
          new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() <
            5 * 60 * 1000;
        const isChained = isSameAuthor && isWithinFiveMin;

        const isUserOnline = isOnline(msg.author.lastSeenAt);

        return (
          <div
            key={msg.id}
            className={`group relative flex gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-white/[0.025] ${
              isChained ? "mt-1 pt-0.5" : "mt-4"
            }`}
          >
            {/* Avatar / Placeholder */}
            {!isChained ? (
              <Avatar
                name={msg.author.displayName}
                color={msg.author.avatarColor}
                minecraftNick={msg.author.minecraftNick}
                isOnline={isUserOnline}
                className="h-9 w-9 text-xs shrink-0"
              />
            ) : (
              <div className="w-9 shrink-0 select-none text-right text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}

            {/* Message Body */}
            <div className="min-w-0 flex-1">
              {!isChained && (
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/directory?u=${msg.author.id}`}
                    className="font-bold text-sm text-white hover:text-[var(--ruby-light)] transition-colors"
                  >
                    {msg.author.displayName}
                  </Link>

                  <RoleBadge role={msg.author.role} showDot={false} className="py-0 px-2 text-[10px]" />

                  <span className="text-[11px] font-medium text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              <p className="whitespace-pre-wrap break-words text-sm text-slate-200 leading-relaxed font-normal">
                <Mentioned text={msg.content} />
                {msg.edited ? (
                  <span className="ml-1.5 text-[10px] text-slate-400 font-medium">(editado)</span>
                ) : null}
              </p>

              {/* Reaction Badges */}
              {msg.reactions.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {msg.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => react(msg.id, r.emoji)}
                      title={r.users.join(", ")}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                        r.mine
                          ? "theme-badge shadow-sm"
                          : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[11px] font-bold">{r.count}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Floating Action Toolbar on Hover */}
            <div className="absolute right-3 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0d121c]/95 backdrop-blur-md border border-white/[0.08] rounded-xl p-1 shadow-lg z-10">
              <div className="relative">
                <button
                  onClick={() => {
                    sounds.playPop();
                    setPalette(palette === msg.id ? null : msg.id);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                  title="Añadir reacción"
                >
                  <IconPlus className="h-4 w-4" />
                </button>
                {palette === msg.id ? (
                  <div className="absolute bottom-full right-0 z-30 mb-2 flex gap-1 rounded-2xl border border-white/[0.12] bg-[#0d121c] p-2 shadow-2xl backdrop-blur-xl animate-fadeIn">
                    {QUICK_REACTIONS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => react(msg.id, tag)}
                        className="rounded-xl p-1.5 text-sm hover:scale-125 hover:bg-white/[0.08] transition-all cursor-pointer select-none"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {msg.canDelete ? (
                <button
                  onClick={() => {
                    sounds.playPop();
                    setDeleting(msg.id);
                    deleteMessage(msg.id).then(() => {
                      router.refresh();
                      setDeleting(null);
                    });
                  }}
                  disabled={deleting === msg.id}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Eliminar mensaje"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}