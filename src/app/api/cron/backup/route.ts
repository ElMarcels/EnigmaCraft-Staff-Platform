import { NextRequest, NextResponse } from "next/server";
import { createBackup } from "@/lib/backup";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await createBackup({ creatorId: null, type: "automatic" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cron backup falló", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}