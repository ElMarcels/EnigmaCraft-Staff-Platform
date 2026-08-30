"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions/messaging";
import { IconSend } from "@/components/icons";
import { sounds } from "@/lib/sound-effects";

export function MessageComposer({ channelId }: { channelId: string }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    sounds.playMessage();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await sendMessage(formData);
      setText("");
      router.refresh();
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border-t border-white/[0.08] p-4 bg-[#080b12]/80 backdrop-blur-xl"
    >
      <input type="hidden" name="channelId" value={channelId} />
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
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
          placeholder="Escribe un mensaje en el canal (Enter para enviar, Shift+Enter para salto)..."
          rows={1}
          className="input max-h-36 min-h-[44px] resize-none py-2.5 px-4 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || pending}
          className="btn-primary h-11 px-4 shrink-0 font-semibold"
          title="Enviar mensaje"
        >
          {pending ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <IconSend className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}
