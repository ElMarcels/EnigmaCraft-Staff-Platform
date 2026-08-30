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
} from "@/actions/files";
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
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIconStyle(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "schem" || ext === "schematic" || ext === "nbt") {
    return {
      badge: "SCHEM",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      cardGradient: "from-emerald-500/15 to-teal-950/40",
      glowColor: "rgba(16,185,129,0.3)",
      label: "Esquemático Minecraft",
      type: "schem",
    };
  }
  if (ext === "jar") {
    return {
      badge: "JAR",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      cardGradient: "from-amber-500/15 to-yellow-950/40",
      glowColor: "rgba(245,158,11,0.3)",
      label: "Java Plugin Paper/Spigot",
      type: "jar",
    };
  }
  if (ext === "yml" || ext === "yaml" || ext === "json" || ext === "toml") {
    return {
      badge: "CFG",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      cardGradient: "from-cyan-500/15 to-blue-950/40",
      glowColor: "rgba(6,182,212,0.3)",
      label: "Configuración Servidor",
      type: "config",
    };
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") {
    return {
      badge: "IMG",
      color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      cardGradient: "from-rose-500/15 to-red-950/40",
      glowColor: "rgba(225,29,72,0.3)",
      label: "Imagen / Banner",
      type: "image",
    };
  }
  if (ext === "zip" || ext === "rar" || ext === "gz") {
    return {
      badge: "ZIP",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      cardGradient: "from-purple-500/15 to-indigo-950/40",
      glowColor: "rgba(168,85,247,0.3)",
      label: "Comprimido",
      type: "zip",
    };
  }
  return {
    badge: "DOC",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    cardGradient: "from-slate-500/15 to-slate-950/40",
    glowColor: "rgba(148,163,184,0.3)",
    label: "Documento",
    type: "other",
  };
}

export function DriveView({
  folderId,
  items,
  breadcrumb,
  canManage,
}: {
  folderId: string | null;
  items: DriveItemDTO[];
  breadcrumb: { id: string; name: string }[];
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

  // Modals for Local Folder Sync, Cloud Import and YAML Diff Editor
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editorFileName, setEditorFileName] = useState("config.yml");
  const [editorContent, setEditorContent] = useState(
    `# Configuración del Servidor EnigmaCraft Network\nserver-name: "EnigmaCraft Survival Custom"\nmax-players: 150\nview-distance: 12\n\nnetwork:\n  bungee-mode: true\n  redis-sync: true\n  packet-compression-threshold: 256\n\neconomy:\n  enabled: true\n  starting-balance: 500\n  currency-symbol: "⛁"\n\nsecurity:\n  anti-vpn: true\n  rate-limit-cps: 20\n  two-factor-staff: true\n`
  );

  function openFileEditor(name: string, sampleContent?: string) {
    sounds.playPop();
    setEditorFileName(name);
    if (sampleContent) {
      setEditorContent(sampleContent);
    } else {
      const ext = name.split(".").pop()?.toLowerCase();
      if (ext === "yml" || ext === "yaml") {
        setEditorContent(
          `# Configuración: ${name}\n# EnigmaCraft Network Platform\nversion: "1.21.4"\nenabled: true\nsettings:\n  debug-mode: false\n  cache-ttl-seconds: 3600\n  auto-save: true\n\nmessages:\n  prefix: "&c[EnigmaCraft]&r "\n  success: "&aConfiguración cargada correctamente."\n  error: "&cError al procesar el comando."\n`
        );
      } else if (ext === "json") {
        setEditorContent(
          JSON.stringify(
            {
              name: name,
              server: "EnigmaCraft Survival Custom",
              environment: "production",
              maxConnections: 150,
              features: { autoBackup: true, antiLag: true },
            },
            null,
            2
          )
        );
      } else if (ext === "properties") {
        setEditorContent(
          `# Minecraft server properties\n# ${name}\nserver-port=25565\nmotd=§c§lEnigmaCraft §8| §7Staff Network 1.21.x\nonline-mode=true\nmax-players=150\npvp=true\ndifficulty=hard\n`
        );
      } else if (ext === "schem" || ext === "schematic") {
        setEditorContent(
          `# Metadatos del Esquemático de WorldEdit (.schem)\nname: "${name}"\nformat: "Sponge V2 / FastAsyncWorldEdit"\ndimensions:\n  width_x: 64\n  height_y: 48\n  length_z: 64\nblocks_count: 196608\npaste_offset: [0, 0, 0]\n`
        );
      } else {
        setEditorContent(`# Archivo: ${name}\n# EnigmaCraft Staff Cloud Storage\n\n`);
      }
    }
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
      for (const file of all) {
        const signRes = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            parentId: folderId,
          }),
        });
        if (!signRes.ok) {
          const j = await signRes.json().catch(() => null);
          toast.error(j?.error || "Error al preparar la subida.", { id: toastId });
          return;
        }
      }

      sounds.playSuccess();
      toast.success("Archivos subidos correctamente", { id: toastId });
      router.refresh();
    } catch {
      toast.error("Error al subir los archivos.", { id: toastId });
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

            {/* Storage Usage Bar */}
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-1 text-[11px] text-slate-400">
              <span>Espacio: <strong className="text-slate-200">18.0 MB</strong> / 10 GB</span>
              <div className="w-16 h-1.5 rounded-full bg-white/[0.1] overflow-hidden">
                <div className="h-full w-[8%] bg-gradient-to-r from-[var(--ruby-light)] to-[var(--ruby-primary)]" />
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
                      onClick={() => openFileEditor(item.name)}
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
                      onClick={() => openFileEditor(item.name)}
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
                      <span className="truncate text-sm font-medium text-slate-200">{item.name}</span>
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
    </div>
  );
}
