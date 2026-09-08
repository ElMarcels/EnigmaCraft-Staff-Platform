import { NextRequest, NextResponse } from "next/server";
import {
  registerVoiceParticipant,
  removeVoiceParticipant,
  getChannelVoicePresence,
  getAllVoicePresence,
} from "@/lib/voice-presence";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (channelId) {
      const participants = getChannelVoicePresence(channelId);
      return NextResponse.json({ participants });
    }

    const presence = getAllVoicePresence();
    return NextResponse.json({ presence });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, userId, displayName, role, avatarColor, isMuted, isDeafened, isSpeaking } = body;

    if (!channelId || !userId || !displayName) {
      return NextResponse.json({ error: "Faltan parámetros de voz requeridos" }, { status: 400 });
    }

    const participants = registerVoiceParticipant(channelId, {
      userId: String(userId),
      displayName: String(displayName),
      role: String(role || "STAFF"),
      avatarColor: avatarColor || "#f43f5e",
      isMuted: Boolean(isMuted),
      isDeafened: Boolean(isDeafened),
      isSpeaking: Boolean(isSpeaking),
    });

    return NextResponse.json({ success: true, participants });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let channelId = searchParams.get("channelId");
    let userId = searchParams.get("userId");

    if (!channelId || !userId) {
      try {
        const body = await req.json();
        channelId = channelId || body.channelId;
        userId = userId || body.userId;
      } catch {
        // query params only
      }
    }

    if (channelId && userId) {
      removeVoiceParticipant(channelId, userId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
