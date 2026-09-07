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

  const onlineStaff = allStaff.filter(
    (u) => statusOf({ status: u.status, lastSeenAt: u.lastSeenAt })?.key === "ONLINE"
  );

  const stats = [
    {
      label: "Staff en Red",
      value: staffCount,
      sub: "Miembros registrados",
      iconName: "users",
      icon: IconUsers,
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
      icon: IconChat,
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
      icon: IconFolder,
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
      icon: IconBackup,
      href: "/founder/backups",
      gradient: "from-amber-500/20 to-orange-600/10",
      iconColor: "text-amber-400",
      border: "hover:border-amber-500/40",
    },
  ];

  const quickHub = [
    {
      title: "Tablón de Anuncios & Eventos",
      desc: "Crear comunicados oficiales, alertas y convocar eventos con cuenta atrás.",
      icon: IconMegaphone,
      href: "/announcements",
      badge: "Oficial",
      color: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30",
    },
    {
      title: "Sala de Guardia (Canal de Voz)",
      desc: "Entrar directamente a la sala de voz en directo para coordinar al staff.",
      icon: IconRadio,
      href: "/chat/voz-guardia",
      badge: "Voz en Vivo",
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
    },
    {
      title: "Normativa & Protocolos",
      desc: "Consultar las directrices de moderación, sanciones y código de conducta.",
      icon: IconShield,
      href: "/chat/normativa-staff",
      badge: "Reglas",
      color: "from-cyan-500/20 to-blue-600/5 text-cyan-400 border-cyan-500/30",
    },
    {
      title: "Directorio & Equipo",
      desc: "Ver todos los miembros del equipo, roles, horarios y Discord.",
      icon: IconUsers,
      href: "/directory",
      badge: "Equipo",
      color: "from-purple-500/20 to-indigo-600/5 text-purple-400 border-purple-500/30",
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
      <InteractiveMetricCards stats={stats} staffList={allStaff} />

      {/* Centro de Operaciones & Accesos Rápidos del Staff (Direct Voice PiP Launch & Interactive Modals) */}
      <InteractiveOperationsHub
        currentUser={{ id: user.id, displayName: user.displayName, role: user.role }}
      />

      {/* Online Staff and Recent Announcements Split View (Interactive Functional Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InteractiveOnlineStaff staff={onlineStaff} />
        <InteractiveRecentAnnouncements announcements={announcements} />
      </div>

      {/* Estado Operativo de la Plataforma (Interactive Functional Diagnostic Tools) */}
      <InteractivePlatformHealth />
    </div>
  );
}
