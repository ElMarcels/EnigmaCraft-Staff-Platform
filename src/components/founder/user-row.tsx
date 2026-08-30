"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  updateUserRole,
  suspendUserAction,
  unsuspendUser,
  addWarning,
  removeWarning,
  resetUserPassword,
  deleteUser,
} from "@/actions/founder";
import { RoleBadge, Avatar } from "@/components/role-badge";
import { ALL_ROLES, ROLE_META } from "@/lib/role-meta";
import { LiquidSelect } from "@/components/liquid-select";
import {
  IconTrash,
  IconSettings,
  IconShield,
  IconAlertTriangle,
  IconClock,
  IconPlus,
} from "@/components/icons";

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
  warnings: {
    id: string;
    reason: string;
    createdAt: string;
    issuedByName: string;
  }[];
};

const DURATION_OPTIONS = [
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
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [newWarning, setNewWarning] = useState("");
  const [warnError, setWarnError] = useState<string | null>(null);

  const isFounder = user.role === "FOUNDER";
  const suspended = !user.active;
  const permanent = suspended && !user.suspendedUntil;
  const warningCount = user.warnings.length;

  const roleOptions = ALL_ROLES.map((r) => ({
    value: r,
    label: ROLE_META[r].label,
    badge: (
      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${ROLE_META[r].gradient}`} />
    ),
  }));

  function changeRole(nextRole: string) {
    const next = nextRole as Role;
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

  function submitWarning() {
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("reason", newWarning);
    startTransition(async () => {
      const res = await addWarning(fd);
      if (res?.error) {
        setWarnError(res.error);
      } else {
        setNewWarning("");
        setWarnError(null);
        router.refresh();
      }
    });
  }

  function removeWarn(id: string) {
    startTransition(() => removeWarning(id).then(() => router.refresh()));
  }

  return (
    <div className="glass-card-interactive p-6 flex flex-col justify-between space-y-4 relative overflow-visible group">
      {/* Top Profile Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5">
            <Avatar
              name={user.displayName}
              color={user.avatarColor}
              isOnline={!suspended}
              className="h-12 w-12 text-base shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">
                  {user.displayName}
                </span>
                {isSelf ? (
                  <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-semibold text-slate-300">
                    (tú)
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-400 font-medium">@{user.username}</div>
            </div>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {/* Member Details */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 py-2 border-y border-white/[0.06] mb-3">
          <span>
            {user.createdByName ? `Creado por ${user.createdByName}` : "Cuenta raíz"}
          </span>
          <span className="flex items-center gap-1">
            <IconClock className="h-3 w-3 text-slate-500" />
            {new Date(user.createdAt).toLocaleDateString("es-ES")}
          </span>
        </div>

        {/* Alert Banners: Suspension and Warnings */}
        <div className="space-y-2 mb-3">
          {suspended ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-rose-300 mb-0.5">
                <IconAlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                {permanent ? "Suspensión Permanente" : "Cuenta Suspendida"}
              </div>
              <p className="text-[11px] text-rose-200/90">
                {permanent
                  ? "El usuario no tiene acceso a ningún servicio de la network."
                  : `Hasta ${new Date(user.suspendedUntil as string).toLocaleString("es-ES")}`}
              </p>
              {user.suspensionReason ? (
                <p className="mt-1 text-[11px] font-medium text-rose-300/80 italic">
                  Motivo: &quot;{user.suspensionReason}&quot;
                </p>
              ) : null}
            </div>
          ) : null}

          {warningCount > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-xs text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-300">
                  <IconAlertTriangle className="h-3.5 w-3.5" />
                  {warningCount} advertencia{warningCount > 1 ? "s" : ""} registrada{warningCount > 1 ? "s" : ""}
                </div>
                <button
                  type="button"
                  onClick={() => setWarningsOpen((v) => !v)}
                  className="text-[11px] font-semibold text-amber-300 underline hover:text-amber-200 cursor-pointer"
                >
                  {warningsOpen ? "Ocultar" : "Ver detalles"}
                </button>
              </div>

              {warningsOpen ? (
                <ul className="mt-2.5 space-y-1.5 pt-2 border-t border-amber-500/30">
                  {user.warnings.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-black/40 px-2.5 py-1 text-[11px]"
                    >
                      <span className="truncate">{w.reason}</span>
                      <button
                        type="button"
                        onClick={() => removeWarn(w.id)}
                        className="shrink-0 text-slate-400 hover:text-rose-300 cursor-pointer p-0.5"
                        title="Retirar advertencia"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Controls & Footer */}
      <div className="pt-3 border-t border-white/[0.08] space-y-3">
        {isFounder ? (
          <div className="flex items-center justify-between text-xs text-slate-400 py-1">
            <span className="flex items-center gap-1.5 font-semibold text-rose-300">
              <IconShield className="h-4 w-4" /> Fundador Principal
            </span>
            <span className="text-[11px] text-slate-500">Inmune a cambios</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Liquid Select Role and Suspend */}
            <div className="flex items-center gap-2">
              <LiquidSelect
                options={roleOptions}
                value={role}
                onChange={changeRole}
                disabled={pending}
                className="flex-1"
              />

              {suspended ? (
                <button
                  onClick={reactivate}
                  disabled={pending}
                  className="btn-secondary !py-1.5 !px-3 text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
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
                  className="btn-danger !py-1.5 !px-3 text-xs"
                >
                  Suspender
                </button>
              )}
            </div>

            {/* Sub-actions toolbar */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setWarningsOpen((v) => !v);
                  setWarnError(null);
                }}
                disabled={pending}
                className="btn-secondary !py-1 !px-2.5 text-[11px] flex items-center gap-1"
              >
                <IconPlus className="h-3 w-3" /> Advertir
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setResetting((v) => !v)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                  title="Restablecer contraseña"
                >
                  <IconSettings className="h-4 w-4" />
                </button>

                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => deleteUser(user.id).then(() => router.refresh()))
                      }
                      className="btn-danger !py-1 !px-2 text-[10px]"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="btn-secondary !py-1 !px-2 text-[10px]"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Eliminar usuario"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expandable Suspension Bubble with Liquid Glass */}
        {suspendOpen && !isFounder ? (
          <div className="p-3.5 rounded-2xl border border-rose-500/40 bg-[#0c101a]/95 shadow-[0_10px_30px_rgba(225,29,72,0.25)] backdrop-blur-2xl space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-rose-300">
              <span>Suspender a @{user.username}</span>
              <button
                type="button"
                onClick={() => setSuspendOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label text-[10px]">Duración</label>
                <LiquidSelect
                  options={DURATION_OPTIONS}
                  value={suspendDuration}
                  onChange={setSuspendDuration}
                  className="w-full"
                />
              </div>
              <div>
                <label className="label text-[10px]">Razón</label>
                <input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="input !py-1.5 text-xs"
                  placeholder="Motivo obligatorio"
                  required
                  minLength={3}
                />
              </div>
            </div>
            {suspendError ? (
              <p className="text-[10px] text-rose-300">{suspendError}</p>
            ) : null}
            <button
              type="button"
              onClick={submitSuspend}
              disabled={pending || suspendReason.trim().length < 3}
              className="btn-danger w-full !py-1.5 text-xs font-semibold"
            >
              Confirmar Suspensión
            </button>
          </div>
        ) : null}

        {/* Expandable New Warning Form */}
        {warningsOpen && !isFounder ? (
          <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-[#0c101a]/95 shadow-[0_10px_30px_rgba(245,158,11,0.2)] backdrop-blur-2xl space-y-2.5 animate-fadeIn">
            <label className="label text-[10px] text-amber-300">
              Nueva Advertencia para @{user.username}
            </label>
            <div className="flex items-center gap-2">
              <input
                value={newWarning}
                onChange={(e) => setNewWarning(e.target.value)}
                className="input !py-1.5 text-xs flex-1"
                placeholder="Razón de la sanción..."
              />
              <button
                type="button"
                onClick={submitWarning}
                disabled={pending || newWarning.trim().length < 3}
                className="btn-primary !py-1.5 !px-3 text-xs"
              >
                Añadir
              </button>
            </div>
            {warnError ? (
              <p className="text-[10px] text-rose-300">{warnError}</p>
            ) : null}
          </div>
        ) : null}

        {/* Expandable Password Reset Form */}
        {resetting && !isFounder ? (
          <form
            action={async (fd) => {
              fd.set("userId", user.id);
              await resetUserPassword(fd);
              startTransition(() => router.refresh());
              setResetting(false);
            }}
            className="p-3.5 rounded-2xl border border-white/[0.12] bg-[#0c101a]/95 shadow-xl backdrop-blur-2xl space-y-2 animate-fadeIn"
          >
            <label className="label text-[10px]">
              Nueva Contraseña para @{user.username}
            </label>
            <div className="flex items-center gap-2">
              <input
                name="password"
                className="input !py-1.5 text-xs flex-1 font-mono"
                required
                minLength={6}
                placeholder="Nueva clave"
              />
              <button type="submit" className="btn-primary !py-1.5 !px-3 text-xs">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setResetting(false)}
                className="btn-secondary !py-1.5 !px-2.5 text-xs"
              >
                ✕
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}