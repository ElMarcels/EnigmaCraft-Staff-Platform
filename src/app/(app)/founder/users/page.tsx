import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateUserForm } from "@/components/founder/create-user-form";
import { UserRow } from "@/components/founder/user-row";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const current = await getCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    include: { createdBy: true },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Gestión de usuarios</h1>
        <p className="text-sm text-white/40">
          Crea cuentas y gestiona los rangos del staff. Solo los fundadores lo ven.
        </p>
      </header>

      <CreateUserForm />

      <div className="card">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">
          Personal ({users.length})
        </h2>
        <div className="space-y-2">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={{
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                role: u.role,
                active: u.active,
                avatarColor: u.avatarColor,
                createdAt: u.createdAt.toISOString(),
                createdByName: u.createdBy?.displayName || null,
              }}
              isSelf={current?.id === u.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
