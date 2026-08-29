import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IconUsers, IconBackup, IconShield, IconFile } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function FounderHomePage() {
  const user = await getCurrentUser();
  const [staff, admins, backups, files] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "MOD"] } } }),
    prisma.backup.count(),
    prisma.fileNode.count({ where: { isFolder: false } }),
  ]);

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
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Panel de control</h1>
        <p className="text-sm text-white/40">
          Bienvenido de nuevo, {user?.displayName}. Desde aquí gestionas toda la
          plataforma.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="card transition-colors hover:bg-white/[0.06]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <Icon />
              </div>
              <div className="text-2xl font-bold text-white">{c.value}</div>
              <div className="text-sm font-medium text-white">{c.label}</div>
              <div className="text-xs text-white/40">{c.sub}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
            <IconShield className="text-amber-300" /> Acciones rápidas
          </h2>
          <ul className="space-y-1 text-sm text-white/60">
            <li>· <Link href="/founder/users" className="text-amber-300 hover:underline">Crear o gestionar usuarios</Link></li>
            <li>· <Link href="/founder/backups" className="text-amber-300 hover:underline">Generar copia de seguridad</Link></li>
            <li>· <Link href="/chat" className="text-amber-300 hover:underline">Ir al chat del staff</Link></li>
            <li>· <Link href="/files" className="text-amber-300 hover:underline">Gestionar archivos del servidor</Link></li>
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold text-white">Recordatorio de seguridad</h2>
          <p className="text-sm text-white/60">
            Las cuentas de usuario solo deberían crearse desde este panel,
            nunca compartiendo credenciales. Si un miembro abandona la network,
            desactiva su cuenta o restablece su contraseña de inmediato.
          </p>
        </div>
      </div>
    </div>
  );
}
