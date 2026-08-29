"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions/messaging";
import { IconSend } from "@/components/icons";

export function MessageComposer({ channelId }: { channelId: string }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim() || pending) return;
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
      className="border-t border-white/10 p-4"
    >
      <input type="hidden" name="channelId" value={channelId} />
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
          placeholder={`Escribe un mensaje…`}
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
  );
}
