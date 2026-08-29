import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { streamBlob } from "@/lib/blob";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const node = await prisma.fileNode.findUnique({ where: { id } });
  if (!node || node.isFolder || !node.url || !node.storageKey) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  let stream: ReadableStream;
  try {
    stream = await streamBlob(node.url);
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const encoded = encodeURIComponent(node.name);
  return new NextResponse(stream, {
    headers: {
      "Content-Type": node.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
    },
  });
}