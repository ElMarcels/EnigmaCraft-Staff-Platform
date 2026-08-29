import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoleBadge } from "@/components/role-badge";
import {
  IconUsers,
  IconChat,
  IconFolder,
  IconMegaphone,
  IconBackup,
} from "@/components/icons";

export const dynamic = "force-dynamic";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [staffCount, channelCount, messageCount, fileCount, fileBytes, backupCount, announcements] =
    await Promise.all([
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
    ]);

  const stats = [
    { label: "Staff activo", value: staffCount, icon: IconUsers, href: "/founder/users" },
    { label: "Canales", value: channelCount, icon: IconChat, href: "/chat" },
    { label: "Archivos", value: fileCount, icon: IconFolder, href: "/files" },
    { label: "Copias de seguridad", value: backupCount, icon: IconBackup, href: "/founder/backups" },
  ];

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Hola, {user.displayName} 👋
        </h1>
        <p className="mt-1 text-sm text-white/40">
          <RoleBadge role={user.role} /> · Tienes{" "}
          {fileBytes._sum.size ? fmtBytes(fileBytes._sum.size) : "0 B"} en archivos y{" "}
          {messageCount} mensajes enviados.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="card transition-colors hover:bg-white/[0.06]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <Icon />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-white/40">{s.label}</div>
            </Link>
          );
        })}
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <IconMegaphone className="text-indigo-300" /> Últimos anuncios
          </h2>
          <Link href="/announcements" className="text-sm text-indigo-300 hover:underline">
            Ver todos
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="card text-sm text-white/40">Aún no hay anuncios.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <span className="text-xs text-white/30">
                    {a.author.displayName} · {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/60">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
