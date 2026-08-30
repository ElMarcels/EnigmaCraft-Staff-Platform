import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DriveView } from "@/components/drive-view";

export const dynamic = "force-dynamic";

const DEMO_ITEMS = [
  {
    id: "file-demo-1",
    name: "Lobby_Halloween_2026.schem",
    isFolder: false,
    size: 5033164,
    mimeType: "application/octet-stream",
    createdAt: new Date("2026-08-25T14:30:00Z").toISOString(),
    ownerName: "ElenaBuilder",
    ownerId: "4",
  },
  {
    id: "file-demo-2",
    name: "EnigmaCore-v2.1.jar",
    isFolder: false,
    size: 12897484,
    mimeType: "application/java-archive",
    createdAt: new Date("2026-08-28T09:15:00Z").toISOString(),
    ownerName: "Marcel",
    ownerId: "1",
  },
  {
    id: "file-demo-3",
    name: "config-economy.yml",
    isFolder: false,
    size: 18432,
    mimeType: "text/yaml",
    createdAt: new Date("2026-08-29T16:20:00Z").toISOString(),
    ownerName: "AlexAdmin",
    ownerId: "2",
  },
  {
    id: "file-demo-4",
    name: "banner-promocional.png",
    isFolder: false,
    size: 1258291,
    mimeType: "image/png",
    createdAt: new Date("2026-08-30T08:00:00Z").toISOString(),
    ownerName: "LucasMod",
    ownerId: "3",
  },
  {
    id: "folder-demo-1",
    name: "Esquematicos & Mapas",
    isFolder: true,
    size: 0,
    mimeType: "inode/directory",
    createdAt: new Date("2026-08-20T12:00:00Z").toISOString(),
    ownerName: "ElenaBuilder",
    ownerId: "4",
  },
];

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const user = await getCurrentUser();

  let items = DEMO_ITEMS;
  let path: { id: string; name: string }[] = [];
  const rootId: string | null = folder || null;

  try {
    if (rootId) {
      const current = await prisma.fileNode.findUnique({ where: { id: rootId } });
      if (current && current.isFolder) {
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
    }

    const dbItems = await prisma.fileNode.findMany({
      where: { parentId: rootId },
      orderBy: [{ isFolder: "desc" }, { name: "asc" }],
      include: { owner: true },
    });
    if (dbItems.length > 0) {
      items = dbItems.map((i) => ({
        id: i.id,
        name: i.name,
        isFolder: i.isFolder,
        size: i.size,
        mimeType: i.mimeType || "application/octet-stream",
        createdAt: i.createdAt.toISOString(),
        ownerName: i.owner?.displayName || "—",
        ownerId: i.ownerId || "",
      }));
    }
  } catch {
    // Graceful fallback
  }

  const canManage = !!user;

  return (
    <div className="pb-20">
      <DriveView
        folderId={rootId}
        items={items}
        breadcrumb={path}
        canManage={canManage}
      />
    </div>
  );
}
