"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions/messaging";
import { IconSend, IconPlus, IconClose, IconFile } from "@/components/icons";
import { sounds } from "@/lib/sound-effects";
import { toast } from "sonner";

export function MessageComposer({ channelId }: { channelId: string }) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: "image" | "file";
    dataUrl: string;
    size: number;
  } | null>(null);

  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 8MB.");
      return;
    }

    sounds.playPop();
    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith("image/");
      setAttachment({
        name: file.name,
        type: isImg ? "image" : "file",
        dataUrl: reader.result as string,
        size: file.size,
      });
      toast.success(isImg ? "Imagen adjuntada al mensaje" : "Archivo adjuntado");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((!text.trim() && !attachment) || pending) return;
    sounds.playMessage();

    let fullContent = text.trim();
    if (attachment) {
      if (attachment.type === "image") {
        fullContent = fullContent
          ? `${fullContent}\n[img:${attachment.dataUrl}]`
          : `[img:${attachment.dataUrl}]`;
      } else {
        fullContent = fullContent
          ? `${fullContent}\n[file:${attachment.name}:${attachment.dataUrl}]`
          : `[file:${attachment.name}:${attachment.dataUrl}]`;
      }
    }

    const formData = new FormData();
    formData.set("channelId", channelId);
    formData.set("content", fullContent);

    startTransition(async () => {
      await sendMessage(formData);
      setText("");
      setAttachment(null);
      router.refresh();
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border-t border-white/[0.08] p-4 bg-[#080b12]/80 backdrop-blur-xl space-y-2"
    >
      <input type="hidden" name="channelId" value={channelId} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.schem,.yml,.yaml,.json,.txt,.jar,.zip"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="max-w-5xl mx-auto flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/[0.1] w-fit animate-fadeIn">
          {attachment.type === "image" ? (
            <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/20">
              <Image
                src={attachment.dataUrl}
                alt={attachment.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg theme-icon-box">
              <IconFile className="h-5 w-5" />
            </div>
          )}

          <div className="text-xs">
            <div className="font-bold text-white max-w-[200px] truncate">{attachment.name}</div>
            <div className="text-[10px] text-slate-400">{(attachment.size / 1024).toFixed(1)} KB</div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setAttachment(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/[0.08] transition-colors"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            fileInputRef.current?.click();
          }}
          className="btn-secondary h-11 px-3 shrink-0 text-slate-300 hover:text-white"
          title="Adjuntar imagen o archivo de servidor (.schem, .yml, imagen)"
        >
          <IconPlus className="h-4 w-4 text-[var(--ruby-light)]" />
        </button>

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
          placeholder="Escribe un mensaje o pega una captura... (Enter para enviar)"
          rows={1}
          className="input max-h-36 min-h-[44px] resize-none py-2.5 px-4 text-sm flex-1"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !attachment) || pending}
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
