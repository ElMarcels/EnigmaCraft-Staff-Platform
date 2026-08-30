import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { ServerStatusWidget } from "@/components/server-status-widget";
import {
  IconUsers,
  IconChat,
  IconFolder,
  IconMegaphone,
  IconBackup,
  IconArrowRight,
} from "@/components/icons";
import { statusOf } from "@/lib/role-meta";

export const dynamic = "force-dynamic";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let staffCount = 5;
  let channelCount = 4;
  let messageCount = 42;
  let fileCount = 8;
  let fileBytes = { _sum: { size: 1024 * 1024 * 18 } };
  let backupCount = 12;
  let announcements: any[] = [
    {
      id: "demo-ann-1",
      title: "Lanzamiento de la Temporada 5 de Survival",
      content: "Este viernes a las 18:00 UTC se lanzará la nueva temporada con economía balanceada, calabozos y protección de parcelas.",
      createdAt: new Date(),
      author: { displayName: "Marcel" },
    },
    {
      id: "demo-ann-2",
      title: "Actualización de Proxies y Mitigación DDoS",
      content: "Se han aplicado los nuevos parches en los nodos Velocity y Paper 1.21. Todos los servicios corren a 20 TPS estables.",
      createdAt: new Date(Date.now() - 86400000),
      author: { displayName: "AlexAdmin" },
    },
  ];
  let allStaff: any[] = [
    { id: "1", displayName: "Marcel", avatarColor: "#f43f5e", role: "FOUNDER", status: "En línea", lastSeenAt: new Date() },
    { id: "2", displayName: "AlexAdmin", avatarColor: "#e11d48", role: "ADMIN", status: "En línea", lastSeenAt: new Date() },
    { id: "3", displayName: "LucasMod", avatarColor: "#06b6d4", role: "MOD", status: "Ausente", lastSeenAt: new Date(Date.now() - 3600000) },
    { id: "4", displayName: "ElenaBuilder", avatarColor: "#10b981", role: "BUILDER", status: "En línea", lastSeenAt: new Date() },
    { id: "5", displayName: "SofiaStaff", avatarColor: "#a855f7", role: "STAFF", status: "Desconectado", lastSeenAt: new Date(Date.now() - 86400000) },
  ];

  try {
    const res = await Promise.all([
      prisma.user.count({ where: { active: true } }),
      prisma.channel.count(),
      prisma.message.count(),
      prisma.fileNode.count({ where: { isFolder: false } }),
      prisma.fileNode.aggregate({ _sum: { size: true }, where: { isFolder: false } }),
      prisma.backup.count(),
      prisma.announcement.findMany({
        where: { OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { author: true },
      }),
      prisma.user.findMany({
        where: { active: true },
        orderBy: [{ role: "asc" }, { displayName: "asc" }],
        select: {
          id: true,
          displayName: true,
          avatarColor: true,
          role: true,
          status: true,
          lastSeenAt: true,
        },
      }),
    ]);
    if (res[0] > 0) {
      staffCount = res[0];
      channelCount = res[1];
      messageCount = res[2];
      fileCount = res[3];
      fileBytes = res[4] as any;
      backupCount = res[5];
      announcements = res[6];
      allStaff = res[7];
    }
  } catch {
    // Graceful offline fallback
  }

  const onlineStaff = allStaff.filter(
    (u) => statusOf({ status: u.status, lastSeenAt: u.lastSeenAt })?.key === "ONLINE"
  );

  const stats = [
    {
      label: "Staff en Red",
      value: staffCount,
      sub: "Miembros activos",
      icon: IconUsers,
      href: "/founder/users",
      gradient: "from-rose-500/20 to-red-600/10",
      iconColor: "text-rose-400",
      border: "hover:border-rose-500/40",
    },
    {
      label: "Canales de Chat",
      value: channelCount,
      sub: `${messageCount} mensajes`,
      icon: IconChat,
      href: "/chat",
      gradient: "from-cyan-500/20 to-blue-600/10",
      iconColor: "text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
    {
      label: "Archivos & Drive",
      value: fileCount,
      sub: fileBytes?._sum?.size ? fmtBytes(fileBytes._sum.size) : "0 B",
      icon: IconFolder,
      href: "/files",
      gradient: "from-emerald-500/20 to-teal-600/10",
      iconColor: "text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    {
      label: "Copias de Seguridad",
      value: backupCount,
      sub: "Respaldos seguros",
      icon: IconBackup,
      href: "/founder/backups",
      gradient: "from-amber-500/20 to-orange-600/10",
      iconColor: "text-amber-400",
      border: "hover:border-amber-500/40",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-28">
      {/* Welcome Hero Banner */}
      <div className="glass-card relative overflow-hidden p-6 md:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Bienvenido, {user.displayName}
              </h1>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-sm font-medium text-slate-400 max-w-xl">
              Panel de control y administración de <span className="text-slate-200 font-semibold">EnigmaCraft Network</span>. Todos los sistemas operativos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="btn-primary flex items-center gap-2 text-xs font-semibold"
            >
              <IconChat className="h-4 w-4" />
              Abrir Chat
            </Link>
            <Link
              href="/directory"
              className="btn-secondary flex items-center gap-2 text-xs font-semibold"
            >
              <IconUsers className="h-4 w-4" />
              Ver Personal
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Metric Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className={`glass-card-interactive p-5 flex flex-col justify-between group select-none ${s.border}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} border border-white/10 ${s.iconColor} shadow-inner`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
                  Detalles
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold tracking-tight text-white mb-1">
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {s.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {s.sub}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Minecraft Network Real-Time Status Widget */}
      <ServerStatusWidget />

      {/* Online Staff and Recent Announcements Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En línea ahora */}
        <section className="lg:col-span-1 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              En Línea ({onlineStaff.length})
            </h2>
            <Link
              href="/directory"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Ver todos
            </Link>
          </div>

          {onlineStaff.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
              <p>No hay otros miembros conectados en este momento.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
              {onlineStaff.map((m) => (
                <Link
                  key={m.id}
                  href={`/directory`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all hover:translate-x-1 duration-150"
                >
                  <Avatar
                    name={m.displayName}
                    color={m.avatarColor}
                    isOnline={true}
                    className="h-9 w-9 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {m.displayName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <RoleBadge role={m.role} showDot={false} className="py-0 px-2 text-[10px]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Tablón de Anuncios */}
        <section className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
              <IconMegaphone className="h-5 w-5 text-rose-400" />
              Últimos Anuncios
            </h2>
            <Link
              href="/announcements"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Ver historial
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
              <p>Aún no se han publicado comunicados en el tablón.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="glass-card-interactive p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                        Comunicado
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-1 mb-1.5">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">Por {a.author.displayName}</span>
                    <Link
                      href="/announcements"
                      className="text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1"
                    >
                      Leer <IconArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
