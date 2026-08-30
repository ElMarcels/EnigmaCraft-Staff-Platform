import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  try {
    const firstChannel = await prisma.channel.findFirst({
      orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
    });
    if (firstChannel) {
      redirect(`/chat/${firstChannel.id}`);
    }
  } catch {
    // Fallback to general channel
  }
  redirect("/chat/general");
}
