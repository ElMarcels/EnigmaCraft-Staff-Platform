"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage, toggleReaction } from "@/actions/messaging";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { IconTrash, IconPlus } from "@/components/icons";
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
  };
  canDelete: boolean;
  reactions: ReactionDTO[];
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🔥"];

function Mentioned({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-Z0-9_]{2,32})/g);
  return (
    <>
      {parts.map((p, i) =>
        i === 0 || !p.startsWith("@") ? (
          p
        ) : (
          <span key={i} className="rounded bg-indigo-500/20 px-1 font-semibold text-indigo-300">
            {p}
          </span>
        )
      )}
    </>
  );
}

export function MessageList({ messages }: { messages: MessageDTO[] }) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [palette, setPalette] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(id);
  }, [router]);

  function react(messageId: string, emoji: string) {
    setPalette(null);
    toggleReaction(messageId, emoji).then(() => router.refresh());
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-white/30">
        Todavía no hay mensajes en este canal.
      </div>
    );
  }

  // Group consecutive messages from the same author
  const rows: {
    msg: MessageDTO;
    grouped: boolean;
  }[] = messages.map((m, i) => ({
    msg: m,
    grouped: i > 0 && messages[i - 1].author.id === m.author.id,
  }));

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex flex-col gap-0.5">
        {rows.map(({ msg, grouped }) => (
          <div
            key={msg.id}
            className={`group flex gap-3 rounded-lg px-2 py-1 hover:bg-white/[0.04] ${
              grouped ? "ml-11" : ""
            }`}
          >
            {grouped ? null : (
              <Avatar name={msg.author.displayName} color={msg.author.avatarColor} />
            )}
            <div className="min-w-0 flex-1">
              {grouped ? null : (
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-white transition-colors hover:underline"
                    style={{ color: msg.author.avatarColor }}
                  >
                    {msg.author.displayName}
                  </span>
                  <RoleBadge role={msg.author.role} />
                  <span className="text-[11px] text-white/30">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap break-words text-sm text-white/80">
                <Mentioned text={msg.content} />
                {msg.edited ? (
                  <span className="ml-1 text-[11px] text-white/30">(editado)</span>
                ) : null}
              </p>

              {msg.reactions.length > 0 ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  {msg.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => react(msg.id, r.emoji)}
                      title={r.users.join(", ")}
                      className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                        r.mine
                          ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-200"
                          : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/10"
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.count}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 self-center">
              {msg.canDelete ? (
                <button
                  onClick={() => {
                    setDeleting(msg.id);
                    deleteMessage(msg.id).then(() => {
                      router.refresh();
                      setDeleting(null);
                    });
                  }}
                  disabled={deleting === msg.id}
                  className="rounded p-1.5 text-white/30 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                  title="Eliminar mensaje"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              ) : null}

              <div className="relative">
                <button
                  onClick={() => setPalette(palette === msg.id ? null : msg.id)}
                  className="rounded p-1 text-white/30 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  title="Reaccionar"
                >
                  <IconPlus className="h-4 w-4" />
                </button>
                {palette === msg.id ? (
                  <div className="absolute bottom-full right-0 z-20 mb-1 flex gap-1 rounded-full border border-white/10 bg-[#12151f] p-1.5 shadow-xl">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => react(msg.id, emoji)}
                        className="rounded-full p-1 text-lg transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}