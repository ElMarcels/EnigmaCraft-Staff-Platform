import { getCurrentUser } from "@/lib/auth";
import { ThemeAccentPicker } from "@/components/theme-accent-picker";
import { FullProfileEditor } from "@/components/full-profile-editor";
import { AudioAndMinecraftSettings } from "@/components/audio-and-minecraft-settings";
import { IconPalette, IconUsers } from "@/components/icons";

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
          Edita toda tu información de staff, skin de Minecraft, seguridad y estética visual.
        </p>
      </header>

      {/* Full Profile & Account Settings Form */}
      <div className="glass-card p-6 md:p-7 space-y-5">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <IconUsers className="h-4 w-4 theme-text" /> Editar Información de Perfil & Datos
        </h2>
        <FullProfileEditor user={user} />
      </div>

      {/* Audio UI Settings */}
      <div className="glass-card p-6 md:p-7">
        <AudioAndMinecraftSettings defaultNick={user.displayName} />
      </div>

      {/* Theme Accent Color Picker Section */}
      <div className="glass-card p-6 md:p-7 space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <IconPalette className="h-4 w-4 theme-text" /> Esquema de Acento & Resplandor (Glow)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza el color de los reflejos Liquid Glass, la barra inferior y los botones de acción.
          </p>
        </div>
        <ThemeAccentPicker />
      </div>
    </div>
  );
}
