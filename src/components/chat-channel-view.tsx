"use client";

import { useState } from "react";
import { MessageList, MessageDTO } from "@/components/message-list";
import { MessageComposer } from "@/components/message-composer";
import { ChannelMembersSidebar, ChannelMemberDTO } from "@/components/channel-members-sidebar";
import { IconUserGroup } from "@/components/icons";

export function ChatChannelView({
  channel,
  messages,
  userDisplayName,
  members,
}: {
  channel: { id: string; name: string; type: string; description: string | null; categoryName: string };
  messages: MessageDTO[];
  userDisplayName: string;
  members?: ChannelMemberDTO[];
}) {
  const [showMembers, setShowMembers] = useState(true);

  return (
    <div className="flex h-full min-w-0 flex-1 overflow-hidden">
      {/* Center Feed */}
      <div className="flex flex-1 min-w-0 flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-white/[0.08] px-5 py-3 bg-[#080b12]/80 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-white">
              <span className="font-extrabold text-base tracking-tight">#{channel.name}</span>
              {channel.type === "VOICE" ? (
                <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-300">
                  Voz
                </span>
              ) : null}
            </div>
            {channel.description ? (
              <p className="truncate text-xs text-slate-400 mt-0.5">{channel.description}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMembers((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border select-none ${
                showMembers
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Alternar lista de miembros"
            >
              <IconUserGroup className="h-4 w-4" />
              <span className="hidden sm:inline">Miembros</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessageList messages={messages} />
        </div>

        {/* Message Composer */}
        {channel.type === "VOICE" ? null : <MessageComposer channelId={channel.id} />}
      </div>

      {/* Right Members Drawer */}
      <ChannelMembersSidebar
        members={members}
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
}
