import "server-only";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { putBlob, BLOB_PREFIX } from "@/lib/blob";

const AUTO_INTERVAL_MS = 1000 * 60 * 60 * 24;

export async function createBackup(opts: {
  creatorId?: string | null;
  type: "automatic" | "manual";
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `${opts.type === "automatic" ? "auto" : "backup"}-${timestamp}`;

  const [
    users,
    categories,
    channels,
    messages,
    announcements,
    announcementReads,
    notifications,
    fileNodes,
    directMessages,
    messageReactions,
    warnings,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.channelCategory.findMany(),
    prisma.channel.findMany(),
    prisma.message.findMany(),
    prisma.announcement.findMany(),
    prisma.announcementRead.findMany(),
    prisma.notification.findMany(),
    prisma.fileNode.findMany(),
    prisma.directMessage.findMany(),
    prisma.messageReaction.findMany(),
    prisma.warning.findMany(),
  ]);

  const snapshot = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      users,
      categories,
      channels,
      messages,
      announcements,
      announcementReads,
      notifications,
      fileNodes,
      directMessages,
      messageReactions,
      warnings,
    },
  };

  const json = JSON.stringify(snapshot, null, 2);
  const blob = await putBlob(`${BLOB_PREFIX}/backups/${name}.json`, json, {
    contentType: "application/json",
    access: "private",
  });

  const backup = await prisma.backup.create({
    data: {
      name,
      path: blob.url,
      size: Buffer.byteLength(json, "utf-8"),
      status: "completed",
      type: opts.type,
      createdById: opts.creatorId ?? null,
    },
  });

  await audit({
    userId: opts.creatorId ?? null,
    action: "BACKUP_CREATE",
    targetType: "Backup",
    targetId: backup.id,
    details: `${name} (${opts.type})`,
  });

  return backup;
}

export async function maybeRunAutomaticBackup() {
  if (process.env.NODE_ENV !== "production") return false;
  const last = await prisma.backup.findFirst({
    where: { type: "automatic" },
    orderBy: { createdAt: "desc" },
  });
  const stale =
    !last || Date.now() - last.createdAt.getTime() > AUTO_INTERVAL_MS;
  if (!stale) return false;
  await createBackup({ creatorId: null, type: "automatic" });
  return true;
}