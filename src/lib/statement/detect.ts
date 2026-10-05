import { guessDateOrder, parseAmount, parseDate, type DateOrder } from "./parse.ts";

/**
 * Finds the header row of a statement table, maps its columns, and turns the
 * rows below it into transactions. Works on any grid of strings, whether it
 * came from CSV, Excel, an HTML ".xls" or a PDF.
 */

export const FIELDS = ["date", "narration", "debit", "credit", "amount", "drcr", "balance"] as const;
export type Field = (typeof FIELDS)[number];
export type Mapping = Partial<Record<Field, number>>;

const KEYWORDS: Record<Field, string[]> = {
  date: ["txn date", "transaction date", "tran date", "trans date", "posting date", "date", "value date", "value dt", "txn dt", "date time"],
  narration: ["narration", "description", "particulars", "transaction details", "transaction remarks", "remarks", "details", "transaction description", "transaction particulars"],
  debit: ["withdrawal amt", "withdrawal amount", "withdrawals", "withdrawal", "debit amount", "debit amt", "debits", "debit", "dr amount", "dr"],
  credit: ["deposit amt", "deposit amount", "deposits", "deposit", "credit amount", "credit amt", "credits", "credit", "cr amount", "cr"],
  amount: ["transaction amount", "txn amount", "amount", "amt"],
  drcr: ["dr cr", "cr dr", "debit credit", "transaction type", "txn type", "type", "dr cr indicator"],
  balance: ["closing balance", "available balance", "running balance", "balance amt", "balance", "bal"],
};

export const normalizeHeader = (cell: string) =>
  cell
    .toLowerCase()
    .replace(/\(.*?\)|₹|\binr\b|\brs\b\.?/g, " ")
    .replace(/[^a-z]+/g, " ")
    .trim();

/**
 * Which field a header cell names, and how strongly (lower rank = preferred
 * name, e.g. "txn date" beats "value date"). Exact names first, then names
 * that start the cell.
 */
export function matchHeader(cell: string): { field: Field; rank: number } | null {
  const h = normalizeHeader(cell);
  if (!h) return null;
  for (const f of FIELDS) {
    const i = KEYWORDS[f].indexOf(h);
    if (i >= 0) return { field: f, rank: i };
  }
  for (const f of FIELDS) {
    const i = KEYWORDS[f].findIndex((k) => k.length > 3 && h.startsWith(k));
    if (i >= 0) return { field: f, rank: i + 50 };
  }
  return null;
}

export const fieldForHeader = (cell: string): Field | null => matchHeader(cell)?.field ?? null;

export type Header = { row: number; mapping: Mapping; labels: string[] };

/** Map one row's cells to fields; per field, the best-named column wins (first on a tie). */
export function mappingForRow(row: string[]): Mapping {
  const mapping: Mapping = {};
  const ranks: Partial<Record<Field, number>> = {};
  row.forEach((cell, c) => {
    const m = matchHeader(cell);
    if (m && (ranks[m.field] === undefined || m.rank < ranks[m.field]!)) {
      mapping[m.field] = c;
      ranks[m.field] = m.rank;
    }
  });
  return mapping;
}

/** Scan the first rows for the one that best looks like a header. */
export function detectHeader(grid: string[][]): Header | null {
  let best: Header | null = null;
  let bestScore = 0;
  const limit = Math.min(grid.length, 60);
  for (let r = 0; r < limit; r += 1) {
    const mapping = mappingForRow(grid[r]!);
    const hasMoney = mapping.debit !== undefined || mapping.credit !== undefined || mapping.amount !== undefined;
    if (mapping.date === undefined || !hasMoney) continue;
    const score = Object.keys(mapping).length;
    if (score > bestScore) {
      bestScore = score;
      best = { row: r, mapping, labels: grid[r]!.map((c) => c.trim()) };
    }
  }
  return best;
}

export type Txn = {
  id: number;
  date: string;
  narration: string;
  /** Money out, in paise (0 if none). */
  debit: number;
  /** Money in, in paise (0 if none). */
  credit: number;
  balance: number | null;
};

export type Extraction = { txns: Txn[]; skipped: number; order: DateOrder };

const cellAt = (row: string[], i: number | undefined) => (i === undefined ? "" : (row[i] ?? "").trim());

function directionFromText(text: string): "dr" | "cr" | null {
  const t = text.toLowerCase();
  if (/^(dr|d|debit|debited|withdrawal|paid|sent)\b/.test(t)) return "dr";
  if (/^(cr|c|credit|credited|deposit|received)\b/.test(t)) return "cr";
  return null;
}

/** Lines that are never part of an entry: totals, opening/closing balance, page footers. */
export const NOT_ENTRY = /\b(total|grand total|closing balance|opening balance|balance b\/?f|balance as on|brought forward|carried forward|page\s*(no\.?|number)?\s*[:.]?\s*\d+|statement summary)\b/i;

