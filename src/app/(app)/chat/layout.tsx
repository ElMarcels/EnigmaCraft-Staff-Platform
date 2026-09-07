import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatSidebar } from "@/components/chat-sidebar";

export const dynamic = "force-dynamic";

const DEMO_CATEGORIES: any[] = [
  {
    id: "cat-staff-official",
    name: "📢 OFICIAL & COMUNICADOS",
    position: 0,
    channels: [
      { id: "anuncios", name: "anuncios", type: "TEXT", position: 0, description: "Canal oficial de alertas y anuncios de la network", categoryId: "cat-staff-official" },
      { id: "normativa-staff", name: "normativa-staff", type: "TEXT", position: 1, description: "Protocolos, directrices internas y código de conducta", categoryId: "cat-staff-official" },
    ],
  },
  {
    id: "cat-staff-general",
    name: "💬 TEXTO & COORDINACIÓN",
    position: 1,
    channels: [
      { id: "general", name: "general", type: "TEXT", position: 0, description: "Canal principal de comunicación del staff", categoryId: "cat-staff-general" },
      { id: "guardia-staff", name: "guardia-staff", type: "TEXT", position: 1, description: "Turnos activos de moderación y relevos en servidores", categoryId: "cat-staff-general" },
      { id: "charla-casual", name: "charla-casual", type: "TEXT", position: 2, description: "Off-topic y convivencia del equipo", categoryId: "cat-staff-general" },
    ],
  },
  {
    id: "cat-staff-moderation",
    name: "🛡️ SEGURIDAD & SANCIONES",
    position: 2,
    channels: [
      { id: "sospechas-hacks", name: "sospechas-hacks", type: "TEXT", position: 0, description: "Reportes de cheaters, clips sospechosos y revisiones de screenshare", categoryId: "cat-staff-moderation" },
      { id: "sanciones-logs", name: "sanciones-logs", type: "TEXT", position: 1, description: "Registro y debate sobre baneos o apelaciones", categoryId: "cat-staff-moderation" },
      { id: "reportes-bugs", name: "reportes-bugs", type: "TEXT", position: 2, description: "Incidencias técnicas, fallos de plugins y exploits", categoryId: "cat-staff-moderation" },
    ],
  },
  {
    id: "cat-staff-build",
    name: "🔨 BUILD & PROYECTOS",
    position: 3,
    channels: [
      { id: "build-team", name: "build-team", type: "TEXT", position: 0, description: "Construcción de mapas, lobbies y arenas de modalidades", categoryId: "cat-staff-build" },
      { id: "actualizaciones-red", name: "actualizaciones-red", type: "TEXT", position: 1, description: "Notas de parches y cambios técnicos de servidores", categoryId: "cat-staff-build" },
    ],
  },
  {
    id: "cat-staff-voice",
    name: "🔊 SALAS DE VOZ (STAFF RTC)",
    position: 4,
    channels: [
      { id: "voz-guardia", name: "🔊 Sala de Guardia", type: "VOICE", position: 0, description: "Voz en vivo para moderadores en turno activo", categoryId: "cat-staff-voice" },
      { id: "voz-reuniones", name: "🔊 Sala de Reuniones", type: "VOICE", position: 1, description: "Reuniones generales de staff y anuncios semanales", categoryId: "cat-staff-voice" },
      { id: "voz-despacho", name: "🔊 Despacho Admin", type: "VOICE", position: 2, description: "Canal de voz privado para alta dirección", categoryId: "cat-staff-voice" },
    ],
  },
];

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  let categories: any[] = DEMO_CATEGORIES;

  try {
    const dbCats = await prisma.channelCategory.findMany({
      orderBy: { position: "asc" },
      include: {
        channels: { orderBy: { position: "asc" } },
      },
    });
    if (dbCats.length > 0) {
      // Check if dbCats already has the voice channels or anuncios, if not, merge or ensure fallback
      const hasAnuncios = dbCats.some((c) => c.channels.some((ch) => ch.name.includes("anuncio")));
      const hasVoice = dbCats.some((c) => c.channels.some((ch) => ch.type === "VOICE"));
      if (!hasAnuncios || !hasVoice) {
        // Merge missing demo categories into categories display so user has immediate access
        categories = [...dbCats, ...DEMO_CATEGORIES.filter((dc) => !dbCats.some((c) => c.name.toLowerCase() === dc.name.toLowerCase()))];
      } else {
        categories = dbCats;
      }
    }
  } catch {
    // Graceful fallback to demo categories
  }

  const canManage = !!user && ["FOUNDER", "ADMIN"].includes(user.role);

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden pb-20">
      <ChatSidebar
        categories={categories}
        canManage={canManage}
        currentUser={user ? { id: user.id, displayName: user.displayName, role: user.role, avatarColor: user.avatarColor } : null}
      />
      <div className="min-w-0 flex-1 h-full">{children}</div>
    </div>
  );
}
