import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatSidebar } from "@/components/chat-sidebar";

export const dynamic = "force-dynamic";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const categories = await prisma.channelCategory.findMany({
    orderBy: { position: "asc" },
    include: {
      channels: { orderBy: { position: "asc" } },
    },
  });

  const canManage = !!user && user.role === "FOUNDER";

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar categories={categories} canManage={canManage} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
