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
