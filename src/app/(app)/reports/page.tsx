import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TicketsView, TicketDTO } from "@/components/tickets-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let tickets: TicketDTO[] = [];

  try {
    const dbTickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarColor: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            avatarColor: true,
          },
        },
      },
      take: 100,
    });

    tickets = dbTickets.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      status: t.status,
      priority: t.priority,
      targetPlayer: t.targetPlayer,
      proofUrl: t.proofUrl,
      resolution: t.resolution,
      createdAt: t.createdAt.toISOString(),
      author: {
        id: t.author.id,
        displayName: t.author.displayName,
        avatarColor: t.author.avatarColor,
        role: t.author.role,
      },
      assignedTo: t.assignedTo
        ? {
            id: t.assignedTo.id,
            displayName: t.assignedTo.displayName,
            avatarColor: t.assignedTo.avatarColor,
          }
        : null,
    }));
  } catch (err: unknown) {
    console.error("Error loading tickets from database:", err);
    // If table does not exist yet before production migration, provide starter clean structure
    tickets = [];
  }

  return (
    <TicketsView
      tickets={tickets}
      currentUserId={user.id}
      userRole={user.role}
    />
  );
}
