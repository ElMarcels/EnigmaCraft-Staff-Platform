import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { channelId } = await params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  try {
    const whereClause: any = { channelId };
    if (since) {
      whereClause.createdAt = { gt: new Date(since) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarColor: true,
            role: true,
            contactDiscord: true,
            lastSeenAt: true,
            status: true,
          },
        },
        reactions: {
          include: {
            user: { select: { displayName: true } },
          },
        },
      },
      take: 50,
    });

    const formatted = messages.map((m) => {
      const grouped = new Map<string, { count: number; mine: boolean; users: string[] }>();
      for (const r of m.reactions) {
        const cur = grouped.get(r.emoji) || { count: 0, mine: false, users: [] };
        cur.count += 1;
        cur.users.push(r.user?.displayName || "Usuario");
        if (r.userId === user.id) cur.mine = true;
        grouped.set(r.emoji, cur);
      }

      return {
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        edited: m.edited,
        author: {
          id: m.author.id,
          displayName: m.author.displayName,
          avatarColor: m.author.avatarColor,
          role: m.author.role,
          discord: m.author.contactDiscord,
          lastSeenAt: m.author.lastSeenAt?.toISOString() || null,
          status: m.author.status,
        },
        canDelete: ["FOUNDER", "ADMIN"].includes(user.role) || m.authorId === user.id,
        reactions: [...grouped.entries()].map(([emoji, v]) => ({
          emoji,
          count: v.count,
          mine: v.mine,
          users: v.users.slice(0, 8),
        })),
      };
    });

    return NextResponse.json({ messages: formatted });
  } catch (err: unknown) {
    console.error("Error fetching live chat messages:", err);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}
