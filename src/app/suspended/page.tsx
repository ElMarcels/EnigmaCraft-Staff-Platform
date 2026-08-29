import { redirect } from "next/navigation";
import { getCurrentUserWithStatus } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function SuspendedPage() {
  const { suspended } = await getCurrentUserWithStatus();
  if (!suspended) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.15),transparent_60%)]">
      <div className="w-full max-w-md px-6">
        <div className="card space-y-1 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-2xl font-extrabold text-white shadow-lg shadow-red-500/30">
            !
          </div>
          <h1 className="text-2xl font-bold text-white">Cuenta suspendida</h1>
          <p className="text-sm text-white/50">
            Tu cuenta no puede acceder a la plataforma en este momento.
          </p>

          <div className="mt-6 space-y-3 text-left">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-white/40">
                Duración
              </div>
              <div className="mt-0.5 text-sm font-semibold text-white">
                {suspended.permanent
                  ? "Suspensión permanente"
                  : `Hasta el ${suspended.until?.toLocaleString("es-ES") ?? "—"}`}
              </div>
            </div>
            {suspended.reason ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-white/40">
                  Razón
                </div>
                <div className="mt-0.5 text-sm text-white/80">
                  “{suspended.reason}”
                </div>
              </div>
            ) : null}
          </div>

          <form action={logoutAction} className="mt-8">
            <button type="submit" className="btn-secondary w-full justify-center">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}