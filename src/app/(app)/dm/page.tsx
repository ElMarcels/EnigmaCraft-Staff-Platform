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

export default async function DmIndexPage() {
  const user = await getCurrentUserOrThrow();

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

  const conversations = [...map.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  return (
    <div className="p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconMail className="h-7 w-7 text-indigo-300" />
          <div>
            <h1 className="text-2xl font-bold text-white">Mensajes directos</h1>
            <p className="text-sm text-white/40">
              Conversaciones privadas con el staff.
            </p>
          </div>
        </div>
        <NewDmSelect currentUserId={user.id} />
      </header>

      {conversations.length === 0 ? (
        <p className="card text-white/40">
          Aún no tienes mensajes directos. Inicia una conversación con el menú
          de arriba.
        </p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dm/${c.id}`}
              className="card flex items-center gap-3 transition-colors hover:bg-white/[0.06]"
            >
              <Avatar name={c.displayName} color={c.avatarColor} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{c.displayName}</span>
                  {c.unread > 0 ? (
                    <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-300">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-sm text-white/40">{c.lastContent}</div>
              </div>
              <span className="shrink-0 text-xs text-white/30">
                {c.lastAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <IconArrowRight className="h-4 w-4 shrink-0 text-white/30" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}