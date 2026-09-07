"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, RoleBadge } from "@/components/role-badge";
import {
  IconDashboard,
  IconChat,
  IconMail,
  IconFolder,
  IconMegaphone,
  IconContact,
  IconShield,
  IconUsers,
  IconBackup,
  IconSettings,
  IconSend,
  IconPlus,
  IconTrash,
  IconDownload,
  IconArrowRight,
  IconClock,
  IconBell,
  IconCheck,
  IconFire,
  IconDiamond,
  IconSparkles,
  IconServer,
  IconRadio,
  IconMic,
  IconHeadphones,
} from "@/components/icons";
import {
  InteractiveOnlineStaff,
  InteractiveRecentAnnouncements,
  InteractivePlatformHealth,
  AnnouncementItem,
  OnlineStaffItem,
} from "@/components/interactive-dashboard-widgets";
import { VoiceProvider } from "@/context/voice-context";
import { FloatingVoiceOverlay } from "@/components/floating-voice-overlay";
import { VoiceChannelView } from "@/components/voice-channel-view";

const demoAnnouncements: AnnouncementItem[] = [
  {
    id: "ann-1",
    title: "Apertura de la Temporada 5: Survival Custom",
    content: "Este viernes a las 18:00 UTC se lanzará la nueva temporada de Survival Custom con economía renovada, mazmorras procedurales y bosses exclusivos.",
    createdAt: new Date(),
    type: "EVENT",
    serverTarget: "Survival Custom",
    eventDate: new Date(Date.now() + 86400000 * 3),
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    author: { displayName: "mortal_pirata107", avatarColor: "#f43f5e" },
  },
  {
    id: "ann-2",
    title: "Actualización de Seguridad y Mitigación DDoS",
    content: "Se han aplicado los nuevos filtros de red en los proxies Velocity y optimizado las reglas de firewall para mitigar ataques layer 7.",
    createdAt: new Date(Date.now() - 3600000 * 5),
    type: "MAINTENANCE",
    serverTarget: "Velocity Proxies",
    author: { displayName: "AlexAdmin", avatarColor: "#e11d48" },
  },
  {
    id: "ann-3",
    title: "Nuevo Sistema de Canales de Voz con Minecraft Skins",
    content: "Ya está activo el nuevo módulo de salas de voz con detección de habla en tiempo real, supresión de ruido y ventana flotante PiP.",
    createdAt: new Date(Date.now() - 3600000 * 12),
    type: "UPDATE",
    serverTarget: "Plataforma Staff",
    author: { displayName: "mortal_pirata107", avatarColor: "#f43f5e" },
  },
];

const demoOnlineStaff: OnlineStaffItem[] = [
  {
    id: "staff-1",
    displayName: "mortal_pirata107",
    avatarColor: "#f43f5e",
    role: "FOUNDER",
    status: "En línea · Centro de Mando",
    lastSeenAt: new Date(),
  },
  {
    id: "staff-2",
    displayName: "AlexAdmin",
    avatarColor: "#e11d48",
    role: "ADMIN",
    status: "Configurando plugins Velocity",
    lastSeenAt: new Date(),
  },
  {
    id: "staff-3",
    displayName: "LucasMod",
    avatarColor: "#06b6d4",
    role: "MOD",
    status: "Revisando reportes de Bedwars",
    lastSeenAt: new Date(),
  },
  {
    id: "staff-4",
    displayName: "ElenaBuilder",
    avatarColor: "#10b981",
    role: "BUILDER",
    status: "Construyendo lobby de Halloween",
    lastSeenAt: new Date(),
  },
];

export default function PreviewPage() {
  return (
    <VoiceProvider>
      <PreviewContent />
      <FloatingVoiceOverlay />
    </VoiceProvider>
  );
}

