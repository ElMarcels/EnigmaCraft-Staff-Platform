import "server-only";
import { prisma } from "@/lib/db";

export async function notifyMentions({
  content,
  authorId,
  fromName,
  location,
  href,
}: {
  content: string;
  authorId: string;
  fromName: string;
  location: string;
  href: string;
}) {
  const re = /@([a-zA-Z0-9_]{2,32})/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) names.add(match[1]);

  if (names.size === 0) return;
  const targets = await prisma.user.findMany({
    where: { username: { in: [...names] }, active: true },
    select: { id: true },
  });

  const preview = content.length > 80 ? `${content.slice(0, 80)}…` : content;
  await Promise.all(
    targets
      .filter((t) => t.id !== authorId)
      .map((t) =>
        prisma.notification.create({
          data: {
            userId: t.id,
            type: "MESSAGE_MENTION",
            title: `${fromName} te mencionó`,
            body: `en ${location}: “${preview}”`,
            href,
          },
        })
      )
  );
}