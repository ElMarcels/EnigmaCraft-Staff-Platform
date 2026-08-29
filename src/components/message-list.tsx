"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage } from "@/actions/messaging";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { IconTrash } from "@/components/icons";
import type { Role } from "@prisma/client";

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
};

export function MessageList({ messages }: { messages: MessageDTO[] }) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(id);
  }, [router]);

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
                {msg.content}
                {msg.edited ? (
                  <span className="ml-1 text-[11px] text-white/30">(editado)</span>
                ) : null}
              </p>
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
                className="self-center rounded p-1.5 text-white/30 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                title="Eliminar mensaje"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
