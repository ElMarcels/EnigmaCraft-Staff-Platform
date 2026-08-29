"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { audit } from "@/lib/audit";

function sanitize(name: string): string {
  const n = name.replace(/[\\/]/g, "").trim();
  if (!n) throw new Error("Nombre no válido");
  return n.slice(0, 120);
}

export async function createFolder(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const name = sanitize(String(formData.get("name") || ""));
  const parentId = String(formData.get("parentId") || "") || null;

  if (parentId) {
    const parent = await prisma.fileNode.findUnique({
      where: { id: parentId },
    });
    if (!parent || !parent.isFolder)
      return { error: "Carpeta padre no válida" };
  }

  const folder = await prisma.fileNode.create({
    data: { name, isFolder: true, parentId, ownerId: user.id },
  });

  await audit({
    userId: user.id,
    action: "FOLDER_CREATE",
    targetType: "FileNode",
    targetId: folder.id,
    details: name,
  });
  revalidatePath("/files");
}

export async function deleteFileOrFolder(nodeId: string) {
  const user = await getCurrentUserOrThrow();
  const node = await prisma.fileNode.findUnique({ where: { id: nodeId } });
  if (!node) return;
  if (
    node.ownerId !== user.id &&
    !["FOUNDER", "ADMIN"].includes(user.role)
  ) {
    return;
  }
  await prisma.fileNode.delete({ where: { id: nodeId } });
  await audit({
    userId: user.id,
    action: node.isFolder ? "FOLDER_DELETE" : "FILE_DELETE",
    targetType: "FileNode",
    targetId: nodeId,
    details: node.name,
  });
  revalidatePath("/files");
}

export async function renameFileOrFolder(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const id = String(formData.get("id") || "");
  const name = sanitize(String(formData.get("name") || ""));
  const node = await prisma.fileNode.findUnique({ where: { id } });
  if (!node) return;
  if (node.ownerId !== user.id && !["FOUNDER", "ADMIN"].includes(user.role)) {
    return;
  }
  await prisma.fileNode.update({ where: { id }, data: { name } });
  revalidatePath("/files");
}
