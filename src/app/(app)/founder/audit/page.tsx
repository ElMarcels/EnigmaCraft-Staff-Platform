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

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
    take: 120,
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Registro de actividad</h1>
        <p className="text-sm text-white/40">
          Todas las acciones importantes realizadas en la plataforma.
        </p>
      </header>

      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50">
          <IconShield className="text-amber-300" /> Últimas acciones
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-white/40">Todavía no hay actividad registrada.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {logs.map((l) => (
              <li key={l.id} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-medium text-white">
                      {ACTION_LABELS[l.action] || l.action}
                    </span>
                    <span className="ml-2 text-sm text-white/40">
                      {l.user ? l.user.displayName : "Sistema"}
                    </span>
                    {l.details ? (
                      <p className="truncate text-xs text-white/30">{l.details}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-white/30">
                    {new Date(l.createdAt).toLocaleString()}
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
