"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notifyMentions } from "@/lib/mentions";
import { Role } from "@prisma/client";

const ROLE_RANK: Record<Role, number> = {
  FOUNDER: 5,
  ADMIN: 4,
  MOD: 3,
  BUILDER: 2,
  STAFF: 1,
};

export async function createCategory(formData: FormData) {
  await requireRole("FOUNDER");
  const user = await getCurrentUserOrThrow();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const category = await prisma.channelCategory.create({
    data: {
      name,
      position: (await prisma.channelCategory.count()),
    },
  });

  await audit({
    userId: user.id,
    action: "CATEGORY_CREATE",
    targetType: "ChannelCategory",
    targetId: category.id,
    details: name,
  });
  revalidatePath("/chat");
}

export async function deleteCategory(categoryId: string) {
  await requireRole("FOUNDER");
  await prisma.channelCategory.delete({ where: { id: categoryId } });
  await audit({
    userId: (await getCurrentUserOrThrow()).id,
    action: "CATEGORY_DELETE",
    targetType: "ChannelCategory",
    targetId: categoryId,
  });
  revalidatePath("/chat");
}

export async function createChannel(formData: FormData) {
  await requireRole("FOUNDER");
  const user = await getCurrentUserOrThrow();
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const type = String(formData.get("type") || "TEXT") === "VOICE" ? "VOICE" : "TEXT";
  const description = String(formData.get("description") || "").trim();
  if (!name || !categoryId) return;

  const category = await prisma.channelCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) return;

  const channel = await prisma.channel.create({
    data: {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      description: description || null,
      type,
      categoryId,
      createdById: user.id,
      position: await prisma.channel.count({ where: { categoryId } }),
    },
  });

  await audit({
    userId: user.id,
    action: "CHANNEL_CREATE",
    targetType: "Channel",
    targetId: channel.id,
    details: `${category.name} / ${channel.name}`,
  });
  revalidatePath("/chat");
}

export async function deleteChannel(channelId: string) {
  await requireRole("FOUNDER");
  await prisma.channel.delete({ where: { id: channelId } });
  await audit({
    userId: (await getCurrentUserOrThrow()).id,
    action: "CHANNEL_DELETE",
    targetType: "Channel",
    targetId: channelId,
  });
  revalidatePath("/chat");
}

export async function sendMessage(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const channelId = String(formData.get("channelId") || "");
  const content = String(formData.get("content") || "").trim();
  if (!channelId || !content) return { error: "Mensaje vacío" };

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { error: "Canal no encontrado" };

  await prisma.message.create({
    data: { channelId, authorId: user.id, content },
  });

  await notifyMentions({
    content,
    authorId: user.id,
    fromName: user.displayName,
    location: `#${channel.name}`,
    href: `/chat/${channelId}`,
  });

  revalidatePath("/chat");
}

export async function toggleReaction(messageId: string, emoji: string) {
  const user = await getCurrentUserOrThrow();
  const safe = emoji.replace(/[^\p{L}\p{N}\p{Emoji}]/gu, "").slice(0, 8);
  if (!safe) return;

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: user.id,
        emoji: safe,
      },
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) return;
    await prisma.messageReaction.create({
      data: { messageId, userId: user.id, emoji: safe },
    });
  }
  revalidatePath("/chat");
}

