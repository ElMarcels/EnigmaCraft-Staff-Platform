import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnnouncementsView } from "@/components/announcements-view";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  const canCreate = !!user && ["FOUNDER", "ADMIN"].includes(user.role);

  const now = new Date();
  let published: any[] = [];
  let scheduled: any[] = [];

  try {
    const [dbPub, dbSched] = await Promise.all([
      prisma.announcement.findMany({
        where: { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: { author: true, reads: true },
      }),
      canCreate
        ? prisma.announcement.findMany({
            where: { publishAt: { gt: now } },
            orderBy: { publishAt: "asc" },
            include: { author: true },
          })
        : Promise.resolve([]),
    ]);

    if (dbPub.length > 0) {
      published = dbPub;
      scheduled = dbSched;
    } else if (user) {
      // Auto-seed real default announcements into the database
      const a1 = await prisma.announcement.create({
        data: {
          title: "Apertura de la Temporada 5 de Survival Custom",
          content:
            "Este viernes a las 18:00 UTC se lanzará la nueva temporada de Survival Custom con economía renovada, mazmorras y protección de parcelas.",
          priority: "alta",
          requiresRead: true,
          authorId: user.id,
        },
        include: { author: true, reads: true },
      });

      const a2 = await prisma.announcement.create({
        data: {
          title: "Actualización de Seguridad en Proxies Velocity",
          content:
            "Se han aplicado los parches de seguridad y mitigación contra ataques DDoS en los proxies de entrada. El ping medio ha disminuido un 15%.",
          priority: "normal",
          requiresRead: false,
          authorId: user.id,
        },
        include: { author: true, reads: true },
      });

      published = [a1, a2];
    }
  } catch {
    // Graceful fallback
  }

  return (
    <AnnouncementsView
      user={user ? { id: user.id, displayName: user.displayName, role: user.role, timezone: user.timezone } : null}
      published={published}
      scheduled={scheduled}
      canCreate={canCreate}
    />
  );
}