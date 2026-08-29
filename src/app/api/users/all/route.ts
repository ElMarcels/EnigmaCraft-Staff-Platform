import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { active: true, NOT: { id: user.id } },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      avatarColor: true,
    },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json(users);
}