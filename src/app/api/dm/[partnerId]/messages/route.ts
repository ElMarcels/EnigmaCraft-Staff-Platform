import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { partnerId } = await params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  try {
    const whereClause: any = {
      OR: [
        { senderId: user.id, recipientId: partnerId },
        { senderId: partnerId, recipientId: user.id },
      ],
    };
    if (since) {
      whereClause.createdAt = { gt: new Date(since) };
    }

    const messages = await prisma.directMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarColor: true,
            role: true,
          },
        },
      },
      take: 50,
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      fromMe: m.senderId === user.id,
      author: {
        displayName: m.sender.displayName,
        avatarColor: m.sender.avatarColor,
        role: m.sender.role,
      },
    }));

    return NextResponse.json({ messages: formatted });
  } catch (err: unknown) {
    console.error("Error fetching live DM messages:", err);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}
