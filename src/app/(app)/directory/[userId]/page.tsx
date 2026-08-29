import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar, RoleBadge } from "@/components/role-badge";
import {
  IconArrowLeft,
  IconClock,
  IconMail,
  IconArrowRight,
} from "@/components/icons";
import { statusOf, isOnline } from "@/lib/role-meta";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      active: true,
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
  if (!member || !member.active) notFound();

  const st = statusOf(member);
  const online = isOnline(member.lastSeenAt);

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link
        href="/directory"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
      >
        <IconArrowLeft className="h-4 w-4" /> Volver al directorio
      </Link>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-white/10 p-6">
          <Avatar name={member.displayName} color={member.avatarColor} className="h-16 w-16 text-2xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold text-white">
                {member.displayName}
              </span>
              <RoleBadge role={member.role} />
            </div>
            <div className="text-sm text-white/40">@{member.username}</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm">
              {st ? (
                <>
                  <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                  <span className={`font-semibold ${st.text}`}>{st.label}</span>
                </>
              ) : (
                <span className="text-white/35">Inactivo</span>
              )}
            </div>
          </div>
          {member.id !== current.id ? (
            <Link
              href={`/dm/${member.id}`}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/25"
            >
              <IconMail className="h-4 w-4" />
              Escribirle
              <IconArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <div className="space-y-3 p-6 text-sm">
          <div>
            <div className="label">Contacto</div>
            {member.contactDiscord ? (
              <div className="mt-1 space-y-1.5">
                <div className="rounded-md bg-white/[0.03] px-3 py-1.5 text-white/80">
                  <span className="mr-1 text-white/30">Discord:</span>
                  @{member.contactDiscord}
                </div>
                {member.contactEmail ? (
                  <a
                    href={`mailto:${member.contactEmail}`}
                    className="block rounded-md bg-white/[0.03] px-3 py-1.5 text-indigo-300 hover:underline"
                  >
                    <span className="mr-1 text-white/30">Email:</span>
                    {member.contactEmail}
                  </a>
                ) : null}
                {member.contactOther ? (
                  <div className="rounded-md bg-white/[0.03] px-3 py-1.5 text-white/80">
                    <span className="mr-1 text-white/30">Otro:</span>
                    {member.contactOther}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-1 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Ficha de contacto sin completar.
              </div>
            )}
          </div>

          <div>
            <div className="label">Actividad</div>
            <div className="mt-1 space-y-1.5 text-white/60">
              {online ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Conectado ahora mismo
                </div>
              ) : member.lastSeenAt ? (
                <div className="flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5" />
                  Último acceso:{" "}
                  {new Date(member.lastSeenAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              ) : (
                <div>Todavía no ha iniciado sesión.</div>
              )}
              {member.timezone ? (
                <div className="flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5" />
                  Zona horaria: {member.timezone}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 text-xs text-white/30">
            Miembro desde{" "}
            {new Date(member.createdAt).toLocaleDateString("es-ES")}
          </div>
        </div>
      </div>
    </div>
  );
}