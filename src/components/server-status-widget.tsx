"use client";

import { useState } from "react";
import { IconServer, IconActivity, IconSparkles } from "@/components/icons";

type ServerNode = {
  id: string;
  name: string;
  type: string;
  status: "ONLINE" | "MAINTENANCE" | "OFFLINE";
  tps: number;
  players: number;
  maxPlayers: number;
  ramUsage: string;
  ping: number;
};

const INITIAL_NODES: ServerNode[] = [
  {
    id: "proxy",
    name: "Velocity Proxy (Core)",
    type: "PROXY",
    status: "ONLINE",
    tps: 20.0,
    players: 142,
    maxPlayers: 500,
    ramUsage: "1.8 / 4 GB",
    ping: 11,
  },
  {
    id: "lobby",
    name: "Lobby Principal #1",
    type: "LOBBY",
    status: "ONLINE",
    tps: 20.0,
    players: 28,
    maxPlayers: 100,
    ramUsage: "2.4 / 8 GB",
    ping: 14,
  },
  {
    id: "survival",
    name: "Survival Custom Season 5",
    type: "SURVIVAL",
    status: "ONLINE",
    tps: 19.98,
    players: 86,
    maxPlayers: 200,
    ramUsage: "7.2 / 16 GB",
    ping: 18,
  },
  {
    id: "bedwars",
    name: "BedWars & MiniGames",
    type: "MINIGAMES",
    status: "ONLINE",
    tps: 20.0,
    players: 28,
    maxPlayers: 100,
    ramUsage: "4.1 / 12 GB",
    ping: 15,
  },
];

export function ServerStatusWidget() {
  const [nodes] = useState<ServerNode[]>(INITIAL_NODES);

  const totalPlayers = nodes.reduce((acc, curr) => (curr.type !== "PROXY" ? acc + curr.players : acc), 0);

  return (
    <div className="glass-card p-6 md:p-7 space-y-5 relative overflow-hidden group">
      {/* Background Accent Shimmer */}
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <IconServer className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Estado de la Red de Minecraft
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                En Línea
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoreo de proxies Velocity, nodos Paper 1.21 y rendimiento de TPS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-200">
            <IconActivity className="h-3.5 w-3.5 text-rose-400" />
            <span>{totalPlayers} Jugadores en Red</span>
          </div>
        </div>
      </div>

      {/* Server Nodes Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:border-white/[0.18] hover:bg-white/[0.05] transition-all duration-200 space-y-2.5 group/node"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold text-white tracking-tight truncate">
                  {node.name}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {node.type}
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {node.tps.toFixed(1)} TPS
              </span>
            </div>

            {/* Performance Indicators */}
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Jugadores</span>
                <span className="font-semibold text-slate-200">
                  {node.players} / {node.maxPlayers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Memoria RAM</span>
                <span className="font-mono text-[10px] text-slate-300">{node.ramUsage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Latencia</span>
                <span className="text-[10px] text-slate-400">{node.ping}ms</span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (node.players / node.maxPlayers) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
