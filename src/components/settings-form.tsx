"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction } from "@/actions/founder";

export function SettingsForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, null);

  return (
    <form action={action} className="card max-w-md space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
        Cambiar contraseña de {displayName}
      </h2>
      {state?.error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {state.error}
        </div>
      ) : null}
      <div>
        <label className="label">Contraseña actual</label>
        <input name="current" type="password" className="input" required />
      </div>
      <div>
        <label className="label">Nueva contraseña</label>
        <input name="newPassword" type="password" className="input" required minLength={6} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
