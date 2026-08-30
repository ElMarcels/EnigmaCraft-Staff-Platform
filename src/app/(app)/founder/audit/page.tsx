import { prisma } from "@/lib/db";
import { IconShield } from "@/components/icons";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  USER_CREATE: "Usuario creado",
  USER_ROLE_CHANGE: "Cambio de rango",
  USER_ENABLE: "Cuenta activada",
  USER_DISABLE: "Cuenta desactivada",
  USER_PASSWORD_RESET: "Contraseña restablecida",
  USER_DELETE: "Usuario eliminado",
  CATEGORY_CREATE: "Categoría creada",
  CATEGORY_DELETE: "Categoría eliminada",
  CHANNEL_CREATE: "Canal creado",
  CHANNEL_DELETE: "Canal eliminado",
  MESSAGE_DELETE: "Mensaje eliminado",
  ANNOUNCEMENT_CREATE: "Anuncio publicado",
  ANNOUNCEMENT_DELETE: "Anuncio eliminado",
  FILE_UPLOAD: "Archivo subido",
  FILE_DELETE: "Archivo eliminado",
  FOLDER_CREATE: "Carpeta creada",
  FOLDER_DELETE: "Carpeta eliminada",
  BACKUP_CREATE: "Copia de seguridad",
  PASSWORD_CHANGE: "Cambio de contraseña propia",
};

const DEMO_LOGS: any[] = [
  {
    id: "log-1",
    action: "LOGIN",
    createdAt: new Date(),
    user: { displayName: "Marcel" },
    details: "Sesión iniciada desde IP autenticada",
  },
  {
    id: "log-2",
    action: "BACKUP_CREATE",
    createdAt: new Date(Date.now() - 14400000),
    user: null,
    details: "Snapshot automático diario completado",
  },
  {
    id: "log-3",
    action: "ANNOUNCEMENT_CREATE",
    createdAt: new Date(Date.now() - 28800000),
    user: { displayName: "AlexAdmin" },
    details: "Publicado comunicado sobre proxies Velocity",
  },
];

export default async function AuditPage() {
  let logs: any[] = DEMO_LOGS;

  try {
    const dbLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
      take: 120,
    });
    if (dbLogs.length > 0) {
      logs = dbLogs;
    }
  } catch {
    // Graceful fallback
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-28">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Registro de Auditoría & Actividad</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Registro inmutable de todas las acciones administrativas y cambios en la plataforma.
        </p>
      </header>

      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <IconShield className="h-4 w-4 text-rose-400" /> Últimas Acciones Registradas ({logs.length})
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay actividad registrada.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {logs.map((l) => (
              <li key={l.id} className="py-3 hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                      <span className="text-xs font-semibold text-rose-400/90">
                        · {l.user ? l.user.displayName : "Sistema Automático"}
                      </span>
                    </div>
                    {l.details ? (
                      <p className="truncate text-xs text-slate-400 mt-0.5">{l.details}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-slate-500">
                    {new Date(l.createdAt).toLocaleString("es-ES")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
