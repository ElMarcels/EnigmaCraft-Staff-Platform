import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

function resolveSqlitePath(url: string): string {
  const cleaned = url.replace(/^file:/, "");
  if (cleaned === ":memory:") return cleaned;
  if (path.isAbsolute(cleaned)) return cleaned;
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), cleaned);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(process.env.DATABASE_URL || "file:./dev.db"),
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
