"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createTicket,
  updateTicketStatus,
  assignTicket,
  deleteTicket,
} from "@/actions/tickets";
import {
  IconAlertTriangle,
  IconPlus,
  IconCheck,
  IconClock,
  IconUser,
  IconTrash,
  IconExternalLink,
  IconClose,
  IconFilter,
} from "@/components/icons";
import { sounds } from "@/lib/sound-effects";
import { toast } from "sonner";

export type TicketDTO = {
  id: string;
  title: string;
  description: string;
  category: "HACKS" | "BUG" | "TOXICITY" | "APPEAL" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  targetPlayer: string | null;
  proofUrl: string | null;
  resolution: string | null;
  createdAt: string;
  author: { id: string; displayName: string; avatarColor: string; role: string };
  assignedTo: { id: string; displayName: string; avatarColor: string } | null;
};

const CATEGORY_META = {
  HACKS: { label: "Hacks / Cheats", color: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  BUG: { label: "Bug / Dupe", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  TOXICITY: { label: "Toxicidad", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  APPEAL: { label: "Apelación", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  OTHER: { label: "General", color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
};

const PRIORITY_META = {
  LOW: { label: "Baja", color: "text-slate-400 border-slate-700 bg-slate-800/40" },
  MEDIUM: { label: "Media", color: "text-blue-300 border-blue-500/30 bg-blue-500/10" },
  HIGH: { label: "Alta", color: "text-amber-300 border-amber-500/30 bg-amber-500/10" },
  URGENT: { label: "Urgente", color: "text-rose-300 border-rose-500/40 bg-rose-500/15 animate-pulse" },
};

export function TicketsView({
  tickets,
  currentUserId,
  userRole,
}: {
  tickets: TicketDTO[];
  currentUserId: string;
  userRole: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ACTIVE"); // ACTIVE = OPEN + IN_PROGRESS
  const [selectedTicket, setSelectedTicket] = useState<TicketDTO | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const canManage = ["FOUNDER", "ADMIN", "MOD"].includes(userRole);

  const filteredTickets = tickets.filter((t) => {
    if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
    if (filterStatus === "ACTIVE" && t.status !== "OPEN" && t.status !== "IN_PROGRESS") return false;
    if (filterStatus === "RESOLVED" && t.status !== "RESOLVED") return false;
    if (filterStatus === "DISMISSED" && t.status !== "DISMISSED") return false;
    return true;
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      sounds.playPop();
      const res = await createTicket(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Reporte creado en la base de datos");
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleStatusChange(ticketId: string, status: string, resolution?: string) {
    const fd = new FormData();
    fd.set("ticketId", ticketId);
    fd.set("status", status);
    if (resolution) fd.set("resolution", resolution);

    startTransition(async () => {
      sounds.playPop();
      await updateTicketStatus(fd);
      toast.success(`Estado actualizado a: ${status}`);
      setSelectedTicket(null);
      router.refresh();
    });
  }

  function handleAssign(ticketId: string) {
    const fd = new FormData();
    fd.set("ticketId", ticketId);
    fd.set("assignedToId", currentUserId);

    startTransition(async () => {
      sounds.playPop();
      await assignTicket(fd);
      toast.success("Te has asignado este ticket de moderación");
      router.refresh();
    });
  }

  function handleDelete(ticketId: string) {
    if (!confirm("¿Deseas eliminar este ticket definitivamente?")) return;
    startTransition(async () => {
      sounds.playPop();
      await deleteTicket(ticketId);
      toast.success("Ticket eliminado");
      setSelectedTicket(null);
      router.refresh();
    });
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <IconAlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Mesa de Moderación & Reportes
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              Gestión de sospechas de hacks, bugs de red, apelaciones y conducta en el servidor.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playPop();
            setModalOpen(true);
          }}
          className="btn-primary !py-2.5 !px-4 flex items-center gap-2"
        >
          <IconPlus className="h-4 w-4" />
          <span>Nuevo Reporte</span>
        </button>
      </header>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          {[
            { key: "ACTIVE", label: "Activos / En Proceso" },
            { key: "RESOLVED", label: "Resueltos" },
            { key: "DISMISSED", label: "Descartados" },
            { key: "ALL", label: "Todos" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                sounds.playPop();
                setFilterStatus(tab.key);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === tab.key
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <IconFilter className="h-3.5 w-3.5" /> Tipo:
          </span>
          <button
            onClick={() => setFilterCategory("ALL")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-all ${
              filterCategory === "ALL"
                ? "bg-white/[0.1] text-white border-white/20"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Todos ({tickets.length})
          </button>
          {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
            const count = tickets.filter((t) => t.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => {
                  sounds.playPop();
                  setFilterCategory(catKey);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-all ${
                  filterCategory === catKey
                    ? meta.color
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket Grid */}
      {filteredTickets.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 space-y-3">
          <div className="h-12 w-12 rounded-2xl theme-icon-box mx-auto flex items-center justify-center">
            <IconCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">No hay incidencias en esta vista</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Todos los reportes para estos filtros están al día o no se ha creado ninguno todavía.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((t) => {
            const cat = CATEGORY_META[t.category] || CATEGORY_META.OTHER;
            const prio = PRIORITY_META[t.priority] || PRIORITY_META.MEDIUM;
            const isOpen = t.status === "OPEN";
            const inProgress = t.status === "IN_PROGRESS";

            return (
              <div
                key={t.id}
                className="glass-card-interactive p-5 flex flex-col justify-between group hover:border-white/20 transition-all relative"
              >
                <div>
                  {/* Category and Priority Strip */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.color}`}>
                      {prio.label}
                    </span>
                  </div>

                  {/* Title & Player Target */}
                  <h3 className="font-bold text-white text-base tracking-tight line-clamp-1 mb-1">
                    {t.title}
                  </h3>
                  {t.targetPlayer && (
                    <div className="flex items-center gap-2 text-xs font-mono text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg w-fit mb-2">
                      <Image
                        src={`https://minotar.net/avatar/${t.targetPlayer}/18.png`}
                        alt={t.targetPlayer}
                        width={18}
                        height={18}
                        unoptimized
                        className="rounded"
                      />
                      <span>Jugador: {t.targetPlayer}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {t.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  {/* Proof Link if exists */}
                  {t.proofUrl && (
                    <a
                      href={t.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <IconExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Ver prueba / clip adjunto</span>
                    </a>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Por {t.author.displayName}</span>
                    <span>
                      {new Date(t.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {isOpen && (
                        <button
                          onClick={() => handleAssign(t.id)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] transition-all cursor-pointer"
                        >
                          Asignarme
                        </button>
                      )}
                      {(isOpen || inProgress) && (
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
                        >
                          Resolver
                        </button>
                      )}
                      {t.status === "RESOLVED" && (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <IconCheck className="h-3.5 w-3.5" /> Resuelto
                        </span>
                      )}
                    </div>

                    {["FOUNDER", "ADMIN"].includes(userRole) && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar ticket"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card max-w-lg w-full p-6 md:p-7 space-y-5 border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-rose-400" />
                Registrar Nuevo Reporte / Incidencia
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="label">Título del reporte</label>
                <input
                  name="title"
                  required
                  placeholder="Ej: Uso de KillAura y Speed en BoxPvP"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoría</label>
                  <select name="category" defaultValue="HACKS" className="input">
                    <option value="HACKS">Hacks / Trampas</option>
                    <option value="BUG">Bug / Duplicación</option>
                    <option value="TOXICITY">Toxicidad / Chat</option>
                    <option value="APPEAL">Apelación de Sanción</option>
                    <option value="OTHER">Otro Asunto</option>
                  </select>
                </div>
                <div>
                  <label className="label">Prioridad</label>
                  <select name="priority" defaultValue="MEDIUM" className="input">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nick Jugador (Opcional)</label>
                  <input
                    name="targetPlayer"
                    placeholder="Ej: DarkPlayer99"
                    className="input font-mono"
                  />
                </div>
                <div>
                  <label className="label">Enlace a Prueba (Clip/Img)</label>
                  <input
                    name="proofUrl"
                    placeholder="https://medal.tv/..."
                    className="input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción detallada</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Explica qué sucedió, coordenadas, modalidad y pruebas observadas..."
                  className="input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary !py-2 !px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary !py-2 !px-5"
                >
                  {pending ? "Guardando..." : "Crear Reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border border-emerald-500/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-white">
              Resolver Reporte: {selectedTicket.title}
            </h3>
            <p className="text-xs text-slate-300">
              Escribe el veredicto o acción aplicada (ej: Sancionado con TempBan 30d, Advertido verbalmente, Falsa alarma).
            </p>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Veredicto y notas de resolución..."
              rows={3}
              className="input resize-none"
            />
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleStatusChange(
                    selectedTicket.id,
                    "DISMISSED",
                    resolutionText || "Descartado por falta de pruebas"
                  )
                }
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white"
              >
                Descartar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="btn-secondary !py-2 !px-3 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange(
                      selectedTicket.id,
                      "RESOLVED",
                      resolutionText || "Resuelto y sanción aplicada"
                    )
                  }
                  className="btn-primary !py-2 !px-4 text-xs !bg-emerald-600 hover:!bg-emerald-500"
                >
                  Marcar Resuelto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
