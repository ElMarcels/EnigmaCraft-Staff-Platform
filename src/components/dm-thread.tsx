"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendDm } from "@/actions/messaging";
import { Avatar } from "@/components/role-badge";
import { IconSend } from "@/components/icons";
import type { Role } from "@prisma/client";

export type DmMessageDTO = {
  id: string;
  content: string;
  createdAt: string;
  fromMe: boolean;
  author: { displayName: string; avatarColor: string; role: Role };
};

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

export function DmThread({
  partnerId,
  partnerName,
  messages,
}: {
  partnerId: string;
  partnerName: string;
  messages: DmMessageDTO[];
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(id);
  }, [router]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await sendDm(fd);
      if (res && "error" in res) {
        setError(res.error || null);
      } else {
        setError(null);
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-0.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 rounded-lg px-2 py-1 hover:bg-white/[0.04] ${
                m.fromMe ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar
                name={m.author.displayName}
                color={m.author.avatarColor}
                className="h-7 w-7 text-xs"
              />
              <div
                className={`min-w-0 max-w-[75%] ${
                  m.fromMe ? "text-right" : ""
                }`}
              >
                {!m.fromMe ? (
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: m.author.avatarColor }}>
                      {m.author.displayName}
                    </span>
                    <span className="text-[11px] text-white/30">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ) : null}
                <p
                  className={`inline-block rounded-2xl px-3 py-1.5 text-sm whitespace-pre-wrap break-words ${
                    m.fromMe
                      ? "bg-indigo-500/25 text-white"
                      : "bg-white/[0.06] text-white/80"
                  }`}
                >
                  <Mentioned text={m.content} />
                </p>
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="border-t border-white/10 px-5 py-1 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="border-t border-white/10 p-4">
        <input type="hidden" name="to" value={partnerId} />
        <div className="flex items-end gap-2">
          <textarea
            name="content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
            placeholder={`Mensaje a ${partnerName}…`}
            rows={1}
            className="input max-h-40 min-h-[44px] resize-none py-2.5"
          />
          <button
            type="submit"
            disabled={!text.trim() || pending}
            className="btn-primary shrink-0"
            title="Enviar"
          >
            <IconSend />
          </button>
        </div>
      </form>
    </>
  );
}