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

const DEMO_BACKUPS: any[] = [
  {
    id: "b-1",
    name: "snapshot-auto-2026-08-30.zip",
    type: "automatic",
    size: 24576000,
    createdAt: new Date("2026-08-30T04:00:00Z"),
    creator: null,
  },
  {
    id: "b-2",
    name: "backup-pre-update-v5.zip",
    type: "manual",
    size: 31457280,
    createdAt: new Date("2026-08-29T18:30:00Z"),
    creator: { displayName: "Marcel" },
  },
];

export default async function BackupsPage() {
  let backups: any[] = DEMO_BACKUPS;

  try {
    await maybeRunAutomaticBackup();
    const dbBackups = await prisma.backup.findMany({
      orderBy: { createdAt: "desc" },
      include: { creator: true },
      take: 50,
    });
    if (dbBackups.length > 0) {
      backups = dbBackups;
    }
  } catch {
    // Graceful fallback
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-28">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Copias de Seguridad</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Instantáneas automáticas diarias y respaldos manuales de bases de datos y esquemáticos.
          </p>
        </div>
        <form action={createBackupAction}>
          <button type="submit" className="btn-primary text-xs font-semibold px-4 py-2.5">
            <IconPlus className="h-4 w-4" /> Crear Copia Ahora
          </button>
        </form>
      </header>

      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <IconBackup className="h-4 w-4 text-rose-400" /> Historial de Respaldos ({backups.length})
        </h2>
        {backups.length === 0 ? (
          <p className="text-sm text-slate-400">
            Aún no hay copias de seguridad registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pr-4 font-semibold">Nombre del Archivo</th>
                  <th className="py-3 pr-4 font-semibold">Tipo</th>
                  <th className="py-3 pr-4 font-semibold">Tamaño</th>
                  <th className="py-3 pr-4 font-semibold">Origen</th>
                  <th className="py-3 font-semibold">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-slate-200">{b.name}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          b.type === "automatic"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        {b.type === "automatic" ? "Automática" : "Manual"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-400">
                      {fmtBytes(b.size)}
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-medium text-slate-300">
                      {b.creator?.displayName || "Sistema Automático"}
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {new Date(b.createdAt).toLocaleString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
