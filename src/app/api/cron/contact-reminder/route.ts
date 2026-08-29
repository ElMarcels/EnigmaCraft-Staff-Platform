import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        active: true,
        OR: [
          { contactUpdatedAt: null },
          { contactUpdatedAt: { lt: new Date(Date.now() - THIRTY_DAYS_MS) } },
        ],
      },
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "SYSTEM",
          title: "Revisa tu ficha de contacto",
          body: "Ya ha pasado un mes desde la última actualización. Entra en Contactos y confirma que tus datos siguen al día.",
          href: "/directory",
        })),
      });
    }

    return NextResponse.json({ ok: true, notified: users.length });
  } catch (e) {
    console.error("Cron contacto falló", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}