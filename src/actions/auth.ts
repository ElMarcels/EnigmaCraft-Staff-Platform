"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getCurrentUserOrThrow } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Usuario y contraseña son obligatorios." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { error: "Credenciales incorrectas." };
  }

  await createSession(user.id);
  await audit({
    userId: user.id,
    action: "LOGIN",
    details: `Inicio de sesión (${user.username})`,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUserOrThrow();
  await audit({ userId: user.id, action: "LOGOUT" });
  await destroySession();
  redirect("/login");
}
