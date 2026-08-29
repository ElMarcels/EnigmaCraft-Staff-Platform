"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getCurrentUserWithStatus } from "@/lib/auth";
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
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Credenciales incorrectas." };
  }

  await createSession(user.id);

  if (!user.active) {
    const suspended =
      user.suspendedUntil && user.suspendedUntil.getTime() <= Date.now()
        ? null // suspensión temporal ya expirada: se reactiva al entrar
        : user.suspendedUntil ?? true;
    if (suspended === null) {
      await prisma.user.update({
        where: { id: user.id },
        data: { active: true, suspendedUntil: null, suspensionReason: null },
      });
      await audit({
        userId: user.id,
        action: "LOGIN",
        details: `Inicio de sesión (${user.username})`,
      });
      redirect("/dashboard");
    }
    await audit({
      userId: user.id,
      action: "SUSPENDED_LOGIN",
      details: `Intento de acceso con cuenta suspendida (${user.username})`,
    });
    redirect("/suspended");
  }

  await audit({
    userId: user.id,
    action: "LOGIN",
    details: `Inicio de sesión (${user.username})`,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const status = await getCurrentUserWithStatus();
  if (status.user) {
    await audit({ userId: status.user.id, action: "LOGOUT" });
  }
  await destroySession();
  redirect("/login");
}
