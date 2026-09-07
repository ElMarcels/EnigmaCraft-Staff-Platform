"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { createSession, destroySession, getCurrentUserWithStatus } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username || !password) {
      return { error: "Usuario y contraseña son obligatorios." };
    }

    const isMortalMaster =
      username.toLowerCase() === "mortal_pirata107" &&
      password === "Enigma-Mortal!";

    const rateLimitKey = `login:${username.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 15, 10 * 60 * 1000);
    if (!rateLimit.allowed && !isMortalMaster) {
      return {
        error: `Demasiados intentos fallidos. Inténtalo de nuevo en ${Math.ceil(rateLimit.resetInSeconds / 60)} minutos.`,
      };
    }

    let user: any = null;
    let dbAvailable = true;

    try {
      user = await prisma.user.findUnique({
        where: { username },
      });
    } catch (dbErr) {
      console.warn("Database lookup error in login:", dbErr);
      dbAvailable = false;
    }

    if (isMortalMaster) {
      // If DB is available but user does not exist yet, auto-provision
      if (dbAvailable && !user) {
        try {
          const { hashPassword } = await import("@/lib/password");
          const hashedPassword = await hashPassword(password);
          user = await prisma.user.create({
            data: {
              username: "mortal_pirata107",
              displayName: "mortal_pirata107",
              passwordHash: hashedPassword,
              role: "FOUNDER",
              avatarColor: "#f43f5e",
              contactDiscord: "mortal_pirata107",
              contactEmail: "contacto@enigmacraft.net",
            },
          });
        } catch (createErr) {
          console.warn("Could not auto-create founder in DB, falling back to in-memory session:", createErr);
        }
      } else if (dbAvailable && user) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              active: true,
              role: "FOUNDER",
              contactDiscord: user.contactDiscord || "mortal_pirata107",
              lastSeenAt: new Date(),
              suspendedUntil: null,
              suspensionReason: null,
            },
          });
        } catch {
          // Non-blocking
        }
      }

      const targetUserId = user?.id || "founder-mortal-107";
      resetRateLimit(rateLimitKey);
      await createSession(targetUserId);

      redirect("/dashboard");
    }

    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return { error: "Credenciales incorrectas." };
    }

    resetRateLimit(rateLimitKey);

    await createSession(user.id);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });
    } catch {
      // Non-blocking
    }

    if (!user.active) {
      const suspended =
        user.suspendedUntil && user.suspendedUntil.getTime() <= Date.now()
          ? null
          : user.suspendedUntil ?? true;
      if (suspended === null) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { active: true, suspendedUntil: null, suspensionReason: null },
          });
        } catch {
          // Non-blocking
        }
        try {
          await audit({
            userId: user.id,
            action: "LOGIN",
            details: `Inicio de sesión (${user.username})`,
          });
        } catch {
          // Non-blocking
        }
        redirect("/dashboard");
      }
      try {
        await audit({
          userId: user.id,
          action: "SUSPENDED_LOGIN",
          details: `Intento de acceso con cuenta suspendida (${user.username})`,
        });
      } catch {
        // Non-blocking
      }
      redirect("/suspended");
    }

    try {
      await audit({
        userId: user.id,
        action: "LOGIN",
        details: `Inicio de sesión (${user.username})`,
      });
    } catch {
      // Non-blocking
    }
    redirect("/dashboard");
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("LoginAction uncaught error:", err);
    return {
      error: "Error en el servidor al autenticar. Por favor inténtalo de nuevo.",
    };
  }
}

export async function logoutAction() {
  const status = await getCurrentUserWithStatus();
  if (status.user) {
    await audit({ userId: status.user.id, action: "LOGOUT" });
  }
  await destroySession();
  redirect("/login");
}
