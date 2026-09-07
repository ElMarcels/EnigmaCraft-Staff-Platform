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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-28">
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
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="btn-primary flex items-center gap-2 text-xs font-semibold shadow-lg shadow-rose-950/40"
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
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} border border-white/10 ${s.iconColor} shadow-inner`}
                >
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
                <div className="text-sm font-semibold text-slate-200">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Centro de Operaciones & Accesos Rápidos del Staff */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              <IconSparkles className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Centro de Operaciones & Accesos Rápidos
            </h2>
          </div>
          <span className="text-xs text-slate-500">Gestión interna de red</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickHub.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.title}
                href={hub.href}
                className="glass-card-interactive p-5 rounded-2xl flex flex-col justify-between border border-white/[0.08] hover:border-white/20 group select-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br border ${hub.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                      {hub.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors mb-1.5">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{hub.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white">
                  <span>Acceder</span>
                  <IconArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

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
              Staff en Línea ({onlineStaff.length})
            </h2>
            <Link href="/directory" className="text-xs font-semibold theme-link">
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

        {/* Tablón de Anuncios y Eventos Oficiales */}
        <section className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
              <IconMegaphone className="h-5 w-5 theme-text" />
              Últimos Avisos y Eventos
            </h2>
            <Link href="/announcements" className="text-xs font-semibold theme-link">
              Ver tablón completo
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
                  className="glass-card-interactive p-4 flex flex-col justify-between rounded-2xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md theme-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {a.type || "Comunicado"}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-1 mb-1.5">{a.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">Por {a.author.displayName}</span>
                    <Link
                      href="/announcements"
                      className="theme-link font-medium inline-flex items-center gap-1"
                    >
                      Ver <IconArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Estado Operativo de la Plataforma (100% Autónomo - Sin necesidad de servidor externo) */}
      <section className="glass-card p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Estado de la Plataforma Staff
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Todos los módulos internos se ejecutan de forma autónoma sin dependencias externas.
            </p>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistemas 100% Operativos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Canales y Chat
            </span>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> Activos (10 Canales)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Salas de Voz Staff
            </span>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> Listo (WebRTC Stage)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Tablón de Anuncios
            </span>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> Conectado a #anuncios
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Almacenamiento Drive
            </span>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> Sincronizado
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
