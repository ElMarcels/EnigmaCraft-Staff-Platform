"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
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
    return { badge: "SCHEM", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "Minecraft Schem" };
  }
  if (ext === "jar") {
    return { badge: "JAR", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Java Plugin" };
  }
  if (ext === "yml" || ext === "yaml" || ext === "json" || ext === "toml") {
    return { badge: "CFG", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", label: "Configuración" };
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") {
    return { badge: "IMG", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", label: "Imagen" };
  }
  if (ext === "zip" || ext === "rar" || ext === "gz") {
    return { badge: "ZIP", color: "bg-purple-500/20 text-purple-300 border-purple-500/30", label: "Archivo Comprimido" };
  }
  return { badge: "DOC", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", label: "Documento" };
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

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`Subiendo ${files.length} archivo(s)...`);

    try {
      const all = Array.from(files);
      let uploaded = 0;
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
        const { presignedUrl, pathname } = await signRes.json();

        const res = await fetch(presignedUrl, { method: "PUT", body: file });
        if (!res.ok) {
          toast.error(`Error al subir ${file.name}.`, { id: toastId });
          return;
        }

        const confirmRes = await fetch("/api/files/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname,
            name: file.name,
            size: file.size,
            type: file.type || null,
            parentId: folderId,
          }),
        });
        if (!confirmRes.ok) {
          const j = await confirmRes.json().catch(() => null);
          toast.error(j?.error || "Error al guardar el archivo.", { id: toastId });
          return;
        }
        uploaded++;
      }
      router.refresh();
      toast.success(
        `Se ${uploaded === 1 ? "subió" : "subieron"} ${uploaded} archivo(s) correctamente.`,
        { id: toastId }
      );
    } catch {
      toast.error("Error de red al subir archivos.", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function startRename(item: DriveItemDTO) {
    setRenaming(item.id);
    setRenameValue(item.name);
  }

  function submitRename(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("id", id);
    fd.append("name", renameValue);
    startTransition(() => {
      renameFileOrFolder(fd).then(() => {
        router.refresh();
        setRenaming(null);
        toast.success("Elemento renombrado.");
      });
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) return;
    startTransition(() => {
      deleteFileOrFolder(id).then(() => {
        router.refresh();
        toast.success(`"${name}" eliminado.`);
      });
    });
  }

  const parentId = folderId
    ? breadcrumb.length > 1
      ? breadcrumb[breadcrumb.length - 2].id
      : null
    : null;

  return (
    <div
      className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) {
          handleUpload(e.dataTransfer.files);
        }
      }}
    >
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <IconFolder className="h-6 w-6 text-rose-500" />
            Almacenamiento de Red & Drive
          </h1>
          {/* Breadcrumbs */}
          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link href="/files" className="hover:text-rose-400 transition-colors">
              Raíz / Drive
            </Link>
            {breadcrumb.map((b) => (
              <span key={b.id} className="flex items-center gap-2">
                <span className="text-slate-600">/</span>
                <Link href={`/files?folder=${b.id}`} className="hover:text-rose-400 transition-colors text-slate-200">
                  {b.name}
                </Link>
              </span>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {parentId !== null && (
            <Link
              href={parentId ? `/files?folder=${parentId}` : "/files"}
              className="btn-secondary text-xs"
            >
              <IconArrowLeft className="h-4 w-4" /> Subir nivel
            </Link>
          )}
          {canManage ? (
            <>
              <button
                onClick={() => setNewFolder((v) => !v)}
                className="btn-secondary text-xs"
              >
                <IconPlus className="h-4 w-4" /> Nueva Carpeta
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="btn-primary text-xs"
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

      {/* Drag & Drop Visual Highlight */}
      {isDragOver && (
        <div className="rounded-2xl border-2 border-dashed border-rose-500 bg-rose-500/10 p-8 text-center backdrop-blur-md animate-pulse flex items-center justify-center gap-2">
          <IconDownload className="h-5 w-5 text-rose-400" />
          <p className="text-sm font-bold text-rose-300">
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
      {items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-rose-400 mb-4">
            <IconFolder className="h-8 w-8 text-slate-500" />
          </div>
          <p className="font-bold text-base text-slate-200">Esta carpeta está vacía</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Arrastra archivos a esta ventana o usa el botón de Subir para almacenar esquemáticos, plugins y configuraciones.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="hidden grid-cols-[1fr_120px_160px_90px] gap-4 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
            <span>Nombre del Elemento</span>
            <span>Tamaño</span>
            <span>Autor / Propietario</span>
            <span className="text-right">Acciones</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {items.map((item) => {
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
                    <div className="flex min-w-0 items-center gap-3 font-medium text-slate-200">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-rose-400 shadow-sm">
                        <IconFile className="h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-semibold">{item.name}</span>
                      {fileStyle && (
                        <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${fileStyle.color}`}>
                          {fileStyle.badge}
                        </span>
                      )}
                    </div>
                  )}

                  <span className="text-xs font-medium text-slate-400">
                    {item.isFolder ? "Carpeta" : fmtBytes(item.size)}
                  </span>
                  <span className="truncate text-xs text-slate-400 font-medium">
                    {item.ownerName}
                  </span>

                  <div className="flex items-center justify-end gap-1.5">
                    {!item.isFolder ? (
                      <a
                        href={`/api/files/${item.id}`}
                        download
                        className="rounded-lg p-1.5 text-slate-400 opacity-80 group-hover:opacity-100 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                        title="Descargar archivo"
                      >
                        <IconDownload className="h-4 w-4" />
                      </a>
                    ) : null}
                    {canManage ? (
                      <>
                        <button
                          onClick={() => startRename(item)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-400 opacity-80 group-hover:opacity-100 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                          title="Renombrar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="rounded-lg p-1.5 text-slate-400 opacity-80 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </>
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
