// Client-side parsers for chat attachments.
// Returns plain text suitable for LLM context.

import mammoth from "mammoth";

export const SUPPORTED_EXTENSIONS = [
  // text & data
  ".csv", ".tsv", ".txt", ".json", ".md", ".log", ".xml", ".yaml", ".yml",
  // bioinformatics text
  ".vcf", ".bed", ".gff", ".gtf", ".fasta", ".fa", ".fastq", ".fq", ".sam", ".maf",
  // documents
  ".pdf", ".docx", ".doc", ".rtf",
  // web
  ".html", ".htm",
];

const TEXT_EXTENSIONS = new Set([
  ".csv", ".tsv", ".txt", ".json", ".md", ".log", ".xml", ".yaml", ".yml",
  ".vcf", ".bed", ".gff", ".gtf", ".fasta", ".fa", ".fastq", ".fq", ".sam", ".maf",
]);

export function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function stripRtf(rtf: string): string {
  // Minimal RTF → text: remove control words, groups, escapes.
  return rtf
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
  return (doc.body?.textContent || doc.documentElement.textContent || "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdf(file: File): Promise<string> {
  // Lazy-load pdfjs only when needed (heavy bundle).
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  // Use the bundled worker via Vite worker import.
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 100);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
    pages.push(`--- Page ${i} ---\n${text}`);
  }
  if (pdf.numPages > maxPages) {
    pages.push(`\n[Truncated: PDF has ${pdf.numPages} pages, only the first ${maxPages} were extracted.]`);
  }
  return pages.join("\n\n").trim();
}

async function parseDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return (res.value || "").trim();
}

export interface ParsedFile {
  name: string;
  content: string;
  size: number;
  truncated: boolean;
  kind: string;
}

export async function parseFile(file: File, maxChars = 50000): Promise<ParsedFile> {
  const ext = getExtension(file.name);
  let text = "";
  let kind = ext.slice(1) || "file";

  if (TEXT_EXTENSIONS.has(ext)) {
    text = await file.text();
    kind = "text";
  } else if (ext === ".pdf") {
    text = await parsePdf(file);
    kind = "pdf";
  } else if (ext === ".docx") {
    text = await parseDocx(file);
    kind = "docx";
  } else if (ext === ".doc") {
    // Legacy .doc (binary): best-effort raw text strip; recommend conversion to .docx.
    const raw = await file.text();
    text = `[Legacy .doc binary — raw text extraction is approximate. For best results, save as .docx.]\n\n${raw.replace(/[\x00-\x08\x0E-\x1F]+/g, " ").replace(/\s{2,}/g, " ").trim()}`;
    kind = "doc";
  } else if (ext === ".rtf") {
    const raw = await file.text();
    text = stripRtf(raw);
    kind = "rtf";
  } else if (ext === ".html" || ext === ".htm") {
    const raw = await file.text();
    text = stripHtml(raw);
    kind = "html";
  } else {
    throw new Error(`Unsupported file type: ${ext || "(no extension)"}`);
  }

  const truncated = text.length > maxChars;
  return {
    name: file.name,
    content: truncated ? text.slice(0, maxChars) : text,
    size: file.size,
    truncated,
    kind,
  };
}
