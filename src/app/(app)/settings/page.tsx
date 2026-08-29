import { getCurrentUser } from "@/lib/auth";
import { RoleBadge, Avatar } from "@/components/role-badge";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ajustes de la cuenta</h1>
        <p className="text-sm text-white/40">Tu perfil y tu seguridad.</p>
      </header>

      <div className="card mb-6 max-w-md">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
          Tu perfil
        </h2>
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName} color={user.avatarColor} className="h-12 w-12 text-xl" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{user.displayName}</span>
              <RoleBadge role={user.role} />
            </div>
            <div className="text-sm text-white/40">@{user.username}</div>
            <div className="text-xs text-white/30">
              Miembro desde {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <SettingsForm displayName={user.displayName} />
    </div>
  );
}