function PreviewContent() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "chat" | "voice" | "files" | "directory" | "toasts"
  >("dashboard");

  const [demoMessages, setDemoMessages] = useState([
    {
      id: "1",
      author: { displayName: "mortal_pirata107", role: "FOUNDER" as const, avatarColor: "#f43f5e" },
      content: "Bienvenidos a la nueva versión interactiva de EnigmaCraft Staff Platform. Todo el sistema está actualizado con Liquid Glass y Ruby Crimson.",
      time: "10:30",
      reactions: [{ label: "+1", count: 8 }, { label: "OK", count: 5 }],
    },
    {
      id: "2",
      author: { displayName: "AlexAdmin", role: "ADMIN" as const, avatarColor: "#e11d48" },
      content: "He probado los nuevos widgets funcionales del Dashboard y la ventana flotante de voz. Funcionan a la perfección.",
      time: "10:34",
      reactions: [{ label: "OK", count: 4 }],
    },
    {
      id: "3",
      author: { displayName: "LucasMod", role: "MOD" as const, avatarColor: "#06b6d4" },
      content: "La supresión de ruido y la visualización de skins de Minecraft en la sala de voz están excelentes.",
      time: "10:41",
      reactions: [{ label: "TPS", count: 3 }],
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");

  function sendDemoMessage() {
    if (!inputMsg.trim()) return;
    setDemoMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        author: { displayName: "mortal_pirata107 (Tú)", role: "FOUNDER" as const, avatarColor: "#f43f5e" },
        content: inputMsg,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        reactions: [{ label: "+1", count: 1 }],
      },
    ]);
    setInputMsg("");
    toast.success("Mensaje enviado al canal #" + activeChannel);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-rose-500/30">
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-slate-950/80 border-b border-rose-500/20 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Modo <strong className="text-rose-300">Vista Previa Interactiva</strong> · Todas las funciones, widgets y llamadas de voz están activos.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 hidden sm:inline">
              Cuenta Fundador: <strong className="text-white">mortal_pirata107</strong>
            </span>
            <Link
              href="/login"
              className="btn-primary !py-1 !px-3 text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
            >
              <IconShield className="h-3.5 w-3.5" />
              Acceder al Panel Real
            </Link>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-6">
        <div className="glass-card p-1.5 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: IconDashboard },
            { id: "chat", label: "Chat Staff", icon: IconChat },
            { id: "voice", label: "Sala de Voz (PiP)", icon: IconRadio, badge: "NUEVO" },
            { id: "files", label: "Drive & Archivos", icon: IconFolder },
            { id: "directory", label: "Directorio Staff", icon: IconUsers },
            { id: "toasts", label: "UI Playground", icon: IconSparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950/30"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-rose-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold uppercase tracking-wider">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-48">
        {/* VIEW: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="glass-card relative overflow-hidden p-6 md:p-8">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                      Bienvenido, mortal_pirata107
                    </h1>
                    <RoleBadge role="FOUNDER" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 max-w-xl">
                    Centro de operaciones de <span className="text-slate-200 font-semibold">EnigmaCraft Network</span>. Todos los widgets son 100% interactivos con soporte para modales, diagnósticos y llamadas de voz flotantes.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("voice")}
                    className="btn-primary flex items-center gap-2 text-xs font-semibold shadow-lg shadow-rose-950/40"
                  >
                    <IconRadio className="h-4 w-4" />
                    Probar Sala de Voz PiP
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="btn-secondary flex items-center gap-2 text-xs font-semibold"
                  >
                    <IconChat className="h-4 w-4" />
                    Abrir Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Staff en Red", value: "24", sub: "4 activos ahora", icon: IconUsers, gradient: "from-rose-500/20 to-red-600/10", color: "text-rose-400" },
                { label: "Canales de Chat & Voz", value: "14", sub: "General, Avisos, Voz", icon: IconChat, gradient: "from-cyan-500/20 to-blue-600/10", color: "text-cyan-400" },
                { label: "Archivos & Drive", value: "86", sub: "2.4 GB esquemáticos", icon: IconFolder, gradient: "from-emerald-500/20 to-teal-600/10", color: "text-emerald-400" },
                { label: "Copias Seguras", value: "48", sub: "Auto-backup activo", icon: IconBackup, gradient: "from-amber-500/20 to-orange-600/10", color: "text-amber-400" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass-card-interactive p-5 flex flex-col justify-between group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} border border-white/10 ${s.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300">
                        100% Operativo
                      </span>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                      <div className="text-sm font-semibold text-slate-200">{s.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NEW INTERACTIVE FUNCTIONAL WIDGETS */}
            <div className="space-y-8">
              {/* Split View: Interactive Online Staff + Interactive Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <InteractiveOnlineStaff staff={demoOnlineStaff} />
                <div className="lg:col-span-2">
                  <InteractiveRecentAnnouncements announcements={demoAnnouncements} />
                </div>
              </div>

              {/* Interactive Platform Health & Live Latency Diagnostics */}
              <InteractivePlatformHealth />
            </div>
          </div>
        )}

        {/* VIEW: VOICE ROOM WITH PIP */}
        {activeTab === "voice" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <IconRadio className="h-5 w-5 text-rose-400 animate-pulse" />
                  Sala de Voz del Staff · Demostración Interactiva
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prueba el botón <strong>&quot;Conectarse a Voz&quot;</strong> para activar la ventana flotante cuadrada PiP con las skins de Minecraft.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="btn-secondary text-xs self-start sm:self-auto"
              >
                Volver al Dashboard
              </button>
            </div>

            <VoiceChannelView
              channel={{
                id: "preview-voice-room",
                name: "sala-de-voz-staff",
                description: "Canal de voz principal para coordinación de moderadores y fundadores",
                categoryName: "Canales de Voz",
              }}
              currentUserId="founder-mortal-107"
              userDisplayName="mortal_pirata107"
              members={[
                {
                  id: "mem-1",
                  displayName: "mortal_pirata107",
                  username: "mortal_pirata107",
                  role: "FOUNDER",
                  avatarColor: "#f43f5e",
                  isOnline: true,
                  statusText: "En línea",
                },
                {
                  id: "mem-2",
                  displayName: "AlexAdmin",
                  username: "alexadmin",
                  role: "ADMIN",
                  avatarColor: "#e11d48",
                  isOnline: true,
                  statusText: "En línea",
                },
                {
                  id: "mem-3",
                  displayName: "LucasMod",
                  username: "lucasmod",
                  role: "MOD",
                  avatarColor: "#06b6d4",
                  isOnline: true,
                  statusText: "En llamada",
                },
              ]}
              messages={[
                {
                  id: "vmsg-1",
                  content: "Canal de voz preparado. Conéctate arriba para probar el micrófono, supresión de ruido y PiP.",
                  createdAt: new Date().toISOString(),
                  edited: false,
                  canDelete: false,
                  reactions: [],
                  author: {
                    id: "sys",
                    displayName: "Sistema EnigmaCraft",
                    role: "ADMIN",
                    avatarColor: "#e11d48",
                  },
                },
              ]}
            />
          </div>
        )}

        {/* VIEW: CHAT */}
        {activeTab === "chat" && (
          <div className="glass-card h-[640px] flex overflow-hidden border border-white/[0.08]">
            {/* Chat Sidebar */}
            <div className="w-56 shrink-0 border-r border-white/[0.08] bg-[#090c14]/90 p-3 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-2">
                  Canales de Texto
                </div>
                <div className="space-y-1">
                  {["general", "anuncios-staff", "builds-proyectos", "reportes-bugs"].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setActiveChannel(ch)}
                      className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        activeChannel === ch
                          ? "bg-rose-500/20 text-rose-300 font-semibold border-l-2 border-rose-500 shadow-sm"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span className="text-slate-500 font-bold">#</span>
                      <span className="truncate">{ch}</span>
                    </button>
                  ))}
                </div>

                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-2 pt-3 border-t border-white/[0.06]">
                  Canal de Voz
                </div>
                <button
                  onClick={() => setActiveTab("voice")}
                  className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <IconRadio className="h-4 w-4 text-rose-400 animate-pulse" />
                    <span>sala-de-voz</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200">
                    Entrar
                  </span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-slate-400">
                <span className="text-white font-semibold block">EnigmaCraft Chat</span>
                <span>Modo vista previa sincronizada</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 flex flex-col justify-between bg-[#07090e]/60">
              <div className="border-b border-white/[0.08] px-5 py-3 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">#</span>
                  <span className="font-bold text-sm text-white">{activeChannel}</span>
                </div>
                <button
                  onClick={() => setActiveTab("voice")}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
                >
                  <IconRadio className="h-3.5 w-3.5" />
                  Abrir Sala de Voz PiP
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {demoMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 group">
                    <Avatar name={m.author.displayName} color={m.author.avatarColor} className="h-9 w-9 text-xs mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-white">{m.author.displayName}</span>
                        <RoleBadge role={m.author.role} showDot={false} className="py-0 px-2 text-[10px]" />
                        <span className="text-[11px] text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-normal">{m.content}</p>
                      <div className="mt-1.5 flex gap-1">
                        {m.reactions.map((r, idx) => (
                          <span
                            key={idx}
                            onClick={() => toast.success(`Reacción registrada`)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-xs text-slate-300 hover:border-rose-500/40 cursor-pointer active:scale-95 transition-all"
                          >
                            <IconCheck className="h-3 w-3 text-rose-400" />
                            {r.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-white/[0.08] bg-[#080b12]/90 flex items-center gap-2">
                <input
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendDemoMessage()}
                  placeholder={`Enviar mensaje a #${activeChannel}...`}
                  className="input text-sm py-2.5"
                />
                <button onClick={sendDemoMessage} className="btn-primary shrink-0 py-2.5 px-4">
                  <IconSend className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: FILES */}
        {activeTab === "files" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <IconFolder className="h-6 w-6 text-rose-500" />
                  Archivos de Red & Esquemáticos
                </h2>
                <p className="text-xs text-slate-400 mt-1">Explorador de recursos para administradores y builders</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("Carpeta creada")}
                  className="btn-secondary text-xs"
                >
                  <IconPlus className="h-4 w-4" /> Nueva Carpeta
                </button>
                <button
                  onClick={() => toast.success("Archivo subido con éxito")}
                  className="btn-primary text-xs"
                >
                  <IconPlus className="h-4 w-4" /> Subir Archivo
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="hidden grid-cols-[1fr_120px_160px_100px] gap-4 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
                <span>Nombre del Archivo</span>
                <span>Tamaño</span>
                <span>Subido Por</span>
                <span className="text-right">Acción</span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {[
                  { name: "Lobby_Halloween_2026.schem", type: "SCHEM", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", size: "4.8 MB", owner: "ElenaBuilder" },
                  { name: "EnigmaCore-v2.1.jar", type: "JAR", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", size: "12.3 MB", owner: "mortal_pirata107" },
                  { name: "config-economy.yml", type: "CFG", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", size: "18 KB", owner: "AlexAdmin" },
                  { name: "banner-promocional.png", type: "IMG", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30", size: "1.2 MB", owner: "LucasMod" },
                ].map((item) => (
                  <div key={item.name} className="grid grid-cols-1 md:grid-cols-[1fr_120px_160px_100px] items-center gap-2 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-rose-400">
                        <IconFolder className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-slate-200">{item.name}</span>
                      <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${item.badge}`}>
                        {item.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{item.size}</span>
                    <span className="text-xs text-slate-400 font-medium">{item.owner}</span>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toast.success(`Descargando ${item.name}...`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white"
                        title="Descargar"
                      >
                        <IconDownload className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toast.error(`Eliminado ${item.name}`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                        title="Eliminar"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: DIRECTORY */}
        {activeTab === "directory" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Directorio del Personal</h2>
              <p className="text-xs text-slate-400 mt-1">Haz clic en copiar Discord para probar los toasts de Sonner</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "mortal_pirata107", user: "mortal_pirata107", role: "FOUNDER" as const, color: "#f43f5e", discord: "mortal_pirata107", tz: "Europe/Madrid (UTC+1)", status: "En línea", isOnline: true },
                { name: "AlexAdmin", user: "alex_sys", role: "ADMIN" as const, color: "#e11d48", discord: "alex_dev", tz: "America/Mexico_City (UTC-6)", status: "En línea", isOnline: true },
                { name: "LucasMod", user: "lucas_guard", role: "MOD" as const, color: "#06b6d4", discord: "lucas_mod", tz: "America/Argentina/BA (UTC-3)", status: "Ausente", isOnline: false },
                { name: "ElenaBuilder", user: "elena_arch", role: "BUILDER" as const, color: "#10b981", discord: "elena_craft", tz: "Europe/Madrid (UTC+1)", status: "En línea", isOnline: true },
                { name: "SofiaStaff", user: "sofia_helper", role: "STAFF" as const, color: "#a855f7", discord: "sofia_helper", tz: "Europe/Rome (UTC+1)", status: "De vacaciones", isOnline: false },
              ].map((u) => (
                <div key={u.user} className="glass-card-interactive p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.color} isOnline={u.isOnline} className="h-11 w-11 text-base" />
                        <div>
                          <div className="font-bold text-white text-base">{u.name}</div>
                          <div className="text-xs text-slate-400">@{u.user}</div>
                        </div>
                      </div>
                      <RoleBadge role={u.role} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-xs">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">Discord</span>
                          <span className="font-semibold text-slate-200">{u.discord}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(u.discord);
                            toast.success(`Copiado @${u.discord}`, {
                              description: "Listo para pegar en Discord.",
                            });
                          }}
                          className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <IconClock className="h-3.5 w-3.5" />
                      <span>{u.tz}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.07] flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-semibold">{u.status}</span>
                    <button
                      onClick={() => {
                        setActiveTab("chat");
                        toast.info(`Iniciando conversación con ${u.name}`);
                      }}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      <IconMail className="h-3.5 w-3.5" /> Mensaje
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: TOAST & UI PLAYGROUND */}
        {activeTab === "toasts" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-extrabold text-white">Sistema de Componentes & Sonner Toasts</h2>
              <p className="text-xs text-slate-400 mt-1">Prueba los botones con feedback táctil (:active:scale-[0.97]) y notificaciones en tiempo real</p>
            </div>

            {/* Toasts Trigger Grid */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Disparadores de Toasts (Sonner)</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => toast.success("Operación completada con éxito", { description: "Los cambios se han guardado en la base de datos." })}
                  className="btn-primary text-xs"
                >
                  <IconCheck className="h-4 w-4" /> Toast de Éxito
                </button>
                <button
                  onClick={() => toast.error("Error al conectar con el servidor", { description: "Por favor revisa tu conexión de red o credenciales." })}
                  className="btn-danger text-xs"
                >
                  <IconShield className="h-4 w-4" /> Toast de Error
                </button>
                <button
                  onClick={() => {
                    const promise = new Promise((resolve) => setTimeout(resolve, 2000));
                    toast.promise(promise, {
                      loading: "Generando reporte de auditoría...",
                      success: "Reporte generado y descargado.",
                      error: "Error al generar reporte",
                    });
                  }}
                  className="btn-secondary text-xs"
                >
                  <IconClock className="h-4 w-4" /> Toast con Promesa
                </button>
                <button
                  onClick={() => toast.info("Servidor Spigot reiniciado", {
                    action: {
                      label: "Ver Logs",
                      onClick: () => toast("Abriendo consola de servidor..."),
                    },
                  })}
                  className="btn-secondary text-xs"
                >
                  <IconServer className="h-4 w-4" /> Toast con Acción
                </button>
              </div>
            </div>

            {/* Badges and Hierarchy */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Jerarquía de Roles de EnigmaCraft</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <RoleBadge role="FOUNDER" />
                <RoleBadge role="ADMIN" />
                <RoleBadge role="MOD" />
                <RoleBadge role="BUILDER" />
                <RoleBadge role="STAFF" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
