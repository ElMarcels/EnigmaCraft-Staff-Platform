import { Role } from "@prisma/client";

export const ROLE_META: Record<
  Role,
  { label: string; color: string; desc: string }
> = {
  FOUNDER: {
    label: "Fundador",
    color: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    desc: "Acceso total, incluye panel de control exclusivo.",
  },
  ADMIN: {
    label: "Admin",
    color: "bg-red-500/20 text-red-300 border-red-400/30",
    desc: "Gestiona canales, anuncios y archivos.",
  },
  MOD: {
    label: "Mod",
    color: "bg-sky-500/20 text-sky-300 border-sky-400/30",
    desc: "Modera canales y gestiona contenido.",
  },
  BUILDER: {
    label: "Builder",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    desc: "Acceso a mensajería y archivos de construcción.",
  },
  STAFF: {
    label: "Staff",
    color: "bg-violet-500/20 text-violet-300 border-violet-400/30",
    desc: "Miembro base del equipo.",
  },
};

export const ALL_ROLES: Role[] = [
  "FOUNDER",
  "ADMIN",
  "MOD",
  "BUILDER",
  "STAFF",
];

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  AWAY: {
    label: "Ausente",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  VACATION: {
    label: "De vacaciones",
    dot: "bg-sky-400",
    text: "text-sky-300",
  },
};

export type ActivityStatus = "AWAY" | "VACATION";

export function isOnline(
  lastSeenAt?: Date | string | null
): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

export function statusOf(
  user: { status?: string | null; lastSeenAt?: Date | string | null }
):
  | { key: "AWAY"; label: string; dot: string; text: string }
  | { key: "VACATION"; label: string; dot: string; text: string }
  | { key: "ONLINE"; label: string; dot: string; text: string }
  | null {
  if (user.status === "AWAY") return { key: "AWAY", ...STATUS_META.AWAY };
  if (user.status === "VACATION")
    return { key: "VACATION", ...STATUS_META.VACATION };
  if (isOnline(user.lastSeenAt))
    return {
      key: "ONLINE",
      label: "En línea",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
    };
  return null;
}
