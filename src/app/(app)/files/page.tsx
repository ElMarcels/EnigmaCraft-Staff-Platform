import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DriveView } from "@/components/drive-view";

export const dynamic = "force-dynamic";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const user = await getCurrentUser();

  let current: Awaited<ReturnType<typeof prisma.fileNode.findUnique>> = null;
  let path: { id: string; name: string }[] = [];
  const rootId: string | null = folder || null;

  if (rootId) {
    current = await prisma.fileNode.findUnique({ where: { id: rootId } });
    if (!current || !current.isFolder) {
      return <DriveView folderId={null} items={[]} breadcrumb={[]} canManage={false} />;
    }
    path = [{ id: current.id, name: current.name }];
    let cursorId: string | null = current.parentId;
    while (cursorId) {
      const n = await prisma.fileNode.findUnique({
        where: { id: cursorId },
        select: { id: true, name: true, parentId: true },
      });
      if (!n) break;
      path.unshift({ id: n.id, name: n.name });
      cursorId = n.parentId;
    }
  }

  const items = await prisma.fileNode.findMany({
    where: { parentId: rootId },
    orderBy: [{ isFolder: "desc" }, { name: "asc" }],
    include: { owner: true },
  });

  const canManage = !!user;

  return (
    <DriveView
      folderId={rootId}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        isFolder: i.isFolder,
        size: i.size,
        mimeType: i.mimeType,
        createdAt: i.createdAt.toISOString(),
        ownerName: i.owner?.displayName || "—",
        ownerId: i.ownerId,
      }))}
      breadcrumb={path}
      canManage={canManage}
    />
  );
}
