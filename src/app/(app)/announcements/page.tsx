import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createAnnouncement,
  deleteAnnouncement,
  confirmAnnouncementRead,
} from "@/actions/messaging";
import { Avatar } from "@/components/role-badge";
import { IconMegaphone, IconTrash, IconClock, IconCheck } from "@/components/icons";
import { formatInTimezone } from "@/lib/format";

export const dynamic = "force-dynamic";

const PRIORITY_STYLE: Record<string, string> = {
  alta: "border-rose-500/40 bg-rose-500/10 shadow-rose-950/20",
  normal: "",
  baja: "opacity-80",
};

const DEMO_ANNOUNCEMENTS: any[] = [
  {
    id: "ann-demo-1",
    title: "Apertura de la Temporada 5 de Survival Custom",
    content: "Este viernes a las 18:00 UTC se lanzará la nueva temporada de Survival Custom con economía renovada, mazmorras y protección de parcelas.",
    priority: "alta",
    requiresRead: true,
    createdAt: new Date(),
    author: {
      displayName: "Marcel",
      avatarColor: "#f43f5e",
    },
    reads: [],
  },
  {
    id: "ann-demo-2",
    title: "Actualización de Seguridad en Proxies Velocity",
    content: "Se han aplicado los parches de seguridad y mitigación contra ataques DDoS en los proxies de entrada. El ping medio ha disminuido un 15%.",
    priority: "normal",
    requiresRead: false,
    createdAt: new Date(Date.now() - 86400000),
    author: {
      displayName: "AlexAdmin",
      avatarColor: "#e11d48",
    },
    reads: [],
  },
];

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  const canCreate = !!user && ["FOUNDER", "ADMIN"].includes(user.role);

  const now = new Date();
  let published: any[] = DEMO_ANNOUNCEMENTS;
  let scheduled: any[] = [];

  try {
    const [dbPub, dbSched] = await Promise.all([
      prisma.announcement.findMany({
        where: { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: { author: true, reads: true },
      }),
      canCreate
        ? prisma.announcement.findMany({
            where: { publishAt: { gt: now } },
            orderBy: { publishAt: "asc" },
            include: { author: true },
          })
        : Promise.resolve([]),
    ]);
    if (dbPub.length > 0) {
      published = dbPub;
      scheduled = dbSched;
    }
  } catch {
    // Graceful fallback
  }

  const confirmedIds = new Set(
    user
      ? published
          .filter((a) => a.reads.some((r: any) => r.userId === user.id))
          .map((a) => a.id)
      : []
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto pb-28">
      <header className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-sm">
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
      {canCreate ? (
        <form
          action={createAnnouncement}
          className="glass-card p-6 space-y-4 shadow-xl shadow-black/40"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-300">
              Publicar Nuevo Comunicado
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              Autor: {user.displayName}
            </span>
          </div>

          <div>
            <label className="label">Título del Comunicado</label>
            <input
              name="title"
              className="input"
              placeholder="Ej: Mantenimiento programado de servidores Spigot"
              required
            />
          </div>

          <div>
            <label className="label">Contenido Detallado</label>
            <textarea
              name="content"
              rows={4}
              className="input resize-none leading-relaxed"
              placeholder="Escribe aquí las instrucciones, cambios de balance o comunicados para el equipo..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Prioridad</label>
              <select name="priority" className="input cursor-pointer">
                <option value="normal">Normal</option>
                <option value="alta">Alta (Destacada)</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="label">Programar publicación</label>
              <input
                name="publishAt"
                type="datetime-local"
                className="input cursor-pointer"
              />
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="requiresRead"
                  value="true"
                  className="rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500"
                />
                Exigir confirmación de lectura
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn-primary text-xs font-semibold px-6 py-2.5">
              Publicar Anuncio
            </button>
          </div>
        </form>
      ) : null}

      {/* Scheduled Announcements */}
      {scheduled.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <IconClock className="h-4 w-4" /> Comunicados Programados
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
                  <form action={deleteAnnouncement.bind(null, a.id)}>
                    <button type="submit" className="btn-danger text-xs py-1.5 px-3">
                      <IconTrash className="h-4 w-4" /> Cancelar
                    </button>
                  </form>
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
                  PRIORITY_STYLE[a.priority] || ""
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
                      <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-300">
                        Prioridad Alta
                      </span>
                    ) : null}

                    {canCreate ? (
                      <form action={deleteAnnouncement.bind(null, a.id)}>
                        <button
                          type="submit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                          title="Eliminar comunicado"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{a.title}</h3>
                <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </div>

                {requiresRead ? (
                  <form action={confirmAnnouncementRead.bind(null, a.id)} className="mt-4 pt-3 border-t border-white/[0.08]">
                    <button
                      type="submit"
                      className="btn-primary w-full justify-center text-xs font-semibold py-2.5 flex items-center gap-2"
                    >
                      <IconCheck className="h-4 w-4" />
                      He leído y comprendido este comunicado
                    </button>
                  </form>
                ) : null}

                {a.requiresRead &&
                user &&
                !requiresRead &&
                confirmedIds.has(a.id) ? (
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