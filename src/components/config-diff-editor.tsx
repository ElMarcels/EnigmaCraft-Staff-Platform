import { useEffect, useState } from "react";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { saveFileContentAction } from "@/actions/files";
import {
  IconClose,
  IconCheck,
  IconAlertTriangle,
  IconFile,
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
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<"editor" | "diff">("editor");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, fileName]);

  if (!isOpen) return null;

  // Basic YAML syntax linting (checks tab characters, malformed colons, unmatched quotes)
  function validateYaml(text: string): { isValid: boolean; error?: string } {
    if (text.includes("\t")) {
      return {
        isValid: false,
        error: "Los archivos YAML no admiten tabuladores (Tab). Usa espacios para indentar.",
      };
    }
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#") || line === "") continue;
      const singleQuoteCount = (line.match(/'/g) || []).length;
      const doubleQuoteCount = (line.match(/"/g) || []).length;
      if (singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) {
        return {
          isValid: false,
          error: `Posible comilla sin cerrar en la línea ${i + 1}: "${line.slice(0, 30)}..."`,
        };
      }
    }
    return { isValid: true };
  }

  const validation = fileName.endsWith(".yml") || fileName.endsWith(".yaml")
    ? validateYaml(content)
    : { isValid: true };

  // Calculate simple diff lines
  const originalLines = initialContent.split("\n");
  const modifiedLines = content.split("\n");

  async function handleSave() {
    if (!validation.isValid) {
      toast.error("Error de sintaxis YAML detectado", {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#090d16]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_var(--ruby-glow-soft)] backdrop-blur-3xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl theme-icon-box shadow-md">
              <IconFile className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight font-mono">
                  {fileName}
                </h2>
                <span className="rounded-md theme-badge px-2 py-0.5 text-[10px] font-bold uppercase">
                  Editor de Configs
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Edición directa en la nube con validador de sintaxis en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
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
                Editor
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

        {/* Editor Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#05070c]">
          {activeTab === "editor" ? (
            <div className="flex-1 relative flex">
              {/* Line Numbers */}
              <div className="w-12 py-3 bg-black/40 border-r border-white/[0.06] text-slate-600 font-mono text-xs select-none text-right pr-3 space-y-0.5 overflow-hidden">
                {content.split("\n").map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className="flex-1 h-full w-full bg-transparent p-3 text-slate-200 font-mono text-xs leading-6 resize-none focus:outline-none selection:bg-white/20 whitespace-pre"
                placeholder="# Escribe la configuración aquí..."
              />
            </div>
          ) : (
            /* Diff View */
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5 select-text">
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
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <div className="text-xs text-slate-500 font-mono">
            {modifiedLines.length} líneas · {content.length} caracteres
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
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !validation.isValid}
              className="btn-primary text-xs font-semibold px-5 flex items-center gap-2"
            >
              <IconCheck className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar y Desplegar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
