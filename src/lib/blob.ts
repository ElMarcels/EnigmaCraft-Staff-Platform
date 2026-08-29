import "server-only";
import { del, get, head, put } from "@vercel/blob";
import type { HeadBlobResult, PutBlobResult } from "@vercel/blob";

export const BLOB_PREFIX = "ec";

function token() {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error("BLOB_READ_WRITE_TOKEN no configurado");
  return t;
}

export async function putBlob(
  pathname: string,
  data: Buffer | string | Blob,
  options?: { contentType?: string; access?: "public" | "private" }
): Promise<PutBlobResult> {
  return put(pathname, data, {
    access: options?.access ?? "public",
    contentType: options?.contentType,
    addRandomSuffix: false,
    token: token(),
  });
}

export async function readBlobHead(
  pathnameOrUrl: string
): Promise<HeadBlobResult | null> {
  try {
    return await head(pathnameOrUrl, { token: token() });
  } catch {
    return null;
  }
}

export async function deleteBlob(pathnameOrUrl: string): Promise<void> {
  await del(pathnameOrUrl, { token: token() });
}

export async function streamBlob(url: string): Promise<ReadableStream> {
  const result = await get(url, { access: "public", token: token() });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Blob no disponible");
  }
  return result.stream;
}