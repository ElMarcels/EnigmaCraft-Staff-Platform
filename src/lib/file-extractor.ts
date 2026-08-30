import JSZip from "jszip";

/**
 * Extracts real human-readable content from uploaded or synced files:
 * - .yml / .yaml / .json / .properties / .txt / .md / .schem / .java / .ts / .xml -> Raw UTF-8 code
 * - .docx -> Parses word/document.xml to extract real paragraphs and text
 * - .xlsx -> Parses xl/sharedStrings.xml & xl/worksheets/sheet1.xml into clean CSV table
 */
export async function extractRealFileContent(
  fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array,
  fileName: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Text & Code Formats
  const textExts = [
    "yml", "yaml", "json", "properties", "txt", "md", "schem",
    "toml", "xml", "csv", "tsv", "ini", "conf", "log", "java",
    "js", "ts", "tsx", "jsx", "html", "css", "sql", "sh", "bat", "env"
  ];

  if (textExts.includes(ext)) {
    if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
      try {
        return await fileOrBuffer.text();
      } catch {
        return "";
      }
    }
    const decoder = new TextDecoder("utf-8");
    if (fileOrBuffer instanceof ArrayBuffer) {
      return decoder.decode(fileOrBuffer);
    }
    if (fileOrBuffer instanceof Uint8Array) {
      return decoder.decode(fileOrBuffer);
    }
    return "";
  }

  // 2. DOCX Real Text Extraction from word/document.xml
  if (ext === "docx" || ext === "doc") {
    try {
      const zip = await JSZip.loadAsync(fileOrBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (docXmlFile) {
        const xmlText = await docXmlFile.async("text");
        const paragraphs = xmlText.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || [];
        const lines: string[] = [];

        for (const p of paragraphs) {
          const texts = p.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
          const pText = texts
            .map((t) => t.replace(/<[^>]+>/g, "").trim())
            .filter(Boolean)
            .join(" ");

          if (pText) {
            // Check if paragraph is heading
            if (p.includes("Heading1") || p.includes("Title")) {
              lines.push(`# ${pText}`);
            } else if (p.includes("Heading2")) {
              lines.push(`## ${pText}`);
            } else if (p.includes("Heading3")) {
              lines.push(`### ${pText}`);
            } else {
              lines.push(pText);
            }
          }
        }

        if (lines.length > 0) {
          return lines.join("\n\n");
        }
      }
    } catch {
      // Ignored
    }
  }

  // 3. XLSX Real Spreadsheet Extraction
  if (ext === "xlsx" || ext === "xls") {
    try {
      const zip = await JSZip.loadAsync(fileOrBuffer);
      const sharedStringsFile = zip.file("xl/sharedStrings.xml");
      const sharedStrings: string[] = [];

      if (sharedStringsFile) {
        const ssXml = await sharedStringsFile.async("text");
        const siList = ssXml.match(/<si>[\s\S]*?<\/si>/g) || [];
        for (const si of siList) {
          const texts = si.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g) || [];
          sharedStrings.push(texts.map((t) => t.replace(/<[^>]+>/g, "")).join(""));
        }
      }

      const sheetFile = zip.file("xl/worksheets/sheet1.xml");
      if (sheetFile) {
        const sheetXml = await sheetFile.async("text");
        const rows = sheetXml.match(/<row(?:\s[^>]*)?>[\s\S]*?<\/row>/g) || [];
        const csvRows: string[] = [];

        for (const row of rows) {
          const cells = row.match(/<c(?:\s[^>]*)?>[\s\S]*?<\/c>/g) || [];
          const rowValues: string[] = [];

          for (const cell of cells) {
            const isShared = cell.includes('t="s"');
            const vMatch = cell.match(/<v>([\s\S]*?)<\/v>/);
            if (vMatch) {
              const rawVal = vMatch[1];
              if (isShared) {
                const idx = parseInt(rawVal, 10);
                rowValues.push(sharedStrings[idx] || "");
              } else {
                rowValues.push(rawVal);
              }
            } else {
              rowValues.push("");
            }
          }
          if (rowValues.some(Boolean)) {
            csvRows.push(rowValues.join(","));
          }
        }

        if (csvRows.length > 0) {
          return csvRows.join("\n");
        }
      }
    } catch {
      // Ignored
    }
  }

  return "";
}
