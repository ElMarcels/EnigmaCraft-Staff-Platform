"use client";

import { useEffect, useState } from "react";
import { IconServer, IconRefresh, IconUsers, IconShield } from "@/components/icons";
import { sounds } from "@/lib/sound-effects";

interface ServerNode {
  name: string;
  type: string;
  port: number;
  online: boolean;
  players: number;
  maxPlayers: number;
  tps: number;
  ramUsage: string;
  pingMs: number;
}

export function ServerStatusWidget() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nodes, setNodes] = useState<ServerNode[]>([
    {
      name: "Proxy Velocity",
      type: "Bungee/Velocity",
      port: 25565,
      online: true,
      players: 142,
      maxPlayers: 1000,
      tps: 20.0,
      ramUsage: "2.8 GB / 8 GB",
      pingMs: 14,
    },
    {
      name: "Survival Custom 1.21",
      type: "Paper 1.21.1",
      port: 25566,
      online: true,
      players: 84,
      maxPlayers: 250,
      tps: 19.96,
      ramUsage: "7.4 GB / 16 GB",
      pingMs: 18,
    },
    {
      name: "BoxPvP Nether",
      type: "Purpur 1.21.1",
      port: 25567,
      online: true,
      players: 46,
      maxPlayers: 150,
      tps: 20.0,
      ramUsage: "5.1 GB / 12 GB",
      pingMs: 16,
    },
    {
      name: "Lobby Principal",
      type: "Paper 1.21.1",
      port: 25568,
      online: true,
      players: 12,
      maxPlayers: 200,
      tps: 20.0,
      ramUsage: "2.1 GB / 6 GB",
      pingMs: 12,
    },
  ]);

  const totalPlayers = nodes.reduce((acc, n) => acc + (n.online ? n.players : 0), 0);
  const maxCapacity = nodes[0]?.maxPlayers || 1000;
  const avgPing = Math.round(nodes.reduce((acc, n) => acc + n.pingMs, 0) / nodes.length);
  const lowestTps = Math.min(...nodes.map((n) => n.tps));

  function refreshMetrics() {
    sounds.playPop();
    setLoading(true);
    setTimeout(() => {
      // Simulate micro-fluctuations in live server network
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          players: Math.max(0, n.players + Math.floor(Math.random() * 5) - 2),
          pingMs: Math.max(8, n.pingMs + Math.floor(Math.random() * 4) - 2),
          tps: Number(Math.min(20.0, 19.92 + Math.random() * 0.08).toFixed(2)),
        }))
      );
      setLastUpdated(new Date());
      setLoading(false);
    }, 600);
  }

  return (
    <div className="glass-card p-6 md:p-7 space-y-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <IconServer className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Infraestructura de Servidores
              </h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Red Operativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Estado de los nodos Paper, Purpur y Velocity en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Actualizado: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button
            onClick={refreshMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refrescar métricas de red"
          >
            <IconRefresh className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Global Quick KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Jugadores Online</span>
          <span className="text-2xl font-black text-white mt-1 block tracking-tight">
            {totalPlayers} <span className="text-xs font-semibold text-slate-500">/ {maxCapacity}</span>
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TPS Promedio</span>
          <span className={`text-2xl font-black mt-1 block tracking-tight ${lowestTps >= 19.8 ? "text-emerald-400" : "text-amber-400"}`}>
            {lowestTps.toFixed(2)}
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Latencia Red</span>
          <span className="text-2xl font-black text-white mt-1 block tracking-tight">
            {avgPing} <span className="text-xs font-semibold text-slate-500">ms</span>
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Versión Minecraft</span>
          <span className="text-base font-black text-indigo-300 mt-2 block tracking-tight truncate">
            1.21.1 Native
          </span>
        </div>
      </div>

      {/* Sub-server Node Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {nodes.map((node) => {
          const tpsGood = node.tps >= 19.8;
          const percentage = Math.min(100, Math.round((node.players / node.maxPlayers) * 100));

          return (
            <div
              key={node.name}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="font-bold text-white text-sm tracking-tight">{node.name}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                  :{node.port}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{node.type}</span>
                <span className="font-mono text-slate-300">{node.ramUsage}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, percentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-white/[0.04]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <IconUsers className="h-3.5 w-3.5 text-slate-400" />
                  {node.players} / {node.maxPlayers}
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span className={tpsGood ? "text-emerald-400" : "text-amber-400"}>
                    {node.tps.toFixed(2)} TPS
                  </span>
                  <span className="text-slate-500">{node.pingMs}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
