import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DriveView } from "@/components/drive-view";

export const dynamic = "force-dynamic";

const ROOT_DEMO_ITEMS = [
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
];

const FOLDER_CONTENTS: Record<string, { name: string; items: typeof ROOT_DEMO_ITEMS }> = {
  "folder-demo-1": {
    name: "Esquematicos & Mapas",
    items: [
      {
        id: "file-sub-1",
        name: "Spawn_Lobby_Principal_V5.schem",
        isFolder: false,
        size: 8945120,
        mimeType: "application/octet-stream",
        createdAt: new Date("2026-08-26T11:00:00Z").toISOString(),
        ownerName: "ElenaBuilder",
        ownerId: "4",
      },
      {
        id: "file-sub-2",
        name: "Isla_Skyblock_Nether.schem",
        isFolder: false,
        size: 3412900,
        mimeType: "application/octet-stream",
        createdAt: new Date("2026-08-27T15:40:00Z").toISOString(),
        ownerName: "ElenaBuilder",
        ownerId: "4",
      },
      {
        id: "file-sub-3",
        name: "Mundo_Survival_Spawn.schem",
        isFolder: false,
        size: 14205800,
        mimeType: "application/octet-stream",
        createdAt: new Date("2026-08-28T18:20:00Z").toISOString(),
        ownerName: "ElenaBuilder",
        ownerId: "4",
      },
    ],
  },
};

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const user = await getCurrentUser();

  const rootId: string | null = folder || null;
  let items: {
    id: string;
    name: string;
    isFolder: boolean;
    size: number;
    mimeType: string | null;
    createdAt: string;
    ownerName: string;
    ownerId: string | null;
    url?: string | null;
  }[] = [];
  let path: { id: string; name: string }[] = [];

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
        url: i.url,
      }));
    } else if (!rootId) {
      // Show default root starter templates only if database has 0 items at root
      items = ROOT_DEMO_ITEMS.map((d) => ({
        ...d,
        url: null,
      }));
    }
  } catch {
    // Fallback
    if (!rootId) {
      items = ROOT_DEMO_ITEMS.map((d) => ({
        ...d,
        url: null,
      }));
    }
  }

  let totalUsedBytes = items.reduce((acc, it) => acc + (it.size || 0), 0);

  try {
    const sumAgg = await prisma.fileNode.aggregate({
      _sum: { size: true },
      where: { isFolder: false },
    });
    if (sumAgg._sum.size !== null && sumAgg._sum.size !== undefined) {
      totalUsedBytes = sumAgg._sum.size;
    }
  } catch {
    // Fallback
  }

  const canManage = !!user;

  return (
    <div className="pb-20">
      <DriveView
        folderId={rootId}
        items={items}
        breadcrumb={path}
        totalUsedBytes={totalUsedBytes}
        canManage={canManage}
      />
    </div>
  );
}
