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

function sanitize(name: string, fallback = "archivo"): string {
  if (!name) return fallback;
  const n = name.replace(/[\\/]/g, "").trim();
  return (n || fallback).slice(0, 120);
}

function inferMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "yml" || ext === "yaml") return "text/yaml";
  if (ext === "json") return "application/json";
  if (ext === "properties" || ext === "txt" || ext === "log") return "text/plain";
  if (ext === "docx" || ext === "doc") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "jar") return "application/java-archive";
  if (ext === "schem" || ext === "schematic") return "application/x-minecraft-schematic";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

export async function createFolder(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const name = sanitize(String(formData.get("name") || ""), "Nueva Carpeta");
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
  const name = sanitize(String(formData.get("name") || ""), "archivo");
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
  content?: string;
};

export async function syncLocalDirectoryAction(
  folderName: string,
  files: SyncedFileDTO[],
  parentId?: string | null
) {
  try {
    const user = await getCurrentUserOrThrow();
    const cleanFolderName = sanitize(folderName, "Carpeta Sincronizada");

    // Create root synced folder
    let rootFolder = await prisma.fileNode.findFirst({
      where: {
        name: cleanFolderName,
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
    } else if (!rootFolder.isFolder) {
      rootFolder = await prisma.fileNode.update({
        where: { id: rootFolder.id },
        data: { isFolder: true },
      });
    }

    // Helper to ensure nested subfolder path exists
    async function ensureFolderPath(
      pathParts: string[],
      parentFolderId: string
    ): Promise<string> {
      let currentParentId = parentFolderId;

      for (const folderName of pathParts) {
        const cleanSubName = sanitize(folderName, "subcarpeta");
        if (!cleanSubName) continue;

        let subFolder = await prisma.fileNode.findFirst({
          where: {
            name: cleanSubName,
            parentId: currentParentId,
          },
        });

        if (!subFolder) {
          subFolder = await prisma.fileNode.create({
            data: {
              name: cleanSubName,
              isFolder: true,
              parentId: currentParentId,
              ownerId: user.id,
            },
          });
        } else if (!subFolder.isFolder) {
          subFolder = await prisma.fileNode.update({
            where: { id: subFolder.id },
            data: { isFolder: true },
          });
        }

        currentParentId = subFolder.id;
      }

      return currentParentId;
    }

    let count = 0;

    // Create files and nested subfolders
    for (const f of files) {
      const rawPath = f.relativePath.replace(/\\/g, "/").trim();
      if (!rawPath) continue;

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
          count++;
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

      const cleanName = sanitize(fileName, "archivo.txt");
      const safeSize = Math.min(2147483647, Math.max(0, Math.floor(f.size || 0)));
      const mime = inferMimeType(cleanName);

      const existingNode = await prisma.fileNode.findFirst({
        where: {
          name: cleanName,
          parentId: targetParentId,
        },
      });

      const contentPayload = f.content
        ? `data:text/plain;charset=utf-8;base64,${Buffer.from(f.content).toString("base64")}`
        : null;

      if (existingNode) {
        await prisma.fileNode.update({
          where: { id: existingNode.id },
          data: {
            isFolder: false,
            size: safeSize,
            mimeType: mime,
            ...(contentPayload ? { url: contentPayload } : {}),
          },
        });
      } else {
        await prisma.fileNode.create({
          data: {
            name: cleanName,
            isFolder: false,
            size: safeSize,
            mimeType: mime,
            parentId: targetParentId,
            ownerId: user.id,
            url: contentPayload,
          },
        });
      }
      count++;
    }

    await audit({
      userId: user.id,
      action: "FOLDER_SYNC",
      targetType: "FileNode",
      targetId: rootFolder.id,
      details: `${cleanFolderName} (${count} elementos sincronizados)`,
    });

    revalidatePath("/files");
    return { success: true, folderId: rootFolder.id, count };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al sincronizar con el almacenamiento.";
    return { success: false, error: errorMsg, count: 0 };
  }
}

export async function saveFileContentAction(
  fileName: string,
  content: string,
  parentId?: string | null
) {
  const user = await getCurrentUserOrThrow();
  const cleanName = sanitize(fileName);
  const contentPayload = `data:text/plain;charset=utf-8;base64,${Buffer.from(content).toString("base64")}`;
  const size = Buffer.byteLength(content, "utf-8");

  const existing = await prisma.fileNode.findFirst({
    where: {
      name: cleanName,
      parentId: parentId || null,
      isFolder: false,
    },
  });

  if (existing) {
    await prisma.fileNode.update({
      where: { id: existing.id },
      data: { size, url: contentPayload },
    });
  } else {
    await prisma.fileNode.create({
      data: {
        name: cleanName,
        isFolder: false,
        size,
        parentId: parentId || null,
        ownerId: user.id,
        url: contentPayload,
      },
    });
  }

  await audit({
    userId: user.id,
    action: "FILE_EDIT",
    targetType: "FileNode",
    targetId: cleanName,
    details: `Editado archivo ${cleanName} (${size} bytes)`,
  });

  revalidatePath("/files");
  return { success: true };
}

export async function getFileContentAction(fileId: string) {
  const node = await prisma.fileNode.findUnique({
    where: { id: fileId },
  });
  if (!node || node.isFolder) return null;

  if (node.url && node.url.startsWith("data:text/plain;charset=utf-8;base64,")) {
    const b64 = node.url.replace("data:text/plain;charset=utf-8;base64,", "");
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf-8");
      const lower = node.name.toLowerCase();
      // If a non-normative file was previously persisted with the old generic normativa template, discard and recalculate
      if (
        !lower.includes("norma") &&
        !lower.includes("regla") &&
        decoded.startsWith("# NORMATIVA OFICIAL DE STAFF")
      ) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }
  return null;
}
