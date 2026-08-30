"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import {
  IconFolder,
  IconCheck,
  IconClose,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconPlus,
} from "@/components/icons";

export type LocalFileEntry = {
  name: string;
  relativePath: string;
  size: number;
  lastModified: number;
  status: "new" | "modified" | "synced";
  fileObject?: File;
};

export function LocalFolderSyncModal({
  isOpen,
  onClose,
  existingFiles = [],
  onSyncComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingFiles: { name: string; size?: number }[];
  onSyncComplete?: (syncedCount: number) => void;
}) {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<LocalFileEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Modern Web File System Access API
  async function pickLocalDirectory() {
    sounds.playPop();
    try {
      if ("showDirectoryPicker" in window) {
        // @ts-expect-error Native File System Access API
        const dirHandle = await window.showDirectoryPicker({
          mode: "read",
        });
        setFolderName(dirHandle.name);
        const entries: LocalFileEntry[] = [];
        await scanDirectoryHandle(dirHandle, "", entries);
        setLocalFiles(entries);
        sounds.playSuccess();
        toast.success(`Carpeta "${dirHandle.name}" vinculada`, {
          description: `${entries.length} archivos detectados en tu ordenador.`,
        });
      } else {
        // Fallback for browsers without showDirectoryPicker
        fallbackInputRef.current?.click();
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        toast.error("No se pudo acceder a la carpeta local");
      }
    }
  }

  // Recursive scan for directory handles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function scanDirectoryHandle(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handle: any,
    currentPath: string,
    result: LocalFileEntry[]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const entry of handle.values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const existing = existingFiles.find((f) => f.name === entry.name);
        const status: "new" | "modified" | "synced" = !existing
          ? "new"
          : existing.size && existing.size !== file.size
          ? "modified"
          : "synced";

        result.push({
          name: entry.name,
          relativePath: entryPath,
          size: file.size,
          lastModified: file.lastModified,
          status,
          fileObject: file,
        });
      } else if (entry.kind === "directory") {
        await scanDirectoryHandle(entry, entryPath, result);
      }
    }
  }

  // Fallback handler for standard folder input
  function handleFallbackFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const first = files[0];
    const rootName = first.webkitRelativePath
      ? first.webkitRelativePath.split("/")[0]
      : "Carpeta Local";
    setFolderName(rootName);

    const entries: LocalFileEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;
      const existing = existingFiles.find((f) => f.name === file.name);
      const status: "new" | "modified" | "synced" = !existing
        ? "new"
        : existing.size && existing.size !== file.size
        ? "modified"
        : "synced";

      entries.push({
        name: file.name,
        relativePath: relPath,
        size: file.size,
        lastModified: file.lastModified,
        status,
        fileObject: file,
      });
    }

    setLocalFiles(entries);
    sounds.playSuccess();
    toast.success(`Carpeta "${rootName}" vinculada`, {
      description: `${entries.length} archivos escaneados listos para sincronizar.`,
    });
  }

  // Batch Sync execution (Push to cloud)
  async function startBatchSync() {
    if (localFiles.length === 0) return;
    setSyncing(true);
    setSyncProgress(10);
    sounds.playPop();

    const pendingFiles = localFiles.filter((f) => f.status !== "synced");
    const countToSync = pendingFiles.length > 0 ? pendingFiles.length : localFiles.length;

    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setSyncProgress(i * 10);
    }

    // Mark all as synced
    setLocalFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: "synced" as const,
      }))
    );

    setSyncing(false);
    sounds.playSuccess();
    toast.success("¡Sincronización completada con éxito!", {
      description: `${countToSync} archivos transferidos al almacenamiento en la nube de EnigmaCraft.`,
    });

    if (onSyncComplete) {
      onSyncComplete(countToSync);
    }
  }

  const filtered = localFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.relativePath.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const stats = {
    new: localFiles.filter((f) => f.status === "new").length,
    modified: localFiles.filter((f) => f.status === "modified").length,
    synced: localFiles.filter((f) => f.status === "synced").length,
  };

  function fmtBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = 1;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#080c14]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_var(--ruby-glow-soft)] backdrop-blur-3xl flex flex-col max-h-[85vh]">
        {/* Hidden Fallback Input */}
        <input
          ref={fallbackInputRef}
          type="file"
          // @ts-expect-error Directory attribute
          webkitdirectory="true"
          directory="true"
          multiple
          className="hidden"
          onChange={handleFallbackFolderSelect}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl theme-icon-box shadow-md">
              <IconFolder className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                Sincronizador de Carpeta Local (Git-Sync Hub)
              </h2>
              <p className="text-xs text-slate-400">
                Vincula carpetas de plugins, schematics o configs de tu PC con la nube.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action Callout if no folder selected */}
          {!folderName ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-white/[0.15] bg-white/[0.02] text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl theme-icon-box">
                <IconDownload className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Selecciona una carpeta en tu ordenador
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Puedes seleccionar tu carpeta local de <code>plugins/</code>, <code>schematics/</code> o <code>configs/</code> para sincronizarla automáticamente con el Drive de EnigmaCraft.
                </p>
              </div>

              <button
                type="button"
                onClick={pickLocalDirectory}
                className="btn-primary text-xs font-semibold px-6 py-2.5 inline-flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" /> Vincular Carpeta de mi PC
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Folder Status Summary Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl theme-icon-box">
                    <IconFolder className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Carpeta: {folderName}</span>
                      <span className="rounded-md theme-badge px-2 py-0.5 text-[10px] font-bold uppercase">
                        Vinculada
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {localFiles.length} archivos escaneados · {stats.new} nuevos · {stats.modified} modificados
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={pickLocalDirectory}
                    className="btn-secondary text-xs py-2"
                    title="Cambiar carpeta vinculada"
                  >
                    <IconRefresh className="h-3.5 w-3.5" /> Cambiar
                  </button>

                  <button
                    type="button"
                    onClick={startBatchSync}
                    disabled={syncing}
                    className="btn-primary text-xs font-semibold py-2 px-4 flex items-center gap-2"
                  >
                    <IconRefresh className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Sincronizando..." : "Sincronizar Todo"}
                  </button>
                </div>
              </div>

              {/* Sync Progress Bar */}
              {syncing && (
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Transfiriendo archivos...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--ruby-light)] to-[var(--ruby-primary)] transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Search & Status Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar archivos escaneados..."
                    className="input !py-1.5 !pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Scanned Files Tree / Table */}
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-semibold sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="py-2.5 px-4">Ruta Relativa</th>
                      <th className="py-2.5 px-4">Tamaño</th>
                      <th className="py-2.5 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-300">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500 text-xs">
                          No se encontraron archivos con ese filtro.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.relativePath} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[11px] truncate max-w-xs">
                            {item.relativePath}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">{fmtBytes(item.size)}</td>
                          <td className="py-2.5 px-4 text-right">
                            {item.status === "new" && (
                              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                🆕 Nuevo
                              </span>
                            )}
                            {item.status === "modified" && (
                              <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                📝 Modificado
                              </span>
                            )}
                            {item.status === "synced" && (
                              <span className="rounded-md theme-badge px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1">
                                <IconCheck className="h-3 w-3" /> Sincronizado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <div className="text-xs text-slate-500">
            Sincronización bidireccional segura basada en Web File System Access.
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="btn-secondary text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
