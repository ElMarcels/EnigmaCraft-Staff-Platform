"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteMessage, toggleReaction } from "@/actions/messaging";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { IconTrash, IconPlus, IconChat, IconCheck } from "@/components/icons";
import { statusOf } from "@/lib/role-meta";
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
    lastSeenAt?: string | null;
    status?: string | null;
  };
  canDelete: boolean;
  reactions: ReactionDTO[];
};

const QUICK_REACTIONS = ["+1", "OK", "CORRECTO", "REPORT", "FIX"];

function Mentioned({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-Z0-9_]{2,32})/g);
  return (
    <>
      {parts.map((p, i) =>
        i === 0 || !p.startsWith("@") ? (
          p
        ) : (
          <span key={i} className="rounded-md bg-rose-500/20 px-1.5 py-0.5 font-semibold text-rose-300 border border-rose-500/30">
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

  function react(messageId: string, tag: string) {
    setPalette(null);
    toggleReaction(messageId, tag).then(() => router.refresh());
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-rose-400 mb-3">
          <IconChat className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">No hay mensajes todavia</p>
        <p className="text-xs text-slate-400 mt-1">Inicia la conversacion en este canal.</p>
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
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-1">
      {rows.map(({ msg, grouped }) => {
        const authorStatus = statusOf({
          status: msg.author.status,
          lastSeenAt: msg.author.lastSeenAt,
        });

        return (
          <div
            key={msg.id}
            className={`group relative flex gap-3.5 rounded-xl px-3 py-1.5 hover:bg-white/[0.03] transition-colors ${
              grouped ? "ml-12" : "mt-2"
            }`}
          >
            {grouped ? null : (
              <Avatar
                name={msg.author.displayName}
                color={msg.author.avatarColor}
                isOnline={authorStatus?.key === "ONLINE"}
                className="h-9 w-9 text-xs mt-0.5"
              />
            )}

            <div className="min-w-0 flex-1">
              {grouped ? null : (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/directory`}
                    className="font-bold text-sm text-white hover:text-rose-400 transition-colors"
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
                          ? "border-rose-500/40 bg-rose-500/20 text-rose-200 shadow-sm"
                          : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      <IconCheck className="h-3 w-3 text-rose-400" />
                      <span>{r.emoji}</span>
                      <span className="text-[11px]">{r.count}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Floating Action Toolbar on Hover */}
            <div className="absolute right-3 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0d121c]/90 backdrop-blur-md border border-white/[0.08] rounded-lg p-1 shadow-lg z-10">
              <div className="relative">
                <button
                  onClick={() => setPalette(palette === msg.id ? null : msg.id)}
                  className="rounded p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                  title="Anadir reaccion"
                >
                  <IconPlus className="h-4 w-4" />
                </button>
                {palette === msg.id ? (
                  <div className="absolute bottom-full right-0 z-30 mb-2 flex gap-1 rounded-2xl border border-white/[0.12] bg-[#0d121c] p-2 shadow-2xl backdrop-blur-xl">
                    {QUICK_REACTIONS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => react(msg.id, tag)}
                        className="rounded-lg px-2 py-1 text-xs font-bold hover:bg-white/[0.08] hover:text-rose-300 transition-all cursor-pointer"
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
                    setDeleting(msg.id);
                    deleteMessage(msg.id).then(() => {
                      router.refresh();
                      setDeleting(null);
                    });
                  }}
                  disabled={deleting === msg.id}
                  className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
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