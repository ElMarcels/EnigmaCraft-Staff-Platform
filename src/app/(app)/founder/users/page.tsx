import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateUserForm } from "@/components/founder/create-user-form";
import { UserRow } from "@/components/founder/user-row";
import { IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";

const DEMO_FOUNDER_USERS: any[] = [
  {
    id: "dev-founder-01",
    username: "marcel",
    displayName: "Marcel",
    role: "FOUNDER",
    active: true,
    suspendedUntil: null,
    suspensionReason: null,
    avatarColor: "#f43f5e",
    warnings: [],
    createdAt: new Date("2026-01-01").toISOString(),
    createdByName: null,
  },
  {
    id: "dev-admin-02",
    username: "alex_sys",
    displayName: "AlexAdmin",
    role: "ADMIN",
    active: true,
    suspendedUntil: null,
    suspensionReason: null,
    avatarColor: "#e11d48",
    warnings: [],
    createdAt: new Date("2026-01-15").toISOString(),
    createdByName: "Marcel",
  },
  {
    id: "dev-mod-03",
    username: "lucas_guard",
    displayName: "LucasMod",
    role: "MOD",
    active: true,
    suspendedUntil: null,
    suspensionReason: null,
    avatarColor: "#06b6d4",
    warnings: [{ id: "w1", reason: "Retraso en reporte mensual", createdAt: new Date("2026-02-10").toISOString(), issuedByName: "Marcel" }],
    createdAt: new Date("2026-02-01").toISOString(),
    createdByName: "AlexAdmin",
  },
  {
    id: "dev-builder-04",
    username: "elena_arch",
    displayName: "ElenaBuilder",
    role: "BUILDER",
    active: true,
    suspendedUntil: null,
    suspensionReason: null,
    avatarColor: "#10b981",
    warnings: [],
    createdAt: new Date("2026-02-10").toISOString(),
    createdByName: "Marcel",
  },
  {
    id: "dev-staff-05",
    username: "sofia_helper",
    displayName: "SofiaStaff",
    role: "STAFF",
    active: false,
    suspendedUntil: new Date("2026-09-05T00:00:00Z").toISOString(),
    suspensionReason: "Inactividad prolongada sin previo aviso",
    avatarColor: "#a855f7",
    warnings: [
      { id: "w2", reason: "Falta a reunión obligatoria", createdAt: new Date("2026-02-15").toISOString(), issuedByName: "AlexAdmin" },
    ],
    createdAt: new Date("2026-02-20").toISOString(),
    createdByName: "AlexAdmin",
  },
];

export default async function UsersPage() {
  const current = await getCurrentUser();
  let users: any[] = DEMO_FOUNDER_USERS;

  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { username: "asc" }],
      include: {
        createdBy: true,
        warnings: { orderBy: { createdAt: "desc" }, include: { issuedBy: true } },
      },
    });
    if (dbUsers.length > 0) {
      users = dbUsers.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        active: u.active,
        suspendedUntil: u.suspendedUntil?.toISOString() || null,
        suspensionReason: u.suspensionReason,
        avatarColor: u.avatarColor,
        warnings: u.warnings.map((w) => ({
          id: w.id,
          reason: w.reason,
          createdAt: w.createdAt.toISOString(),
          issuedByName: w.issuedBy?.username || "—",
        })),
        createdAt: u.createdAt.toISOString(),
        createdByName: u.createdBy?.displayName || null,
      }));
    }
  } catch {
    // Graceful fallback
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-28">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Gestión de Usuarios & Rangos
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Crea cuentas de staff, asigna roles de Minecraft y gestiona permisos de red.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-slate-300">
            <IconUsers className="h-4 w-4 text-rose-400" />
            {users.length} miembros registrados
          </span>
        </div>
      </header>

      {/* Create User Form */}
      <CreateUserForm />

      {/* Profile Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cartas de Perfil del Personal ({users.length})
          </h2>
          <span className="text-xs font-semibold text-rose-400">
            Control de Rangos & Moderación
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={current?.id === u.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
