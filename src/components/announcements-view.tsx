"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import {
  createAnnouncement,
  deleteAnnouncement,
  confirmAnnouncementRead,
} from "@/actions/messaging";
import { Avatar } from "@/components/role-badge";
import {
  IconMegaphone,
  IconTrash,
  IconClock,
  IconCheck,
  IconRadio,
  IconServer,
  IconCalendar,
  IconAlertTriangle,
  IconSparkles,
} from "@/components/icons";
import { formatInTimezone } from "@/lib/format";

export type AnnouncementDTO = {
  id: string;
  title: string;
  content: string;
  priority: string;
  type?: string | null;
  eventDate?: string | Date | null;
  serverTarget?: string | null;
  bannerUrl?: string | null;
  requiresRead: boolean;
  publishAt: string | Date | null;
  createdAt: string | Date;
  author: {
    displayName: string;
    avatarColor?: string | null;
  };
  reads?: { userId: string }[];
};

const PRESET_BANNERS = [
  {
    name: "Apertura / Evento Épico",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80",
  },
  {
    name: "Mantenimiento Servidores",
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
  },
  {
    name: "Alerta Crítica / Seguridad",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
  },
  {
    name: "Reunión de Staff",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
  },
];

function CountdownTimer({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    function calculate() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, passed: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  if (timeLeft.passed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold animate-pulse">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        ¡Evento en progreso / Concluido!
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold shadow-md">
      <IconClock className="h-3.5 w-3.5 text-amber-400" />
      <span>
        Comienza en:{" "}
        <strong className="text-white font-black">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </strong>
      </span>
    </div>
  );
}

function getTypeBadge(type?: string | null) {
  switch (type) {
    case "EVENT":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center gap-1">
          <IconSparkles className="h-3 w-3" /> Evento Especial
        </span>
      );
    case "MAINTENANCE":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
          <IconServer className="h-3 w-3" /> Mantenimiento
        </span>
      );
    case "URGENT":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-600/30 border border-rose-500/60 text-rose-200 flex items-center gap-1 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]">
          <IconAlertTriangle className="h-3 w-3 text-rose-400" /> Urgente
        </span>
      );
    case "MEETING":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
          <IconRadio className="h-3 w-3" /> Reunión Staff
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1">
          <IconMegaphone className="h-3 w-3" /> Comunicado
        </span>
      );
  }
}

