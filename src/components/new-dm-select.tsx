"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function NewDmSelect({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/all");
        if (!res.ok) return;
        const list = (await res.json()) as {
          id: string;
          displayName: string;
          username: string;
          role: string;
        }[];
        setUsers(
          (Array.isArray(list) ? list : [])
            .filter((u) => u.id !== currentUserId)
            .map((u) => ({
              id: u.id,
              label: `${u.displayName} (@${u.username})`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  return (
    <select
      value=""
      onChange={(e) => e.target.value && router.push(`/dm/${e.target.value}`)}
      className="input !w-auto text-sm"
      disabled={loading}
    >
      <option value="" disabled>
        {loading ? "Cargando personal…" : "Iniciar conversación…"}
      </option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.label}
        </option>
      ))}
    </select>
  );
}