/**
 * Rows below the header become transactions. Each entry starts at a row with a
 * date; the rows after it, up to the next date, belong to it: their description
 * is joined on, and if the dated row had no amounts at all (some PDFs print the
 * figures on the entry's second line) the figures are taken from those rows.
 * Totals, balance lines, page footers and repeated headers are counted as skipped.
 */
export function extractTransactions(grid: string[][], header: Header, mapping: Mapping = header.mapping): Extraction {
  const dateSamples = grid.slice(header.row + 1, header.row + 200).map((r) => cellAt(r, mapping.date));
  const order = guessDateOrder(dateSamples);
  const moneyCols = [mapping.debit, mapping.credit, mapping.amount, mapping.balance, mapping.drcr].filter((i): i is number => i !== undefined);
  const txns: Txn[] = [];
  let skipped = 0;
  let previousBalance: number | null = null;
  let block: { date: string; cells: string[] } | null = null;

  const hasMoney = (cells: string[]) => [mapping.debit, mapping.credit, mapping.amount].some((i) => parseAmount(cellAt(cells, i)) !== null);

  const flush = () => {
    if (!block) return;
    const row = block.cells;
    const narration = cellAt(row, mapping.narration).replace(/\s+/g, " ");
    let debit = 0;
    let credit = 0;
    const balanceParsed = parseAmount(cellAt(row, mapping.balance));
    const balance = balanceParsed ? (balanceParsed.mark === "dr" ? -Math.abs(balanceParsed.paise) : balanceParsed.paise) : null;
    if (mapping.debit !== undefined || mapping.credit !== undefined) {
      const d = parseAmount(cellAt(row, mapping.debit));
      const c = parseAmount(cellAt(row, mapping.credit));
      debit = d ? Math.abs(d.paise) : 0;
      credit = c ? Math.abs(c.paise) : 0;
      // Some banks put a single signed amount in one of the two columns.
      if (d && d.paise < 0 && !c) {
        debit = 0;
        credit = Math.abs(d.paise);
      }
    } else if (mapping.amount !== undefined) {
      const a = parseAmount(cellAt(row, mapping.amount));
      if (a) {
        const dir =
          directionFromText(cellAt(row, mapping.drcr)) ??
          a.mark ??
          (a.paise < 0 ? "dr" : null) ??
          (balance !== null && previousBalance !== null ? (balance < previousBalance ? "dr" : "cr") : null);
        if (dir === "dr") debit = Math.abs(a.paise);
        else if (dir === "cr") credit = Math.abs(a.paise);
      }
    }
    if (balance !== null) previousBalance = balance;
    if (debit === 0 && credit === 0) skipped += 1;
    else txns.push({ id: txns.length, date: block.date, narration: narration || "(no description)", debit, credit, balance });
    block = null;
  };

  for (let r = header.row + 1; r < grid.length; r += 1) {
    const row = grid[r]!;
    const text = row.join(" ").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const date = parseDate(cellAt(row, mapping.date), order);
    if (date) {
      flush();
      if (NOT_ENTRY.test(cellAt(row, mapping.narration))) {
        skipped += 1;
        continue;
      }
      block = { date, cells: row.map((c) => c.trim()) };
      continue;
    }
    const looksLikeHeader = row.filter((c) => fieldForHeader(c) !== null).length >= 2;
    if (!block || looksLikeHeader || NOT_ENTRY.test(text)) {
      skipped += 1;
      continue;
    }
    const narration = cellAt(row, mapping.narration);
    if (narration) block.cells[mapping.narration!] = `${cellAt(block.cells, mapping.narration)} ${narration}`.trim();
    // Figures from a following row only when the dated row had none, and only real amounts (with paise).
    if (!hasMoney(block.cells)) {
      for (const i of moneyCols) {
        const v = cellAt(row, i);
        if (v && !cellAt(block.cells, i) && (i === mapping.drcr || /\.\d{2}\b/.test(v))) block.cells[i] = v;
      }
    }
  }
  flush();
  return { txns, skipped, order };
}

/** The opening balance printed in the statement ("Opening Balance 770.11", "Balance as on 1 Apr 2026: 770.11"). */
export function findOpeningBalance(texts: string[]): number | null {
  for (const t of texts) {
    const m = /(opening balance|balance as on|balance b\/?f|brought forward)[^\d-]*(?:\d{1,2}[\s/-]\w{2,9}[\s/-]\d{2,4})?[^\d-]*(-?[\d,]+\.\d{2})\s*(cr|dr)?/i.exec(t);
    if (m) {
      const v = parseAmount(m[2]!);
      if (v) return (m[3] ?? "").toLowerCase() === "dr" ? -Math.abs(v.paise) : v.paise;
    }
  }
  return null;
}

