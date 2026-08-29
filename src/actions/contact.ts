"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type ContactState = { error?: string; ok?: boolean };

export type ContactRedirect = "dashboard" | "directory";

const DISCORD_RE = /^[^\s]+$/;

export async function saveContactInfoAction(
  redirectTo: ContactRedirect,
  _prev: ContactState | null,
  formData: FormData
): Promise<ContactState> {
  const user = await getCurrentUserOrThrow();
  const discord = String(formData.get("discord") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const other = String(formData.get("other") || "").trim() || null;

  if (!discord) return { error: "El Discord es obligatorio." };
  if (!DISCORD_RE.test(discord))
    return { error: "El Discord no puede contener espacios ni ir vacío." };

  await prisma.user.update({
    where: { id: user.id },
    data: { contactDiscord: discord, contactEmail: email, contactOther: other },
  });

  await audit({
    userId: user.id,
    action: "CONTACT_UPDATE",
    details: `Ficha de contacto actualizada (${distinguidor(discord, email)})`,
  });

  if (redirectTo === "dashboard") {
    redirect("/dashboard");
  }
  revalidatePath("/directory");
  return { ok: true };
}

function distinguidor(discord: string, email: string | null) {
  return email ? `${discord} · ${email}` : discord;
}