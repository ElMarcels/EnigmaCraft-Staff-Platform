import { redirect } from "next/navigation";
import { getCurrentUserWithStatus, hasContactInfo } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, suspended } = await getCurrentUserWithStatus();
  if (suspended) redirect("/suspended");
  if (!user) redirect("/login");
  if (!hasContactInfo(user)) redirect("/onboarding");

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <AppShell user={user} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
