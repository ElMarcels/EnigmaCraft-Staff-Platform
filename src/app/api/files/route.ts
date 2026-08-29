import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { BLOB_PREFIX } from "@/lib/blob";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    size?: number;
    type?: string;
    parentId?: string;
  } | null;

  const name = String(body?.name || "").replace(/[\\/]/g, "").trim();
  const size = Number(body?.size) || 0;
  const parentId = String(body?.parentId || "") || null;

  if (!name) return NextResponse.json({ error: "Nombre no válido" }, { status: 400 });
  if (!(size > 0) || size > MAX_BYTES) {
    return NextResponse.json({ error: "Tamaño de archivo no válido" }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.fileNode.findUnique({ where: { id: parentId } });
    if (!parent || !parent.isFolder) {
      return NextResponse.json({ error: "Carpeta padre no válida" }, { status: 400 });
    }
  }

  const id = randomUUID();
  const pathname = `${BLOB_PREFIX}/${id}${path.extname(name).toLowerCase()}`;

  const { clientSigningToken, delegationToken } = await issueSignedToken({
    token: process.env.BLOB_READ_WRITE_TOKEN,
    pathname,
    operations: ["put"],
    validUntil: Date.now() + 1000 * 60 * 60,
  });

  const { presignedUrl } = await presignUrl(
    { clientSigningToken, delegationToken },
    {
      operation: "put",
      pathname,
      access: "public",
      allowOverwrite: false,
      addRandomSuffix: false,
      maximumSizeInBytes: MAX_BYTES,
    }
  );

  return NextResponse.json({ presignedUrl, pathname });
}