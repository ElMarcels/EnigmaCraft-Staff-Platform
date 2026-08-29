import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { IconBell } from "@/components/icons";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; color: string }> = {
  ANNOUNCEMENT: { label: "Anuncio", color: "bg-indigo-500/20 text-indigo-300" },
  MESSAGE_MENTION: { label: "Mención", color: "bg-sky-500/20 text-sky-300" },
  SYSTEM: { label: "Sistema", color: "bg-amber-500/20 text-amber-300" },
  FILE: { label: "Archivo", color: "bg-emerald-500/20 text-emerald-300" },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const ids = notifications.filter((n) => !n.read).map((n) => n.id);
  if (ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { read: true },
    });
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <IconBell className="h-7 w-7 text-indigo-300" />
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-sm text-white/40">
            Avisos y avisos del sistema para ti.
          </p>
        </div>
      </header>

      {notifications.length === 0 ? (
        <p className="card text-white/40">No tienes notificaciones.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
            const inner = (
              <div key={n.id} className="card flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{n.title}</div>
                  <div className="text-sm text-white/60">{n.body}</div>
                  <div className="mt-0.5 text-xs text-white/30">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="block transition-opacity hover:opacity-80">
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