export type BalanceCheck = { hasBalances: boolean; checked: number; matched: number; ok: boolean };

/**
 * Does every balance follow from the one before it? With balances on (almost) every
 * entry, each consecutive pair must differ by exactly that entry's amount, in the
 * right direction. All pairs must agree for the check to pass.
 */
export function balanceCheck(txns: Txn[], opening: number | null = null): BalanceCheck {
  const withBalance = txns.filter((t) => t.balance !== null).length;
  const hasBalances = txns.length > 0 && withBalance >= txns.length * 0.9;
  if (!hasBalances) return { hasBalances, checked: 0, matched: 0, ok: false };
  const signed = (t: Txn) => t.credit - t.debit;
  let asc = 0;
  let desc = 0;
  for (let i = 1; i < txns.length; i += 1) {
    const a = txns[i - 1]!;
    const b = txns[i]!;
    if (a.balance === null || b.balance === null) continue;
    if (b.balance - a.balance === signed(b)) asc += 1;
    if (a.balance - b.balance === signed(a)) desc += 1;
  }
  const newestFirst = desc > asc;
  let checked = 0;
  let matched = 0;
  txns.forEach((t, i) => {
    const earlierBalance = newestFirst ? (txns[i + 1]?.balance ?? (i === txns.length - 1 ? opening : null)) : (i === 0 ? opening : txns[i - 1]!.balance);
    if (t.balance === null || earlierBalance === null || earlierBalance === undefined) return;
    checked += 1;
    if (t.balance - earlierBalance === signed(t)) matched += 1;
  });
  return { hasBalances, checked, matched, ok: checked > 0 && matched === checked };
}

/**
 * Where a statement prints balances, the balance itself proves the direction: if the
 * balance moves by exactly the amount, a fall is money out and a rise is money in.
 * This repairs PDFs whose Debit and Credit columns sit so close that amounts land in
 * the wrong one. Works for oldest-first and newest-first files; entries that cannot
 * be proved are left as they were.
 */
export function reconcileWithBalance<T extends Txn>(txns: T[], opening: number | null = null): { txns: T[]; fixed: number } {
  const amount = (t: Txn) => t.debit + t.credit;
  let asc = 0;
  let desc = 0;
  for (let i = 1; i < txns.length; i += 1) {
    const a = txns[i - 1]!;
    const b = txns[i]!;
    if (a.balance === null || b.balance === null) continue;
    if (Math.abs(b.balance - a.balance) === amount(b)) asc += 1;
    if (Math.abs(a.balance - b.balance) === amount(a)) desc += 1;
  }
  if (asc === 0 && desc === 0) return { txns, fixed: 0 };
  const newestFirst = desc > asc;
  let fixed = 0;
  const out = txns.map((t, i) => {
    const earlierBalance = newestFirst ? (i === txns.length - 1 ? opening : txns[i + 1]!.balance) : i === 0 ? opening : txns[i - 1]!.balance;
    if (t.balance === null || earlierBalance === null) return t;
    const delta = t.balance - earlierBalance;
    const value = amount(t);
    if (Math.abs(delta) !== value || value === 0) return t;
    const debit = delta < 0 ? value : 0;
    const credit = delta > 0 ? value : 0;
    if (debit === t.debit && credit === t.credit) return t;
    fixed += 1;
    return { ...t, debit, credit };
  });
  return { txns: out, fixed };
}

/** Structure-only report for support: no names, amounts or narrations. */
export function problemReport(fileKind: string, grid: string[][], header: Header | null, extraction: Extraction | null): string {
  const shape = (s: string) => s.replace(/[0-9]/g, "9").replace(/[A-Za-z]/g, "a").slice(0, 24);
  const lines = [
    `File type: ${fileKind}`,
    `Rows read: ${grid.length}`,
    `Header row: ${header ? header.row + 1 : "not found"}`,
    `Header words: ${header ? header.labels.map(normalizeHeader).join(" | ") : "-"}`,
    `Columns used: ${header ? FIELDS.filter((f) => header.mapping[f] !== undefined).map((f) => `${f}=${header.mapping[f]! + 1}`).join(", ") : "-"}`,
  ];
  if (header) {
    const sample = grid.slice(header.row + 1, header.row + 4);
    lines.push(`Date shapes: ${sample.map((r) => shape(cellAt(r, header.mapping.date))).join(" ; ")}`);
    const money = header.mapping.debit ?? header.mapping.amount;
    lines.push(`Amount shapes: ${sample.map((r) => shape(cellAt(r, money))).join(" ; ")}`);
    lines.push(`Cells per row: ${sample.map((r) => r.length).join(", ")}`);
  }
  if (extraction) lines.push(`Transactions found: ${extraction.txns.length}; rows skipped: ${extraction.skipped}; date order: ${extraction.order}`);
  return lines.join("\n");
}
