"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function createCategory(formData: FormData) {
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
  await requireRole("FOUNDER", "ADMIN");
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
  await requireRole("FOUNDER", "ADMIN", "MOD");
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
  await requireRole("FOUNDER", "ADMIN");
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

  revalidatePath(`/chat/${channelId}`);
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
  await requireRole("FOUNDER", "ADMIN");
  const user = await getCurrentUserOrThrow();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const priority = String(formData.get("priority") || "normal");
  if (!title || !content) return;

  const announcement = await prisma.announcement.create({
    data: { title, content, priority, authorId: user.id },
  });

  const staff = await prisma.user.findMany({ where: { active: true } });
  for (const s of staff) {
    await prisma.notification.create({
      data: {
        userId: s.id,
        type: "ANNOUNCEMENT",
        title: "Nuevo anuncio",
        body: title,
      },
    });
  }

  await audit({
    userId: user.id,
    action: "ANNOUNCEMENT_CREATE",
    targetType: "Announcement",
    targetId: announcement.id,
    details: title,
  });
  revalidatePath("/announcements");
}

export async function deleteAnnouncement(announcementId: string) {
  await requireRole("FOUNDER", "ADMIN");
  await prisma.announcement.delete({ where: { id: announcementId } });
  await audit({
    userId: (await getCurrentUserOrThrow()).id,
    action: "ANNOUNCEMENT_DELETE",
    targetType: "Announcement",
    targetId: announcementId,
  });
  revalidatePath("/announcements");
}

export async function markNotificationsRead() {
  const user = await getCurrentUserOrThrow();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/");
}
