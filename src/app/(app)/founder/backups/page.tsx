import { prisma } from "@/lib/db";
import { createBackupAction } from "@/actions/founder";
import { maybeRunAutomaticBackup } from "@/lib/backup";
import { IconBackup, IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function BackupsPage() {
  await maybeRunAutomaticBackup();

  const backups = await prisma.backup.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: true },
    take: 50,
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Copias de seguridad</h1>
          <p className="text-sm text-white/40">
            Copias automáticas (1 al día en producción) y manuales de los
            archivos y la base de datos del servidor.
          </p>
        </div>
        <form action={createBackupAction}>
          <button type="submit" className="btn-primary">
            <IconPlus /> Crear copia ahora
          </button>
        </form>
      </header>

      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50">
          <IconBackup className="text-amber-300" /> Historial ({backups.length})
        </h2>
        {backups.length === 0 ? (
          <p className="text-sm text-white/40">
            Aún no hay copias de seguridad. Crea la primera con el botón de
            arriba.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/30">
                  <th className="py-2 pr-4 font-semibold">Copia</th>
                  <th className="py-2 pr-4 font-semibold">Tipo</th>
                  <th className="py-2 pr-4 font-semibold">Tamaño</th>
                  <th className="py-2 pr-4 font-semibold">Creada por</th>
                  <th className="py-2 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-4 text-white/80">{b.name}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          b.type === "automatic"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-sky-500/20 text-sky-300"
                        }`}
                      >
                        {b.type === "automatic" ? "Automática" : "Manual"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white/50">
                      {fmtBytes(b.size)}
                    </td>
                    <td className="py-2.5 pr-4 text-white/50">
                      {b.creator?.displayName || "Sistema"}
                    </td>
                    <td className="py-2.5 text-white/50">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-white/30">
        Las copias se guardan como instantáneas en el almacenamiento de Vercel
        Blob. En producción se crea una copia automática cada 24 horas vía cron.
      </p>
    </div>
  );
}
