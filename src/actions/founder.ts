"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentUserOrThrow, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { createBackup } from "@/lib/backup";
import { Role } from "@prisma/client";

export type UserFormState = { error?: string };

export async function createUserAction(
  _prev: UserFormState | null,
  formData: FormData
): Promise<UserFormState> {
  const founder = await requireRole("FOUNDER");
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim() || username;
  const role = String(formData.get("role") || "STAFF") as Role;

  if (!username || !password) return { error: "Usuario y contraseña obligatorios" };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres" };
  const validRoles = Object.values(Role);
  if (!validRoles.includes(role)) return { error: "Rol no válido" };

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { error: "Ese usuario ya existe" };

  const created = await prisma.user.create({
    data: {
      username,
      passwordHash: hashPassword(password),
      displayName,
      role,
      createdById: founder.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: created.id,
      type: "SYSTEM",
      title: "Bienvenido/a a EnigmaCraft",
      body: `Tu cuenta ha sido creada por ${founder.displayName}. Rango: ${role}`,
    },
  });

  await audit({
    userId: founder.id,
    action: "USER_CREATE",
    targetType: "User",
    targetId: created.id,
    details: `${username} (${role})`,
  });
  revalidatePath("/founder/users");
  return {};
}

export async function updateUserRole(formData: FormData) {
  const founder = await requireRole("FOUNDER");
  const targetId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as Role;
  if (!Object.values(Role).includes(role)) return { error: "Rol no válido" };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { error: "Usuario no encontrado" };
  if (target.role === "FOUNDER") return { error: "No puedes cambiar el rol de un fundador" };

  await prisma.user.update({ where: { id: targetId }, data: { role } });
  await audit({
    userId: founder.id,
    action: "USER_ROLE_CHANGE",
    targetType: "User",
    targetId,
    details: `${target.username}: ${target.role} -> ${role}`,
  });
  revalidatePath("/founder/users");
}

const SUSPENSION_DURATIONS: Record<string, number | null> = {
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "2w": 14 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  forever: null,
};

export async function suspendUserAction(
  formData: FormData
): Promise<UserFormState> {
  const founder = await requireRole("FOUNDER");
  const targetId = String(formData.get("userId") || "");
  const durationKey = String(formData.get("duration") || "");
  const reason = String(formData.get("reason") || "").trim();

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { error: "Usuario no encontrado" };
  if (target.role === "FOUNDER") {
    return { error: "No puedes suspender a otro fundador" };
  }
  const ms = SUSPENSION_DURATIONS[durationKey];
  if (ms === undefined) return { error: "Duración no válida" };
  if (reason.length < 3) {
    return { error: "Escribe una razón (mínimo 3 caracteres)" };
  }

  const suspendedUntil = ms === null ? null : new Date(Date.now() + ms);
  await prisma.user.update({
    where: { id: targetId },
    data: { active: false, suspendedUntil, suspensionReason: reason },
  });

  await audit({
    userId: founder.id,
    action: "USER_SUSPEND",
    targetType: "User",
    targetId,
    details: `${target.username}: ${
      suspendedUntil ? `hasta ${suspendedUntil.toISOString()}` : "permanente"
    } — ${reason}`,
  });
  revalidatePath("/founder/users");
  return {};
}

export async function unsuspendUser(userId: string) {
  const founder = await requireRole("FOUNDER");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "FOUNDER") return;
  if (target.active) return;

  await prisma.user.update({
    where: { id: userId },
    data: { active: true, suspendedUntil: null, suspensionReason: null },
  });
  await audit({
    userId: founder.id,
    action: "USER_UNSUSPEND",
    targetType: "User",
    targetId: userId,
    details: target.username,
  });
  revalidatePath("/founder/users");
}

export async function resetUserPassword(formData: FormData) {
  const founder = await requireRole("FOUNDER");
  const targetId = String(formData.get("userId") || "");
  const newPassword = String(formData.get("password") || "");
  if (newPassword.length < 6) return { error: "Mínimo 6 caracteres" };
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return;

  await prisma.user.update({
    where: { id: targetId },
    data: { passwordHash: hashPassword(newPassword) },
  });
  await audit({
    userId: founder.id,
    action: "USER_PASSWORD_RESET",
    targetType: "User",
    targetId,
    details: target.username,
  });
  revalidatePath("/founder/users");
}

export async function deleteUser(userId: string) {
  const founder = await requireRole("FOUNDER");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "FOUNDER") return;

  await prisma.user.delete({ where: { id: userId } });
  await audit({
    userId: founder.id,
    action: "USER_DELETE",
    targetType: "User",
    targetId: userId,
    details: target.username,
  });
  revalidatePath("/founder/users");
}

export async function createBackupAction() {
  const founder = await requireRole("FOUNDER");
  await createBackup({ creatorId: founder.id, type: "manual" });
  revalidatePath("/founder/backups");
}

export async function changeOwnPasswordAction(
  _prev: UserFormState | null,
  formData: FormData
): Promise<UserFormState> {
  const user = await getCurrentUserOrThrow();
  const current = String(formData.get("current") || "");
  const next = String(formData.get("newPassword") || "");
  if (!verifyPassword(current, user.passwordHash)) {
    return { error: "La contraseña actual no es correcta" };
  }
  if (next.length < 6) return { error: "La nueva contraseña debe tener al menos 6 caracteres" };
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });
  await audit({ userId: user.id, action: "PASSWORD_CHANGE" });
  redirect("/dashboard");
}
