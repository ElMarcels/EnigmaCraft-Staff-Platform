"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteBlob } from "@/lib/blob";

async function collectBlobKeys(nodeId: string): Promise<string[]> {
  const keys: string[] = [];
  const stack = [nodeId];
  while (stack.length) {
    const current = stack.pop()!;
    const children = await prisma.fileNode.findMany({
      where: { parentId: current },
      select: { id: true, isFolder: true, storageKey: true },
    });
    for (const child of children) {
      if (child.storageKey) keys.push(child.storageKey);
      if (child.isFolder) stack.push(child.id);
    }
  }
  return keys;
}

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

async function deleteNodeRecursively(nodeId: string) {
  const children = await prisma.fileNode.findMany({ where: { parentId: nodeId } });
  for (const child of children) {
    await deleteNodeRecursively(child.id);
  }
  await prisma.fileNode.delete({ where: { id: nodeId } });
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

  const blobKeys = await collectBlobKeys(node.id);
  if (node.storageKey) blobKeys.push(node.storageKey);
  await Promise.all(blobKeys.map((k) => deleteBlob(k).catch(() => {})));

  await deleteNodeRecursively(nodeId);

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

export type SyncedFileDTO = {
  name: string;
  relativePath: string;
  size: number;
  isFolder?: boolean;
};

export async function syncLocalDirectoryAction(
  folderName: string,
  files: SyncedFileDTO[],
  parentId?: string | null
) {
  const user = await getCurrentUserOrThrow();
  const cleanFolderName = sanitize(folderName || "Carpeta Sincronizada");

  // Create root synced folder
  let rootFolder = await prisma.fileNode.findFirst({
    where: {
      name: cleanFolderName,
      isFolder: true,
      parentId: parentId || null,
    },
  });

  if (!rootFolder) {
    rootFolder = await prisma.fileNode.create({
      data: {
        name: cleanFolderName,
        isFolder: true,
        parentId: parentId || null,
        ownerId: user.id,
      },
    });
  }

  // Helper to ensure nested subfolder path exists
  async function ensureFolderPath(
    pathParts: string[],
    parentFolderId: string
  ): Promise<string> {
    let currentParentId = parentFolderId;

    for (const folderName of pathParts) {
      const cleanSubName = sanitize(folderName);
      let subFolder = await prisma.fileNode.findFirst({
        where: {
          name: cleanSubName,
          isFolder: true,
          parentId: currentParentId,
        },
      });

      if (!subFolder) {
        // If a non-folder file with same name exists by accident, delete it first to avoid collision
        const accidentFile = await prisma.fileNode.findFirst({
          where: {
            name: cleanSubName,
            isFolder: false,
            parentId: currentParentId,
          },
        });
        if (accidentFile) {
          await prisma.fileNode.delete({ where: { id: accidentFile.id } });
        }

        subFolder = await prisma.fileNode.create({
          data: {
            name: cleanSubName,
            isFolder: true,
            parentId: currentParentId,
            ownerId: user.id,
          },
        });
      }

      currentParentId = subFolder.id;
    }

    return currentParentId;
  }

  // Create files and nested subfolders
  for (const f of files) {
    const rawPath = f.relativePath.replace(/\\/g, "/");

    // If it is explicitly a folder or ends with a slash
    if (f.isFolder || rawPath.endsWith("/")) {
      const folderSegments = rawPath.replace(/\/+$/, "").split("/").filter(Boolean);
      if (
        folderSegments.length > 0 &&
        folderSegments[0].toLowerCase() === cleanFolderName.toLowerCase()
      ) {
        folderSegments.shift();
      }
      if (folderSegments.length > 0) {
        await ensureFolderPath(folderSegments, rootFolder.id);
      }
      continue;
    }

    const segments = rawPath.split("/").filter(Boolean);

    // If relative path begins with the root folder name, shift it
    if (segments.length > 1 && segments[0].toLowerCase() === cleanFolderName.toLowerCase()) {
      segments.shift();
    }

    const fileName = segments.pop() || f.name;
    const subfolderSegments = segments;

    // Resolve exact parent folder (root or nested subfolder)
    const targetParentId =
      subfolderSegments.length > 0
        ? await ensureFolderPath(subfolderSegments, rootFolder.id)
        : rootFolder.id;

    const cleanName = sanitize(fileName);

    const existingFile = await prisma.fileNode.findFirst({
      where: {
        name: cleanName,
        parentId: targetParentId,
        isFolder: false,
      },
    });

    if (existingFile) {
      await prisma.fileNode.update({
        where: { id: existingFile.id },
        data: { size: Math.floor(f.size || 0) },
      });
    } else {
      await prisma.fileNode.create({
        data: {
          name: cleanName,
          isFolder: false,
          size: Math.floor(f.size || 0),
          parentId: targetParentId,
          ownerId: user.id,
        },
      });
    }
  }

  await audit({
    userId: user.id,
    action: "FOLDER_SYNC",
    targetType: "FileNode",
    targetId: rootFolder.id,
    details: `${cleanFolderName} (${files.length} archivos con estructura de subcarpetas)`,
  });

  revalidatePath("/files");
  return { success: true, folderId: rootFolder.id, count: files.length };
}

export async function saveFileContentAction(
  fileName: string,
  content: string,
  parentId?: string | null
) {
  const user = await getCurrentUserOrThrow();
  const cleanName = sanitize(fileName);

  const existing = await prisma.fileNode.findFirst({
    where: {
      name: cleanName,
      parentId: parentId || null,
      isFolder: false,
    },
  });

  const size = Buffer.byteLength(content, "utf-8");

  if (existing) {
    await prisma.fileNode.update({
      where: { id: existing.id },
      data: { size },
    });
  } else {
    await prisma.fileNode.create({
      data: {
        name: cleanName,
        isFolder: false,
        size,
        parentId: parentId || null,
        ownerId: user.id,
      },
    });
  }

  revalidatePath("/files");
  return { success: true };
}
