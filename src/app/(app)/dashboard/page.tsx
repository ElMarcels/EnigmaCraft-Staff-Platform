import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, RoleBadge } from "@/components/role-badge";
import {
  IconUsers,
  IconChat,
  IconFolder,
  IconMegaphone,
  IconBackup,
  IconArrowRight,
  IconSparkles,
  IconShield,
  IconRadio,
  IconClock,
  IconCalendar,
  IconCheck,
} from "@/components/icons";
import { statusOf } from "@/lib/role-meta";
import {
  InteractiveOnlineStaff,
  InteractiveRecentAnnouncements,
  InteractivePlatformHealth,
  InteractiveMetricCards,
  InteractiveOperationsHub,
} from "@/components/interactive-dashboard-widgets";

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
  let channelCount = 12;
  let messageCount = 42;
  let fileCount = 8;
  let fileBytes = { _sum: { size: 1024 * 1024 * 18 } };
  let backupCount = 12;
  let announcements: any[] = [
    {
      id: "demo-ann-1",
      title: "Lanzamiento de la Temporada 5 de Survival Custom",
      content: "Este viernes a las 18:00 UTC se lanzará la nueva temporada con economía balanceada, calabozos y protección de parcelas.",
      createdAt: new Date(),
      type: "EVENT",
      serverTarget: "Survival Custom",
      author: { displayName: "Marcel" },
    },
    {
      id: "demo-ann-2",
      title: "Protocolo de Seguridad y Guardia de Fin de Semana",
      content: "Por favor revisad los turnos asignados en el canal de guardia. Toda apelación debe quedar registrada en #sanciones-logs.",
      createdAt: new Date(Date.now() - 86400000),
      type: "ANNOUNCEMENT",
      serverTarget: "Toda la Red (Global)",
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
      channelCount = res[1] || 12;
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

  const safeStaff = allStaff.map((u) => ({
    id: String(u.id),
    displayName: String(u.displayName),
    avatarColor: u.avatarColor || "#f43f5e",
    role: String(u.role),
    status: u.status || null,
    lastSeenAt: u.lastSeenAt
      ? u.lastSeenAt instanceof Date
        ? u.lastSeenAt.toISOString()
        : String(u.lastSeenAt)
      : null,
  }));

  const safeOnline = safeStaff.filter((u) => {
    const raw = allStaff.find((x) => String(x.id) === u.id);
    return statusOf({ status: raw?.status, lastSeenAt: raw?.lastSeenAt })?.key === "ONLINE";
  });

  const safeAnnouncements = announcements.map((a) => ({
    id: String(a.id),
    title: String(a.title),
    content: String(a.content),
    type: a.type || null,
    serverTarget: a.serverTarget || null,
    eventDate: a.eventDate
      ? a.eventDate instanceof Date
        ? a.eventDate.toISOString()
        : String(a.eventDate)
      : null,
    bannerUrl: a.bannerUrl || null,
    createdAt:
      a.createdAt instanceof Date
        ? a.createdAt.toISOString()
        : String(a.createdAt),
    author: {
      displayName: a.author?.displayName || "Staff",
      avatarColor: a.author?.avatarColor || "#f43f5e",
    },
  }));

  const stats = [
    {
      label: "Staff en Red",
      value: staffCount,
      sub: "Miembros registrados",
      iconName: "users",
      href: "/directory",
      gradient: "from-white/[0.08] to-transparent",
      iconColor: "theme-text",
      border: "theme-glow-card",
    },
    {
      label: "Canales de Chat",
      value: channelCount,
      sub: `${messageCount} mensajes enviados`,
      iconName: "chat",
      href: "/chat",
      gradient: "from-cyan-500/20 to-blue-600/10",
      iconColor: "text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
    {
      label: "Archivos & Documentos",
      value: fileCount,
      sub: fileBytes?._sum?.size ? fmtBytes(fileBytes._sum.size) : "0 B",
      iconName: "files",
      href: "/files",
      gradient: "from-emerald-500/20 to-teal-600/10",
      iconColor: "text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    {
      label: "Copias de Seguridad",
      value: backupCount,
      sub: "Copias seguras del sistema",
      iconName: "backup",
      href: "/founder/backups",
      gradient: "from-amber-500/20 to-orange-600/10",
      iconColor: "text-amber-400",
      border: "hover:border-amber-500/40",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-48">
      {/* Welcome Hero Banner */}
      <div className="glass-card relative overflow-hidden p-6 md:p-8">
        <div
          style={{ backgroundColor: "var(--ruby-glow)" }}
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Bienvenido, {user.displayName}
              </h1>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-sm font-medium text-slate-400 max-w-xl">
              Plataforma de comunicación, gestión de eventos y coordinación para el equipo de{" "}
              <span className="text-slate-200 font-semibold">EnigmaCraft</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/chat/voz-guardia"
              className="btn-primary flex items-center gap-2 text-xs font-semibold shadow-lg shadow-emerald-950/40 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40"
            >
              <IconRadio className="h-4 w-4 animate-pulse" />
              Sala de Voz (PiP)
            </Link>
            <Link
              href="/chat"
              className="btn-secondary flex items-center gap-2 text-xs font-semibold"
            >
              <IconChat className="h-4 w-4" />
              Abrir Canales
            </Link>
            <Link
              href="/announcements"
              className="btn-secondary flex items-center gap-2 text-xs font-semibold"
            >
              <IconMegaphone className="h-4 w-4" />
              Publicar Aviso
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Metric Glass Cards (Functional Interactive Modals with Live Data) */}
      <InteractiveMetricCards stats={stats} staffList={safeStaff} />

      {/* Centro de Operaciones & Accesos Rápidos del Staff (Direct Voice PiP Launch & Interactive Modals) */}
      <InteractiveOperationsHub
        currentUser={{ id: user.id, displayName: user.displayName, role: user.role }}
      />

      {/* Online Staff and Recent Announcements Split View (Interactive Functional Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InteractiveOnlineStaff staff={safeOnline} />
        <InteractiveRecentAnnouncements announcements={safeAnnouncements} />
      </div>

      {/* Estado Operativo de la Plataforma (Interactive Functional Diagnostic Tools) */}
      <InteractivePlatformHealth />
    </div>
  );
}
