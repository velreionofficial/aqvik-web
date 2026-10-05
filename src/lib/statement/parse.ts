/**
 * Low-level readers for bank statements: CSV text, amounts and dates.
 * Pure functions, no imports, so Node's test runner can load them.
 */

/** Split CSV/TSV text into rows. Handles quotes, "" escapes and CRLF; guesses the delimiter. */
export function parseDelimited(text: string): string[][] {
  const body = text.replace(/^\uFEFF/, "");
  const sample = body.split(/\r?\n/).slice(0, 30).join("\n");
  const counts = { ",": 0, ";": 0, "\t": 0, "|": 0 } as Record<string, number>;
  for (const ch of sample) if (ch in counts) counts[ch]! += 1;
  const delimiter = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ",") as string;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i]!;
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell.trim() === "") {
      quoted = true;
      cell = "";
    } else if (ch === delimiter) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && body[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ""));
}

export type ParsedAmount = { paise: number; mark: "dr" | "cr" | null };

/**
 * "1,23,456.78" · "₹ 250" · "INR 99.5" · "(1,000.00)" · "-45" · "500.00 Dr" · "Cr 1,200".
 * Returns null for blanks, dashes and anything that is not a number.
 */
export function parseAmount(raw: string): ParsedAmount | null {
  let s = raw.replace(/\u00A0/g, " ").trim();
  if (s === "" || /^[-–—]+$/.test(s)) return null;
  let mark: ParsedAmount["mark"] = null;
  const m = /\b(dr|cr|debit|credit)\.?\s*$/i.exec(s) ?? /^(dr|cr)\.?\s+/i.exec(s);
  if (m) {
    mark = m[1]!.toLowerCase().startsWith("d") ? "dr" : "cr";
    s = s.replace(m[0], "").trim();
  }
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/₹|inr|rs\.?/gi, "").replace(/[,\s]/g, "");
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    // An explicit plus sign means money in (app statements such as Paytm).
    s = s.slice(1);
    mark = mark ?? "cr";
  }
  const n = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!n) return null;
  const frac = (n[2] ?? "").padEnd(3, "0");
  // Round half up at the paisa (some exports carry 3 decimals).
  let paise = Number(n[1]) * 100 + Number(frac.slice(0, 2)) + (Number(frac[2]) >= 5 ? 1 : 0);
  if (negative) paise = -paise;
  if (!Number.isSafeInteger(paise)) return null;
  return { paise, mark };
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export type DateOrder = "dmy" | "mdy";

const iso = (y: number, m: number, d: number) => {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCMonth() !== m - 1) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

/** Numeric day/month pairs in a column, used to tell 03/09 (3 Sep) from 09/03 US-style. */
export function guessDateOrder(samples: string[]): DateOrder {
  let firstOver12 = false;
  let secondOver12 = false;
  for (const s of samples) {
    const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}/.exec(s);
    if (!m) continue;
    if (Number(m[1]) > 12) firstOver12 = true;
    if (Number(m[2]) > 12) secondOver12 = true;
  }
  return !firstOver12 && secondOver12 ? "mdy" : "dmy";
}

/** Indian statement dates to YYYY-MM-DD; time parts are ignored. Day-first unless told otherwise. */
export function parseDate(raw: string, order: DateOrder = "dmy"): string | null {
  const s = raw.replace(/\u00A0/g, " ").trim();
  if (!s) return null;
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:\s.*)?$/.exec(s);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return order === "mdy" ? iso(Number(m[3]), a, b) : iso(Number(m[3]), b, a);
  }
  m = /^(\d{1,2})[\s-/]*([A-Za-z]{3,9})[\s,'’\-/]+(\d{4}|\d{2})(?![\d:])(?:\s.*)?$/.exec(s);
  if (m) {
    const month = MONTHS[m[2]!.toLowerCase().slice(0, m[2]!.toLowerCase().startsWith("sept") ? 4 : 3)];
    return month ? iso(Number(m[3]), month, Number(m[1])) : null;
  }
  m = /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})(?:\s.*)?$/.exec(s);
  if (m) {
    const month = MONTHS[m[1]!.toLowerCase().slice(0, 3)];
    return month ? iso(Number(m[3]), month, Number(m[2])) : null;
  }
  // Excel serial day numbers (1900 system) that arrive as plain numbers.
  m = /^(\d{5})(?:\.\d+)?$/.exec(s);
  if (m) {
    const days = Number(m[1]);
    if (days > 32_000 && days < 80_000) {
      const t = new Date(Date.UTC(1899, 11, 30) + days * 86_400_000);
      return t.toISOString().slice(0, 10);
    }
  }
  return null;
}
