import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteBlob, readBlobHead } from "@/lib/blob";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    pathname?: string;
    name?: string;
    size?: number;
    type?: string;
    parentId?: string;
  } | null;

  const pathname = String(body?.pathname || "");
  const name = String(body?.name || "").trim().slice(0, 120);
  const size = Number(body?.size) || 0;
  const type = typeof body?.type === "string" ? body.type : null;
  const parentId = String(body?.parentId || "") || null;

  if (!pathname || !name || !(size > 0)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const info = await readBlobHead(pathname);
  if (!info || info.size !== size) {
    return NextResponse.json(
      { error: "El archivo no se subió correctamente" },
      { status: 409 }
    );
  }

  if (parentId) {
    const parent = await prisma.fileNode.findUnique({ where: { id: parentId } });
    if (!parent || !parent.isFolder) {
      await deleteBlob(info.url);
      return NextResponse.json({ error: "Carpeta padre no válida" }, { status: 400 });
    }
  }

  const node = await prisma.fileNode.create({
    data: {
      name,
      isFolder: false,
      size,
      mimeType: type || null,
      storageKey: info.pathname,
      url: info.url,
      parentId,
      ownerId: user.id,
    },
  });

  await audit({
    userId: user.id,
    action: "FILE_UPLOAD",
    targetType: "FileNode",
    targetId: node.id,
    details: `${name} (${(size / 1024).toFixed(1)} KB)`,
  });

  return NextResponse.json({ ok: true, node });
}