import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IconShield } from "@/components/icons";
import { FounderNav } from "@/components/founder-nav";

export const dynamic = "force-dynamic";

export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FOUNDER") redirect("/dashboard");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-amber-400/20 bg-amber-500/[0.06] px-6 py-3">
        <div className="flex items-center gap-2 text-amber-300">
          <IconShield className="h-5 w-5" />
          <span className="font-semibold">Panel de Fundadores</span>
          <span className="text-xs text-amber-200/50">
            · Acceso exclusivo · {user.displayName}
          </span>
        </div>
      </div>
      <FounderNav />
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
