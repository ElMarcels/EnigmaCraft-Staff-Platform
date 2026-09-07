import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const envVars = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
    hasPostgresNonPooling: Boolean(process.env.POSTGRES_URL_NON_POOLING),
    nodeEnv: process.env.NODE_ENV,
  };

  let dbStatus = "unknown";
  let dbError = null;
  let userCount = -1;
  let hasMortalUser = false;

  try {
    userCount = await prisma.user.count();
    dbStatus = "connected";
    const mortal = await prisma.user.findUnique({
      where: { username: "mortal_pirata107" },
      select: { id: true, username: true, role: true, displayName: true },
    });
    hasMortalUser = Boolean(mortal);
  } catch (err: unknown) {
    dbStatus = "error";
    dbError = (err as Error)?.message || String(err);
  }

  return NextResponse.json({
    ok: dbStatus === "connected",
    envVars,
    dbStatus,
    dbError,
    userCount,
    hasMortalUser,
    timestamp: new Date().toISOString(),
  });
}
