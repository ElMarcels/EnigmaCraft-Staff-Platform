"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const all = Array.from(files);
      for (const file of all) {
        const fd = new FormData();
        fd.append("file", file);
        if (folderId) fd.append("parentId", folderId);
        const res = await fetch("/api/files", { method: "POST", body: fd });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setUploadMsg(j?.error || "Error al subir archivo.");
          return;
        }
      }
      router.refresh();
      setUploadMsg(`Se subieron ${all.length} archivo(s).`);
    } catch {
      setUploadMsg("Error de red al subir archivos.");
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
      });
    });
  }

  const parentId = folderId
    ? breadcrumb.length > 1
      ? breadcrumb[breadcrumb.length - 2].id
      : null
    : null;

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/files" className="hover:text-white">
            Mi Drive
          </Link>
          {breadcrumb.map((b) => (
            <span key={b.id} className="flex items-center gap-2">
              <span className="text-white/20">/</span>
              <Link href={`/files?folder=${b.id}`} className="hover:text-white">
                {b.name}
              </Link>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {parentId !== null && (
            <Link
              href={parentId ? `/files?folder=${parentId}` : "/files"}
              className="btn-secondary"
            >
              <IconArrowLeft /> Subir nivel
            </Link>
          )}
          {canManage ? (
            <>
              <button
                onClick={() => setNewFolder((v) => !v)}
                className="btn-secondary"
              >
                <IconPlus /> Carpeta
              </button>
              <button onClick={() => fileInput.current?.click()} className="btn-primary">
                <IconPlus /> Subir
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

      {uploadMsg ? (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
          {uploadMsg}
        </div>
      ) : null}

      {newFolder && canManage ? (
        <form
          action={async (fd) => {
            if (folderId) fd.append("parentId", folderId);
            await createFolder(fd);
            router.refresh();
            setNewFolder(false);
          }}
          className="mb-4 flex items-end gap-2"
        >
          <div className="flex-1">
            <label className="label">Nueva carpeta</label>
            <input name="name" className="input" placeholder="Nombre de la carpeta" required />
          </div>
          <button type="submit" className="btn-primary">Crear</button>
        </form>
      ) : null}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-white/30">
          <IconFolder className="mb-3 h-12 w-12" />
          <p>Esta carpeta está vacía.</p>
          <p className="text-sm">Sube archivos para empezar a guardarlos.</p>
        </div>
      ) : (
        <div>
          <div className="hidden grid-cols-[1fr_120px_150px_80px] gap-3 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wide text-white/30 md:grid">
            <span>Nombre</span>
            <span>Tamaño</span>
            <span>Subido por</span>
            <span className="text-right">Acciones</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="group grid grid-cols-1 items-center gap-2 border-b border-white/5 py-2.5 transition-colors hover:bg-white/[0.03] md:grid-cols-[1fr_120px_150px_80px]"
            >
              {renaming === item.id ? (
                <form onSubmit={(e) => submitRename(e, item.id)} className="flex items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="input"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary" disabled={pending}>
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenaming(null)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </form>
              ) : item.isFolder ? (
                <Link
                  href={`/files?folder=${item.id}`}
                  className="flex min-w-0 items-center gap-2 font-medium text-amber-200 hover:text-amber-100"
                >
                  <IconFolder className="h-5 w-5 shrink-0 text-amber-300/80" />
                  <span className="truncate">{item.name}</span>
                </Link>
              ) : (
                <div className="flex min-w-0 items-center gap-2 font-medium text-white/80">
                  <IconFile className="h-5 w-5 shrink-0 text-indigo-300/80" />
                  <span className="truncate">{item.name}</span>
                </div>
              )}

              <span className="text-sm text-white/40">{item.isFolder ? "—" : fmtBytes(item.size)}</span>
              <span className="truncate text-sm text-white/40">{item.ownerName}</span>

              <div className="flex items-center justify-end gap-1">
                {!item.isFolder ? (
                  <a
                    href={`/api/files/${item.id}`}
                    download
                    className="rounded p-1.5 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                    title="Descargar"
                  >
                    <IconDownload className="h-4 w-4" />
                  </a>
                ) : null}
                {canManage ? (
                  <>
                    <button
                      onClick={() => startRename(item)}
                      className="rounded px-1.5 py-1 text-xs text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      title="Renombrar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        startTransition(() =>
                          deleteFileOrFolder(item.id).then(() => router.refresh())
                        )
                      }
                      className="rounded p-1.5 text-white/30 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading ? (
        <div className="mt-4 animate-pulse text-sm text-indigo-300">
          Subiendo archivos…
        </div>
      ) : null}
    </div>
  );
}
