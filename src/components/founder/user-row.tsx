"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  updateUserRole,
  suspendUserAction,
  unsuspendUser,
  resetUserPassword,
  deleteUser,
} from "@/actions/founder";
import { RoleBadge, Avatar } from "@/components/role-badge";
import { ALL_ROLES, ROLE_META } from "@/lib/role-meta";
import { IconTrash, IconSettings, IconShield } from "@/components/icons";

export type UserRowDTO = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  active: boolean;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  avatarColor: string;
  createdAt: string;
  createdByName: string | null;
};

const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "1d", label: "1 día" },
  { value: "3d", label: "3 días" },
  { value: "1w", label: "1 semana" },
  { value: "2w", label: "2 semanas" },
  { value: "1m", label: "1 mes" },
  { value: "3m", label: "3 meses" },
  { value: "forever", label: "Permanente" },
];

export function UserRow({ user, isSelf }: { user: UserRowDTO; isSelf: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>(user.role);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [suspendDuration, setSuspendDuration] = useState("1w");
  const [suspendReason, setSuspendReason] = useState("");
  const isFounder = user.role === "FOUNDER";
  const suspended = !user.active;
  const permanent = suspended && !user.suspendedUntil;

  function changeRole(next: Role) {
    setRole(next);
    if (next === user.role) return;
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("role", next);
    startTransition(() => updateUserRole(fd).then(() => router.refresh()));
  }

  function submitSuspend() {
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("duration", suspendDuration);
    fd.set("reason", suspendReason);
    startTransition(async () => {
      const res = await suspendUserAction(fd);
      if (res?.error) {
        setSuspendError(res.error);
      } else {
        setSuspendOpen(false);
        setSuspendReason("");
        setSuspendError(null);
        router.refresh();
      }
    });
  }

  function reactivate() {
    startTransition(() => unsuspendUser(user.id).then(() => router.refresh()));
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <Avatar name={user.displayName} color={user.avatarColor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{user.displayName}</span>
          <RoleBadge role={user.role} />
          {isSelf ? <span className="text-[11px] text-white/30">(tú)</span> : null}
          {suspended ? (
            <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-300">
              Suspendido
            </span>
          ) : null}
        </div>
        <div className="text-xs text-white/40">
          @{user.username}
          {user.createdByName ? ` · creado por ${user.createdByName}` : ""} ·{" "}
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
        {suspended ? (
          <div className="mt-1 rounded bg-red-500/10 px-2 py-1 text-xs text-red-200/80">
            {permanent
              ? "Suspensión permanente"
              : `Suspendido hasta ${new Date(
                  user.suspendedUntil as string
                ).toLocaleString()}`}
            {user.suspensionReason ? ` · "${user.suspensionReason}"` : ""}
          </div>
        ) : null}
      </div>

      {isFounder ? (
        <span className="flex items-center gap-1 text-xs text-white/30">
          <IconShield className="h-4 w-4 text-amber-300" /> Fundador
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={role}
            onChange={(e) => changeRole(e.target.value as Role)}
            disabled={pending}
            className="input !w-auto !py-1.5 text-sm"
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
          {role === "FOUNDER" && user.role !== "FOUNDER" ? (
            <span className="text-[11px] text-amber-300/80">
              Al guardar le darás acceso al panel de fundadores.
            </span>
          ) : null}

          {suspended ? (
            <button
              onClick={reactivate}
              disabled={pending}
              className="btn-secondary !py-1.5 border-green-500/30 text-green-300 hover:bg-green-500/10"
              title="Levantar la suspensión"
            >
              Reactivar
            </button>
          ) : (
            <button
              onClick={() => {
                setSuspendOpen((v) => !v);
                setSuspendError(null);
              }}
              disabled={pending}
              className="btn-secondary !py-1.5 border-red-500/30 text-red-300 hover:bg-red-500/10"
              title="Suspender cuenta"
            >
              Suspender
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setResetting((v) => !v)}
              className="rounded p-2 text-white/40 hover:bg-white/10 hover:text-white"
              title="Restablecer contraseña"
            >
              <IconSettings className="h-4 w-4" />
            </button>
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-300">¿Eliminar?</span>
                <button
                  onClick={() =>
                    startTransition(() => deleteUser(user.id).then(() => router.refresh()))
                  }
                  className="btn-danger !py-1.5"
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-secondary !py-1.5"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded p-2 text-white/40 hover:bg-red-500/10 hover:text-red-300"
                title="Eliminar usuario"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {suspendOpen && !isFounder ? (
        <div className="flex basis-full flex-wrap items-end gap-2 pl-11">
          <div className="flex flex-col">
            <label className="label">Duración</label>
            <select
              value={suspendDuration}
              onChange={(e) => setSuspendDuration(e.target.value)}
              className="input !w-40 !py-1.5 text-sm"
            >
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="label">Razón de la suspensión</label>
            <input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="input"
              required
              minLength={3}
              placeholder="Motivo de la suspensión"
            />
          </div>
          <button
            type="button"
            onClick={submitSuspend}
            disabled={pending || suspendReason.trim().length < 3}
            className="btn-danger !py-1.5"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setSuspendOpen(false)}
            className="btn-secondary !py-1.5"
          >
            Cancelar
          </button>
          {suspendError ? (
            <span className="basis-full text-xs text-red-300">{suspendError}</span>
          ) : null}
        </div>
      ) : null}

      {resetting && !isFounder ? (
        <form
          action={async (fd) => {
            fd.set("userId", user.id);
            await resetUserPassword(fd);
            startTransition(() => router.refresh());
            setResetting(false);
          }}
          className="flex basis-full items-end gap-2 pl-11"
        >
          <div className="flex-1">
            <label className="label">Nueva contraseña para @{user.username}</label>
            <input
              name="password"
              className="input"
              required
              minLength={6}
              placeholder="Contraseña nueva"
            />
          </div>
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      ) : null}
    </div>
  );
}