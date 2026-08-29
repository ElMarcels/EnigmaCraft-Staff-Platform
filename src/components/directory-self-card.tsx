"use client";

import { useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { statusOf } from "@/lib/role-meta";

type Props = {
  user: {
    displayName: string;
    username: string;
    role: import("@prisma/client").Role;
    avatarColor: string;
    contactDiscord: string | null;
    contactEmail: string | null;
    contactOther: string | null;
    timezone: string | null;
    status: string | null;
    lastSeenAt: Date | null;
    createdAt: Date;
  };
};

export function DirectorySelfCard({ user }: Props) {
  const [editing, setEditing] = useState(false);
  const st = statusOf(user);

  const summary = [
    user.contactDiscord ? `Discord: ${user.contactDiscord}` : null,
    user.contactEmail || null,
    st ? st.label : null,
    user.timezone || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="card -mt-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Tu ficha
          </div>
          <p className="mt-0.5 text-sm text-white/60">
            {summary ||
              "Todavía no has completado tu ficha de contacto."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="btn-secondary"
        >
          {editing ? "Cancelar" : "Editar mi ficha"}
        </button>
      </div>

      {editing ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <ContactForm
            redirectTo="directory"
            submitLabel="Guardar ficha"
            defaults={{
              discord: user.contactDiscord,
              email: user.contactEmail,
              other: user.contactOther,
              timezone: user.timezone,
              status: user.status,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}