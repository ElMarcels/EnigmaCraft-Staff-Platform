import { Role } from "@prisma/client";
import { ROLE_META } from "@/lib/role-meta";

export function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

export function Avatar({
  name,
  color,
  className,
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${className || ""}`}
      style={{ backgroundColor: color || "#6366f1" }}
    >
      {initial}
    </div>
  );
}
