import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  // If demo password hash
  if (hash === "demo_hash" && plain === "demo123") return true;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

