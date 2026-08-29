import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { storagePath, ensureDir } from "@/lib/storage";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const parentId = String(formData.get("parentId") || "") || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.fileNode.findUnique({ where: { id: parentId } });
    if (!parent || !parent.isFolder) {
      return NextResponse.json({ error: "Carpeta padre no válida" }, { status: 400 });
    }
  }

  const id = randomUUID();
  const storageKey = `${id}${path.extname(file.name)}`;
  const dir = storagePath("files");
  ensureDir(dir);

  const buffer = Buffer.from(await file.arrayBuffer());
  await import("node:fs/promises")
    .then((fs) => fs.writeFile(path.join(dir, storageKey), buffer));

  const node = await prisma.fileNode.create({
    data: {
      name: file.name,
      isFolder: false,
      size: file.size,
      mimeType: file.type || null,
      storageKey,
      parentId,
      ownerId: user.id,
    },
  });

  await audit({
    userId: user.id,
    action: "FILE_UPLOAD",
    targetType: "FileNode",
    targetId: node.id,
    details: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
  });

  return NextResponse.json({ ok: true, node });
}
