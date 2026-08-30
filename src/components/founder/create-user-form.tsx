"use client";

import { useActionState, useState } from "react";
import { createUserAction } from "@/actions/founder";
import { ALL_ROLES, ROLE_META } from "@/lib/role-meta";
import { LiquidSelect } from "@/components/liquid-select";
import { IconPlus } from "@/components/icons";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, null);
  const [selectedRole, setSelectedRole] = useState("STAFF");

  const roleOptions = ALL_ROLES.map((r) => ({
    value: r,
    label: ROLE_META[r].label,
    badge: (
      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${ROLE_META[r].gradient}`} />
    ),
  }));

  return (
    <form action={action} className="glass-card p-6 md:p-7 space-y-5 shadow-2xl shadow-black/50 mb-8 relative overflow-visible">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <IconPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Crear Nuevo Usuario de Staff
            </h2>
            <p className="text-xs text-slate-400">
              Genera credenciales de acceso inicial y asigna el rango de red
            </p>
          </div>
        </div>
      </div>

      {state?.error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300">
          <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Usuario</label>
          <input
            name="username"
            className="input"
            placeholder="Ej: alex_mod"
            required
          />
        </div>
        <div>
          <label className="label">Contraseña Temporal</label>
          <input
            name="password"
            type="text"
            className="input font-mono text-xs"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="label">Nombre Visible (In-Game)</label>
          <input
            name="displayName"
            className="input"
            placeholder="Ej: Alex (Opcional)"
          />
        </div>
        <div>
          <label className="label">Rango en la Network</label>
          <LiquidSelect
            name="role"
            options={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            className="w-full"
          />
          <p className="mt-1.5 text-[10px] text-slate-400 leading-tight">
            <span className="text-rose-400 font-semibold">Fundador</span> otorga acceso a la consola total y auditoría.
          </p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary text-xs font-semibold px-6 py-2.5"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creando Usuario...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <IconPlus className="h-4 w-4" /> Crear Usuario
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
