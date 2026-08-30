"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createHash } from "node:crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function updateFullProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No has iniciado sesión." };
  }

  const displayName = formData.get("displayName")?.toString().trim();
  const username = formData.get("username")?.toString().trim().toLowerCase();
  const contactDiscord = formData.get("contactDiscord")?.toString().trim() || null;
  const minecraftNick = formData.get("minecraftNick")?.toString().trim() || null;
  const avatarColor = formData.get("avatarColor")?.toString().trim() || user.avatarColor;
  const status = formData.get("status")?.toString().trim() || null;
  
  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();

  if (!displayName || displayName.length < 2) {
    return { success: false, error: "El nombre en pantalla debe tener al menos 2 caracteres." };
  }

  if (!username || username.length < 3) {
    return { success: false, error: "El nombre de usuario debe tener al menos 3 caracteres." };
  }

  // Check username uniqueness if changed
  if (username !== user.username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== user.id) {
      return { success: false, error: "Ese nombre de usuario ya está en uso por otro miembro." };
    }
  }

  const updateData: {
    displayName: string;
    username: string;
    contactDiscord: string | null;
    avatarColor: string;
    status: string | null;
    passwordHash?: string;
  } = {
    displayName,
    username,
    contactDiscord,
    avatarColor,
    status,
  };

  // Password update check
  if (newPassword && newPassword.trim()) {
    if (!currentPassword) {
      return { success: false, error: "Debes ingresar tu contraseña actual para cambiarla." };
    }
    const currentHash = hashPassword(currentPassword);
    if (user.passwordHash !== "demo_hash" && user.passwordHash !== currentHash) {
      return { success: false, error: "La contraseña actual es incorrecta." };
    }
    if (newPassword.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
    }
    updateData.passwordHash = hashPassword(newPassword);
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/chat");
    revalidatePath("/directory");
    revalidatePath("/founder/users");

    return { success: true, message: "Perfil y datos actualizados en la base de datos." };
  } catch (err: unknown) {
    console.error("Error updating profile:", err);
    return { success: false, error: "Error al guardar en la base de datos." };
  }
}
