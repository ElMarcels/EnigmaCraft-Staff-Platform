"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";

export async function createTicket(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryRaw = String(formData.get("category") || "HACKS");
  const priorityRaw = String(formData.get("priority") || "MEDIUM");
  const targetPlayer = String(formData.get("targetPlayer") || "").trim() || null;
  const proofUrl = String(formData.get("proofUrl") || "").trim() || null;

  if (!title || !description) {
    return { error: "El título y la descripción son obligatorios." };
  }

  const category = (Object.values(TicketCategory).includes(categoryRaw as any)
    ? categoryRaw
    : "HACKS") as TicketCategory;

  const priority = (Object.values(TicketPriority).includes(priorityRaw as any)
    ? priorityRaw
    : "MEDIUM") as TicketPriority;

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      category,
      priority,
      targetPlayer,
      proofUrl,
      authorId: user.id,
    },
  });

  await audit({
    userId: user.id,
    action: "TICKET_CREATE",
    targetType: "Ticket",
    targetId: ticket.id,
    details: `${category} - ${title}`,
  });

  // Notify admins and mods about new ticket
  const managementStaff = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ["FOUNDER", "ADMIN", "MOD"] },
      id: { not: user.id },
    },
    select: { id: true },
  });

  for (const s of managementStaff) {
    await prisma.notification.create({
      data: {
        userId: s.id,
        type: "SYSTEM",
        title: `Nuevo reporte de staff: ${title}`,
        body: `Categoría: ${category} · Prioridad: ${priority}`,
        href: `/reports`,
      },
    }).catch(() => {});
  }

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true, ticketId: ticket.id };
}

export async function updateTicketStatus(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const ticketId = String(formData.get("ticketId") || "");
  const statusRaw = String(formData.get("status") || "IN_PROGRESS");
  const resolution = String(formData.get("resolution") || "").trim() || null;

  if (!ticketId) return { error: "Ticket ID no válido." };

  const status = (Object.values(TicketStatus).includes(statusRaw as any)
    ? statusRaw
    : "IN_PROGRESS") as TicketStatus;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket no encontrado." };

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      resolution: resolution || ticket.resolution,
    },
  });

  await audit({
    userId: user.id,
    action: "TICKET_STATUS_CHANGE",
    targetType: "Ticket",
    targetId: ticketId,
    details: `Estado cambiado a ${status}`,
  });

  revalidatePath("/reports");
  return { success: true };
}

export async function assignTicket(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const ticketId = String(formData.get("ticketId") || "");
  const assignedToId = String(formData.get("assignedToId") || "") || null;

  if (!ticketId) return { error: "Ticket ID no válido." };

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId: assignedToId || user.id,
      status: "IN_PROGRESS",
    },
  });

  await audit({
    userId: user.id,
    action: "TICKET_ASSIGN",
    targetType: "Ticket",
    targetId: ticketId,
    details: `Asignado a ${assignedToId || user.id}`,
  });

  revalidatePath("/reports");
  return { success: true };
}

export async function deleteTicket(ticketId: string) {
  const user = await requireRole("FOUNDER", "ADMIN");
  await prisma.ticket.delete({ where: { id: ticketId } });

  await audit({
    userId: user.id,
    action: "TICKET_DELETE",
    targetType: "Ticket",
    targetId: ticketId,
  });

  revalidatePath("/reports");
  return { success: true };
}
