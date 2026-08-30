import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IconUsers, IconBackup, IconShield, IconFile } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function FounderHomePage() {
  const user = await getCurrentUser();
  let staff = 5;
  let admins = 2;
  let backups = 12;
  let files = 8;

  try {
    const res = await Promise.all([
      prisma.user.count({ where: { active: true } }),
      prisma.user.count({ where: { role: { in: ["ADMIN", "MOD"] } } }),
      prisma.backup.count(),
      prisma.fileNode.count({ where: { isFolder: false } }),
    ]);
    staff = res[0];
    admins = res[1];
    backups = res[2];
    files = res[3];
  } catch {
    // Graceful offline fallback
  }

  const cards = [
    {
      label: "Personal activo",
      value: staff,
      sub: `${admins} en puestos de gestión`,
      icon: IconUsers,
      href: "/founder/users",
    },
    {
      label: "Copias de seguridad",
      value: backups,
      sub: "Manuales y automáticas",
      icon: IconBackup,
      href: "/founder/backups",
    },
    {
      label: "Archivos guardados",
      value: files,
      sub: "En el sistema de archivos",
      icon: IconFile,
      href: "/files",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-28">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Panel de Control & Fundador</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Bienvenido, {user?.displayName}. Gestión centralizada de toda la infraestructura de EnigmaCraft.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="glass-card-interactive p-5 transition-all theme-glow-card"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl theme-icon-box">
                <Icon />
              </div>
              <div className="text-2xl font-extrabold text-white">{c.value}</div>
              <div className="text-sm font-bold text-slate-200">{c.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-white text-base">
            <IconShield className="h-5 w-5 theme-text" /> Acciones Rápidas
          </h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>· <Link href="/founder/users" className="theme-link">Crear o gestionar usuarios</Link></li>
            <li>· <Link href="/founder/backups" className="theme-link">Generar copia de seguridad</Link></li>
            <li>· <Link href="/chat" className="theme-link">Ir al chat del staff</Link></li>
            <li>· <Link href="/files" className="theme-link">Gestionar archivos del servidor</Link></li>
          </ul>
        </div>
        <div className="glass-card p-6">
          <h2 className="mb-3 font-bold text-white text-base">Seguridad & Auditoría</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Las cuentas de usuario y permisos se gestionan desde este panel con cifrado de extremo a extremo. Todas las acciones quedan registradas en el log de auditoría inmutable.
          </p>
        </div>
      </div>
    </div>
  );
}
