"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconChat, IconFile, IconMegaphone, IconUsers } from "@/components/icons";
import type { Role } from "@prisma/client";

type SearchResults = {
  users: {
    id: string;
    username: string;
    displayName: string;
    role: Role;
    avatarColor: string;
  }[];
  channels: { id: string; name: string; type: string; category: { name: string } }[];
  files: { id: string; name: string; owner: { displayName: string } | null }[];
  announcements: { id: string; title: string }[];
};

export function GlobalSearch({ userId }: { userId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults(null);
        setOpen(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as SearchResults;
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  function go(href: string) {
    setQ("");
    setOpen(false);
    router.push(href);
    router.refresh();
  }

  const total =
    results
      ? results.users.length +
        results.channels.length +
        results.files.length +
        results.announcements.length
      : 0;

  return (
    <div ref={wrapRef} className="relative px-3 pt-3">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <IconSearch className="h-4 w-4 shrink-0 text-white/30" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder="Buscar…"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      {open && results ? (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#12151f] shadow-2xl shadow-black/50">
          {total === 0 ? (
            <div className="px-4 py-3 text-sm text-white/40">
              Sin resultados para “{q.trim()}”
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto py-1">
              {renderSection(
                {
                  key: "users",
                  title: "Usuarios",
                  icon: IconUsers,
                  count: results.users.length,
                },
                results.users.map((u) => ({
                  id: u.id,
                  href: u.id === userId ? "/settings" : `/dm/${u.id}`,
                  title: u.displayName,
                  sub: `@${u.username}`,
                  color: u.avatarColor,
                })),
                go
              )}
              {renderSection(
                {
                  key: "channels",
                  title: "Canales",
                  icon: IconChat,
                  count: results.channels.length,
                },
                results.channels.map((c) => ({
                  id: c.id,
                  href: `/chat/${c.id}`,
                  title: `#${c.name}`,
                  sub: c.category?.name,
                })),
                go
              )}
              {renderSection(
                {
                  key: "files",
                  title: "Archivos",
                  icon: IconFile,
                  count: results.files.length,
                },
                results.files.map((f) => ({
                  id: f.id,
                  href: `/files`,
                  title: f.name,
                  sub: f.owner?.displayName,
                })),
                go
              )}
              {renderSection(
                {
                  key: "announcements",
                  title: "Anuncios",
                  icon: IconMegaphone,
                  count: results.announcements.length,
                },
                results.announcements.map((a) => ({
                  id: a.id,
                  href: `/announcements#${a.id}`,
                  title: a.title,
                })),
                go
              )}
            </div>
          )}
        </div>
      ) : null}

      {loading && q.trim().length >= 2 ? (
        <div className="pointer-events-none absolute right-5 top-4 h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/60" />
      ) : null}
    </div>
  );
}

function renderSection(
  section: { key: string; title: string; icon: (p: { className?: string }) => React.ReactNode; count: number },
  items: {
    id: string;
    href: string;
    title: string;
    sub?: string;
    color?: string;
  }[],
  go: (href: string) => void
) {
  if (items.length === 0) return null;
  const Icon = section.icon;
  return (
    <div key={section.key}>
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
        <Icon className="h-3.5 w-3.5" /> {section.title}
      </div>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => go(it.href)}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-indigo-500/10"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
              it.color ? "" : "bg-white/10 text-white/60"
            }`}
            style={it.color ? { backgroundColor: `${it.color}33`, color: it.color } : undefined}
          >
            {it.title[0]?.toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-white">{it.title}</span>
            {it.sub ? <span className="block truncate text-xs text-white/40">{it.sub}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}