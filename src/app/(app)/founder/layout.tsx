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
    <div className="flex min-h-screen flex-col selection:bg-rose-500/30">
      {/* Unified Liquid Glass Founder Header */}
      <div className="border-b border-white/[0.08] bg-[#090d16]/85 backdrop-blur-2xl px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                background: "linear-gradient(135deg, var(--ruby-light) 0%, var(--ruby-primary) 100%)",
                boxShadow: "0 4px 18px var(--ruby-glow)",
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white border border-white/20"
            >
              <IconShield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">
                  Panel de Fundadores
                </h1>
                <span
                  style={{
                    backgroundColor: "var(--ruby-surface)",
                    borderColor: "var(--ruby-border)",
                    color: "var(--ruby-light)",
                  }}
                  className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  Acceso Total
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consola ejecutiva y control administrativo para {user.displayName}
              </p>
            </div>
          </div>

          {/* Sub Navigation Segmented Control */}
          <FounderNav />
        </div>
      </div>

      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
