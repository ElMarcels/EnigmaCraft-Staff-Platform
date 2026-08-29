import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { storagePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const node = await prisma.fileNode.findUnique({ where: { id } });
  if (!node || node.isFolder || !node.storageKey) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const filePath = path.join(storagePath("files"), node.storageKey);
  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const encoded = encodeURIComponent(node.name);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": node.mimeType || "application/octet-stream",
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
    },
  });
}
