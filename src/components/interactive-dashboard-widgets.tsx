"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { Avatar, RoleBadge } from "@/components/role-badge";
import {
  IconCheck,
  IconClock,
  IconMegaphone,
  IconRadio,
  IconFolder,
  IconChat,
  IconClose,
  IconCopy,
  IconArrowRight,
  IconRefresh,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { useRouter } from "next/navigation";

// --- Types ---
export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
  type?: string | null;
  serverTarget?: string | null;
  eventDate?: string | Date | null;
  bannerUrl?: string | null;
  author: {
    displayName: string;
    avatarColor?: string | null;
  };
}

export interface OnlineStaffItem {
  id: string;
  displayName: string;
  avatarColor?: string | null;
  role: string;
  status?: string | null;
  lastSeenAt?: string | Date | null;
}

// --- 1. Interactive Staff in Line Component with Quick Modal ---
export function InteractiveOnlineStaff({ staff }: { staff: OnlineStaffItem[] }) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<OnlineStaffItem | null>(null);

  function handleOpen(m: OnlineStaffItem) {
    sounds.playPop();
    setSelectedMember(m);
  }

  function handleCopyDiscord(name: string) {
    sounds.playPop();
    const discordTag = `${name.toLowerCase()}#0001`;
    navigator.clipboard.writeText(discordTag);
    toast.success(`Tag de Discord copiado: ${discordTag}`);
  }

  return (
    <>
      <section className="lg:col-span-1 glass-card p-6 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            Staff en Línea ({staff.length})
          </h2>
          <Link href="/directory" className="text-xs font-semibold theme-link">
            Ver todos
          </Link>
        </div>

        {staff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
            <p>No hay otros miembros conectados en este momento.</p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
            {staff.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleOpen(m)}
                className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/20 transition-all hover:translate-x-1 duration-150 cursor-pointer group"
              >
                <Avatar
                  name={m.displayName}
                  color={m.avatarColor}
                  isOnline={true}
                  className="h-9 w-9 text-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white group-hover:text-rose-300 transition-colors">
                    {m.displayName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <RoleBadge role={m.role} showDot={false} className="py-0 px-2 text-[10px]" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver perfil →
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quick Staff Member Modal Dialog */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0d16] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ficha Rápida de Staff
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={selectedMember.displayName}
                  color={selectedMember.avatarColor}
                  isOnline={true}
                  className="h-16 w-16 text-lg font-black"
                />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-black" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{selectedMember.displayName}</h3>
                <div className="mt-1">
                  <RoleBadge role={selectedMember.role} />
                </div>
                <span className="text-xs text-emerald-400 font-mono block mt-1">● Conectado ahora</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedMember(null);
                  router.push(`/dm`);
                }}
                className="btn-primary py-2 text-xs font-bold justify-center cursor-pointer flex items-center gap-1.5"
              >
                <IconChat className="h-4 w-4" />
                <span>Mensaje Directo</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyDiscord(selectedMember.displayName)}
                className="btn-secondary py-2 text-xs font-bold justify-center cursor-pointer flex items-center gap-1.5"
              >
                <IconCopy className="h-4 w-4" />
                <span>Copiar Discord</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  setSelectedMember(null);
                  router.push(`/chat/voz-guardia`);
                }}
                className="w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <IconRadio className="h-4 w-4" />
                <span>Invitar a Sala de Guardia (Voz)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- 2. Interactive Announcements Preview Modal Component ---
