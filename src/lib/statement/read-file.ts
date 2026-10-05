import { parseDelimited } from "./parse";
import { layoutGrid, toLines, type TextItem } from "./pdf-layout";

/**
 * Reads a statement file in the browser into a grid of strings. Nothing is
 * uploaded: CSV/TXT are read as text, .xlsx with exceljs, HTML-style .xls
 * with the browser's own parser, and PDFs with pdf.js (all loaded only when
 * needed).
 */

export type ReadResult =
  | { ok: true; kind: "csv" | "xlsx" | "html-xls" | "pdf"; grid: string[][]; lines?: string[] }
  | {
      ok: false;
      reason: "password" | "excel-password" | "wrong-password" | "scanned" | "old-xls" | "locked-excel" | "too-big" | "unreadable" | "empty";
    };

/** "EncryptedPackage" in UTF-16: a password-protected .xlsx (Office stores it inside an OLE container). */
const ENCRYPTED_PACKAGE = [...("EncryptedPackage")].flatMap((ch) => [ch.charCodeAt(0), 0]);

export function isLockedExcel(bytes: Uint8Array): boolean {
  outer: for (let i = 0; i + ENCRYPTED_PACKAGE.length <= bytes.length; i += 1) {
    for (let j = 0; j < ENCRYPTED_PACKAGE.length; j += 1) if (bytes[i + j] !== ENCRYPTED_PACKAGE[j]) continue outer;
    return true;
  }
  return false;
}

export const MAX_BYTES = 15 * 1024 * 1024;

const startsWith = (bytes: Uint8Array, sig: number[]) => sig.every((b, i) => bytes[i] === b);

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const v = value as { richText?: { text: string }[]; result?: unknown; text?: unknown };
    if (v.richText) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return cellText(v.result);
    if ("text" in v) return cellText(v.text);
    return "";
  }
  return String(value).trim();
}

async function readXlsx(buffer: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  // exceljs is typed for an ArrayBuffer; a decrypted file arrives as bytes, so copy it into one.
  const data: ArrayBuffer = buffer instanceof Uint8Array ? new Uint8Array(buffer).buffer : buffer;
  await workbook.xlsx.load(data);
  let best: string[][] = [];
  type SheetLike = { eachRow(opts: { includeEmpty: boolean }, cb: (row: { values: unknown }) => void): void };
  workbook.eachSheet((sheet: SheetLike) => {
    const grid: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row: { values: unknown }) => {
      const values = (row.values as unknown[]).slice(1);
      grid.push(values.map(cellText));
    });
    if (grid.length > best.length) best = grid;
  });
  return best;
}

function readHtmlTable(text: string): string[][] {
  const doc = new DOMParser().parseFromString(text, "text/html");
  let best: string[][] = [];
  doc.querySelectorAll("table").forEach((table) => {
    const grid = [...table.querySelectorAll("tr")].map((tr) =>
      [...tr.querySelectorAll("th,td")].map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim()),
    );
    if (grid.length > best.length) best = grid;
  });
  return best.filter((r) => r.some((c) => c !== ""));
}

type PdfError = { name?: string; code?: number };

async function readPdf(bytes: Uint8Array, password?: string): Promise<ReadResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  try {
    const doc = await pdfjs.getDocument({ data: bytes, password, isEvalSupported: false }).promise;
    const items: TextItem[] = [];
    for (let p = 1; p <= doc.numPages; p += 1) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      for (const raw of content.items as unknown as { str?: string; transform?: number[]; width?: number }[]) {
        if (!raw.str || !raw.transform) continue;
        items.push({ str: raw.str, x: raw.transform[4] ?? 0, y: raw.transform[5] ?? 0, width: raw.width ?? 0, page: p });
      }
    }
    await doc.destroy();
    const chars = items.reduce((n, i) => n + i.str.trim().length, 0);
    if (chars < 40) return { ok: false, reason: "scanned" };
    // Each visual line as one string, for statements that are not laid out as a table.
    const lines = toLines(items).map((l) => l.items.map((i) => i.str.trim()).filter(Boolean).join(" "));
    return { ok: true, kind: "pdf", grid: layoutGrid(items), lines };
  } catch (error) {
    const e = error as PdfError;
    if (e?.name === "PasswordException") return { ok: false, reason: e.code === 2 ? "wrong-password" : "password" };
    return { ok: false, reason: "unreadable" };
  }
}

export async function readStatement(file: File, password?: string): Promise<ReadResult> {
  if (file.size > MAX_BYTES) return { ok: false, reason: "too-big" };
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  try {
    if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return await readPdf(bytes, password); // %PDF
    if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
      const grid = await readXlsx(buffer);
      return grid.length ? { ok: true, kind: "xlsx", grid } : { ok: false, reason: "empty" };
    }
    // OLE container: either a password-protected .xlsx or a legacy binary .xls.
    if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) {
      if (!isLockedExcel(bytes)) return { ok: false, reason: "old-xls" };
      if (!password) return { ok: false, reason: "excel-password" };
      const { decryptXlsx } = await import("./office-crypto");
      const opened = await decryptXlsx(bytes, password);
      if (!opened.ok) return { ok: false, reason: opened.reason === "wrong-password" ? "wrong-password" : "locked-excel" };
      const grid = await readXlsx(opened.xlsx);
      return grid.length ? { ok: true, kind: "xlsx", grid } : { ok: false, reason: "empty" };
    }
    const text = new TextDecoder("utf-8").decode(bytes);
    if (/<table[\s>]/i.test(text.slice(0, 200_000))) {
      const grid = readHtmlTable(text);
      return grid.length ? { ok: true, kind: "html-xls", grid } : { ok: false, reason: "empty" };
    }
    const grid = parseDelimited(text);
    return grid.length ? { ok: true, kind: "csv", grid } : { ok: false, reason: "empty" };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}
