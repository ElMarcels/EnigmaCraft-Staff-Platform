import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatSidebar } from "@/components/chat-sidebar";

export const dynamic = "force-dynamic";

const DEMO_CATEGORIES: any[] = [
  {
    id: "cat-staff-1",
    name: "COMUNICACIÓN GENERAL",
    position: 0,
    channels: [
      { id: "general", name: "general", type: "TEXT", position: 0, description: "Canal de texto principal del staff", categoryId: "cat-staff-1" },
      { id: "anuncios-staff", name: "anuncios-staff", type: "TEXT", position: 1, description: "Avisos urgentes del equipo", categoryId: "cat-staff-1" },
    ],
  },
  {
    id: "cat-staff-2",
    name: "DESARROLLO & BUILDS",
    position: 1,
    channels: [
      { id: "builds-proyectos", name: "builds-proyectos", type: "TEXT", position: 0, description: "Coordinación de mapas y construcción", categoryId: "cat-staff-2" },
      { id: "reportes-bugs", name: "reportes-bugs", type: "TEXT", position: 1, description: "Incidencias técnicas y bugs de plugins", categoryId: "cat-staff-2" },
    ],
  },
];

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  let categories: any[] = DEMO_CATEGORIES;

  try {
    const dbCats = await prisma.channelCategory.findMany({
      orderBy: { position: "asc" },
      include: {
        channels: { orderBy: { position: "asc" } },
      },
    });
    if (dbCats.length > 0) {
      categories = dbCats;
    }
  } catch {
    // Graceful fallback to demo categories
  }

  const canManage = !!user && user.role === "FOUNDER";

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden pb-20">
      <ChatSidebar categories={categories} canManage={canManage} />
      <div className="min-w-0 flex-1 h-full">{children}</div>
    </div>
  );
}
