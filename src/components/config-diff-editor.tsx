"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { saveFileContentAction } from "@/actions/files";
import {
  IconClose,
  IconCheck,
  IconAlertTriangle,
  IconFile,
  IconSearch,
} from "@/components/icons";

export function ConfigDiffEditor({
  isOpen,
  fileName,
  initialContent = "",
  parentId,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  fileName: string;
  initialContent?: string;
  parentId?: string | null;
  onClose: () => void;
  onSave?: (fileName: string, newContent: string) => void;
}) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isSheet = ["xlsx", "xls", "csv", "tsv"].includes(ext);
  const isDoc = ["docx", "doc", "md", "txt", "pdf"].includes(ext);
  const isJson = ext === "json";
  const isYaml = ["yml", "yaml"].includes(ext);
  const isProperties = ["properties", "toml", "conf", "ini", "env"].includes(ext);

  function getFormatInfo() {
    if (isYaml) return { name: "YAML Config", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", type: "yaml" };
    if (isJson) return { name: "JSON Data", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", type: "json" };
    if (isProperties) return { name: "Server Properties", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", type: "properties" };
    if (isSheet) return { name: "Hoja de Cálculo", color: "bg-teal-500/20 text-teal-300 border-teal-500/30", type: "sheet" };
    if (isDoc) return { name: "Documento / Texto", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", type: "doc" };
    if (["java", "js", "ts", "xml", "sql"].includes(ext)) {
      return { name: `${ext.toUpperCase()} Source`, color: "bg-purple-500/20 text-purple-300 border-purple-500/30", type: "code" };
    }
    return { name: "Archivo de Texto", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", type: "text" };
  }

  const formatInfo = getFormatInfo();

  const defaultTab: "editor" | "diff" | "preview" = isSheet || isDoc ? "preview" : "editor";
  const [activeTab, setActiveTab] = useState<"editor" | "diff" | "preview">(defaultTab);
  const [content, setContent] = useState(initialContent);
  const [sheetSearch, setSheetSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(initialContent);
    const newExt = fileName.split(".").pop()?.toLowerCase() || "";
    if (["xlsx", "xls", "csv", "tsv", "docx", "doc", "md"].includes(newExt)) {
      setActiveTab("preview");
    } else {
      setActiveTab("editor");
    }
  }, [initialContent, fileName]);

  // Sync scroll between textarea and line numbers gutter
  function handleTextareaScroll() {
    if (textareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  // Update cursor position line & col
  function updateCursor() {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.substring(0, pos);
    const lines = textBefore.split("\n");
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  }

  // Handle Tab key and Ctrl+S shortcut inside editor
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      // Insert 2 spaces
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      setContent(newVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateCursor();
      }, 0);
    }
  }

  // Syntax Validation for YAML and JSON
  function validateSyntax(): { isValid: boolean; error?: string } {
    if (isYaml) {
      if (content.includes("\t")) {
        return {
          isValid: false,
          error: "Los archivos YAML no admiten tabuladores (Tab). Usa espacios para indentar.",
        };
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#") || line === "") continue;
        const singleQuoteCount = (line.match(/'/g) || []).length;
        const doubleQuoteCount = (line.match(/"/g) || []).length;
        if (singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) {
          return {
            isValid: false,
            error: `Comilla sin cerrar en línea ${i + 1}: "${line.slice(0, 30)}..."`,
          };
        }
      }
    } else if (isJson && content.trim()) {
      try {
        JSON.parse(content);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Sintaxis JSON inválida";
        return { isValid: false, error: msg };
      }
    }
    return { isValid: true };
  }

  const validation = validateSyntax();

  // Auto-format JSON / YAML
  function handleAutoFormat() {
    if (isJson) {
      try {
        const parsed = JSON.parse(content);
        setContent(JSON.stringify(parsed, null, 2));
        sounds.playSuccess();
        toast.success("JSON formateado correctamente");
      } catch {
        toast.error("Corrige los errores de sintaxis antes de autoformatear.");
      }
    }
  }

  // Calculate simple diff lines
  const originalLines = initialContent.split("\n");
  const modifiedLines = content.split("\n");

  // Spreadsheet CSV parsing
  const csvRows = content.split("\n").filter(Boolean).map((row) =>
    row.includes(",") ? row.split(",") : row.split(";")
  );
  const headers = csvRows[0] || ["Columna 1", "Columna 2", "Columna 3"];
  const dataRows = csvRows.slice(1);
  const filteredRows = dataRows.filter((r) =>
    r.some((c) => c.toLowerCase().includes(sheetSearch.toLowerCase()))
  );

  async function handleSave() {
    if (!validation.isValid) {
      toast.error("Error de sintaxis detectado", {
        description: validation.error,
      });
      return;
    }
    setSaving(true);
    sounds.playPop();

    try {
      await saveFileContentAction(fileName, content, parentId);
      setSaving(false);
      sounds.playSuccess();
      toast.success(`Archivo "${fileName}" guardado en la nube`, {
        description: "Los cambios han sido aplicados y persistidos en el almacenamiento de EnigmaCraft.",
      });
      if (onSave) onSave(fileName, content);
      onClose();
    } catch {
      setSaving(false);
      toast.error("Error al guardar el archivo.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#090d16]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_var(--ruby-glow-soft)] backdrop-blur-3xl flex flex-col h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-3.5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl theme-icon-box shadow-md">
              <IconFile className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-extrabold text-white tracking-tight font-mono">
                  {fileName}
                </h2>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${formatInfo.color}`}>
                  {formatInfo.name}
                </span>
                {isJson && (
                  <button
                    type="button"
                    onClick={handleAutoFormat}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors cursor-pointer"
                    title="Dar formato JSON con indentación limpia"
                  >
                    ✨ Formatear
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isSheet
                  ? "Visualizador y editor de tablas de cálculo y datos."
                  : isDoc
                  ? "Lector de documentos de texto, normativas y guías."
                  : "Edición con scroll fluido, atajos (Ctrl+S, Tab) y validador de sintaxis en tiempo real."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              {(isSheet || isDoc) && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab("preview");
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "preview"
                      ? "theme-badge shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isSheet ? "Vista Tabla" : "Vista Lectura"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("editor");
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "editor"
                    ? "theme-badge shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Editor Código
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("diff");
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "diff"
                    ? "theme-badge shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Visor Diff
              </button>
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
        </div>

        {/* Validation Warning Notice */}
        {!validation.isValid && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-xs font-semibold text-rose-300 animate-fadeIn">
            <IconAlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validation.error}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#05070c]">
          {activeTab === "preview" && isSheet ? (
            /* Spreadsheet / Excel Table Preview */
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1">
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    placeholder="Filtrar celdas de la tabla..."
                    className="input !py-1.5 !pl-9 text-xs"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {filteredRows.length} filas encontradas
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-white/[0.08] bg-black/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#0d121c] border-b border-white/[0.08] text-slate-300 font-bold uppercase tracking-wider backdrop-blur-md">
                    <tr>
                      <th className="py-2.5 px-4 w-12 border-r border-white/[0.06] text-slate-500 text-center">#</th>
                      {headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-4 border-r border-white/[0.06] last:border-r-0">
                          {h.trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-300 font-mono text-[11px]">
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 border-r border-white/[0.06] select-none">
                          {idx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2 px-4 border-r border-white/[0.06] last:border-r-0 truncate max-w-xs">
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "preview" && isDoc ? (
            /* Document / Word Reader Preview */
            <div className="flex-1 min-h-0 overflow-y-auto p-8 max-w-3xl mx-auto space-y-4 text-slate-200 text-sm leading-relaxed">
              <div className="border-b border-white/[0.08] pb-4 mb-6">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{fileName}</h1>
                <p className="text-xs text-slate-400 mt-1">Documento de Staff de EnigmaCraft Network</p>
              </div>

              <div className="space-y-4 font-sans whitespace-pre-wrap">
                {content || "No hay texto en este documento."}
              </div>
            </div>
          ) : activeTab === "editor" ? (
            /* Smooth Interactive Code Editor View */
            <div className="flex-1 min-h-0 relative flex overflow-hidden bg-[#03060c]">
              {/* Line Numbers Gutter */}
              <div
                ref={lineGutterRef}
                className="w-14 py-3 bg-[#070b14] border-r border-white/[0.08] text-slate-600 font-mono text-xs select-none text-right pr-3 space-y-0 overflow-hidden"
              >
                {content.split("\n").map((_, i) => (
                  <div
                    key={i}
                    className={`leading-6 h-6 ${
                      cursorPos.line === i + 1 ? "text-rose-400 font-bold bg-white/[0.03]" : ""
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Textarea with Smooth Full-Scroll */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  updateCursor();
                }}
                onScroll={handleTextareaScroll}
                onClick={updateCursor}
                onKeyUp={updateCursor}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 min-h-0 h-full w-full bg-transparent p-3 text-slate-100 font-mono text-xs leading-6 resize-none focus:outline-none selection:bg-rose-500/30 whitespace-pre overflow-y-auto overflow-x-auto scrollbar-thin"
                placeholder="# Escribe la configuración aquí..."
              />
            </div>
          ) : (
            /* Diff View */
            <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs space-y-0.5 select-text">
              {modifiedLines.map((modLine, idx) => {
                const origLine = originalLines[idx];
                const isDifferent = origLine !== modLine;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-2 py-0.5 rounded leading-6 ${
                      isDifferent
                        ? "bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500"
                        : "text-slate-400 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="w-8 text-right text-slate-600 select-none">{idx + 1}</span>
                    <span className="select-none font-bold text-slate-500">
                      {isDifferent ? "+" : " "}
                    </span>
                    <span className="flex-1 break-all whitespace-pre-wrap">{modLine}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-3 bg-white/[0.02]">
          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span>{modifiedLines.length} líneas · {content.length} caracteres</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">
              Línea {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="hidden md:inline text-slate-500">
              (Atajos: <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">Ctrl+S</kbd> guardar, <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">Tab</kbd> indentar)
            </span>
          </div>

          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !validation.isValid}
              className="btn-primary text-xs font-semibold px-5 flex items-center gap-2"
            >
              <IconCheck className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar en la Nube"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
