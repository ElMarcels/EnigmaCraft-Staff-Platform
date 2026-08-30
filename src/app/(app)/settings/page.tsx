import { getCurrentUser } from "@/lib/auth";
import { RoleBadge, Avatar } from "@/components/role-badge";
import { SettingsForm } from "@/components/settings-form";
import { ThemeAccentPicker } from "@/components/theme-accent-picker";
import { IconPalette, IconShield, IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto pb-28">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Ajustes & Personalización
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Configura tu perfil de staff, seguridad y personaliza la estética visual de la plataforma.
        </p>
      </header>

      {/* User Profile Card */}
      <div className="glass-card p-6 md:p-7">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <IconUsers className="h-4 w-4 text-rose-400" /> Tu Ficha de Personal
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar
            name={user.displayName}
            color={user.avatarColor}
            className="h-16 w-16 text-2xl shadow-xl"
            isOnline={true}
          />
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="font-extrabold text-xl text-white tracking-tight">
                {user.displayName}
              </span>
              <RoleBadge role={user.role} />
            </div>
            <div className="text-xs font-medium text-slate-400">
              @{user.username} {user.contactDiscord ? `· Discord: ${user.contactDiscord}` : ""}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Miembro registrado desde {new Date(user.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Accent Color Picker Section */}
      <div className="glass-card p-6 md:p-7 space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <IconPalette className="h-4 w-4 text-rose-400" /> Esquema de Acento & Resplandor (Glow)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza el color de los reflejos Liquid Glass, la barra inferior y los botones de acción.
          </p>
        </div>
        <ThemeAccentPicker />
      </div>

      {/* Security & Password */}
      <div className="glass-card p-6 md:p-7">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <IconShield className="h-4 w-4 text-rose-400" /> Seguridad & Contraseña
        </h2>
        <SettingsForm displayName={user.displayName} />
      </div>
    </div>
  );
}
