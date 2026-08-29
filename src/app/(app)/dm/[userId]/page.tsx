import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { DmThread } from "@/components/dm-thread";
import { statusOf } from "@/lib/role-meta";
import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DmThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getCurrentUserOrThrow();
  const [partner, messages] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, recipientId: userId },
          { senderId: userId, recipientId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: { sender: true },
      take: 200,
    }),
  ]);
  if (!partner) notFound();

  const st = statusOf(partner);
  let notice: { text: string; tone: "away" | "vacation" | "offline" } | null =
    null;
  if (st) {
    if (st.key === "AWAY") {
      notice = {
        text: `${partner.displayName} está ausente; puede tardar en responder.`,
        tone: "away",
      };
    } else if (st.key === "VACATION") {
      notice = {
        text: `${partner.displayName} está de vacaciones.`,
        tone: "vacation",
      };
    }
  } else {
    notice = {
      text: `${partner.displayName} no está conectado ahora mismo.`,
      tone: "offline",
    };
  }

  await prisma.directMessage.updateMany({
    where: { senderId: userId, recipientId: user.id, read: false },
    data: { read: true },
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <Link href="/dm" className="text-white/40 hover:text-white">
          <IconArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <span className="font-semibold text-white">{partner.displayName}</span>
          <span className="ml-2 text-xs text-white/40">@{partner.username}</span>
        </div>
      </div>

      <DmThread
        partnerId={partner.id}
        partnerName={partner.displayName}
        notice={notice}
        messages={messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          fromMe: m.senderId === user.id,
          author: {
            displayName: m.sender.displayName,
            avatarColor: m.sender.avatarColor,
            role: m.sender.role,
          },
        }))}
      />
    </div>
  );
}