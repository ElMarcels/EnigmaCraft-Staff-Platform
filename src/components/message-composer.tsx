"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions/messaging";
import { updateFullProfileAction } from "@/actions/profile";
import { IconSend, IconPlus, IconClose, IconFile } from "@/components/icons";
import { sounds } from "@/lib/sound-effects";
import { toast } from "sonner";
import type { ChannelMemberDTO } from "@/components/channel-members-sidebar";

const SLASH_COMMANDS = [
  { cmd: "/status", desc: "Actualiza tu estado de actividad (ej: /status En vivo en Discord)", example: "/status Desarrollando plugins" },
  { cmd: "/tps", desc: "Muestra métricas en vivo del servidor (TPS 19.98, RAM y Ping)", example: "/tps" },
  { cmd: "/server", desc: "Estado de la red de Minecraft y jugadores conectados", example: "/server" },
  { cmd: "/roll", desc: "Tira un dado aleatorio (ej: /roll 100)", example: "/roll 100" },
  { cmd: "/clear", desc: "Limpia la pantalla de mensajes localmente", example: "/clear" },
  { cmd: "/help", desc: "Lista de comandos de staff y códigos de formato", example: "/help" },
];

const QUICK_CHANNELS_AND_FOLDERS = [
  { tag: "#general", type: "canal", desc: "Canal principal de comunicación" },
  { tag: "#desarrollo", type: "canal", desc: "Coordinación técnica y código" },
  { tag: "#anuncios", type: "canal", desc: "Comunicados oficiales de staff" },
  { tag: "#soporte", type: "canal", desc: "Reportes y moderación de usuarios" },
  { tag: "#plugins", type: "drive", desc: "Carpeta de plugins en Drive" },
  { tag: "#schematics", type: "drive", desc: "Esquemáticos y construcciones" },
  { tag: "#configs", type: "drive", desc: "Configuraciones YAML del servidor" },
  { tag: "#mapas", type: "drive", desc: "Mapas y mundos del servidor" },
];

const GROUP_MENTIONS = [
  { tag: "@staff", desc: "Notificar a todo el equipo de Staff" },
  { tag: "@todos", desc: "Mención general de la network" },
  { tag: "@admin", desc: "Administradores de red" },
  { tag: "@mod", desc: "Moderadores en servicio" },
  { tag: "@builder", desc: "Equipo de construcción y mapas" },
];

