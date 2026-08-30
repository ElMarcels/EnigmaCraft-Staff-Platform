"use client";

import Link from "next/link";
import { Avatar, RoleBadge } from "@/components/role-badge";
import { Role } from "@prisma/client";
import { IconMail, IconUserGroup } from "@/components/icons";

export type ChannelMemberDTO = {
  id: string;
  displayName: string;
  username: string;
  role: Role;
  avatarColor: string;
  isOnline: boolean;
  statusText?: string;
};

const DEMO_CHANNEL_MEMBERS: ChannelMemberDTO[] = [
  {
    id: "1",
    displayName: "Marcel",
    username: "marcel",
    role: "FOUNDER",
    avatarColor: "#f43f5e",
    isOnline: true,
    statusText: "Desarrollando plataforma",
  },
  {
    id: "2",
    displayName: "AlexAdmin",
    username: "alex_sys",
    role: "ADMIN",
    avatarColor: "#e11d48",
    isOnline: true,
    statusText: "Monitoreando TPS",
  },
  {
    id: "3",
    displayName: "LucasMod",
    username: "lucas_guard",
    role: "MOD",
    avatarColor: "#06b6d4",
    isOnline: true,
    statusText: "Atendiendo tickets",
  },
  {
    id: "4",
    displayName: "ElenaBuilder",
    username: "elena_arch",
    role: "BUILDER",
    avatarColor: "#10b981",
    isOnline: true,
    statusText: "Construyendo lobby",
  },
  {
    id: "5",
    displayName: "SofiaStaff",
    username: "sofia_helper",
    role: "STAFF",
    avatarColor: "#a855f7",
    isOnline: false,
    statusText: "Desconectada",
  },
];

const ROLE_ORDER: Role[] = ["FOUNDER", "ADMIN", "MOD", "BUILDER", "STAFF"];

const ROLE_GROUP_NAMES: Record<Role, string> = {
  FOUNDER: "FUNDADORES",
  ADMIN: "ADMINISTRADORES",
  MOD: "MODERADORES",
  BUILDER: "CONSTRUCTORES",
  STAFF: "STAFF DE RED",
};

export function ChannelMembersSidebar({
  members = DEMO_CHANNEL_MEMBERS,
  isOpen = true,
  onClose,
}: {
  members?: ChannelMemberDTO[];
  isOpen?: boolean;
  onClose?: () => void;
}) {
  if (!isOpen) return null;

  const onlineMembers = members.filter((m) => m.isOnline);
  const offlineMembers = members.filter((m) => !m.isOnline);

  return (
    <aside className="w-64 shrink-0 border-l border-white/[0.08] bg-[#07090e]/95 backdrop-blur-2xl flex flex-col h-full overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconUserGroup className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">
            Miembros ({members.length})
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
            title="Cerrar panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Online Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
            En Línea — {onlineMembers.length}
          </div>
          <div className="space-y-1">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={member.displayName}
                    color={member.avatarColor}
                    isOnline={true}
                    className="h-7 w-7 text-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {member.displayName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {member.statusText || `@${member.username}`}
                    </div>
                  </div>
                </div>

                <Link
                  href="/dm"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer"
                  title={`Mensaje directo con ${member.displayName}`}
                >
                  <IconMail className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Section */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
              Desconectados — {offlineMembers.length}
            </div>
            <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
              {offlineMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={member.displayName}
                      color={member.avatarColor}
                      isOnline={false}
                      className="h-7 w-7 text-xs shrink-0 grayscale"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-400 truncate">
                        {member.displayName}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        @{member.username}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
