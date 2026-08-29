import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") || "")
    .trim()
    .slice(0, 60);
  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      users: [],
      channels: [],
      files: [],
      announcements: [],
    });
  }

  const now = new Date();
  const [users, channels, files, announcements] = await Promise.all([
    prisma.user.findMany({
      where: {
        active: true,
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        avatarColor: true,
      },
      orderBy: { displayName: "asc" },
      take: 6,
    }),
    prisma.channel.findMany({
      where: {
        OR: [
          { name: { contains: q.toLowerCase(), mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        category: { select: { name: true } },
      },
      orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
      take: 6,
    }),
    prisma.fileNode.findMany({
      where: {
        isFolder: false,
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        owner: { select: { displayName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.announcement.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          },
          {
            OR: [{ publishAt: null }, { publishAt: { lte: now } }],
          },
        ],
      },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return NextResponse.json({ query: q, users, channels, files, announcements });
}