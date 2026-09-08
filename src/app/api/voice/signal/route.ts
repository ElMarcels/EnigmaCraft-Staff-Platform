import { NextRequest, NextResponse } from "next/server";
import { sendVoiceSignal, pollVoiceSignals } from "@/lib/voice-presence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const userId = searchParams.get("userId");
    const after = searchParams.get("after");

    if (!channelId || !userId) {
      return NextResponse.json({ error: "channelId y userId requeridos" }, { status: 400 });
    }

    const signals = pollVoiceSignals(
      channelId,
      userId,
      after ? parseInt(after, 10) : undefined
    );

    return NextResponse.json({ signals });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, fromUserId, fromDisplayName, toUserId, type, data } = body;

    if (!channelId || !fromUserId || !toUserId || !type || !data) {
      return NextResponse.json({ error: "Parámetros de señalización incompletos" }, { status: 400 });
    }

    sendVoiceSignal({
      channelId,
      fromUserId,
      fromDisplayName,
      toUserId,
      type,
      data,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
