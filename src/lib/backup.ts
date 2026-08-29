import "server-only";
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { STORAGE_DIR } from "@/lib/storage";

const BACKUPS_DIR = path.join(process.cwd(), "backups");
const AUTO_INTERVAL_MS = 1000 * 60 * 60 * 24;

function sumSize(p: string): number {
  const st = statSync(p, { throwIfNoEntry: false });
  if (!st) return 0;
  if (st.isFile()) return st.size;
  let s = 0;
  for (const e of readdirSync(p)) s += sumSize(path.join(p, e));
  return s;
}

export async function createBackup(opts: {
  creatorId?: string | null;
  type: "automatic" | "manual";
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `${opts.type === "automatic" ? "auto" : "backup"}-${timestamp}`;
  const dir = path.join(BACKUPS_DIR, name);
  mkdirSync(dir, { recursive: true });

  let totalSize = 0;

  if (existsSync(STORAGE_DIR)) {
    for (const entry of readdirSync(STORAGE_DIR)) {
      const src = path.join(STORAGE_DIR, entry);
      if (!existsSync(src)) continue;
      const dest = path.join(dir, "files-" + entry);
      cpSync(src, dest, { recursive: true });
      totalSize += sumSize(dest);
    }
  }

  const dbPath = path.join(process.cwd(), "dev.db");
  if (existsSync(dbPath)) {
    const dest = path.join(dir, "db-" + path.basename(dbPath));
    cpSync(dbPath, dest);
    totalSize += sumSize(dest);
  }

  const backup = await prisma.backup.create({
    data: {
      name,
      path: dir,
      size: totalSize,
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
