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
  { id: "1", displayName: "mortal_pirata107", username: "mortal_pirata107", role: "FOUNDER", avatarColor: "#f43f5e", isOnline: true, statusText: "Fundador de Red" },
  { id: "2", displayName: "ElMarcels", username: "elmarcels", role: "FOUNDER", avatarColor: "#e11d48", isOnline: true, statusText: "Director General" },
  { id: "3", displayName: "Ale256", username: "ale256", role: "FOUNDER", avatarColor: "#f59e0b", isOnline: true, statusText: "Desarrollo & Infraestructura" },
  { id: "4", displayName: "Mamut_Feliz", username: "mamut_feliz", role: "STAFF", avatarColor: "#06b6d4", isOnline: true, statusText: "Moderación de Servidores" },
  { id: "5", displayName: "CobaltJ", username: "cobaltj", role: "STAFF", avatarColor: "#10b981", isOnline: true, statusText: "Soporte al Jugador" },
];

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const user = await getCurrentUser();

  const isKnownVoice =
    channelId.toLowerCase().includes("voz") ||
    channelId.toLowerCase().includes("voice") ||
    channelId === "voz-guardia" ||
    channelId === "voz-reuniones" ||
    channelId === "voz-despacho";

  let channel: any = {
    id: channelId,
    name: channelId,
    type: isKnownVoice ? "VOICE" : "TEXT",
    description: isKnownVoice
      ? "Canal de voz del Staff con PiP flotante, avatares de Minecraft y chat integrado"
      : `Canal oficial de #${channelId}`,
    category: { name: isKnownVoice ? "🔊 SALAS DE VOZ (STAFF RTC)" : "COMUNICACIÓN STAFF" },
  };

  let messages: any[] = [];
  let members: ChannelMemberDTO[] = [];

  try {
    const [dbChannel, dbUsers] = await Promise.all([
      prisma.channel.findFirst({
        where: { OR: [{ id: channelId }, { name: channelId }] },
        include: { category: true },
      }),
      prisma.user.findMany({
        where: { active: true },
        orderBy: [{ role: "asc" }, { username: "asc" }],
      }),
    ]);

    if (dbChannel) {
      channel = {
        ...dbChannel,
        type: isKnownVoice ? "VOICE" : dbChannel.type,
      };
      const dbMessages = await prisma.message.findMany({
        where: { channelId: dbChannel.id },
        orderBy: { createdAt: "asc" },
        include: { author: true, reactions: { include: { user: true } } },
        take: 200,
      });
      messages = dbMessages;
    }

    if (messages.length === 0 && isKnownVoice) {
      messages = [
        {
          id: "vmsg-init",
          content: "🔊 Canal de voz activo. Usa los controles superiores para silenciar/activar micrófono, o cambia de página para ver la ventana flotante PiP.",
          createdAt: new Date().toISOString(),
          edited: false,
          author: {
            id: "sys",
            displayName: "Sistema EnigmaCraft",
            avatarColor: "#e11d48",
            role: "ADMIN",
          },
          reactions: [],
        },
      ];
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
      userRole={user?.role}
      members={members}
    />
  );
}
