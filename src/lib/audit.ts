import "server-only";
import { prisma } from "@/lib/db";

export async function audit({
  userId,
  action,
  targetType,
  targetId,
  details,
}: {
  userId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, targetType, targetId, details },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
