import { Role } from "@prisma/client";

export const ROLE_META: Record<
  Role,
  { label: string; color: string; desc: string; glow: string; gradient: string }
> = {
  FOUNDER: {
    label: "Fundador",
    color: "bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-amber-500/20",
    desc: "Acceso total a la red, incluye consola de fundadores y auditoría.",
    glow: "rgba(245, 158, 11, 0.4)",
    gradient: "from-amber-500 to-yellow-400",
  },
  ADMIN: {
    label: "Administrador",
    color: "bg-rose-500/15 text-rose-300 border-rose-400/40 shadow-rose-500/20",
    desc: "Gestión de canales, anuncios, personal y archivos de red.",
    glow: "rgba(244, 63, 94, 0.4)",
    gradient: "from-rose-500 to-red-600",
  },
  MOD: {
    label: "Moderador",
    color: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-cyan-500/20",
    desc: "Modera canales de comunicación y resuelve incidencias.",
    glow: "rgba(6, 182, 212, 0.4)",
    gradient: "from-cyan-500 to-blue-500",
  },
  BUILDER: {
    label: "Constructor",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-emerald-500/20",
    desc: "Gestión de proyectos de construcción y archivos esquemáticos (.schem).",
    glow: "rgba(16, 185, 129, 0.4)",
    gradient: "from-emerald-500 to-teal-400",
  },
  STAFF: {
    label: "Staff",
    color: "bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-purple-500/20",
    desc: "Miembro base del equipo de EnigmaCraft Network.",
    glow: "rgba(168, 85, 247, 0.4)",
    gradient: "from-purple-500 to-indigo-500",
  },
};

export const ALL_ROLES: Role[] = [
  "FOUNDER",
  "ADMIN",
  "MOD",
  "BUILDER",
  "STAFF",
];

export const ONLINE_WINDOW_MS = 15 * 60 * 1000;

export const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  AWAY: {
    label: "Ausente",
    dot: "bg-amber-400 shadow-sm shadow-amber-400/50",
    text: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  VACATION: {
    label: "De vacaciones",
    dot: "bg-sky-400 shadow-sm shadow-sky-400/50",
    text: "text-sky-300",
    bg: "bg-sky-500/10 border-sky-500/20",
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
  | { key: "AWAY"; label: string; dot: string; text: string; bg: string }
  | { key: "VACATION"; label: string; dot: string; text: string; bg: string }
  | { key: "ONLINE"; label: string; dot: string; text: string; bg: string }
  | null {
  if (user.status === "AWAY") return { key: "AWAY", ...STATUS_META.AWAY };
  if (user.status === "VACATION")
    return { key: "VACATION", ...STATUS_META.VACATION };
  if (isOnline(user.lastSeenAt))
    return {
      key: "ONLINE",
      label: "En línea",
      dot: "bg-emerald-400 shadow-sm shadow-emerald-400/60",
      text: "text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    };
  return null;
}
