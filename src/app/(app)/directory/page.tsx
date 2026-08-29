import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { DirectorySelfCard } from "@/components/directory-self-card";
import {
  IconClock,
  IconMail,
  IconArrowRight,
} from "@/components/icons";
import { statusOf, isOnline } from "@/lib/role-meta";

export const dynamic = "force-dynamic";

type ContactPicker = {
  id: string;
  username: string;
  displayName: string;
  role: import("@prisma/client").Role;
  avatarColor: string;
  contactDiscord: string | null;
  contactEmail: string | null;
  contactOther: string | null;
  timezone: string | null;
  status: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
};

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-md bg-white/[0.03] px-3 py-1.5" title={label}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/30">
        {label}
      </div>
      {href ? (
        <a
          href={href}
          className="text-sm text-indigo-300 transition-colors hover:underline"
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <div className="break-words text-sm text-white/80">{value}</div>
      )}
    </div>
  );
}

function ContactCard({
  user,
  isSelf,
}: {
  user: ContactPicker;
  isSelf: boolean;
}) {
  const st = statusOf(user);
  const online = isOnline(user.lastSeenAt);

  return (
    <div className="card flex flex-col p-5">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={user.displayName} color={user.avatarColor} className="h-11 w-11 text-base" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white">{user.displayName}</span>
            <RoleBadge role={user.role} />
          </div>
          <div className="truncate text-xs text-white/40">@{user.username}</div>
        </div>
      </div>

      {user.contactDiscord ? (
        <div className="space-y-1.5">
          <ContactRow label="Discord" value={user.contactDiscord} />
          {user.contactEmail ? (
            <ContactRow
              label="Email"
              value={user.contactEmail}
              href={`mailto:${user.contactEmail}`}
            />
          ) : null}
          {user.contactOther ? (
            <ContactRow label="Otro" value={user.contactOther} />
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Ficha de contacto sin completar.
        </div>
      )}

      <div className="mt-3 space-y-1.5 text-xs">
        {st ? (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${st.dot}`} />
            <span className={`font-semibold ${st.text}`}>{st.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-white/35">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            Inactivo
          </div>
        )}
        {user.lastSeenAt && !online ? (
          <div className="flex items-center gap-1.5 text-white/30">
            <IconClock className="h-3.5 w-3.5" />
            Último acceso:{" "}
            {new Date(user.lastSeenAt).toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
            })}
          </div>
        ) : null}
        {user.timezone ? (
          <div className="flex items-center gap-1.5 text-white/30">
            <IconClock className="h-3.5 w-3.5" />
            {user.timezone}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <IconClock className="h-3.5 w-3.5" />
          Miembro desde {new Date(user.createdAt).toLocaleDateString("es-ES")}
        </div>
        {!isSelf ? (
          <Link
            href={`/dm/${user.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/25"
          >
            <IconMail className="h-3.5 w-3.5" />
            Escribirle
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function DirectoryPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const users: ContactPicker[] = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      avatarColor: true,
      contactDiscord: true,
      contactEmail: true,
      contactOther: true,
      timezone: true,
      status: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Directorio de contactos</h1>
        <p className="text-sm text-white/40">
          Datos de contacto, actividad y disponibilidad del equipo.
        </p>
      </header>

      <DirectorySelfCard
        user={{
          displayName: current.displayName,
          username: current.username,
          role: current.role,
          avatarColor: current.avatarColor,
          contactDiscord: current.contactDiscord,
          contactEmail: current.contactEmail,
          contactOther: current.contactOther,
          timezone: current.timezone,
          status: current.status,
          lastSeenAt: current.lastSeenAt,
          createdAt: current.createdAt,
        }}
      />

      <div className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-white/40">
        Personal ({users.length})
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <ContactCard key={u.id} user={u} isSelf={u.id === current.id} />
        ))}
      </div>
    </div>
  );
}