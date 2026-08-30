"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, RoleBadge } from "@/components/role-badge";
import {
  IconClock,
  IconMail,
  IconArrowRight,
  IconCheck,
} from "@/components/icons";
import { statusOf, isOnline } from "@/lib/role-meta";
import type { Role } from "@prisma/client";

export type ContactUser = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  avatarColor: string;
  contactDiscord: string | null;
  contactEmail: string | null;
  contactOther: string | null;
  timezone: string | null;
  status: string | null;
  lastSeenAt: Date | string | null;
  createdAt: Date | string;
};

export function DirectoryContactCard({
  user,
  isSelf,
}: {
  user: ContactUser;
  isSelf: boolean;
}) {
  const st = statusOf({ status: user.status, lastSeenAt: user.lastSeenAt });
  const online = isOnline(user.lastSeenAt);

  const [copied, setCopied] = useState(false);

  function copyDiscord(tag: string) {
    navigator.clipboard.writeText(tag);
    setCopied(true);
    toast.success(`Copiado @${tag} al portapapeles`, {
      description: "Puedes pegarlo directamente en Discord.",
    });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-card-interactive flex flex-col justify-between p-5 group">
      <div>
        {/* Card Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={user.displayName}
              color={user.avatarColor}
              isOnline={online}
              className="h-11 w-11 text-base"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold text-white text-base">
                  {user.displayName}
                </span>
              </div>
              <div className="truncate text-xs font-medium text-slate-400">
                @{user.username}
              </div>
            </div>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {/* Contact Info Pills */}
        <div className="space-y-2 mb-4">
          {user.contactDiscord ? (
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-xs">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Discord
                </span>
                <span className="truncate font-semibold text-slate-200">
                  {user.contactDiscord}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyDiscord(user.contactDiscord!)}
                className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <IconCheck className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">Copiado</span>
                  </>
                ) : (
                  "Copiar"
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 font-medium">
              Ficha de contacto sin completar.
            </div>
          )}

          {user.contactEmail && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email
              </span>
              <a
                href={`mailto:${user.contactEmail}`}
                className="truncate font-medium text-rose-400 hover:underline block"
              >
                {user.contactEmail}
              </a>
            </div>
          )}
        </div>

        {/* Presence & Availability Meta */}
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {st ? (
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold text-[11px] border ${st.bg} ${st.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 font-medium text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Desconectado
              </span>
            )}
          </div>

          {user.lastSeenAt && !online ? (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <IconClock className="h-3.5 w-3.5" />
              Última conexión:{" "}
              {new Date(user.lastSeenAt).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3.5 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate">
          En el staff desde {new Date(user.createdAt).toLocaleDateString("es-ES")}
        </span>
        {!isSelf && (
          <Link
            href={`/dm/${user.id}`}
            className="btn-primary py-1 px-3 text-xs font-semibold"
          >
            <IconMail className="h-3.5 w-3.5" />
            Mensaje
          </Link>
        )}
      </div>
    </div>
  );
}
