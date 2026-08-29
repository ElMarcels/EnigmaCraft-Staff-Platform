import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MessageList } from "@/components/message-list";
import { MessageComposer } from "@/components/message-composer";

export const dynamic = "force-dynamic";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { category: true },
  });
  if (!channel) notFound();

  const [messages, user] = await Promise.all([
    prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: "asc" },
      include: { author: true, reactions: { include: { user: true } } },
      take: 200,
    }),
    getCurrentUser(),
  ]);

  const canDelete = !!user && ["FOUNDER", "ADMIN"].includes(user.role);

  const reactionsById = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return [];
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
      <div className="border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2 text-white">
          <span className="font-semibold">#{channel.name}</span>
          {channel.type === "VOICE" ? (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white/50">
              Voz
            </span>
          ) : null}
        </div>
        {channel.description ? (
          <p className="mt-0.5 text-xs text-white/40">{channel.description}</p>
        ) : null}
        <span className="text-[11px] text-white/30">
          {channel.category.name} ·{' '}
          {user
            ? `Tú eres ${user.displayName}`
            : ""}
        </span>
      </div>

      <MessageList
        messages={messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          edited: m.edited,
          author: {
            id: m.author.id,
            displayName: m.author.displayName,
            avatarColor: m.author.avatarColor,
            role: m.author.role,
          },
          canDelete:
            canDelete || (!!user && m.authorId === user.id),
          reactions: reactionsById(m.id),
        }))}
      />

      {channel.type === "VOICE" ? null : <MessageComposer channelId={channel.id} />}
    </div>
  );
}