export function AnnouncementsView({
  user,
  published,
  scheduled,
  canCreate,
}: {
  user: { id: string; displayName: string; role: string; timezone?: string | null } | null;
  published: AnnouncementDTO[];
  scheduled: AnnouncementDTO[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("ANNOUNCEMENT");
  const [serverTarget, setServerTarget] = useState("Toda la Red (Global)");
  const [eventDate, setEventDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [priority, setPriority] = useState("normal");
  const [publishAt, setPublishAt] = useState("");
  const [requiresRead, setRequiresRead] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Active filter state for the feed
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const confirmedSet = new Set(
    user
      ? published
          .filter((a) => a.reads?.some((r) => r.userId === user.id))
          .map((a) => a.id)
      : []
  );

  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(confirmedSet);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Por favor completa el título y el contenido.");
      return;
    }

    sounds.playPop();
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("content", content.trim());
    fd.set("type", type);
    fd.set("serverTarget", serverTarget);
    if (eventDate) fd.set("eventDate", eventDate);
    if (bannerUrl) fd.set("bannerUrl", bannerUrl.trim());
    fd.set("priority", priority);
    if (publishAt) fd.set("publishAt", publishAt);
    if (requiresRead) fd.set("requiresRead", "true");

    const toastId = toast.loading("Publicando comunicado oficial...");

    startTransition(async () => {
      const res = await createAnnouncement(fd);
      if (res && res.error) {
        toast.error(res.error, { id: toastId });
        return;
      }

      sounds.playSuccess();
      toast.success("¡Aviso/evento publicado y emitido al chat con éxito!", { id: toastId });
      setTitle("");
      setContent("");
      setType("ANNOUNCEMENT");
      setServerTarget("Toda la Red (Global)");
      setEventDate("");
      setBannerUrl("");
      setPriority("normal");
      setPublishAt("");
      setRequiresRead(false);
      router.refresh();
    });
  }

  function handleConfirmRead(announcementId: string) {
    sounds.playSuccess();
    setConfirmedIds((prev) => new Set(prev).add(announcementId));
    toast.success("Has confirmado la lectura de este comunicado.");

    startTransition(async () => {
      const res = await confirmAnnouncementRead(announcementId);
      if (res && res.error) {
        toast.error(res.error);
        setConfirmedIds((prev) => {
          const next = new Set(prev);
          next.delete(announcementId);
          return next;
        });
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(announcementId: string, itemTitle: string) {
    if (!confirm(`¿Eliminar el comunicado "${itemTitle}"?`)) return;

    sounds.playPop();
    const toastId = toast.loading("Eliminando comunicado...");

    startTransition(async () => {
      const res = await deleteAnnouncement(announcementId);
      if (res && res.error) {
        toast.error(res.error, { id: toastId });
        return;
      }

      sounds.playSuccess();
      toast.success("Comunicado eliminado correctamente.", { id: toastId });
      router.refresh();
    });
  }

  // Filtered published announcements
  const filteredPublished = published.filter((a) => {
    if (activeFilter === "ALL") return true;
    return (a.type || "ANNOUNCEMENT") === activeFilter;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto pb-28">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl theme-icon-box shadow-lg">
            <IconMegaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Alertas, Avisos y Eventos
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              Gestión centralizada de eventos en la red, parches, mantenimientos y comunicados oficiales.
            </p>
          </div>
        </div>

        {/* Sync badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sincronizado con #anuncios</span>
        </div>
      </header>

      {/* New Enriched Announcement Form (Founder / Admin) */}
      {canCreate && user ? (
        <form
          onSubmit={handleCreate}
          className="glass-card p-6 md:p-8 space-y-5 shadow-2xl shadow-black/50 border border-white/10"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <IconSparkles className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Publicar Nuevo Aviso / Evento Oficial
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Autor: <strong className="text-slate-200">{user.displayName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type selector */}
            <div>
              <label className="label">Tipo de Notificación</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input cursor-pointer font-semibold"
              >
                <option value="ANNOUNCEMENT">📢 Comunicado Oficial</option>
                <option value="EVENT">🎉 Evento en la Red</option>
                <option value="MAINTENANCE">🔧 Mantenimiento Servidores</option>
                <option value="URGENT">🚨 Alerta Urgente / Seguridad</option>
                <option value="MEETING">🎙️ Reunión de Staff</option>
              </select>
            </div>

            {/* Server target selector */}
            <div>
              <label className="label">Servidor / Modalidad</label>
              <select
                value={serverTarget}
                onChange={(e) => setServerTarget(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="Toda la Red (Global)">🌐 Toda la Red (Global)</option>
                <option value="Survival Custom">🌲 Survival Custom</option>
                <option value="BoxPvP 1.20">📦 BoxPvP 1.20</option>
                <option value="SkyBlock RPG">☁️ SkyBlock RPG</option>
                <option value="BedWars / Minijuegos">⚔️ BedWars / Minijuegos</option>
                <option value="Lobbies & Proxies Velocity">🛡️ Proxies Velocity & Lobbies</option>
              </select>
            </div>

            {/* Event / Scheduled Date */}
            <div>
              <label className="label">
                Fecha/Hora del Evento <span className="text-slate-500">(Opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="label">Título del Comunicado o Evento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input font-bold text-white placeholder:font-normal"
              placeholder="Ej: Apertura de Temporada 5 | Reseteo de Minas en BoxPvP"
              required
            />
          </div>

          <div>
            <label className="label">Contenido Detallado</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="input resize-none leading-relaxed text-sm"
              placeholder="Escribe aquí los detalles del evento, reglas, horarios, parches aplicados o directrices..."
              required
            />
          </div>

          {/* Banner URL with Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Banner o Imagen de Cabecera (Opcional)</label>
              <button
                type="button"
                onClick={() => setShowPresets((v) => !v)}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
              >
                {showPresets ? "Ocultar plantillas" : "Ver plantillas rápidas"}
              </button>
            </div>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="input text-xs"
              placeholder="https://ejemplo.com/banner-minecraft.jpg"
            />
            {showPresets && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setBannerUrl(preset.url);
                    }}
                    className="group relative h-16 rounded-xl overflow-hidden border border-white/10 hover:border-rose-500/60 transition-all text-left cursor-pointer"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 flex items-center justify-center p-2 text-center">
                      <span className="text-[11px] font-bold text-white leading-tight">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/[0.08]">
            <div>
              <label className="label">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta (Destacada)</option>
                <option value="urgente">Urgente (Notificación Push a todo el staff)</option>
              </select>
            </div>

            <div>
              <label className="label">Programar publicación futura</label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="input cursor-pointer"
              />
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requiresRead}
                  onChange={(e) => setRequiresRead(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500"
                />
                Exigir confirmación de lectura del Staff
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-xs font-bold px-8 py-3 cursor-pointer disabled:opacity-50 shadow-xl shadow-rose-950/40 flex items-center gap-2"
            >
              <IconMegaphone className="h-4 w-4" />
              {isPending ? "Publicando..." : "Publicar y Emitir a #anuncios"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4">
        <span className="text-xs font-extrabold uppercase text-slate-400 mr-2">Filtrar por:</span>
        {[
          { id: "ALL", label: "Todos", count: published.length },
          { id: "ANNOUNCEMENT", label: "📢 Comunicados" },
          { id: "EVENT", label: "🎉 Eventos" },
          { id: "MAINTENANCE", label: "🔧 Mantenimientos" },
          { id: "URGENT", label: "🚨 Urgentes" },
          { id: "MEETING", label: "🎙️ Reuniones" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveFilter(tab.id);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === tab.id
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scheduled Announcements */}
      {scheduled.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <IconClock className="h-4 w-4" /> Comunicados Programados ({scheduled.length})
          </h2>
          <div className="space-y-3">
            {scheduled.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeBadge(a.type)}
                    <span className="text-xs text-amber-300 font-mono">
                      {a.serverTarget || "Global"}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base">{a.title}</h3>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Programado para:{" "}
                    {a.publishAt
                      ? formatInTimezone(a.publishAt, user?.timezone, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Inmediato"}
                  </p>
                </div>
                {canCreate ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(a.id, a.title)}
                    className="btn-danger text-xs py-1.5 px-3 cursor-pointer"
                  >
                    <IconTrash className="h-4 w-4" /> Cancelar
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Published Feed */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Feed Oficial ({filteredPublished.length})
        </h2>

        {filteredPublished.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-card border-white/10 text-slate-400">
            <p className="text-sm font-medium">No hay anuncios o eventos en esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPublished.map((a) => {
              const isConfirmed = confirmedIds.has(a.id);
              const requiresRead = a.requiresRead && !isConfirmed && !!user;
              const isUrgent = a.type === "URGENT" || a.priority === "urgente" || a.priority === "alta";

              return (
                <article
                  key={a.id}
                  className={`glass-card-interactive overflow-hidden transition-all duration-300 rounded-3xl border ${
                    isUrgent
                      ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                      : "border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  {/* Optional Event Banner */}
                  {a.bannerUrl && (
                    <div className="relative h-44 sm:h-56 w-full overflow-hidden">
                      <img
                        src={a.bannerUrl}
                        alt={a.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent" />
                      {a.eventDate && (
                        <div className="absolute bottom-4 left-6 z-10">
                          <CountdownTimer targetDate={a.eventDate} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 md:p-7 space-y-4">
                    {/* Meta Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTypeBadge(a.type)}
                        {a.serverTarget && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.06] text-slate-300 border border-white/[0.08] flex items-center gap-1">
                            <IconServer className="h-3 w-3" />
                            {a.serverTarget}
                          </span>
                        )}
                        {a.eventDate && !a.bannerUrl && (
                          <div className="ml-1">
                            <CountdownTimer targetDate={a.eventDate} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(a.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {canCreate ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(a.id, a.title)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Eliminar comunicado"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Author line */}
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={a.author.displayName}
                        color={a.author.avatarColor}
                        className="h-7 w-7 text-[10px] font-bold"
                      />
                      <span className="font-bold text-xs text-slate-200">
                        {a.author.displayName}
                      </span>
                    </div>

                    {/* Title & Body */}
                    <div>
                      <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                        {a.title}
                      </h3>
                      <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {a.content}
                      </div>
                    </div>

                    {/* Event Date badge if present */}
                    {a.eventDate && (
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 text-xs">
                        <IconCalendar className="h-4 w-4 text-rose-400 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Fecha y Hora Programada
                          </span>
                          <strong className="text-white font-mono">
                            {new Date(a.eventDate).toLocaleString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Require read interaction */}
                    {requiresRead ? (
                      <div className="pt-3 border-t border-white/[0.08]">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleConfirmRead(a.id)}
                          className="btn-primary w-full justify-center text-xs font-bold py-2.5 flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
                        >
                          <IconCheck className="h-4 w-4" />
                          He leído y comprendido este aviso oficial
                        </button>
                      </div>
                    ) : null}

                    {a.requiresRead && user && isConfirmed ? (
                      <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                          <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
                        </span>
                        Has confirmado la lectura de este aviso
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
