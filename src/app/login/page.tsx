"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { IconShield, IconSparkles } from "@/components/icons";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 selection:bg-rose-500/30 overflow-hidden">
      {/* Dynamic Ambient Mesh Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-rose-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-red-800/15 blur-[100px]" />

      <div className="relative w-full max-w-md">
        {/* EnigmaCraft Header Badge */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 opacity-60 blur-xl animate-pulse-subtle" />
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-rose-500 via-rose-600 to-red-800 text-3xl font-extrabold text-white shadow-2xl shadow-rose-950/60">
              <span className="tracking-tighter drop-shadow-md">EC</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Enigma<span className="text-rose-500">Craft</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-400">
            Plataforma interna para el Staff & Administración
          </p>
        </div>

        {/* Liquid Glass Login Container */}
        <div className="glass-card relative overflow-hidden p-8 sm:p-9 shadow-2xl shadow-black/80">
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />
          
          <form action={action} className="space-y-5">
            {state?.error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                {state.error}
              </div>
            ) : null}

            <div>
              <label className="label" htmlFor="username">
                Nombre de Usuario
              </label>
              <input
                id="username"
                name="username"
                className="input"
                placeholder="Nombre de usuario"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0" htmlFor="password">
                  Contraseña
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Contraseña de acceso"
                className="input"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full py-3 text-sm font-semibold tracking-wide"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Autenticando...
                </span>
              ) : (
                "Acceder al Panel"
              )}
            </button>
          </form>

          {/* Quick Demo Preview Link Button */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <IconShield className="h-3.5 w-3.5 text-rose-400" />
              Acceso Seguro
            </span>
            <Link
              href="/preview"
              className="btn-secondary !py-1.5 !px-3 text-xs font-semibold text-rose-300 hover:text-white border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer z-30"
            >
              <IconSparkles className="h-3.5 w-3.5 text-rose-400" />
              Abrir Preview
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          EnigmaCraft Network · Servidor privado y cifrado de extremo a extremo
        </p>
      </div>
    </main>
  );
}
