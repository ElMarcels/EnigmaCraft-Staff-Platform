import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ChatChannelView } from "@/components/chat-channel-view";
import { ChannelMemberDTO } from "@/components/channel-members-sidebar";

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

const DEMO_MEMBERS: ChannelMemberDTO[] = [
  { id: "1", displayName: "Marcel", username: "marcel", role: "FOUNDER", avatarColor: "#f43f5e", isOnline: true, statusText: "Desarrollando plataforma" },
  { id: "2", displayName: "AlexAdmin", username: "alex_sys", role: "ADMIN", avatarColor: "#e11d48", isOnline: true, statusText: "Monitoreando TPS" },
  { id: "3", displayName: "LucasMod", username: "lucas_guard", role: "MOD", avatarColor: "#06b6d4", isOnline: true, statusText: "Atendiendo tickets" },
  { id: "4", displayName: "ElenaBuilder", username: "elena_arch", role: "BUILDER", avatarColor: "#10b981", isOnline: true, statusText: "Construyendo lobby" },
  { id: "5", displayName: "SofiaStaff", username: "sofia_helper", role: "STAFF", avatarColor: "#a855f7", isOnline: false, statusText: "Desconectada" },
];

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
  let members: ChannelMemberDTO[] = DEMO_MEMBERS;

  try {
    const [dbChannel, dbUsers] = await Promise.all([
      prisma.channel.findUnique({
        where: { id: channelId },
        include: { category: true },
      }),
      prisma.user.findMany({
        where: { active: true },
        orderBy: [{ role: "asc" }, { username: "asc" }],
      }),
    ]);

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

    if (dbUsers && dbUsers.length > 0) {
      members = dbUsers.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        username: u.username,
        role: u.role,
        avatarColor: u.avatarColor,
        isOnline:
          (user && u.id === user.id) ||
          (u.lastSeenAt
            ? Date.now() - new Date(u.lastSeenAt).getTime() < 15 * 60 * 1000
            : false),
        statusText: u.status || (user && u.id === user.id ? "En línea ahora" : undefined),
      }));
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
      cur.users.push(r.user?.displayName || "Usuario");
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
    <ChatChannelView
      channel={{
        id: channel.id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        categoryName: channel.category?.name || "CANALES",
      }}
      messages={messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: typeof m.createdAt === "string" ? m.createdAt : m.createdAt.toISOString(),
        edited: m.edited || false,
        author: {
          id: m.author?.id || "1",
          displayName: m.author?.displayName || "Marcel",
          avatarColor: m.author?.avatarColor || "#f43f5e",
          role: m.author?.role || "FOUNDER",
          discord: m.author?.contactDiscord || null,
          lastSeenAt: m.author?.lastSeenAt ? (typeof m.author.lastSeenAt === "string" ? m.author.lastSeenAt : m.author.lastSeenAt.toISOString()) : null,
          status: m.author?.status || "En línea",
        },
        canDelete: canDelete || (!!user && m.authorId === user.id),
        reactions: reactionsById(m.id),
      }))}
      userDisplayName={user?.displayName || "Marcel"}
      currentUserId={user?.id}
      members={members}
    />
  );
}
