import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Avatar } from "@/components/role-badge";
import { NewDmSelect } from "@/components/new-dm-select";
import { IconMail, IconArrowRight } from "@/components/icons";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

type Partner = {
  id: string;
  displayName: string;
  avatarColor: string;
  role: Role;
  lastContent: string;
  lastAt: Date;
  unread: number;
};

const DEMO_PARTNERS: Partner[] = [
  {
    id: "dev-admin-02",
    displayName: "AlexAdmin",
    avatarColor: "#e11d48",
    role: "ADMIN",
    lastContent: "Ya revisé los logs de Paper. Todo listo para la apertura de la temporada.",
    lastAt: new Date(Date.now() - 1800000),
    unread: 1,
  },
  {
    id: "dev-builder-04",
    displayName: "ElenaBuilder",
    avatarColor: "#10b981",
    role: "BUILDER",
    lastContent: "He subido los esquemáticos del spawn principal.",
    lastAt: new Date(Date.now() - 7200000),
    unread: 0,
  },
];

export default async function DmIndexPage() {
  const user = await getCurrentUserOrThrow();

  let conversations: Partner[] = DEMO_PARTNERS;

  try {
    const [sent, received, unread] = await Promise.all([
      prisma.directMessage.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        include: { recipient: true },
        take: 300,
      }),
      prisma.directMessage.findMany({
        where: { recipientId: user.id },
        orderBy: { createdAt: "desc" },
        include: { sender: true },
        take: 300,
      }),
      prisma.directMessage.groupBy({
        by: ["senderId"],
        where: { recipientId: user.id, read: false },
        _count: true,
      }),
    ]);

    const unreadMap = new Map(unread.map((u) => [u.senderId, u._count]));
    const map = new Map<string, Partner>();

    for (const dm of sent) {
      const p = dm.recipient;
      if (!map.has(p.id)) {
        map.set(p.id, {
          id: p.id,
          displayName: p.displayName,
          avatarColor: p.avatarColor,
          role: p.role,
          lastContent: dm.content,
          lastAt: dm.createdAt,
          unread: 0,
        });
      }
    }
    for (const dm of received) {
      const p = dm.sender;
      const cur = map.get(p.id);
      if (!cur) {
        map.set(p.id, {
          id: p.id,
          displayName: p.displayName,
          avatarColor: p.avatarColor,
          role: p.role,
          lastContent: dm.content,
          lastAt: dm.createdAt,
          unread: unreadMap.get(p.id) || 0,
        });
      } else {
        cur.lastContent = dm.content;
        if (dm.createdAt > cur.lastAt) cur.lastAt = dm.createdAt;
        cur.unread = unreadMap.get(p.id) || 0;
      }
    }

    if (map.size > 0) {
      conversations = [...map.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    }
  } catch {
    // Graceful fallback
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-28">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <IconMail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Mensajes Directos</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              Conversaciones privadas y cifradas entre miembros del staff.
            </p>
          </div>
        </div>
        <NewDmSelect currentUserId={user.id} />
      </header>

      {conversations.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-400 text-sm">
          Aún no tienes mensajes directos. Inicia una conversación con el botón superior.
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dm/${c.id}`}
              className="glass-card-interactive p-4 flex items-center gap-4 transition-all"
            >
              <Avatar name={c.displayName} color={c.avatarColor} className="h-11 w-11 text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">{c.displayName}</span>
                  {c.unread > 0 ? (
                    <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {c.unread} nuevo
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-slate-300 font-normal">{c.lastContent}</div>
              </div>
              <span className="shrink-0 text-[11px] text-slate-500 font-medium">
                {c.lastAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <IconArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}