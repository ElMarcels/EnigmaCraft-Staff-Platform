"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-extrabold text-white shadow-lg shadow-indigo-500/30">
            EC
          </div>
          <h1 className="text-2xl font-bold text-white">EnigmaCraft Staff</h1>
          <p className="mt-1 text-sm text-white/40">
            Acceso exclusivo para el staff de la network
          </p>
        </div>

        <form action={action} className="card space-y-4">
          {state?.error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {state.error}
            </div>
          ) : null}
          <div>
            <label className="label" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              className="input"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full justify-center">
            {pending ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Plataforma privada · Solo para miembros autorizados
        </p>
      </div>
    </main>
  );
}
