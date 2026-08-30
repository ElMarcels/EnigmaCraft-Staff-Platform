import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DirectorySelfCard } from "@/components/directory-self-card";
import { DirectoryContactCard, type ContactUser } from "@/components/directory-contact-card";
import { IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";

const DEMO_USERS: ContactUser[] = [
  {
    id: "dev-founder-01",
    username: "marcel",
    displayName: "Marcel",
    role: "FOUNDER",
    avatarColor: "#f43f5e",
    contactDiscord: "marcel_01",
    contactEmail: "marcel@enigmacraft.net",
    contactOther: "Discord Direct",
    timezone: "Europe/Madrid (UTC+1)",
    status: "En línea",
    lastSeenAt: new Date(),
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "dev-admin-02",
    username: "alex_sys",
    displayName: "AlexAdmin",
    role: "ADMIN",
    avatarColor: "#e11d48",
    contactDiscord: "alex_dev",
    contactEmail: "alex@enigmacraft.net",
    contactOther: null,
    timezone: "America/Mexico_City (UTC-6)",
    status: "En línea",
    lastSeenAt: new Date(),
    createdAt: new Date("2026-01-15"),
  },
  {
    id: "dev-mod-03",
    username: "lucas_guard",
    displayName: "LucasMod",
    role: "MOD",
    avatarColor: "#06b6d4",
    contactDiscord: "lucas_mod",
    contactEmail: "lucas@enigmacraft.net",
    contactOther: null,
    timezone: "America/Argentina/BA (UTC-3)",
    status: "Ausente",
    lastSeenAt: new Date(Date.now() - 3600000),
    createdAt: new Date("2026-02-01"),
  },
  {
    id: "dev-builder-04",
    username: "elena_arch",
    displayName: "ElenaBuilder",
    role: "BUILDER",
    avatarColor: "#10b981",
    contactDiscord: "elena_craft",
    contactEmail: "elena@enigmacraft.net",
    contactOther: null,
    timezone: "Europe/Madrid (UTC+1)",
    status: "En línea",
    lastSeenAt: new Date(),
    createdAt: new Date("2026-02-10"),
  },
  {
    id: "dev-staff-05",
    username: "sofia_helper",
    displayName: "SofiaStaff",
    role: "STAFF",
    avatarColor: "#a855f7",
    contactDiscord: "sofia_helper",
    contactEmail: "sofia@enigmacraft.net",
    contactOther: null,
    timezone: "Europe/Rome (UTC+1)",
    status: "Desconectado",
    lastSeenAt: new Date(Date.now() - 86400000),
    createdAt: new Date("2026-02-20"),
  },
];

export default async function DirectoryPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  let users: ContactUser[] = DEMO_USERS;

  try {
    const dbUsers = await prisma.user.findMany({
      where: { active: true },
      orderBy: [{ role: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        avatarColor: true,
        contactDiscord: true,
        contactEmail: true,
        contactOther: true,
        timezone: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    if (dbUsers.length > 0) {
      users = dbUsers;
    }
  } catch {
    // Graceful fallback to demo users
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-28">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Directorio del Staff
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Fichas de contacto, disponibilidad horaria y estados del equipo en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300">
            <IconUsers className="h-4 w-4 text-rose-400" />
            {users.length} miembros registrados
          </span>
        </div>
      </header>

      {/* User's Own Card Editor */}
      <DirectorySelfCard
        user={{
          displayName: current.displayName,
          username: current.username,
          role: current.role,
          avatarColor: current.avatarColor,
          contactDiscord: current.contactDiscord,
          contactEmail: current.contactEmail,
          contactOther: current.contactOther,
          timezone: current.timezone,
          status: current.status,
          lastSeenAt: current.lastSeenAt,
          createdAt: current.createdAt,
        }}
      />

      {/* Staff Grid */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Personal de la Network
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <DirectoryContactCard
              key={u.id}
              user={u}
              isSelf={u.id === current.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}