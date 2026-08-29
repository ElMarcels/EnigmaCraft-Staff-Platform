import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const STORAGE_DIR = path.join(process.cwd(), "storage");
mkdirSync(STORAGE_DIR, { recursive: true });

export function storagePath(...parts: string[]) {
  return path.join(STORAGE_DIR, ...parts);
}

export function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}
