import { getCurrentUser } from "@/lib/auth";
import { RoleBadge, Avatar } from "@/components/role-badge";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-28">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Ajustes de la cuenta</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">Configuración de perfil, credenciales y seguridad del staff.</p>
      </header>

      <div className="glass-card p-6 mb-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Tu perfil de Staff
        </h2>
        <div className="flex items-center gap-4">
          <Avatar name={user.displayName} color={user.avatarColor} className="h-14 w-14 text-xl" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-white">{user.displayName}</span>
              <RoleBadge role={user.role} />
            </div>
            <div className="text-xs text-slate-400">@{user.username} · {user.contactDiscord ? `Discord: ${user.contactDiscord}` : ""}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Miembro registrado desde {new Date(user.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Seguridad & Contraseña
        </h2>
        <SettingsForm displayName={user.displayName} />
      </div>
    </div>
  );
}