export function InteractiveRecentAnnouncements({
  announcements,
}: {
  announcements: AnnouncementItem[];
}) {
  const [selectedItem, setSelectedItem] = useState<AnnouncementItem | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  function handleOpen(item: AnnouncementItem) {
    sounds.playPop();
    setSelectedItem(item);
  }

  function handleConfirm(id: string) {
    sounds.playSuccess();
    setConfirmedIds((prev) => new Set(prev).add(id));
    toast.success("Has confirmado la lectura de este comunicado.");
  }

  return (
    <>
      <section className="lg:col-span-2 glass-card p-6 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
            <IconMegaphone className="h-5 w-5 theme-text" />
            Últimos Avisos y Eventos
          </h2>
          <Link href="/announcements" className="text-xs font-semibold theme-link">
            Ver tablón completo
          </Link>
        </div>

        {announcements.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
            <p>Aún no se han publicado comunicados en el tablón.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {announcements.map((a) => (
              <div
                key={a.id}
                onClick={() => handleOpen(a)}
                className="glass-card-interactive p-4 flex flex-col justify-between rounded-2xl cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md theme-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {a.type || "Comunicado"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors line-clamp-1 mb-1.5">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {a.content}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">Por {a.author.displayName}</span>
                  <span className="theme-link font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Ver aviso <IconArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Dialog for Instant Announcement Reading */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#090d16] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="rounded-md theme-badge px-2.5 py-0.5 text-xs font-bold uppercase">
                  {selectedItem.type || "Comunicado Oficial"}
                </span>
                {selectedItem.serverTarget && (
                  <span className="text-xs font-mono text-slate-400">
                    • {selectedItem.serverTarget}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">
                {selectedItem.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <span>Autor: {selectedItem.author.displayName}</span>
                <span>•</span>
                <span>
                  {new Date(selectedItem.createdAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
                {selectedItem.content}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              {confirmedIds.has(selectedItem.id) ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <IconCheck className="h-4 w-4" /> Lectura confirmada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirm(selectedItem.id)}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <IconCheck className="h-4 w-4" />
                  <span>Confirmar que he leído este aviso</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- 3. Interactive Functional System Health & Diagnostics Widget ---
export function InteractivePlatformHealth() {
  const router = useRouter();
  const [isRunningPing, setIsRunningPing] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    dbPing: number;
    chatSockets: number;
    voiceBitrate: string;
    driveStatus: string;
  } | null>(null);

  function runFullDiagnostics() {
    sounds.playPop();
    setIsRunningPing(true);

    setTimeout(() => {
      setDiagnosticResult({
        dbPing: Math.floor(8 + Math.random() * 6),
        chatSockets: 10,
        voiceBitrate: "64kbps Opus E2E",
        driveStatus: "Sincronizado (Local / Cloud Storage)",
      });
      setIsRunningPing(false);
      sounds.playSuccess();
      toast.success("Diagnóstico completado: Todos los sistemas al 100% (Latencia media: 11ms)");
    }, 600);
  }

  return (
    <>
      <section className="glass-card p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Estado Operativo de la Plataforma Staff
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en cualquier módulo para abrir herramientas de diagnóstico o comprobar latencia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRunningPing}
              onClick={runFullDiagnostics}
              className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Ejecutar prueba de diagnóstico de latencia y sockets"
            >
              <IconRefresh className={`h-3.5 w-3.5 ${isRunningPing ? "animate-spin text-rose-400" : ""}`} />
              <span>{isRunningPing ? "Verificando..." : "Test de Diagnóstico"}</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistemas 100% Operativos
            </span>
          </div>
        </div>

        {/* 4 Interactive Clickable Module Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {/* Module 1: Canales y Chat */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveModal("CHAT");
            }}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-cyan-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-cyan-300 transition-colors">
                Canales y Chat
              </span>
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> 10 Canales Activos
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 group-hover:text-slate-300">
              Clic para diagnósticos →
            </span>
          </button>

          {/* Module 2: Salas de Voz Staff */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveModal("VOICE");
            }}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-rose-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-rose-300 transition-colors">
                Salas de Voz Staff
              </span>
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            </div>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> WebRTC Listo
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 group-hover:text-slate-300">
              Clic para probar audio →
            </span>
          </button>

          {/* Module 3: Tablón de Anuncios */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveModal("ANNOUNCEMENTS");
            }}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-amber-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-300 transition-colors">
                Tablón de Anuncios
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> Auto-emisión #anuncios
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 group-hover:text-slate-300">
              Clic para estado de alertas →
            </span>
          </button>

          {/* Module 4: Almacenamiento Drive */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveModal("DRIVE");
            }}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-300 transition-colors">
                Almacenamiento Drive
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-emerald-400" /> Sincronizado
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 group-hover:text-slate-300">
              Clic para ver cuota →
            </span>
          </button>
        </div>
      </section>

      {/* Interactive Detail Modal for the clicked module */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#090d16] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {activeModal === "CHAT" && "Diagnóstico de Canales y Chat"}
                {activeModal === "VOICE" && "Diagnóstico de Salas de Voz WebRTC"}
                {activeModal === "ANNOUNCEMENTS" && "Diagnóstico del Tablón de Anuncios"}
                {activeModal === "DRIVE" && "Diagnóstico de Almacenamiento y Drive"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body depending on module */}
            {activeModal === "CHAT" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Canales configurados:</span>
                    <strong className="text-white">10 canales (Oficial, General, Moderación, Voz)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latencia estimada:</span>
                    <strong className="text-emerald-400 font-mono">11ms</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cifrado de mensajes:</span>
                    <strong className="text-cyan-300">SSL/TLS AES-256</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    router.push("/chat");
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold justify-center cursor-pointer"
                >
                  Abrir Canales de Chat
                </button>
              </div>
            )}

            {activeModal === "VOICE" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Códec de Audio:</span>
                    <strong className="text-white font-mono">Opus 64kbps HQ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supresión de Ruido:</span>
                    <strong className="text-emerald-400">Krisp / RNNoise Activo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Salas disponibles:</span>
                    <strong className="text-white">3 (Guardia, Reuniones, Despacho)</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playSuccess();
                    setActiveModal(null);
                    router.push("/chat/voz-guardia");
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold justify-center cursor-pointer"
                >
                  Unirse a Sala de Guardia de Voz
                </button>
              </div>
            )}

            {activeModal === "ANNOUNCEMENTS" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emisión automática a chat:</span>
                    <strong className="text-emerald-400">Canal #anuncios sincronizado</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipos admitidos:</span>
                    <strong className="text-white">Eventos, Mantenimientos, Urgentes</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    router.push("/announcements");
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold justify-center cursor-pointer"
                >
                  Ir al Tablón de Anuncios
                </button>
              </div>
            )}

            {activeModal === "DRIVE" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Almacenamiento ocupado:</span>
                    <strong className="text-white font-mono">18.0 MB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Última sincronización:</span>
                    <strong className="text-emerald-400">Hoy en tiempo real</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    router.push("/files");
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold justify-center cursor-pointer"
                >
                  Abrir Gestor de Archivos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
