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
} from "@/components/icons";

export default function PreviewPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "login" | "chat" | "files" | "directory" | "toasts">("dashboard");
  const [demoMessages, setDemoMessages] = useState([
    {
      id: "1",
      author: { displayName: "Marcel", role: "FOUNDER" as const, avatarColor: "#f43f5e" },
      content: "Bienvenidos al nuevo diseno de @EnigmaCraft. Todo el sistema ha sido migrado a Liquid Glass con tematica Rubi Carmesi.",
      time: "10:30",
      reactions: [{ label: "+1", count: 8 }, { label: "OK", count: 5 }],
    },
    {
      id: "2",
      author: { displayName: "AlexAdmin", role: "ADMIN" as const, avatarColor: "#e11d48" },
      content: "He subido los nuevos esquematicos de la lobby 2026 al Drive. Revisen la carpeta @Builds.",
      time: "10:34",
      reactions: [{ label: "OK", count: 4 }],
    },
    {
      id: "3",
      author: { displayName: "LucasMod", role: "MOD" as const, avatarColor: "#06b6d4" },
      content: "El servidor de Bedwars esta corriendo a 20.0 TPS sin perdidas de ticks.",
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
        author: { displayName: "Tu (Staff)", role: "ADMIN" as const, avatarColor: "#f43f5e" },
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
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24">
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
                      Bienvenido, Fundador Marcel
                    </h1>
                    <RoleBadge role="FOUNDER" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 max-w-xl">
                    Centro de operaciones de <span className="text-slate-200 font-semibold">EnigmaCraft Network</span>. Todos los nodos Spigot/Paper y proxies Velocity estan activos.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      toast.success("Backup manual iniciado", {
                        description: "Creando snapshot de la base de datos y archivos...",
                      });
                    }}
                    className="btn-primary flex items-center gap-2 text-xs font-semibold"
                  >
                    <IconBackup className="h-4 w-4" />
                    Iniciar Respaldo
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
                { label: "Staff en Red", value: "24", sub: "18 activos hoy", icon: IconUsers, gradient: "from-rose-500/20 to-red-600/10", color: "text-rose-400" },
                { label: "Canales de Chat", value: "12", sub: "1,420 mensajes", icon: IconChat, gradient: "from-cyan-500/20 to-blue-600/10", color: "text-cyan-400" },
                { label: "Archivos & Drive", value: "86", sub: "2.4 GB ocupados", icon: IconFolder, gradient: "from-emerald-500/20 to-teal-600/10", color: "text-emerald-400" },
                { label: "Copias Seguras", value: "48", sub: "Ultima hace 2h", icon: IconBackup, gradient: "from-amber-500/20 to-orange-600/10", color: "text-amber-400" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass-card-interactive p-5 flex flex-col justify-between group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} border border-white/10 ${s.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300">
                        +12% este mes
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

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Online Staff */}
              <div className="glass-card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                    En Linea Ahora (4)
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">Network Live</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "Marcel", role: "FOUNDER" as const, color: "#f43f5e", status: "Lobby principal" },
                    { name: "AlexAdmin", role: "ADMIN" as const, color: "#e11d48", status: "Configurando plugins" },
                    { name: "LucasMod", role: "MOD" as const, color: "#06b6d4", status: "Revisando reportes" },
                    { name: "ElenaBuilder", role: "BUILDER" as const, color: "#10b981", status: "Mapa Arena" },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all">
                      <Avatar name={m.name} color={m.color} isOnline={true} className="h-9 w-9 text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-semibold text-white">{m.name}</span>
                          <RoleBadge role={m.role} showDot={false} className="text-[10px] py-0 px-2" />
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{m.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Announcements */}
              <div className="lg:col-span-2 glass-card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <IconMegaphone className="h-5 w-5 text-rose-400" />
                    Tablon de Comunicados
                  </h2>
                  <button
                    onClick={() => toast.info("Funcion de redactar anuncio disponible")}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    + Nuevo Anuncio
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="glass-card-interactive p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                          OFICIAL
                        </span>
                        <span className="text-[11px] text-slate-400">Hoy, 09:15</span>
                      </div>
                      <h3 className="font-bold text-sm text-white mb-1">Apertura de la Temporada 5</h3>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        Este viernes a las 18:00 UTC se lanzara la nueva temporada de Survival Custom con economia renovada y mazmorras.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 flex justify-between">
                      <span>Por Marcel</span>
                      <span className="text-rose-400">Leer mas →</span>
                    </div>
                  </div>

                  <div className="glass-card-interactive p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                          MANTENIMIENTO
                        </span>
                        <span className="text-[11px] text-slate-400">Ayer</span>
                      </div>
                      <h3 className="font-bold text-sm text-white mb-1">Actualizacion de Proxies Velocity</h3>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        Se han aplicado los parches de seguridad y mitigacion contra ataques DDoS en los proxies de entrada.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 flex justify-between">
                      <span>Por AlexAdmin</span>
                      <span className="text-rose-400">Leer mas →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CHAT */}
        {activeTab === "chat" && (
          <div className="glass-card h-[600px] flex overflow-hidden border border-white/[0.08]">
            {/* Chat Sidebar */}
            <div className="w-56 shrink-0 border-r border-white/[0.08] bg-[#090c14]/90 p-3 space-y-4 flex flex-col">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-2">
                Canales de Staff
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
            </div>

            {/* Chat Body */}
            <div className="flex-1 flex flex-col justify-between bg-[#07090e]/60">
              <div className="border-b border-white/[0.08] px-5 py-3 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">#</span>
                  <span className="font-bold text-sm text-white">{activeChannel}</span>
                </div>
                <span className="text-xs text-slate-400">3 miembros en linea</span>
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
                            onClick={() => toast.success(`Reaccion registrada`)}
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
                  Archivos de Red & Esquematicos
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
                  onClick={() => toast.success("Archivo subido con exito")}
                  className="btn-primary text-xs"
                >
                  <IconPlus className="h-4 w-4" /> Subir Archivo
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="hidden grid-cols-[1fr_120px_160px_100px] gap-4 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
                <span>Nombre del Archivo</span>
                <span>Tamano</span>
                <span>Subido Por</span>
                <span className="text-right">Accion</span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {[
                  { name: "Lobby_Halloween_2026.schem", type: "SCHEM", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", size: "4.8 MB", owner: "ElenaBuilder" },
                  { name: "EnigmaCore-v2.1.jar", type: "JAR", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", size: "12.3 MB", owner: "Marcel" },
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
                { name: "Marcel", user: "marcel_ec", role: "FOUNDER" as const, color: "#f43f5e", discord: "marcel_01", tz: "Europe/Madrid (UTC+1)", status: "En linea", isOnline: true },
                { name: "AlexAdmin", user: "alex_sys", role: "ADMIN" as const, color: "#e11d48", discord: "alex_dev", tz: "America/Mexico_City (UTC-6)", status: "En linea", isOnline: true },
                { name: "LucasMod", user: "lucas_guard", role: "MOD" as const, color: "#06b6d4", discord: "lucas_mod", tz: "America/Argentina/BA (UTC-3)", status: "Ausente", isOnline: false },
                { name: "ElenaBuilder", user: "elena_arch", role: "BUILDER" as const, color: "#10b981", discord: "elena_craft", tz: "Europe/Madrid (UTC+1)", status: "En linea", isOnline: true },
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
                        toast.info(`Iniciando conversacion con ${u.name}`);
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

        {/* VIEW: LOGIN PREVIEW */}
        {activeTab === "login" && (
          <div className="flex items-center justify-center py-6">
            <div className="w-full max-w-md">
              <div className="mb-6 text-center">
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-rose-600 opacity-60 blur-lg animate-pulse-subtle" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-rose-500 via-rose-600 to-red-800 text-2xl font-extrabold text-white shadow-xl">
                    EC
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Enigma<span className="text-rose-500">Craft</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Plataforma interna del Staff</p>
              </div>

              <div className="glass-card p-8 space-y-4">
                <div>
                  <label className="label">Usuario</label>
                  <input className="input" defaultValue="Marcel" placeholder="Nombre de usuario" />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input className="input" type="password" defaultValue="password123" />
                </div>
                <button
                  onClick={() => toast.success("Credenciales correctas. Redirigiendo...")}
                  className="btn-primary w-full py-2.5 text-sm font-semibold"
                >
                  Iniciar Sesion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: TOAST & UI PLAYGROUND */}
        {activeTab === "toasts" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-extrabold text-white">Sistema de Componentes & Sonner Toasts</h2>
              <p className="text-xs text-slate-400 mt-1">Prueba los botones con feedback tactil (:active:scale-[0.97]) y notificaciones en tiempo real</p>
            </div>

            {/* Toasts Trigger Grid */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Disparadores de Toasts (Sonner)</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => toast.success("Operacion completada con exito", { description: "Los cambios se han guardado en la base de datos." })}
                  className="btn-primary text-xs"
                >
                  <IconCheck className="h-4 w-4" /> Toast de Exito
                </button>
                <button
                  onClick={() => toast.error("Error al conectar con el servidor", { description: "Por favor revisa tu conexion de red o credenciales." })}
                  className="btn-danger text-xs"
                >
                  <IconShield className="h-4 w-4" /> Toast de Error
                </button>
                <button
                  onClick={() => {
                    const promise = new Promise((resolve) => setTimeout(resolve, 2000));
                    toast.promise(promise, {
                      loading: "Generando reporte de auditoria...",
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
                  <IconServer className="h-4 w-4" /> Toast con Accion
                </button>
              </div>
            </div>

            {/* Badges and Hierarchy */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Jerarquia de Roles de EnigmaCraft</h3>
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
