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
import { getAllVoicePresence } from "@/lib/voice-presence";
import {
  InteractiveOnlineStaff,
  InteractiveRecentAnnouncements,
  InteractivePlatformHealth,
  InteractiveMetricCards,
  InteractiveOperationsHub,
  InteractiveRecentChatWidget,
} from "@/components/interactive-dashboard-widgets";

export const dynamic = "force-dynamic";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let staffCount = 1;
  let channelCount = 0;
  let messageCount = 0;
  let fileCount = 0;
  let fileBytes = { _sum: { size: 0 } };
  let backupCount = 0;
  let dbFiles: any[] = [];
  let dbBackups: any[] = [];
  let dbChannels: any[] = [];
  let dbRecentMessages: any[] = [];
  let announcements: any[] = [];
  let allStaff: any[] = [
    {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      avatarColor: user.avatarColor || "#f43f5e",
      role: user.role,
      status: "En línea",
      lastSeenAt: new Date(),
    },
  ];

  try {
    const [
      staffCountRes,
      channelCountRes,
      messageCountRes,
      fileCountRes,
      fileBytesRes,
      backupCountRes,
      announcementsRes,
      staffListRes,
      filesRes,
      backupsRes,
      channelsRes,
      recentMessagesRes,
    ] = await Promise.allSettled([
      prisma.user.count({ where: { active: true } }),
      prisma.channel.count(),
      prisma.message.count(),
      prisma.fileNode.count(),
      prisma.fileNode.aggregate({ _sum: { size: true } }),
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
          username: true,
          avatarColor: true,
          role: true,
          status: true,
          lastSeenAt: true,
          contactDiscord: true,
        },
      }),
      prisma.fileNode.findMany({
        take: 15,
        orderBy: [{ isFolder: "desc" }, { createdAt: "desc" }],
        include: { owner: true },
      }),
      prisma.backup.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { creator: true },
      }),
      prisma.channel.findMany({
        take: 30,
        orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
        include: { category: true },
      }),
      prisma.message.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { author: true, channel: true },
      }),
    ]);

    if (staffCountRes.status === "fulfilled" && staffCountRes.value > 0) staffCount = staffCountRes.value;
    if (channelCountRes.status === "fulfilled") channelCount = channelCountRes.value;
    if (messageCountRes.status === "fulfilled") messageCount = messageCountRes.value;
    if (fileCountRes.status === "fulfilled") fileCount = fileCountRes.value;
    if (fileBytesRes.status === "fulfilled") fileBytes = fileBytesRes.value as any;
    if (backupCountRes.status === "fulfilled") backupCount = backupCountRes.value;
    if (announcementsRes.status === "fulfilled" && announcementsRes.value.length > 0) announcements = announcementsRes.value;
    if (staffListRes.status === "fulfilled" && staffListRes.value.length > 0) allStaff = staffListRes.value;
    if (filesRes.status === "fulfilled") dbFiles = filesRes.value;
    if (backupsRes.status === "fulfilled") dbBackups = backupsRes.value;
    if (channelsRes.status === "fulfilled") dbChannels = channelsRes.value;
    if (recentMessagesRes.status === "fulfilled") dbRecentMessages = recentMessagesRes.value;
  } catch (err) {
    console.error("Dashboard database query error:", err);
  }

  // Calculate real total storage in bytes
  const totalFileBytes =
    fileBytes?._sum?.size !== null && fileBytes?._sum?.size !== undefined
      ? Number(fileBytes._sum.size)
      : dbFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0);

  const safeFiles = dbFiles.map((f) => ({
    id: String(f.id),
    name: String(f.name),
    isFolder: Boolean(f.isFolder),
    size: Number(f.size || 0),
    mimeType: f.mimeType || (f.isFolder ? "folder" : "application/octet-stream"),
    url: f.url || null,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
    owner: {
      displayName: f.owner?.displayName || "Staff",
      avatarColor: f.owner?.avatarColor || "#6366f1",
    },
  }));

  const safeBackups = dbBackups.map((b) => ({
    id: String(b.id),
    name: String(b.name),
    size: Number(b.size || 0),
    status: String(b.status || "completed"),
    type: String(b.type || "manual"),
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
    creator: {
      displayName: b.creator?.displayName || "Sistema",
    },
  }));

  const safeChannels = dbChannels.map((c) => ({
    id: String(c.id),
    name: String(c.name),
    type: String(c.type || "TEXT"),
    description: c.description || null,
    categoryName: c.category?.name || "CANALES",
  }));

  const safeStaff = allStaff.map((u) => ({
    id: String(u.id),
    displayName: String(u.displayName),
    username: String(u.username || u.displayName),
    avatarColor: u.avatarColor || "#f43f5e",
    role: String(u.role),
    status: u.status || null,
    contactDiscord: u.contactDiscord || null,
    lastSeenAt: u.lastSeenAt
      ? u.lastSeenAt instanceof Date
        ? u.lastSeenAt.toISOString()
        : String(u.lastSeenAt)
      : null,
  }));

  // Detect users currently connected to WebRTC voice channels
  const voicePresences = getAllVoicePresence();
  const voiceUserIds = new Set(
    Object.values(voicePresences).flatMap((list) => list.map((p) => p.userId))
  );

  // Real connected staff:
  // 1. Current logged in user is 100% online
  // 2. Any staff member currently inside a WebRTC voice call
  // 3. Any staff member with active heartbeat within the last 10 minutes (and not away)
  const safeOnline = safeStaff.filter((u) => {
    if (u.id === user.id || u.username === user.username) return true;
    if (voiceUserIds.has(u.id) || voiceUserIds.has(u.username)) return true;
    const raw = allStaff.find((x) => String(x.id) === u.id);
    if (!raw || !raw.lastSeenAt) return false;
    const diffMs = Date.now() - new Date(raw.lastSeenAt).getTime();
    return diffMs < 10 * 60 * 1000 && raw.status !== "AWAY" && raw.status !== "VACATION";
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

  const safeRecentMessages = dbRecentMessages.map((m) => ({
    id: String(m.id),
    content: String(m.content),
    channelId: String(m.channelId),
    channelName: String(m.channel?.name || "chat"),
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    author: {
      displayName: m.author?.displayName || "Staff",
      role: String(m.author?.role || "STAFF"),
      avatarColor: m.author?.avatarColor || "#6366f1",
    },
  }));

  const stats = [
    {
      label: "Staff en Red",
      value: staffCount,
      sub: `${safeOnline.length} en línea ahora`,
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
      sub: totalFileBytes > 0 ? fmtBytes(totalFileBytes) : `${fileCount} elemento${fileCount === 1 ? "" : "s"} en Drive`,
      iconName: "files",
      href: "/files",
      gradient: "from-emerald-500/20 to-teal-600/10",
      iconColor: "text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    {
      label: "Copias de Seguridad",
      value: backupCount,
      sub: backupCount > 0 ? `${backupCount} copias registradas` : "Crear respaldo manual",
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
      <InteractiveMetricCards
        currentUser={{ id: user.id, displayName: user.displayName, role: user.role }}
        stats={stats}
        staffList={safeStaff}
        fileList={safeFiles}
        backupList={safeBackups}
        channelList={safeChannels}
        totalFileBytes={totalFileBytes}
      />

      {/* Centro de Operaciones & Accesos Rápidos del Staff (Direct Voice PiP Launch & Interactive Modals) */}
      <InteractiveOperationsHub
        currentUser={{ id: user.id, displayName: user.displayName, role: user.role }}
        staffList={safeStaff}
      />

      {/* Actividad Reciente del Chat del Staff (Interactive Functional Widget) */}
      <InteractiveRecentChatWidget messages={safeRecentMessages} />

      {/* Online Staff and Recent Announcements Split View (Interactive Functional Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InteractiveOnlineStaff staff={safeOnline} />
        <InteractiveRecentAnnouncements announcements={safeAnnouncements} />
      </div>

      {/* Estado Operativo de la Plataforma (Interactive Functional Diagnostic Tools with Live DB Stats) */}
      <InteractivePlatformHealth
        channelCount={channelCount}
        messageCount={messageCount}
        totalFileBytes={totalFileBytes}
        fileCount={fileCount}
        channelList={safeChannels}
      />
    </div>
  );
}
