"use client";

import { useState, useTransition } from "react";
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
} from "@/components/icons";
import { formatInTimezone } from "@/lib/format";

type AnnouncementDTO = {
  id: string;
  title: string;
  content: string;
  priority: string;
  requiresRead: boolean;
  publishAt: string | Date | null;
  createdAt: string | Date;
  author: {
    displayName: string;
    avatarColor?: string | null;
  };
  reads?: { userId: string }[];
};

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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [publishAt, setPublishAt] = useState("");
  const [requiresRead, setRequiresRead] = useState(false);

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
      toast.success("¡Comunicado oficial publicado con éxito!", { id: toastId });
      setTitle("");
      setContent("");
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto pb-28">
      {/* Header */}
      <header className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl theme-icon-box shadow-sm">
          <IconMegaphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Tablón de Anuncios Oficiales
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Comunicados oficiales, actualizaciones de modalidades y avisos internos de la network.
          </p>
        </div>
      </header>

      {/* New Announcement Form (Founder / Admin) */}
      {canCreate && user ? (
        <form
          onSubmit={handleCreate}
          className="glass-card p-6 space-y-4 shadow-xl shadow-black/40"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h2 className="text-sm font-bold uppercase tracking-wider theme-text">
              Publicar Nuevo Comunicado
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              Autor: {user.displayName}
            </span>
          </div>

          <div>
            <label className="label">Título del Comunicado</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Ej: Mantenimiento programado de servidores Spigot"
              required
            />
          </div>

          <div>
            <label className="label">Contenido Detallado</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="input resize-none leading-relaxed"
              placeholder="Escribe aquí las instrucciones, cambios de balance o comunicados para el equipo..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta (Destacada)</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="label">Programar publicación</label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="input cursor-pointer"
              />
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requiresRead}
                  onChange={(e) => setRequiresRead(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500"
                />
                Exigir confirmación de lectura
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-xs font-semibold px-6 py-2.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Publicando..." : "Publicar Anuncio"}
            </button>
          </div>
        </form>
      ) : null}

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
          Comunicados Recientes ({published.length})
        </h2>

        <div className="space-y-4">
          {published.map((a) => {
            const isConfirmed = confirmedIds.has(a.id);
            const requiresRead = a.requiresRead && !isConfirmed && !!user;

            return (
              <article
                key={a.id}
                className={`glass-card-interactive p-6 transition-all ${
                  a.priority === "alta"
                    ? "border-[var(--ruby-border)] bg-[var(--ruby-surface)] shadow-[0_0_24px_var(--ruby-glow-soft)]"
                    : a.priority === "baja"
                    ? "opacity-80"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={a.author.displayName}
                      color={a.author.avatarColor}
                      className="h-7 w-7 text-[10px]"
                    />
                    <span className="font-semibold text-xs text-slate-200">
                      {a.author.displayName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.priority === "alta" ? (
                      <span className="rounded-full theme-badge px-2.5 py-0.5 text-[10px] font-bold uppercase">
                        Prioridad Alta
                      </span>
                    ) : null}

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

                <h3 className="text-lg font-bold text-white mb-2">{a.title}</h3>
                <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </div>

                {requiresRead ? (
                  <div className="mt-4 pt-3 border-t border-white/[0.08]">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleConfirmRead(a.id)}
                      className="btn-primary w-full justify-center text-xs font-semibold py-2.5 flex items-center gap-2 cursor-pointer"
                    >
                      <IconCheck className="h-4 w-4" />
                      He leído y comprendido este comunicado
                    </button>
                  </div>
                ) : null}

                {a.requiresRead && user && isConfirmed ? (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                    Has confirmado la lectura de este comunicado
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
