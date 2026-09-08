import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Fetch latest 40 messages across all channels
    const recentMessages = await prisma.message.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
            categoryId: true,
          },
        },
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            role: true,
            avatarColor: true,
          },
        },
      },
    });

    const channels = await prisma.channel.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        categoryId: true,
      },
    });

    // Group latest message per channel
    const channelActivity: Record<
      string,
      {
        channelName: string;
        channelType: string;
        latestMessage: {
          id: string;
          content: string;
          createdAt: string;
          authorId: string;
          authorName: string;
          authorRole: string;
          authorAvatar?: string | null;
        } | null;
      }
    > = {};

    for (const ch of channels) {
      channelActivity[ch.id] = { channelName: ch.name, channelType: ch.type, latestMessage: null };
    }

    for (const msg of recentMessages) {
      const chId = msg.channelId;
      if (!channelActivity[chId]) {
        channelActivity[chId] = { channelName: msg.channel.name, channelType: msg.channel.type, latestMessage: null };
      }
      if (!channelActivity[chId].latestMessage) {
        channelActivity[chId].latestMessage = {
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          authorId: msg.author.id,
          authorName: msg.author.displayName,
          authorRole: msg.author.role,
          authorAvatar: msg.author.avatarColor,
        };
      }
    }

    return NextResponse.json({
      channels: channelActivity,
      messages: recentMessages.map((m) => ({
        id: m.id,
        channelId: m.channelId,
        channelName: m.channel.name,
        channelType: m.channel.type,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        author: {
          id: m.author.id,
          displayName: m.author.displayName,
          username: m.author.username,
          role: m.author.role,
          avatarColor: m.author.avatarColor,
        },
      })),
    });
  } catch (err) {
    console.error("Error fetching chat activity:", err);
    return NextResponse.json({ channels: {}, messages: [] }, { status: 500 });
  }
}
