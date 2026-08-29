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
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-[#0d1017]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Canales
        </span>
        {canManage ? (
          <button
            onClick={() => setAddingCategory((v) => !v)}
            className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
            title="Nueva categoría"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {addingCategory ? (
        <form action={createCategory} className="border-b border-white/10 p-3">
          <input name="name" placeholder="Nombre de la categoría" className="input" required />
          <button type="submit" className="btn-primary mt-2 w-full justify-center">
            Crear categoría
          </button>
        </form>
      ) : null}

      <div className="flex-1 overflow-y-auto py-2">
        {categories.length === 0 ? (
          <p className="px-4 py-3 text-sm text-white/30">
            No hay categorías todavía.
          </p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="mb-1">
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
                  {cat.name}
                </span>
                {canManage ? (
                  <button
                    onClick={() => setAddingTo(addingTo === cat.id ? null : cat.id)}
                    className="rounded p-0.5 text-white/40 hover:text-white"
                    title="Nuevo canal"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {addingTo === cat.id ? (
                <form action={createChannel} className="mx-2 mb-1 rounded-lg border border-white/10 bg-white/5 p-2">
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <input name="name" placeholder="Nombre del canal" className="input" required />
                  <select name="type" className="input mt-1">
                    <option value="TEXT">Texto</option>
                    <option value="VOICE">Voz</option>
                  </select>
                  <input name="description" placeholder="Descripción (opcional)" className="input mt-1" />
                  <button type="submit" className="btn-primary mt-2 w-full justify-center">
                    Crear canal
                  </button>
                </form>
              ) : null}

              {cat.channels.map((ch) => {
                const active =
                  pathname === `/chat/${ch.id}`;
                return (
                  <div
                    key={ch.id}
                    className={`group flex items-center rounded-md pr-1.5 transition-colors ${
                      active ? "bg-indigo-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    <Link
                      href={`/chat/${ch.id}`}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-4 py-1.5 text-sm transition-colors ${
                        active
                          ? "font-semibold text-indigo-200"
                          : "text-white/50 hover:text-white"
                      }`}
                      title={ch.description || undefined}
                    >
                      {ch.type === "VOICE" ? (
                        <IconVolume className="h-4 w-4 shrink-0" />
                      ) : (
                        <IconHash className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{ch.name}</span>
                    </Link>
                    {canManage ? (
                      <button
                        onClick={() => removeChannel(ch.id, ch.name)}
                        className="shrink-0 rounded p-1 text-white/30 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
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
