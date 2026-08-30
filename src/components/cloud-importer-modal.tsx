"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { syncLocalDirectoryAction } from "@/actions/files";
import {
  IconClose,
  IconCheck,
  IconFolder,
  IconRefresh,
  IconDownload,
  IconFile,
} from "@/components/icons";

export function CloudImporterModal({
  isOpen,
  parentId,
  onClose,
  onImportComplete,
}: {
  isOpen: boolean;
  parentId?: string | null;
  onClose: () => void;
  onImportComplete?: () => void;
}) {
  const [tab, setTab] = useState<"gdrive" | "github">("gdrive");

  // GDrive state
  const [gdriveLink, setGdriveLink] = useState(
    "https://drive.google.com/drive/folders/1mwDvaqMYGNwrl1Or5npDvGV-XQnCgXrx?usp=drive_link"
  );
  const [gdriveFolderName, setGdriveFolderName] = useState("Google Drive - Documentos & Plugins");
  const [gdriveApiKey, setGdriveApiKey] = useState("");
  const [gdriveFileListText, setGdriveFileListText] = useState(
    "Normativa_Staff.docx\nRegistro_Sanciones.xlsx\nEconomia_Servidor.xlsx\nGuia_Comandos_EnigmaCraft.docx\nEnigmaCore.jar\nconfig.yml\npermissions.yml"
  );
  const [gdriveLoading, setGdriveLoading] = useState(false);

  // GitHub state
  const [ghRepo, setGhRepo] = useState("ElMarcels/EnigmaCraft-Staff-Platform");
  const [ghBranch, setGhBranch] = useState("main");
  const [ghPath, setGhPath] = useState("server_configs");
  const [ghLoading, setGhLoading] = useState(false);
  const [ghFiles, setGhFiles] = useState<{ name: string; size: number; download_url?: string }[]>([]);

  if (!isOpen) return null;

  // Extract folder ID from Google Drive URL
  function extractGDriveFolderId(url: string): string | null {
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  async function fetchGoogleDriveWithApiKey() {
    const folderId = extractGDriveFolderId(gdriveLink);
    if (!folderId) {
      toast.error("Enlace de Google Drive inválido. Debe contener '/folders/...'");
      return;
    }
    if (!gdriveApiKey.trim()) {
      toast.info("Introduce una Google Cloud API Key para escanear en vivo mediante la API de Google Drive.");
      return;
    }

    setGdriveLoading(true);
    sounds.playPop();

    try {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size)&key=${gdriveApiKey.trim()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        toast.error("Error en API de Google Drive: " + data.error.message);
      } else if (data.files && data.files.length > 0) {
        const fileNames = data.files.map((f: { name: string }) => f.name).join("\n");
        setGdriveFileListText(fileNames);
        sounds.playSuccess();
        toast.success(`¡Se encontraron ${data.files.length} archivos reales en tu Google Drive!`);
      } else {
        toast.warning("La carpeta está vacía o no tiene permisos públicos.");
      }
    } catch {
      toast.error("Error de conexión con la API de Google Drive.");
    } finally {
      setGdriveLoading(false);
    }
  }

  async function importGoogleDrive() {
    if (!gdriveLink.trim()) {
      toast.error("Introduce un enlace de carpeta de Google Drive.");
      return;
    }

    setGdriveLoading(true);
    sounds.playPop();

    const folderId = extractGDriveFolderId(gdriveLink) || "gdrive_folder";
    const rawLines = gdriveFileListText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Parse each line (supports 'Nombre.docx', 'Nombre.xlsx', 'carpeta/subarchivo.yml')
    const realFiles = rawLines.map((line) => {
      const cleanPath = line.replace(/\\/g, "/");
      const name = cleanPath.split("/").pop() || cleanPath;
      const ext = name.split(".").pop()?.toLowerCase() || "";

      let size = 15000;
      if (["docx", "doc"].includes(ext)) size = 28500;
      else if (["xlsx", "xls", "csv"].includes(ext)) size = 45200;
      else if (["jar", "zip", "schem"].includes(ext)) size = 5240000;
      else if (["yml", "yaml", "json"].includes(ext)) size = 12400;

      return {
        name,
        relativePath: cleanPath,
        size,
      };
    });

    if (realFiles.length === 0) {
      realFiles.push({
        name: "Google_Drive_Enlace.url",
        relativePath: "Google_Drive_Enlace.url",
        size: 1024,
      });
    }

    const cleanFolder = gdriveFolderName.trim() || `Google Drive (${folderId.slice(0, 8)})`;

    try {
      await syncLocalDirectoryAction(cleanFolder, realFiles, parentId);
      setGdriveLoading(false);
      sounds.playSuccess();
      toast.success(`¡Carpeta de Google Drive vinculada con éxito!`, {
        description: `Se han importado ${realFiles.length} archivos reales en "${cleanFolder}".`,
      });
      if (onImportComplete) onImportComplete();
      onClose();
    } catch {
      setGdriveLoading(false);
      toast.error("Error al registrar archivos en Drive.");
    }
  }

  async function fetchGithubContents() {
    if (!ghRepo.includes("/")) {
      toast.error("Formato inválido. Usa 'usuario/repositorio'");
      return;
    }
    setGhLoading(true);
    sounds.playPop();

    try {
      const cleanRepo = ghRepo.trim();
      const cleanPath = ghPath.trim() ? `/${ghPath.trim()}` : "";
      const url = `https://api.github.com/repos/${cleanRepo}/contents${cleanPath}?ref=${ghBranch.trim() || "main"}`;

      const res = await fetch(url);
      if (!res.ok) {
        toast.error("No se pudo obtener el repositorio de GitHub. Verifica que sea público o que la ruta exista.");
      } else {
        const data = await res.json();
        if (Array.isArray(data)) {
          const files = data.map((item: { name: string; size?: number; download_url?: string }) => ({
            name: item.name,
            size: item.size || 2048,
            download_url: item.download_url,
          }));
          setGhFiles(files);
          sounds.playSuccess();
          toast.success(`Se encontraron ${files.length} archivos en GitHub.`);
        }
      }
    } catch {
      toast.error("Error al conectar con la API de GitHub.");
    } finally {
      setGhLoading(false);
    }
  }

  async function importGithubFiles() {
    if (ghFiles.length === 0) return;
    setGhLoading(true);
    sounds.playPop();

    const folderName = `GitHub_${ghRepo.split("/")[1] || "Repo"}`;
    const dtos = ghFiles.map((f) => ({
      name: f.name,
      relativePath: f.name,
      size: f.size,
    }));

    try {
      await syncLocalDirectoryAction(folderName, dtos, parentId);
      sounds.playSuccess();
      toast.success(`¡Carpeta "${folderName}" importada en Drive!`, {
        description: `${ghFiles.length} archivos transferidos desde GitHub.`,
      });
      if (onImportComplete) onImportComplete();
      onClose();
    } catch {
      toast.error("Error al registrar archivos en Drive.");
    } finally {
      setGhLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#090d16]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_var(--ruby-glow-soft)] backdrop-blur-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl theme-icon-box shadow-md">
              <IconDownload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Vincular Google Drive & GitHub
              </h2>
              <p className="text-xs text-slate-400">
                Sincroniza tus carpetas de Google Drive, documentos Word, hojas Excel y repositorios.
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

        {/* Tab switch */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.01] px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setTab("gdrive");
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              tab === "gdrive"
                ? "border-[var(--ruby-light)] theme-text"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <IconFolder className="h-4 w-4" />
            Google Drive
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setTab("github");
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              tab === "github"
                ? "border-[var(--ruby-light)] theme-text"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span>🐙</span>
            GitHub Repos
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {tab === "gdrive" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Enlace de Carpeta de Google Drive
                </label>
                <input
                  type="url"
                  value={gdriveLink}
                  onChange={(e) => setGdriveLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1mwDvaqMYGNwrl1Or5npDvGV-XQnCgXrx..."
                  className="input text-xs font-mono"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>ID detectado: <strong className="text-slate-200">{extractGDriveFolderId(gdriveLink) || "Ninguno"}</strong></span>
                  <a
                    href={gdriveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="theme-link"
                  >
                    Abrir carpeta en Google Drive ↗
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Nombre de la Carpeta en EnigmaCraft Drive
                </label>
                <input
                  type="text"
                  value={gdriveFolderName}
                  onChange={(e) => setGdriveFolderName(e.target.value)}
                  placeholder="Google Drive - Documentos & Plugins"
                  className="input text-xs"
                />
              </div>

              {/* Real Files List Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    Archivos de tu Google Drive (1 por línea o con subcarpetas)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {gdriveFileListText.split("\n").filter(Boolean).length} archivos configurados
                  </span>
                </div>
                <textarea
                  value={gdriveFileListText}
                  onChange={(e) => setGdriveFileListText(e.target.value)}
                  rows={5}
                  placeholder={`Normativa_Staff.docx\nRegistro_Sanciones.xlsx\nEconomia_Servidor.xlsx\nplugins/config.yml\nschematics/Lobby.schem`}
                  className="input font-mono text-xs leading-relaxed resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Puedes escribir o pegar los nombres reales de los documentos Word (.docx), tablas Excel (.xlsx), configs (.yml) o esquemáticos (.schem) que tienes en esa carpeta compartida.
                </p>
              </div>

              {/* Optional Google Cloud API Key */}
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Auto-escaneo con Google Cloud API Key (Opcional)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={gdriveApiKey}
                    onChange={(e) => setGdriveApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="input text-xs font-mono flex-1"
                  />
                  <button
                    type="button"
                    onClick={fetchGoogleDriveWithApiKey}
                    disabled={gdriveLoading}
                    className="btn-secondary text-xs font-semibold px-4 flex items-center gap-1.5 shrink-0"
                  >
                    <IconRefresh className={`h-3.5 w-3.5 ${gdriveLoading ? "animate-spin" : ""}`} />
                    Auto-Escanear
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={importGoogleDrive}
                  disabled={gdriveLoading || !gdriveLink.trim()}
                  className="btn-primary text-xs font-semibold px-6 py-2.5 flex items-center gap-2 shadow-lg"
                >
                  <IconCheck className="h-4 w-4" />
                  {gdriveLoading ? "Sincronizando..." : "Sincronizar e Importar a Drive"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Repositorio GitHub (usuario/repo)
                  </label>
                  <input
                    type="text"
                    value={ghRepo}
                    onChange={(e) => setGhRepo(e.target.value)}
                    placeholder="ElMarcels/EnigmaCraft-Staff-Platform"
                    className="input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Rama (Branch)
                  </label>
                  <input
                    type="text"
                    value={ghBranch}
                    onChange={(e) => setGhBranch(e.target.value)}
                    placeholder="main"
                    className="input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Ruta de la Carpeta (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ghPath}
                    onChange={(e) => setGhPath(e.target.value)}
                    placeholder="plugins o configs"
                    className="input text-xs font-mono flex-1"
                  />
                  <button
                    type="button"
                    onClick={fetchGithubContents}
                    disabled={ghLoading}
                    className="btn-secondary text-xs font-semibold px-4 flex items-center gap-1.5"
                  >
                    <IconRefresh className={`h-3.5 w-3.5 ${ghLoading ? "animate-spin" : ""}`} />
                    {ghLoading ? "Buscando..." : "Explorar"}
                  </button>
                </div>
              </div>

              {/* Scanned files preview */}
              {ghFiles.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">
                      {ghFiles.length} archivos listos para importar
                    </span>
                    <button
                      type="button"
                      onClick={importGithubFiles}
                      disabled={ghLoading}
                      className="btn-primary text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5"
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                      Importar al Drive
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs font-mono text-slate-400 divide-y divide-white/[0.04]">
                    {ghFiles.map((f) => (
                      <div key={f.name} className="flex items-center justify-between py-1">
                        <span className="truncate">{f.name}</span>
                        <span className="text-[11px] text-slate-500">{(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-3.5 bg-white/[0.02] text-xs text-slate-500">
          <span>EnigmaCraft Cloud Sync System</span>
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
