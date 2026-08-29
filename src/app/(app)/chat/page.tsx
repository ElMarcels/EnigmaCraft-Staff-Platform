import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const firstChannel = await prisma.channel.findFirst({
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
  });
  if (firstChannel) redirect(`/chat/${firstChannel.id}`);
  return (
    <div className="flex h-full items-center justify-center text-white/40">
      <p>Selecciona un canal de la izquierda para empezar.</p>
    </div>
  );
}
