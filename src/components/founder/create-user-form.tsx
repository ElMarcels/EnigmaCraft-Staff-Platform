"use client";

import { useActionState } from "react";
import { createUserAction } from "@/actions/founder";
import { ALL_ROLES, ROLE_META } from "@/lib/role-meta";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, null);

  return (
    <form action={action} className="card mb-6 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
        Crear nuevo usuario
      </h2>
      {state?.error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {state.error}
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Usuario</label>
          <input name="username" className="input" required />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input name="password" type="text" className="input" required minLength={6} />
        </div>
        <div>
          <label className="label">Nombre visible</label>
          <input name="displayName" className="input" placeholder="Opcional" />
        </div>
        <div>
          <label className="label">Rango</label>
          <select name="role" className="input">
            {ALL_ROLES.filter((r) => r !== "FOUNDER").map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
