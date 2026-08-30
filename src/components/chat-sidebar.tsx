"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ChannelCategory, Channel } from "@prisma/client";
import {
  createCategory,
  createChannel,
  deleteChannel,
} from "@/actions/messaging";
import { IconPlus, IconHash, IconVolume, IconTrash } from "@/components/icons";

type CatWithChannels = ChannelCategory & { channels: Channel[] };

export function ChatSidebar({
  categories,
  canManage,
}: {
  categories: CatWithChannels[];
  canManage: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  async function removeChannel(id: string, name: string) {
    if (!confirm(`¿Eliminar el canal #${name}?`)) return;
    await deleteChannel(id);
    router.refresh();
  }

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#090c14]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Canales de Staff
        </span>
        {canManage ? (
          <button
            onClick={() => setAddingCategory((v) => !v)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Nueva categoría"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {addingCategory ? (
        <form action={createCategory} className="border-b border-white/[0.07] p-3 bg-white/[0.02]">
          <input name="name" placeholder="Nombre de la categoría" className="input text-xs py-1.5" required autoFocus />
          <div className="mt-2 flex gap-2">
            <button type="submit" className="btn-primary flex-1 py-1 text-xs justify-center">
              Crear
            </button>
            <button
              type="button"
              onClick={() => setAddingCategory(false)}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {categories.length === 0 ? (
          <p className="px-3 py-4 text-xs text-slate-400 text-center">
            No hay canales creados todavía.
          </p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {cat.name}
                </span>
                {canManage ? (
                  <button
                    onClick={() => setAddingTo(addingTo === cat.id ? null : cat.id)}
                    className="rounded p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Añadir canal a esta categoría"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {addingTo === cat.id ? (
                <form action={createChannel} className="mx-1 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 space-y-2">
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <input name="name" placeholder="nombre-del-canal" className="input text-xs py-1.5" required autoFocus />
                  <select name="type" className="input text-xs py-1.5">
                    <option value="TEXT">Canal de Texto</option>
                    <option value="VOICE">Canal de Voz</option>
                  </select>
                  <input name="description" placeholder="Descripción breve" className="input text-xs py-1.5" />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 py-1 text-xs justify-center">
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingTo(null)}
                      className="btn-secondary py-1 px-2.5 text-xs"
                    >
                      X
                    </button>
                  </div>
                </form>
              ) : null}

              {cat.channels.map((ch) => {
                const active = pathname === `/chat/${ch.id}`;
                return (
                  <div
                    key={ch.id}
                    className={`group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all select-none ${
                      active
                        ? "bg-rose-500/15 text-rose-200 border-l-2 border-rose-500 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                  >
                    <Link
                      href={`/chat/${ch.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2"
                      title={ch.description || undefined}
                    >
                      {ch.type === "VOICE" ? (
                        <IconVolume className={`h-4 w-4 shrink-0 ${active ? "text-rose-400" : "text-slate-400"}`} />
                      ) : (
                        <IconHash className={`h-4 w-4 shrink-0 ${active ? "text-rose-400" : "text-slate-400"}`} />
                      )}
                      <span className="truncate text-xs">{ch.name}</span>
                    </Link>
                    {canManage ? (
                      <button
                        onClick={() => removeChannel(ch.id, ch.name)}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer"
                        title={`Eliminar canal #${ch.name}`}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
