import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const INACTIVE_DAYS = 7;
const INACTIVE_MS = 1000 * 60 * 60 * 24 * INACTIVE_DAYS;
const DEDUP_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - INACTIVE_MS);
    const candidates = await prisma.user.findMany({
      where: {
        active: true,
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }],
      },
      select: { id: true, displayName: true },
    });

    const founders = await prisma.user.findMany({
      where: { active: true, role: "FOUNDER" },
      select: { id: true },
    });

    const dedupStart = new Date(Date.now() - DEDUP_WINDOW_MS);
    const rows = [] as Array<{
      userId: string;
      type: "SYSTEM";
      title: string;
      body: string;
      href: string;
    }>;

    for (const c of candidates) {
      const alreadyAlerted = await prisma.notification.findFirst({
        where: {
          userId: { in: founders.map((f) => f.id) },
          title: `Inactividad: ${c.displayName}`,
          createdAt: { gte: dedupStart },
        },
        select: { id: true },
      });
      if (alreadyAlerted) continue;
      for (const f of founders) {
        rows.push({
          userId: f.id,
          type: "SYSTEM",
          title: `Inactividad: ${c.displayName}`,
          body: `${c.displayName} lleva más de ${INACTIVE_DAYS} días sin entrar a la plataforma. Revisa su ficha.`,
          href: "/directory",
        });
      }
    }

    if (rows.length > 0) {
      await prisma.notification.createMany({ data: rows });
    }

    return NextResponse.json({ ok: true, alerted: rows.length });
  } catch (e) {
    console.error("Cron inactividad falló", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}