export async function sendDm(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const to = String(formData.get("to") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!to || !content) return { error: "Mensaje vacío" };
  if (to === user.id) return { error: "No puedes enviarte un mensaje directo a ti mismo" };

  const recipient = await prisma.user.findUnique({ where: { id: to } });
  if (!recipient || !recipient.active) {
    return { error: "El usuario no existe o está inactivo" };
  }

  const senderRank = ROLE_RANK[user.role];
  const recipientRank = ROLE_RANK[recipient.role];
  if (recipientRank - senderRank >= 2) {
    const prior = await prisma.directMessage.findFirst({
      where: { senderId: recipient.id, recipientId: user.id },
    });
    if (!prior) {
      return {
        error: `${recipient.displayName} es de un rango superior al tuyo; solo puede iniciar la conversación un rango igual o superior.`,
      };
    }
  }

  await prisma.directMessage.create({
    data: { senderId: user.id, recipientId: recipient.id, content },
  });

  await notifyMentions({
    content,
    authorId: user.id,
    fromName: user.displayName,
    location: `tu mensaje directo`,
    href: `/dm/${user.id}`,
  });

  await audit({
    userId: user.id,
    action: "DM_SEND",
    targetType: "User",
    targetId: recipient.id,
    details: `${user.username} → ${recipient.username}`,
  });
  revalidatePath("/dm");
}

export async function deleteMessage(messageId: string) {
  const user = await getCurrentUserOrThrow();
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return;
  if (message.authorId !== user.id && !["FOUNDER", "ADMIN"].includes(user.role)) {
    return;
  }
  await prisma.message.delete({ where: { id: messageId } });
  await audit({
    userId: user.id,
    action: "MESSAGE_DELETE",
    targetType: "Message",
    targetId: messageId,
  });
  revalidatePath(`/chat/${message.channelId}`);
}

export async function createAnnouncement(formData: FormData) {
  try {
    await requireRole("FOUNDER", "ADMIN");
    const user = await getCurrentUserOrThrow();
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const priority = String(formData.get("priority") || "normal");
    const publishAtRaw = String(formData.get("publishAt") || "");
    const requiresReadVal = formData.get("requiresRead");
    const requiresRead = requiresReadVal === "true" || requiresReadVal === "on" || requiresReadVal === "1";

    if (!title || !content) {
      return { error: "El título y el contenido son obligatorios." };
    }

    const publishAt = publishAtRaw ? new Date(publishAtRaw) : null;
    const publishesNow = !publishAt || publishAt.getTime() <= Date.now();

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        authorId: user.id,
        publishAt,
        requiresRead,
      },
    });

    if (publishesNow) {
      const staff = await prisma.user.findMany({ where: { active: true } });
      for (const s of staff) {
        await prisma.notification.create({
          data: {
            userId: s.id,
            type: "ANNOUNCEMENT",
            title: "Nuevo anuncio",
            body: title,
            href: "/announcements",
          },
        });
      }
    }

    await audit({
      userId: user.id,
      action: "ANNOUNCEMENT_CREATE",
      targetType: "Announcement",
      targetId: announcement.id,
      details: `${title}${publishAt ? ` (programado ${publishAt.toISOString()})` : ""}`,
    });

    revalidatePath("/announcements");
    return { success: true, id: announcement.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al publicar el comunicado." };
  }
}

export async function confirmAnnouncementRead(announcementId: string) {
  try {
    const user = await getCurrentUserOrThrow();
    const existing = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!existing) {
      revalidatePath("/announcements");
      return { success: true };
    }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: { announcementId, userId: user.id },
      },
      create: { announcementId, userId: user.id },
      update: {},
    });
    revalidatePath("/announcements");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al confirmar la lectura." };
  }
}

export async function deleteAnnouncement(announcementId: string) {
  try {
    await requireRole("FOUNDER", "ADMIN");
    const user = await getCurrentUserOrThrow();
    const existing = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!existing) {
      revalidatePath("/announcements");
      return { success: true };
    }

    await prisma.announcementRead.deleteMany({
      where: { announcementId },
    });
    await prisma.announcement.delete({ where: { id: announcementId } });

    await audit({
      userId: user.id,
      action: "ANNOUNCEMENT_DELETE",
      targetType: "Announcement",
      targetId: announcementId,
    });
    revalidatePath("/announcements");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al eliminar el comunicado." };
  }
}

export async function markNotificationsRead() {
  const user = await getCurrentUserOrThrow();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/");
}
