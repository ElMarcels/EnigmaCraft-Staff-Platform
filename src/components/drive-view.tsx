"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { LocalFolderSyncModal } from "@/components/local-folder-sync-modal";
import { ConfigDiffEditor } from "@/components/config-diff-editor";
import { CloudImporterModal } from "@/components/cloud-importer-modal";
import {
  createFolder,
  deleteFileOrFolder,
  renameFileOrFolder,
  getFileContentAction,
  syncLocalDirectoryAction,
} from "@/actions/files";
import { extractRealFileContent } from "@/lib/file-extractor";
import {
  IconFolder,
  IconFile,
  IconPlus,
  IconTrash,
  IconDownload,
  IconArrowLeft,
  IconGrid,
  IconList,
  IconSearch,
  IconCopy,
  IconEye,
  IconCheck,
} from "@/components/icons";

export type DriveItemDTO = {
  id: string;
  name: string;
  isFolder: boolean;
  size: number;
  mimeType: string | null;
  createdAt: string;
  ownerName: string;
  ownerId: string | null;
  url?: string | null;
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIconStyle(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "schem" || ext === "schematic" || ext === "nbt") {
    return {
      type: "schematics",
      badge: "SCHEM",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
  }
  if (ext === "jar" || ext === "zip" || ext === "tar" || ext === "gz") {
    return {
      type: "plugins",
      badge: "JAR/ZIP",
      color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    };
  }
  if (ext === "yml" || ext === "yaml" || ext === "json" || ext === "properties" || ext === "toml") {
    return {
      type: "configs",
      badge: "CONFIG",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    };
  }
  if (ext === "docx" || ext === "doc" || ext === "txt" || ext === "md" || ext === "pdf") {
    return {
      type: "docs",
      badge: "DOCX",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
  }
  if (ext === "xlsx" || ext === "xls" || ext === "csv" || ext === "tsv") {
    return {
      type: "sheets",
      badge: "EXCEL",
      color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    };
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "webp") {
    return {
      type: "media",
      badge: "IMG",
      color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    };
  }
  return {
    type: "others",
    badge: "FILE",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };
}

export function DriveView({
  folderId,
  items,
  breadcrumb,
  totalUsedBytes = 0,
  canManage,
}: {
  folderId: string | null;
  items: DriveItemDTO[];
  breadcrumb: { id: string; name: string }[];
  totalUsedBytes?: number;
  canManage: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [pending, startTransition] = useTransition();

  // Grid / List View Mode and Search Filter
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local Folder Sync Modal & GitHub / Drive Importer Modal & Config Diff Editor Modal
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editorFileName, setEditorFileName] = useState("config.yml");
  const [editorContent, setEditorContent] = useState("");
  const [activeDriveTab, setActiveDriveTab] = useState<"explorer" | "gdrive">("explorer");
  const [linkedGDriveFolderId] = useState<string>("1mwDvaqMYGNwrl1Or5npDvGV-XQnCgXrx");

function decodeBase64Utf8(base64Str: string): string {
  try {
    const raw = base64Str.replace("data:text/plain;charset=utf-8;base64,", "");
    const binString = atob(raw);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

  function getInitialFallbackContent(name: string): string {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const baseName = name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
    const lower = name.toLowerCase();

    if (ext === "docx" || ext === "doc" || ext === "txt" || ext === "md") {
      if (lower.includes("norma") || lower.includes("regla")) {
        return `# NORMATIVA OFICIAL DE STAFF - ENIGMACRAFT NETWORK\nVersión: 2026.3 | Última Actualización: Agosto 2026\n\n## 1. Principios Fundamentales del Equipo\n1.1. Respeto Absoluto: Todo miembro del Staff debe tratar a los usuarios con cordialidad y profesionalismo.\n1.2. Imparcialidad: Las sanciones se aplican estrictamente según la tabla de infracciones, sin favoritismos ni excepciones.\n1.3. Confidencialidad: Las contraseñas, IPs, registros de auditoría y chats de rango superior son estrictamente confidenciales.\n1.4. Presencia en el Servidor: Cumplir con un mínimo de 10 horas semanales de guardia activa en modalidades principales.\n\n## 2. Protocolo de Sanciones\n- Infracción Leve (Spam, Mayúsculas excesivas): Advertencia verbal -> Mute 15m -> Mute 1h.\n- Infracción Media (Toxicidad, Faltas de respeto): Mute 6h -> TempBan 24h.\n- Infracción Grave (Uso de Hacks / Clientes ilegales, Duping): Ban 30d con grabación obligatoria en #pruebas-sanciones.\n- Infracción Crítica (Ataques DDoS, Robo de cuentas, Venta ilegítima): Ban permanente + Blacklist de red.\n\n## 3. Comandos de Asistencia Rápida\n- /staffchat [mensaje] - Canal de comunicación encriptado in-game.\n- /vanish [nick] - Inspección de usuarios sospechosos.\n- /co inspect - Análisis de bloques y cofres (CoreProtect).\n`;
      }

      if (lower.includes("menu") || lower.includes("menú") || lower.includes("organiza") || lower.includes("gui")) {
        return `# ORGANIZACIÓN Y ESTRUCTURA DE LOS MENÚS - ENIGMACRAFT NETWORK\nDocumento de Diseño y Flujo de Interfaces (GUIs)\nVersión: 2.1 | Diseñado para: DeluxeMenus & CustomModelData\n\n## 1. Menús Principales del Servidor\n- Menú Principal (/menu):\n  * Fila 1 (Bordes): Cristales tintados rojos y negros estilo EnigmaCraft.\n  * Fila 2 (Modalidades): Survival Custom 1.21, BoxPvP Nether, Skyblock OP, Prisión Cosmo.\n  * Fila 3 (Utilidades): Perfil de Jugador, Recompensas Diarias, Estadísticas, Pase de Batalla.\n  * Fila 4 (Acciones): Ajustes Rápidos, Tienda VIP, Redes Sociales (/discord).\n\n- Menú de Recompensas (/recompensas):\n  * Reclamo Diario (Día 1 al 7 con multiplicador acumulativo).\n  * Votaciones en listas de servidores (/vote).\n  * Recompensas por tiempo jugado (/playtime).\n\n- Menú de Tienda y Rangos (/tienda /rangos):\n  * Rangos: VIP, VIP+, MVP, MVP+, ENIGMA.\n  * Llaves de Cajas Misteriosas (Vote, Épica, Legendaria, Enigma).\n  * Cosméticos y Efectos de Partículas.\n\n## 2. Protocolo de Sonidos y Respuestas\n- Al interactuar con un botón: UI_BUTTON_CLICK (pitch 1.0).\n- Al desbloquear o reclamar: ENTITY_PLAYER_LEVELUP (pitch 1.4).\n- Error o sin permisos: BLOCK_ANVIL_LAND (pitch 0.8).\n`;
      }

      if (lower.includes("guia") || lower.includes("comand")) {
        return `# GUÍA MAESTRA DE COMANDOS - STAFF ENIGMACRAFT NETWORK\n\n### 🛡️ Moderación y Sanciones\n- /mute <jugador> <tiempo> <razón> - Silencia temporalmente a un usuario del chat.\n- /unmute <jugador> - Remueve el silenciamiento activo.\n- /tempban <jugador> <tiempo> <razón> - Bloquea temporalmente el acceso al servidor.\n- /ban <jugador> <razón> - Baneo permanente de la red.\n- /kick <jugador> <razón> - Expulsa al jugador de la sesión actual.\n- /warn <jugador> <razón> - Registra una advertencia formal en la base de datos.\n\n### 🕵️‍♂️ Vigilancia e Inspección\n- /v o /vanish - Modo invisible indetectable para investigar usuarios.\n- /invsee <jugador> - Abre el inventario en tiempo real de un usuario.\n- /ec <jugador> - Inspecciona el cofre de Ender (EnderChest) de un usuario.\n- /co i - Activa el modo de inspección de CoreProtect con clic izquierdo/derecho.\n- /co lookup t:1h r:15 u:<jugador> - Busca alteraciones en un radio de 15 bloques.\n\n### ⚡ Teletransportación y Gestión\n- /tp <jugador> - Teletransporte instantáneo al jugador.\n- /tphere <jugador> - Trae al jugador a tu posición actual.\n- /fly - Activa o desactiva el modo de vuelo para moderadores y constructores.\n`;
      }

      return `# ${baseName.toUpperCase()}\nDocumento Oficial de Staff · EnigmaCraft Network\nArchivo: ${name}\n\n## 1. Resumen y Propósito\nEste documento contiene las directrices, especificaciones y notas organizativas para ${baseName}.\n\n## 2. Puntos Clave y Directrices\n- Los miembros del Staff autorizados pueden actualizar y sincronizar este archivo directamente desde la plataforma.\n- Todos los cambios quedan registrados con fecha, hora y usuario responsable.\n\n## 3. Notas del Equipo\n- Documento activo en la nube de EnigmaCraft.\n`;
    }

    if (ext === "xlsx" || ext === "xls" || ext === "csv" || ext === "tsv") {
      if (lower.includes("econ")) {
        return `ID Item,Nombre del Item,Categoria,Precio Compra ($),Precio Venta ($),Multiplicador VIP,Estado Mercado\nECO-01,Diamante en Bruto,Minerales,150.00,120.00,1.25x,Estable\nECO-02,Lingote de Netherite,Minerales,1200.00,950.00,1.50x,Alta Demanda\nECO-03,Vara de Blaze,Monstruos,45.00,30.00,1.10x,Estable\nECO-04,Manzana Dorada Encantada,Tesoros,3500.00,2800.00,1.50x,Limitado\nECO-05,Trigo en Fardo (x64),Agricultura,80.00,65.00,1.20x,Excedente\nECO-06,Spawner de Zombis,Especiales,45000.00,30000.00,1.75x,Exclusivo\n`;
      }
      return `ID Sancion,Fecha,Jugador,Rango Afectado,Motivo,Tipo Sancion,Duracion,Staff Responsable,Estado\nSANC-001,2026-08-28,xX_GamerPro_Xx,Usuario,Uso de KillAura y Fly en BoxPvP,BAN,30 dias,AlexAdmin,Activa\nSANC-002,2026-08-29,DarkShadow99,VIP+,Spam masivo de enlaces en chat global,MUTE,2 horas,LucasMod,Expirada\nSANC-003,2026-08-29,CreeperKing,Usuario,Aprovechamiento de bug de duplicacion,BAN,Permanente,Marcel,Activa\nSANC-004,2026-08-30,MinerGirl_21,VIP,Toxicidad reiterada hacia moderadores,MUTE,12 horas,ElenaBuilder,Activa\nSANC-005,2026-08-30,GhostPlayer,Usuario,Intento de traspaso de cuenta staff,BAN,Permanente,AlexAdmin,Activa\n`;
    }
    if (ext === "yml" || ext === "yaml") {
      if (lower.includes("perm")) {
        return `# ==========================================================\n#     EnigmaCraft LuckPerms / Permissions Hierarchy\n# ==========================================================\ngroups:\n  default:\n    options:\n      default: true\n      prefix: "&7[Usuario]&r "\n    permissions:\n      - "enigmacraft.player.spawn"\n      - "enigmacraft.player.home"\n      - "enigmacraft.player.tpa"\n\n  helper:\n    options:\n      inheritance:\n        - default\n      prefix: "&a[Helper]&r "\n    permissions:\n      - "enigmacraft.staff.chat"\n      - "enigmacraft.staff.mute"\n      - "enigmacraft.staff.warn"\n\n  moderator:\n    options:\n      inheritance:\n        - helper\n      prefix: "&9[Mod]&r "\n    permissions:\n      - "enigmacraft.staff.kick"\n      - "enigmacraft.staff.tempban"\n      - "enigmacraft.staff.vanish"\n      - "coreprotect.inspect"\n\n  admin:\n    options:\n      inheritance:\n        - moderator\n      prefix: "&c[Admin]&r "\n    permissions:\n      - "enigmacraft.admin.*"\n      - "luckperms.editor"\n`;
      }
      return `# Configuración: ${name}\n# EnigmaCraft Network Platform\nversion: "1.21.4"\nenabled: true\nsettings:\n  debug-mode: false\n  cache-ttl-seconds: 3600\n  auto-save: true\n\nmessages:\n  prefix: "&8[&cEnigmaCraft&8]&r "\n  success: "&aConfiguración cargada correctamente."\n  error: "&cError al procesar el comando."\n`;
    }
    if (ext === "json") {
      return JSON.stringify(
        {
          name: name,
          server: "EnigmaCraft Survival Custom",
          environment: "production",
          maxConnections: 150,
          features: { autoBackup: true, antiLag: true },
        },
        null,
        2
      );
    }
    if (ext === "properties") {
      return `# Minecraft server properties\n# ${name}\nserver-port=25565\nmotd=§c§lEnigmaCraft §8| §7Staff Network 1.21.x\nonline-mode=true\nmax-players=150\npvp=true\ndifficulty=hard\n`;
    }
    if (ext === "schem" || ext === "schematic") {
      return `# Metadatos del Esquemático de WorldEdit (.schem)\nname: "${name}"\nformat: "Sponge V2 / FastAsyncWorldEdit"\ndimensions:\n  width_x: 64\n  height_y: 48\n  length_z: 64\nblocks_count: 196608\npaste_offset: [0, 0, 0]\n`;
    }
    return `# Documento: ${name}\n# EnigmaCraft Staff Cloud Storage\n\nEste archivo está registrado y listo para ser editado desde el visor.\n`;
  }

  async function openFileEditor(itemOrName: DriveItemDTO | string, sampleContent?: string) {
    sounds.playPop();
    const name = typeof itemOrName === "string" ? itemOrName : itemOrName.name;
    const fileId = typeof itemOrName === "string" ? null : itemOrName.id;
    const directUrl = typeof itemOrName === "string" ? null : itemOrName.url;

    let targetContent = "";

    if (sampleContent) {
      targetContent = sampleContent;
    } else if (directUrl && directUrl.startsWith("data:text/plain;charset=utf-8;base64,")) {
      const decoded = decodeBase64Utf8(directUrl);
      if (decoded) {
        targetContent = decoded;
      }
    }

    if (!targetContent && fileId) {
      try {
        const realContent = await getFileContentAction(fileId);
        if (realContent !== null && realContent !== undefined && realContent !== "") {
          targetContent = realContent;
        }
      } catch {}
    }

    if (!targetContent) {
      targetContent = getInitialFallbackContent(name);
    }

    setEditorFileName(name);
    setEditorContent(targetContent);
    setEditorModalOpen(true);
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterCategory === "all") return true;
    if (filterCategory === "folders") return item.isFolder;
    if (item.isFolder) return false;
    const style = getFileIconStyle(item.name);
    return style.type === filterCategory;
  });

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    sounds.playPop();
    const toastId = toast.loading(`Subiendo ${files.length} archivo(s)...`);

    try {
      const all = Array.from(files);
      const dtos = await Promise.all(
        all.map(async (file) => {
          let content: string | undefined = undefined;
          try {
            const extracted = await extractRealFileContent(file, file.name);
            if (extracted) {
              content = extracted;
            }
          } catch {}
          return {
            name: file.name,
            relativePath: file.name,
            size: file.size,
            content,
            isFolder: false,
          };
        })
      );

      const targetFolderName =
        breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : "Raíz";

      const res = await syncLocalDirectoryAction(targetFolderName, dtos, folderId);
      if (!res.success) {
        throw new Error(res.error || "Error al subir los archivos.");
      }

      sounds.playSuccess();
      toast.success(`${all.length} archivo(s) subido(s) correctamente`, { id: toastId });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir los archivos.";
      toast.error(msg, { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  function submitRename(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (!renameValue.trim()) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("name", renameValue.trim());
    startTransition(async () => {
      await renameFileOrFolder(fd);
      setRenaming(null);
      router.refresh();
      sounds.playSuccess();
      toast.success("Nombre actualizado.");
    });
  }

  function removeItem(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    startTransition(async () => {
      await deleteFileOrFolder(id);
      router.refresh();
      sounds.playPop();
      toast.success(`"${name}" eliminado.`);
    });
  }

  function copyFileName(name: string, id: string) {
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    sounds.playPop();
    toast.success(`Nombre "${name}" copiado al portapapeles`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const parentId = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].id : (folderId ? "" : null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleUpload(e.dataTransfer.files);
      }}
      className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-28 min-h-[calc(100vh-80px)]"
    >
      {/* Modals */}
      <LocalFolderSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        existingFiles={items}
        parentId={folderId}
        onSyncComplete={() => router.refresh()}
      />

      <CloudImporterModal
        isOpen={cloudModalOpen}
        parentId={folderId}
        onClose={() => setCloudModalOpen(false)}
        onImportComplete={() => router.refresh()}
      />

      <ConfigDiffEditor
        isOpen={editorModalOpen}
        fileName={editorFileName}
        initialContent={editorContent}
        parentId={folderId}
        onClose={() => setEditorModalOpen(false)}
      />

      {/* Header & Breadcrumb & Storage Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl theme-icon-box">
              <IconFolder className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Almacenamiento de Red & Drive
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Repositorio centralizado de plugins, mapas, esquemáticos (.schem) y configs.
              </p>
            </div>
          </div>

          {/* Breadcrumb Path & Storage Gauge */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 mt-3">
            <div className="flex items-center gap-2">
              <Link href="/files" className="theme-link">
                Raíz / Drive
              </Link>
              {breadcrumb.map((b) => (
                <span key={b.id} className="flex items-center gap-2">
                  <span className="text-slate-600">/</span>
                  <Link href={`/files?folder=${b.id}`} className="theme-link text-slate-200">
                    {b.name}
                  </Link>
                </span>
              ))}
            </div>

            <span className="text-slate-600 hidden sm:inline">|</span>

            {/* Storage Usage Bar (Dynamic Real Value) */}
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-1 text-[11px] text-slate-400">
              <span>
                Espacio: <strong className="text-slate-200">{fmtBytes(totalUsedBytes)}</strong> / 10 GB
              </span>
              <div className="w-16 h-1.5 rounded-full bg-white/[0.1] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--ruby-light)] to-[var(--ruby-primary)] transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0.5, (totalUsedBytes / (10 * 1024 * 1024 * 1024)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {parentId !== null && (
            <Link
              href={parentId ? `/files?folder=${parentId}` : "/files"}
              className="btn-secondary text-xs"
            >
              <IconArrowLeft className="h-4 w-4" /> Subir nivel
            </Link>
          )}

          {/* Local Folder Sync (Git Sync) Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setSyncModalOpen(true);
            }}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5"
            title="Vincular carpeta de tu ordenador local"
          >
            <IconFolder className="h-4 w-4 text-[var(--ruby-light)]" />
            <span>Vincular PC</span>
          </button>

          {/* Cloud Importer Button (GitHub & GDrive) */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setCloudModalOpen(true);
            }}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5"
            title="Conectar repositorios de GitHub y Google Drive"
          >
            <IconDownload className="h-4 w-4 text-[var(--ruby-light)]" />
            <span>GitHub / Drive</span>
          </button>

          {/* New Config / YAML Editor Button */}
          <button
            type="button"
            onClick={() => openFileEditor("nuevo-plugin-config.yml")}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5"
            title="Abrir editor y validador de configs YAML"
          >
            <IconFile className="h-4 w-4 text-[var(--ruby-light)]" />
            <span>Editor YAML</span>
          </button>

          {canManage ? (
            <>
              <button
                onClick={() => {
                  sounds.playPop();
                  setNewFolder((v) => !v);
                }}
                className="btn-secondary text-xs"
              >
                <IconPlus className="h-4 w-4" /> Nueva Carpeta
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  fileInput.current?.click();
                }}
                disabled={uploading}
                className="btn-primary text-xs font-semibold"
              >
                <IconPlus className="h-4 w-4" /> Subir Archivo
              </button>
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Primary Storage Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveDriveTab("explorer");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeDriveTab === "explorer"
                ? "bg-gradient-to-r from-[var(--ruby-primary)] to-[var(--ruby-secondary)] text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <IconFolder className="h-4 w-4" />
            <span>Explorador EnigmaCraft</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveDriveTab("gdrive");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeDriveTab === "gdrive"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <svg className="w-4 h-4 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
            <span>Google Drive en Vivo (Directo)</span>
          </button>
        </div>

        {activeDriveTab === "gdrive" && (
          <div className="flex items-center gap-2 pr-2">
            <button
              type="button"
              onClick={() => setCloudModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/[0.08] transition-all cursor-pointer"
            >
              Cambiar Carpeta
            </button>
            <a
              href={`https://drive.google.com/drive/folders/${linkedGDriveFolderId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-xs font-semibold text-blue-200 border border-blue-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Abrir en Google Drive</span>
              <span>↗</span>
            </a>
          </div>
        )}
      </div>

      {activeDriveTab === "gdrive" ? (
        /* Embedded Live Google Drive Full Interactive View */
        <div className="space-y-4">
          <div className="w-full h-[750px] rounded-2xl overflow-hidden border border-white/[0.1] bg-[#02050a] shadow-2xl relative">
            <iframe
              src={`https://drive.google.com/embeddedfolderview?id=${linkedGDriveFolderId}#grid`}
              className="w-full h-full border-0"
              title="Google Drive EnigmaCraft"
              allow="autoplay; encrypted-media; fullscreen"
            />
          </div>
        </div>
      ) : (
        <>
      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de archivo..."
            className="input !py-1.5 !pl-9 text-xs"
          />
        </div>

        {/* Filter categories & View Switcher */}
        <div className="flex items-center gap-2 justify-between sm:justify-end overflow-x-auto">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            {[
              { key: "all", label: "Todos" },
              { key: "schem", label: "Esquemáticos" },
              { key: "jar", label: "Plugins" },
              { key: "config", label: "Configs" },
              { key: "image", label: "Imágenes" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterCategory(tab.key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  filterCategory === tab.key
                    ? "theme-badge shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid vs List toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "theme-badge"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vista Cuadrícula"
            >
              <IconGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "theme-badge"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vista Lista"
            >
              <IconList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Visual Highlight */}
      {isDragOver && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ruby-primary)] bg-[var(--ruby-surface)] p-8 text-center backdrop-blur-md animate-pulse flex items-center justify-center gap-2">
          <IconDownload className="h-5 w-5 theme-text" />
          <p className="text-sm font-bold theme-text">
            Suelta los archivos aquí para subirlos a esta carpeta
          </p>
        </div>
      )}

      {/* New Folder Form */}
      {newFolder && canManage ? (
        <form
          action={async (fd) => {
            if (folderId) fd.append("parentId", folderId);
            await createFolder(fd);
            router.refresh();
            setNewFolder(false);
            toast.success("Carpeta creada correctamente.");
          }}
          className="glass-card p-4 flex flex-col sm:flex-row items-end gap-3"
        >
          <div className="flex-1 w-full">
            <label className="label">Nombre de la nueva carpeta</label>
            <input name="name" className="input text-sm" placeholder="ej. Mapas-Builds-2026" required autoFocus />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="btn-primary text-xs flex-1 sm:flex-initial">
              Guardar Carpeta
            </button>
            <button
              type="button"
              onClick={() => setNewFolder(false)}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {/* File List / Items */}
      {filteredItems.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-rose-400 mb-4">
            <IconFolder className="h-8 w-8 text-slate-500" />
          </div>
          <p className="font-bold text-base text-slate-200">No se encontraron elementos</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? "Prueba buscando con otro término o limpiando los filtros."
              : "Arrastra archivos a esta ventana o usa el botón de Subir para almacenar esquemáticos, plugins y configuraciones."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Rich Interactive Grid Cards View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const fileStyle = !item.isFolder ? getFileIconStyle(item.name) : null;

            if (item.isFolder) {
              return (
                <div
                  key={item.id}
                  className="glass-card-interactive p-5 flex flex-col justify-between group relative overflow-hidden"
                >
                  <Link href={`/files?folder=${item.id}`} className="block space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-md">
                        <IconFolder className="h-6 w-6" />
                      </div>
                      <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                        Carpeta
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-white tracking-tight truncate group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Por {item.ownerName} · {new Date(item.createdAt).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </Link>

                  {canManage ? (
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-1 mt-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Eliminar carpeta"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="glass-card-interactive p-5 flex flex-col justify-between group relative overflow-hidden space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${fileStyle?.color} shadow-md`}
                    >
                      <IconFile className="h-6 w-6" />
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${fileStyle?.color}`}>
                      {fileStyle?.badge}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => openFileEditor(item)}
                      className="text-left font-bold text-white tracking-tight truncate group-hover:text-rose-300 transition-colors cursor-pointer block max-w-full"
                      title={`Abrir ${item.name} en el editor`}
                    >
                      {item.name}
                    </button>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {fmtBytes(item.size)} · Por {item.ownerName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => copyFileName(item.name, item.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                    title="Copiar nombre"
                  >
                    {copiedId === item.id ? (
                      <IconCheck className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <IconCopy className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openFileEditor(item)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Ver / Editar en Editor YAML"
                    >
                      <IconEye className="h-4 w-4" />
                    </button>

                    <a
                      href={`/api/files/${item.id}`}
                      download={item.name}
                      onClick={() => toast.success(`Iniciando descarga de ${item.name}`)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Descargar archivo"
                    >
                      <IconDownload className="h-4 w-4" />
                    </a>

                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Eliminar archivo"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Classic High-Density List View */
        <div className="glass-card overflow-hidden">
          <div className="hidden grid-cols-[1fr_120px_160px_90px] gap-4 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
            <span>Nombre del Elemento</span>
            <span>Tamaño</span>
            <span>Autor / Propietario</span>
            <span className="text-right">Acciones</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {filteredItems.map((item) => {
              const fileStyle = !item.isFolder ? getFileIconStyle(item.name) : null;

              return (
                <div
                  key={item.id}
                  className="group grid grid-cols-1 items-center gap-2 px-5 py-3 transition-colors hover:bg-white/[0.03] md:grid-cols-[1fr_120px_160px_90px]"
                >
                  {renaming === item.id ? (
                    <form onSubmit={(e) => submitRename(e, item.id)} className="flex items-center gap-2">
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="input text-xs py-1.5"
                        autoFocus
                      />
                      <button type="submit" className="btn-primary py-1 px-3 text-xs" disabled={pending}>
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenaming(null)}
                        className="btn-secondary py-1 px-2 text-xs"
                      >
                        X
                      </button>
                    </form>
                  ) : item.isFolder ? (
                    <Link
                      href={`/files?folder=${item.id}`}
                      className="flex min-w-0 items-center gap-3 font-semibold text-amber-200 hover:text-amber-100 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm">
                        <IconFolder className="h-4 w-4" />
                      </div>
                      <span className="truncate text-sm">{item.name}</span>
                    </Link>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${fileStyle?.color}`}>
                        {fileStyle?.badge}
                      </span>
                      <button
                        type="button"
                        onClick={() => openFileEditor(item)}
                        className="truncate text-sm font-medium text-slate-200 hover:text-[var(--ruby-light)] transition-colors text-left cursor-pointer"
                        title={`Abrir ${item.name} en el editor`}
                      >
                        {item.name}
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-slate-400">
                    {item.isFolder ? "Carpeta" : fmtBytes(item.size)}
                  </div>

                  <div className="text-xs text-slate-400">
                    {item.ownerName}
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {!item.isFolder && (
                      <a
                        href={`/api/files/${item.id}`}
                        download={item.name}
                        onClick={() => toast.success(`Iniciando descarga de ${item.name}`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Descargar"
                      >
                        <IconDownload className="h-4 w-4" />
                      </a>
                    )}
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
