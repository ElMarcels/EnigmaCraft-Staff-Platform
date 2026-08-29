import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createAnnouncement,
  deleteAnnouncement,
  confirmAnnouncementRead,
} from "@/actions/messaging";
import { Avatar } from "@/components/role-badge";
import { IconMegaphone, IconTrash, IconClock } from "@/components/icons";

export const dynamic = "force-dynamic";

const PRIORITY_STYLE: Record<string, string> = {
  alta: "border-red-400/40 bg-red-500/10",
  normal: "",
  baja: "opacity-70",
};

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  const canCreate = !!user && ["FOUNDER", "ADMIN"].includes(user.role);

  const now = new Date();
  const [published, scheduled] = await Promise.all([
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

  const confirmedIds = new Set(
    user
      ? published
          .filter((a) => a.reads.some((r) => r.userId === user.id))
          .map((a) => a.id)
      : []
  );

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <IconMegaphone className="h-7 w-7 text-indigo-300" />
        <div>
          <h1 className="text-2xl font-bold text-white">Anuncios oficiales</h1>
          <p className="text-sm text-white/40">
            Avisos y comunicados para todo el staff.
          </p>
        </div>
      </header>

      {canCreate ? (
        <form action={createAnnouncement} className="card mb-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
            Nuevo anuncio
          </h2>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
            <input name="title" className="input" placeholder="Título" required />
            <select name="priority" className="input">
              <option value="normal">Prioridad normal</option>
              <option value="alta">Prioridad alta</option>
              <option value="baja">Prioridad baja</option>
            </select>
            <input
              type="datetime-local"
              name="publishAt"
              className="input"
              title="Fecha de publicación (vacío = publicar ahora)"
            />
          </div>
          <textarea
            name="content"
            className="input min-h-[110px]"
            placeholder="Escribe el contenido del anuncio…"
            required
          />
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" name="requiresRead" className="accent-indigo-500" />
            Requiere confirmación de lectura obligatoria
          </label>
          <button type="submit" className="btn-primary">
            Publicar anuncio
          </button>
          <p className="text-xs text-white/30">
            Si indicas una fecha futura, el anuncio quedará programado y se
            publicará automáticamente a esa hora (sin notificación anticipada).
          </p>
        </form>
      ) : null}

      {scheduled.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            <IconClock className="h-4 w-4 text-amber-300" /> Programados
          </h2>
          <div className="space-y-2">
            {scheduled.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-3 opacity-80">
                <div>
                  <div className="font-semibold text-white">
                    {a.title}
                    {a.requiresRead ? (
                      <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                        Confirma lectura
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-white/40">
                    Se publica el {a.publishAt?.toLocaleString("es-ES")}
                  </div>
                </div>
                <form action={deleteAnnouncement.bind(null, a.id)}>
                  <button className="rounded p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-300">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {published.length === 0 ? (
        <p className="card text-white/40">
          Aún no hay anuncios publicados.
        </p>
      ) : (
        <div className="space-y-4">
          {published.map((a) => {
            const requiresRead =
              a.requiresRead && !!user && !confirmedIds.has(a.id);
            return (
              <article
                key={a.id}
                id={a.id}
                className={`card ${PRIORITY_STYLE[a.priority] || ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.author.displayName} color={a.author.avatarColor} />
                    <div>
                      <h2 className="font-semibold text-white">
                        {a.title}
                        {a.priority === "alta" ? (
                          <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-300">
                            Importante
                          </span>
                        ) : null}
                        {a.requiresRead ? (
                          <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                            Confirmación de lectura
                          </span>
                        ) : null}
                      </h2>
                      <p className="text-xs text-white/40">
                        {a.author.displayName} ·{" "}
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {canCreate ? (
                    <form action={deleteAnnouncement.bind(null, a.id)}>
                      <button className="rounded p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-300">
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">
                  {a.content}
                </p>
                {requiresRead ? (
                  <form action={confirmAnnouncementRead.bind(null, a.id)} className="mt-3">
                    <button
                      type="submit"
                      className="btn-primary w-full justify-center"
                    >
                      Confirmo que he leído este anuncio
                    </button>
                  </form>
                ) : null}
                {a.requiresRead &&
                user &&
                !requiresRead &&
                confirmedIds.has(a.id) ? (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <span>✓</span> Has confirmado la lectura
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}