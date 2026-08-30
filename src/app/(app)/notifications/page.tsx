import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { IconBell } from "@/components/icons";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; color: string }> = {
  ANNOUNCEMENT: { label: "Anuncio", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  MESSAGE_MENTION: { label: "Mención", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  SYSTEM: { label: "Sistema", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  FILE: { label: "Archivo", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

const DEMO_NOTIFICATIONS: any[] = [
  {
    id: "notif-1",
    type: "ANNOUNCEMENT",
    title: "Nueva actualización de modalidad",
    body: "Se ha publicado el anuncio oficial de la Temporada 5 de Survival.",
    createdAt: new Date(),
    href: "/announcements",
  },
  {
    id: "notif-2",
    type: "SYSTEM",
    title: "Copia de seguridad completada",
    body: "El snapshot automático de las 04:00 UTC se guardó correctamente.",
    createdAt: new Date(Date.now() - 14400000),
    href: "/founder/backups",
  },
];

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let notifications = DEMO_NOTIFICATIONS;

  try {
    const dbNotifs = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    if (dbNotifs.length > 0) {
      notifications = dbNotifs;
      const ids = dbNotifs.filter((n) => !n.read).map((n) => n.id);
      if (ids.length > 0) {
        await prisma.notification.updateMany({
          where: { id: { in: ids } },
          data: { read: true },
        });
      }
    }
  } catch {
    // Graceful fallback
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-28">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <IconBell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Centro de Notificaciones</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Avisos de sistema, menciones de chat y confirmaciones de tareas.
          </p>
        </div>
      </header>

      {notifications.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-400 text-sm">
          No tienes notificaciones pendientes.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
            const inner = (
              <div key={n.id} className="glass-card-interactive p-4 flex items-start gap-3.5">
                <span className={`mt-0.5 shrink-0 rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white mb-0.5">{n.title}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{n.body}</div>
                  <div className="mt-1 text-[11px] text-slate-500 font-medium">
                    {new Date(n.createdAt).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="block transition-transform hover:translate-x-1 duration-150">
                {inner}
              </Link>
            ) : (
              inner
            );
          })}
        </div>
      )}
    </div>
  );
}
