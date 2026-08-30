import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MessageList } from "@/components/message-list";
import { MessageComposer } from "@/components/message-composer";

export const dynamic = "force-dynamic";

const DEMO_CHANNEL_MESSAGES: Record<string, any[]> = {
  general: [
    {
      id: "msg-1",
      content: "Bienvenidos al nuevo chat del staff de @EnigmaCraft. Interfaz rediseñada en Liquid Glass.",
      createdAt: new Date("2026-08-30T10:00:00Z"),
      edited: false,
      author: { id: "1", displayName: "Marcel", avatarColor: "#f43f5e", role: "FOUNDER", contactDiscord: "marcel_01", lastSeenAt: new Date(), status: "En línea" },
      authorId: "1",
      reactions: [],
    },
    {
      id: "msg-2",
      content: "He revisado la configuración de permisos de LuckPerms y todo está sincronizado correctamente con la base de datos.",
      createdAt: new Date("2026-08-30T10:15:00Z"),
      edited: false,
      author: { id: "2", displayName: "AlexAdmin", avatarColor: "#e11d48", role: "ADMIN", contactDiscord: "alex_dev", lastSeenAt: new Date(), status: "En línea" },
      authorId: "2",
      reactions: [],
    },
  ],
};

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const user = await getCurrentUser();

  let channel: any = {
    id: channelId,
    name: channelId,
    type: "TEXT",
    description: `Canal oficial de #${channelId}`,
    category: { name: "COMUNICACIÓN STAFF" },
  };

  let messages: any[] = DEMO_CHANNEL_MESSAGES[channelId] || DEMO_CHANNEL_MESSAGES.general;

  try {
    const dbChannel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { category: true },
    });
    if (dbChannel) {
      channel = dbChannel;
      const dbMessages = await prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: "asc" },
        include: { author: true, reactions: { include: { user: true } } },
        take: 200,
      });
      if (dbMessages.length > 0) {
        messages = dbMessages;
      }
    }
  } catch {
    // Graceful fallback
  }

  const canDelete = !!user && ["FOUNDER", "ADMIN"].includes(user.role);

  const reactionsById = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.reactions) return [];
    const grouped = new Map<string, { count: number; mine: boolean; users: string[] }>();
    for (const r of msg.reactions) {
      const cur = grouped.get(r.emoji) || { count: 0, mine: false, users: [] };
      cur.count += 1;
      cur.users.push(r.user.displayName);
      if (user && r.userId === user.id) cur.mine = true;
      grouped.set(r.emoji, cur);
    }
    return [...grouped.entries()].map(([emoji, v]) => ({
      emoji,
      count: v.count,
      mine: v.mine,
      users: v.users.slice(0, 8),
    }));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-3 bg-white/[0.01]">
        <div className="flex items-center gap-2 text-white">
          <span className="font-semibold text-base">#{channel.name}</span>
          {channel.type === "VOICE" ? (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white/50">
              Voz
            </span>
          ) : null}
        </div>
        {channel.description ? (
          <p className="mt-0.5 text-xs text-slate-400">{channel.description}</p>
        ) : null}
        <span className="text-[11px] text-slate-500">
          {channel.category.name} · {user ? `Conectado como ${user.displayName}` : ""}
        </span>
      </div>

      <MessageList
        messages={messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: typeof m.createdAt === "string" ? m.createdAt : m.createdAt.toISOString(),
          edited: m.edited || false,
          author: {
            id: m.author.id,
            displayName: m.author.displayName,
            avatarColor: m.author.avatarColor,
            role: m.author.role,
            discord: m.author.contactDiscord,
            lastSeenAt: m.author.lastSeenAt ? (typeof m.author.lastSeenAt === "string" ? m.author.lastSeenAt : m.author.lastSeenAt.toISOString()) : null,
            status: m.author.status,
          },
          canDelete: canDelete || (!!user && m.authorId === user.id),
          reactions: reactionsById(m.id),
        }))}
      />

      {channel.type === "VOICE" ? null : <MessageComposer channelId={channel.id} />}
    </div>
  );
}