export function MessageComposer({
  channelId,
  members = [],
}: {
  channelId: string;
  members?: ChannelMemberDTO[];
}) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: "image" | "file";
    dataUrl: string;
    size: number;
  } | null>(null);

  // Autocomplete state
  const [autocompleteType, setAutocompleteType] = useState<"@" | "#" | "/" | null>(null);
  const [autocompleteFilter, setAutocompleteFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute autocomplete options
  const suggestions = (() => {
    if (autocompleteType === "@") {
      const q = autocompleteFilter.toLowerCase();
      const groups = GROUP_MENTIONS.filter((g) => g.tag.toLowerCase().includes(q)).map((g) => ({
        label: g.tag,
        subtitle: g.desc,
        value: g.tag,
      }));
      const users = members
        .filter(
          (m) =>
            m.displayName.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q)
        )
        .map((m) => ({
          label: `@${m.displayName}`,
          subtitle: `@${m.username} · ${m.role}`,
          value: `@${m.displayName}`,
        }));
      return [...groups, ...users].slice(0, 7);
    }
    if (autocompleteType === "#") {
      const q = autocompleteFilter.toLowerCase();
      return QUICK_CHANNELS_AND_FOLDERS.filter(
        (c) => c.tag.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      )
        .map((c) => ({
          label: c.tag,
          subtitle: `${c.type === "drive" ? "Carpeta Drive" : "Canal"} · ${c.desc}`,
          value: c.tag,
        }))
        .slice(0, 7);
    }
    if (autocompleteType === "/") {
      const q = autocompleteFilter.toLowerCase();
      return SLASH_COMMANDS.filter(
        (s) => s.cmd.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
      )
        .map((s) => ({
          label: s.cmd,
          subtitle: s.desc,
          value: s.cmd,
        }))
        .slice(0, 6);
    }
    return [];
  })();

  useEffect(() => {
    setSelectedIndex(0);
  }, [autocompleteFilter, autocompleteType]);

  function handleTextChange(val: string) {
    setText(val);

    const cursorPos = textareaRef.current?.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Detect @ mention trigger
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (atMatch) {
      setAutocompleteType("@");
      setAutocompleteFilter(atMatch[1]);
      return;
    }

    // Detect # channel / folder trigger
    const hashMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);
    if (hashMatch) {
      setAutocompleteType("#");
      setAutocompleteFilter(hashMatch[1]);
      return;
    }

    // Detect / slash command trigger at beginning of line
    const slashMatch = textBeforeCursor.match(/^\/([a-zA-Z0-9_]*)$/);
    if (slashMatch) {
      setAutocompleteType("/");
      setAutocompleteFilter(slashMatch[1]);
      return;
    }

    setAutocompleteType(null);
  }

  function applySuggestion(itemValue: string) {
    sounds.playPop();
    const cursorPos = textareaRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);

    let replacedBefore = "";
    if (autocompleteType === "@") {
      replacedBefore = textBeforeCursor.replace(/@[a-zA-Z0-9_]*$/, `${itemValue} `);
    } else if (autocompleteType === "#") {
      replacedBefore = textBeforeCursor.replace(/#[a-zA-Z0-9_]*$/, `${itemValue} `);
    } else if (autocompleteType === "/") {
      replacedBefore = `${itemValue} `;
    }

    const nextText = replacedBefore + textAfterCursor;
    setText(nextText);
    setAutocompleteType(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = replacedBefore.length;
        textareaRef.current.selectionEnd = replacedBefore.length;
      }
    }, 10);
  }

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

  function insertFormatting(prefix: string, suffix: string = "") {
    sounds.playPop();
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end) || "texto";
    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.slice(0, start) + replacement + text.slice(end);

    setText(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + prefix.length;
      el.selectionEnd = start + prefix.length + selected.length;
    }, 10);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = text.trim();
    if ((!raw && !attachment) || pending) return;

    // Handle Slash Commands Execution
    if (raw.startsWith("/")) {
      const parts = raw.split(" ");
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(" ");

      if (cmd === "/status") {
        if (!args) {
          toast.info("Uso: /status [tu nuevo estado]");
          return;
        }
        sounds.playPop();
        const fd = new FormData();
        fd.set("status", args);
        await updateFullProfileAction(fd);
        sounds.playSuccess();
        toast.success(`Estado actualizado a: "${args}"`);
        setText("");
        return;
      }

      if (cmd === "/clear") {
        sounds.playPop();
        setText("");
        toast.info("Vista de chat local limpiada.");
        return;
      }

      if (cmd === "/roll") {
        const max = parseInt(args) || 100;
        const result = Math.floor(Math.random() * max) + 1;
        sounds.playMessage();
        const fd = new FormData();
        fd.set("channelId", channelId);
        fd.set("content", `🎲 **Tirada de dados**: ha obtenido **${result}** (de 1 a ${max})`);
        startTransition(async () => {
          await sendMessage(fd);
          setText("");
          router.refresh();
        });
        return;
      }

      if (cmd === "/tps" || cmd === "/server") {
        sounds.playMessage();
        const fd = new FormData();
        fd.set("channelId", channelId);
        fd.set(
          "content",
          `⚡ **Estado de EnigmaCraft Network**:\n🟢 TPS: **19.98** (Estable)\n🧠 RAM: **14.2 GB / 32 GB**\n🌐 Jugadores en línea: **142** / 250\n📡 Ping Staff Proxy: **12ms**`
        );
        startTransition(async () => {
          await sendMessage(fd);
          setText("");
          router.refresh();
        });
        return;
      }

      if (cmd === "/help") {
        sounds.playMessage();
        const fd = new FormData();
        fd.set("channelId", channelId);
        fd.set(
          "content",
          `📖 **Guía de Comandos y Formatos de EnigmaCraft**:\n- **Comandos**: \`/status\`, \`/tps\`, \`/roll\`, \`/clear\`\n- **Menciones**: \`@staff\`, \`@todos\`, \`@usuario\`\n- **Enlaces Directos**: \`#canal\`, \`#plugins\`, \`#schematics\`\n- **Colores Minecraft**: \`&aVerde\`, \`&cRojo\`, \`&bAqua\`, \`&eAmarillo\`, \`&6Dorado\`\n- **Formatos**: \`**negrita**\`, \`*cursiva*\`, \`==resaltado==\`, \`\`\`código\`\`\``
        );
        startTransition(async () => {
          await sendMessage(fd);
          setText("");
          router.refresh();
        });
        return;
      }
    }

    sounds.playMessage();

    let fullContent = raw;
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
      setAutocompleteType(null);
      router.refresh();
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative border-t border-white/[0.08] p-4 bg-[#080b12]/80 backdrop-blur-xl space-y-2 select-none"
    >
      <input type="hidden" name="channelId" value={channelId} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.schem,.yml,.yaml,.json,.txt,.jar,.zip"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Autocomplete Suggestions Overlay */}
      {autocompleteType && suggestions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 max-w-lg rounded-2xl border border-white/[0.15] bg-[#0c101a]/95 backdrop-blur-2xl shadow-2xl p-2 z-40 animate-fadeIn space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06] flex items-center justify-between">
            <span>
              {autocompleteType === "@"
                ? "Mencionar Miembro o Grupo"
                : autocompleteType === "#"
                ? "Vincular Canal o Directorio"
                : "Comandos de Staff"}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Tab o Enter para elegir</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {suggestions.map((item, idx) => (
              <button
                key={item.label}
                type="button"
                onClick={() => applySuggestion(item.value)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                  selectedIndex === idx
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/[0.05]"
                }`}
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{item.label}</span>
                  </div>
                  {item.subtitle && (
                    <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">↵</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formatting & Color Quick Toolbar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1">
          {/* Format pills */}
          <button
            type="button"
            onClick={() => insertFormatting("**", "**")}
            className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/[0.08]"
            title="Negrita (**texto**)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("*", "*")}
            className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] italic font-serif text-slate-300 hover:text-white hover:bg-white/[0.08]"
            title="Cursiva (*texto*)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("==", "==")}
            className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-semibold text-yellow-300 hover:bg-white/[0.08]"
            title="Resaltado (==texto==)"
          >
            Resaltar
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("`", "`")}
            className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-cyan-300 hover:bg-white/[0.08]"
            title="Código (`código`)"
          >
            &lt;/&gt;
          </button>

          {/* Minecraft Colors */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/[0.08]">
            <button
              type="button"
              onClick={() => insertFormatting("&a", "&r")}
              className="h-5 w-5 rounded-md bg-emerald-500/30 border border-emerald-400/50 text-[10px] font-bold text-emerald-300 flex items-center justify-center hover:scale-110"
              title="Minecraft Verde (&a)"
            >
              &a
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("&c", "&r")}
              className="h-5 w-5 rounded-md bg-rose-500/30 border border-rose-400/50 text-[10px] font-bold text-rose-300 flex items-center justify-center hover:scale-110"
              title="Minecraft Rojo (&c)"
            >
              &c
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("&b", "&r")}
              className="h-5 w-5 rounded-md bg-cyan-500/30 border border-cyan-400/50 text-[10px] font-bold text-cyan-300 flex items-center justify-center hover:scale-110"
              title="Minecraft Aqua (&b)"
            >
              &b
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("&6", "&r")}
              className="h-5 w-5 rounded-md bg-amber-500/30 border border-amber-400/50 text-[10px] font-bold text-amber-300 flex items-center justify-center hover:scale-110"
              title="Minecraft Dorado (&6)"
            >
              &6
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 hidden sm:block">
          Usa <strong className="text-slate-400">@</strong> para mencionar, <strong className="text-slate-400">#</strong> para carpetas o <strong className="text-slate-400">/</strong> para comandos
        </div>
      </div>

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
          ref={textareaRef}
          name="content"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (autocompleteType && suggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                return;
              }
              if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
                e.preventDefault();
                applySuggestion(suggestions[selectedIndex].value);
                return;
              }
              if (e.key === "Escape") {
                setAutocompleteType(null);
                return;
              }
            }

            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          placeholder="Escribe un mensaje, usa @ para mencionar, # para carpetas o / para comandos..."
          rows={1}
          className="input max-h-36 min-h-[44px] resize-none py-2.5 px-4 text-sm flex-1 font-sans select-text"
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
