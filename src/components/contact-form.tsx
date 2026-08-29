"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  saveContactInfoAction,
  type ContactRedirect,
} from "@/actions/contact";

type Props = {
  defaults?: {
    discord?: string | null;
    email?: string | null;
    other?: string | null;
    timezone?: string | null;
    status?: string | null;
  };
  redirectTo: ContactRedirect;
  submitLabel?: string;
};

export function ContactForm({
  defaults,
  redirectTo,
  submitLabel = "Guardar",
}: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    saveContactInfoAction.bind(null, redirectTo),
    null
  );

  useEffect(() => {
    if (state?.ok && redirectTo === "directory") {
      router.refresh();
    }
  }, [state, redirectTo, router]);

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {state.error}
        </div>
      ) : null}

      <div>
        <label className="label">
          Discord <span className="text-red-400">*</span>
        </label>
        <input
          name="discord"
          className="input"
          placeholder="ej. elmarcels"
          defaultValue={defaults?.discord || ""}
          required
        />
        <p className="mt-1 text-xs text-white/35">
          Tu nombre de usuario en Discord (obligatorio para usar la plataforma).
        </p>
      </div>

      <div>
        <label className="label">Email (opcional)</label>
        <input
          name="email"
          type="email"
          className="input"
          placeholder="ej. staff@enigmacraft.xyz"
          defaultValue={defaults?.email || ""}
        />
      </div>

      <div>
        <label className="label">Otra red / enlace (opcional)</label>
        <input
          name="other"
          className="input"
          placeholder="ej. Telegram, perfil en el foro…"
          defaultValue={defaults?.other || ""}
        />
      </div>

      <div>
        <label className="label">Estado de actividad</label>
        <select name="status" className="input" defaultValue={defaults?.status || ""}>
          <option value="">En línea (automático)</option>
          <option value="AWAY">Ausente</option>
          <option value="VACATION">De vacaciones</option>
        </select>
      </div>

      <div>
        <label className="label">Zona horaria (opcional)</label>
        <input
          name="timezone"
          className="input"
          placeholder="ej. Europe/Madrid, UTC-3…"
          defaultValue={defaults?.timezone || ""}
        />
        <p className="mt-1 text-xs text-white/35">
          Se muestra en tu ficha del directorio.
        </p>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full justify-center">
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}