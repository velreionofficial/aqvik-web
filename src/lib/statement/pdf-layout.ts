import { matchHeader } from "./detect.ts";

/**
 * Turns positioned text from a PDF (what pdf.js returns) into a grid of
 * cells. PDFs have no tables, only text at x/y positions, so we rebuild
 * lines by y, find the header line, and use its columns to place every
 * later piece of text. Pure, so it can be tested without a PDF.
 */

export type TextItem = { str: string; x: number; y: number; width: number; page: number };

type Line = { page: number; y: number; items: TextItem[] };

/** Group items into lines: same page, y within `tolerance`, left to right. */
export function toLines(items: TextItem[], tolerance = 2.5): Line[] {
  const sorted = items
    .filter((i) => i.str.trim() !== "")
    .sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const item of sorted) {
    const line = lines[lines.length - 1];
    if (line && line.page === item.page && Math.abs(line.y - item.y) <= tolerance) line.items.push(item);
    else lines.push({ page: item.page, y: item.y, items: [item] });
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  return lines;
}

/** Join items that sit close together into cells (a gap wider than `gap` starts a new cell). */
function cellsOf(line: Line, gap = 6): { text: string; start: number; end: number }[] {
  const cells: { text: string; start: number; end: number }[] = [];
  for (const it of line.items) {
    const last = cells[cells.length - 1];
    if (last && it.x - last.end <= gap) {
      last.text = `${last.text} ${it.str.trim()}`.trim();
      last.end = Math.max(last.end, it.x + it.width);
    } else cells.push({ text: it.str.trim(), start: it.x, end: it.x + it.width });
  }
  return cells;
}

const isNumeric = (s: string) => /^[-+(]?\s*(₹|rs\.?|inr)?\s*[\d,]+(\.\d+)?\)?\s*(cr|dr)?$/i.test(s.trim());

function headerScore(cells: { text: string }[]): number {
  const fields = new Set(cells.map((c) => matchHeader(c.text)?.field).filter(Boolean));
  const money = fields.has("debit") || fields.has("credit") || fields.has("amount");
  return fields.has("date") && money ? fields.size : 0;
}

/**
 * Header cells from one to three stacked lines ("Txn" over "Date", "Ref No./Cheque" over "No."):
 * pieces that overlap horizontally belong to the same column and are read top to bottom.
 */
function stackedCells(stack: Line[], gap = 6): { text: string; start: number; end: number }[] {
  const pieces = stack.flatMap((line) => cellsOf(line, gap).map((c) => ({ ...c, y: line.y })));
  pieces.sort((a, b) => a.start - b.start);
  const columns: { parts: { text: string; y: number }[]; start: number; end: number }[] = [];
  for (const p of pieces) {
    const col = columns.find((c) => p.start <= c.end + gap && p.end >= c.start - gap);
    if (col) {
      col.parts.push({ text: p.text, y: p.y });
      col.start = Math.min(col.start, p.start);
      col.end = Math.max(col.end, p.end);
    } else columns.push({ parts: [{ text: p.text, y: p.y }], start: p.start, end: p.end });
  }
  return columns
    .sort((a, b) => a.start - b.start)
    .map((c) => ({ text: c.parts.sort((a, b) => b.y - a.y).map((p) => p.text).join(" "), start: c.start, end: c.end }));
}

export function layoutGrid(items: TextItem[]): string[][] {
  const lines = toLines(items);
  let headerIndex = -1;
  let headerSpan = 1;
  let best = 0;
  for (let i = 0; i < Math.min(lines.length, 150); i += 1) {
    for (let span = 1; span <= 3 && i + span <= lines.length; span += 1) {
      const stack = lines.slice(i, i + span);
      // Stacked header lines sit close together on one page.
      if (span > 1 && (stack.some((l) => l.page !== stack[0]!.page) || stack[0]!.y - stack[span - 1]!.y > 30)) break;
      const score = headerScore(span === 1 ? cellsOf(stack[0]!) : stackedCells(stack));
      // A single line wins ties; a stack must add something.
      if (score > best) {
        best = score;
        headerIndex = i;
        headerSpan = span;
      }
    }
  }
  if (headerIndex < 0) return lines.map((l) => cellsOf(l, 12).map((c) => c.text));

  const headerLines = lines.slice(headerIndex, headerIndex + headerSpan);
  const columns = headerSpan === 1 ? cellsOf(headerLines[0]!) : stackedCells(headerLines);
  const starts = columns.map((c) => c.start);
  const centers = columns.map((c) => (c.start + c.end) / 2);

  const place = (it: TextItem): number => {
    const text = it.str.trim();
    if (isNumeric(text)) {
      // Amounts are usually right-aligned: nearest column by right edge or centre.
      const right = it.x + it.width;
      let bestCol = 0;
      let bestDist = Infinity;
      columns.forEach((c, i) => {
        const d = Math.min(Math.abs(c.end - right), Math.abs(centers[i]! - (it.x + it.width / 2)));
        if (d < bestDist) {
          bestDist = d;
          bestCol = i;
        }
      });
      return bestCol;
    }
    // Text is left-aligned: the last column that starts at or before it (with a little slack).
    let col = 0;
    for (let i = 0; i < starts.length; i += 1) if (it.x >= starts[i]! - 3) col = i;
    return col;
  };

  const grid: string[][] = [columns.map((c) => c.text)];
  for (let i = headerIndex + headerSpan; i < lines.length; i += 1) {
    const row = columns.map(() => "");
    for (const it of lines[i]!.items) {
      const c = place(it);
      row[c] = `${row[c]} ${it.str.trim()}`.trim();
    }
    if (row.some((c) => c !== "")) grid.push(row);
  }
  return grid;
}
