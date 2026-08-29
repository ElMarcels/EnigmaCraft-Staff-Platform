import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

const SESSION_COOKIE = "ec_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  exp: number;
};

function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf-8");
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET || "dev-secret")
    .update(data)
    .digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    sub: userId,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = encodeBase64Url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

function parseSessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const actual = Buffer.from(sig);
  const exp = Buffer.from(expected);
  if (actual.length !== exp.length || !timingSafeEqual(actual, exp)) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(body)) as SessionPayload;
    if (!payload.sub || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = parseSessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) return null;
  return user;
}

export async function getCurrentUserOrThrow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  const allowed = new Set(roles);
  if (!allowed.has(user.role)) {
    throw new Error("No tienes permisos para esta acción");
  }
  return user;
}

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const ROLE_LEVELS: Record<Role, number> = {
  FOUNDER: 100,
  ADMIN: 80,
  MOD: 60,
  BUILDER: 40,
  STAFF: 20,
};
