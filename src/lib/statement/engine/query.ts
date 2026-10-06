import type { ClassifiedTxn, Paise, TxnType } from "./model.ts";

/**
 * Find transactions by what a person remembers: a name, a reference number, a date or an
 * amount. Every word must match (AND). Deterministic and local; the totals are exact paise.
 *
 *   "mohan"            name or description contains MOHAN (spaces ignored, so "pay tmmoney" finds "paytmmoney")
 *   "412300000001"     reference / UPI number anywhere in the description
 *   "05-10-2026"       that day (also 05/10/2026, 2026-10-05, 5 Oct 2026)
 *   "10-2026", "oct 2026"   that month
 *   "12900", "12,900", "₹12,900.00"   that exact amount (or those digits in the description)
 */

export type TxnQuery = { text?: string; from?: string; to?: string; direction?: "out" | "in"; type?: TxnType; needsReview?: boolean };
export type QueryResult = { items: ClassifiedTxn[]; count: number; moneyOut: Paise; moneyIn: Paise };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const pad = (n: number) => String(n).padStart(2, "0");

type Matcher = (t: ClassifiedTxn, hay: string, squashed: string) => boolean;

function matcherFor(word: string, next?: string): { m: Matcher; used: number } {
  const w = word.trim();
  // Full dates
  let d = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(w);
  if (d) {
    const iso = `${d[3]}-${pad(Number(d[2]))}-${pad(Number(d[1]))}`;
    return { m: (t) => t.date === iso, used: 1 };
  }
  d = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(w);
  if (d) {
    const iso = `${d[1]}-${pad(Number(d[2]))}-${pad(Number(d[3]))}`;
    return { m: (t) => t.date === iso, used: 1 };
  }
  // Month and year: 10-2026, 10/2026
  d = /^(\d{1,2})[-/](\d{4})$/.exec(w);
  if (d) {
    const ym = `${d[2]}-${pad(Number(d[1]))}`;
    return { m: (t) => t.date.startsWith(ym), used: 1 };
  }
  // "Oct 2026", "5 Oct 2026" (month names may come with a following year)
  const mi = MONTHS.indexOf(w.slice(0, 3).toUpperCase());
  if (mi >= 0 && /^[a-z]{3,9}$/i.test(w) && next && /^\d{4}$/.test(next)) {
    const ym = `${next}-${pad(mi + 1)}`;
    return { m: (t) => t.date.startsWith(ym), used: 2 };
  }
  // Amounts: 12900, 12,900, ₹12,900.00 — the exact amount, or the digits inside the description.
  const a = /^₹?\s*([\d,]+)(?:\.(\d{1,2}))?$/.exec(w);
  if (a) {
    const digits = a[1]!.replace(/,/g, "");
    const paise = Number(digits) * 100 + Number((a[2] ?? "0").padEnd(2, "0"));
    return { m: (t, hay) => t.debit === paise || t.credit === paise || (digits.length >= 4 && hay.includes(digits)), used: 1 };
  }
  // Text: name, category or description, case-insensitive, spaces ignored as a fallback.
  const up = w.toUpperCase();
  const sq = up.replace(/\s+/g, "");
  return { m: (_t, hay, squashed) => hay.includes(up) || squashed.includes(sq), used: 1 };
}

export function queryTransactions(txns: ClassifiedTxn[], q: TxnQuery): QueryResult {
  const words = (q.text ?? "").trim().split(/\s+/).filter(Boolean);
  const matchers: Matcher[] = [];
  for (let i = 0; i < words.length; ) {
    // "5 Oct 2026": a day number followed by a month and year
    if (/^\d{1,2}$/.test(words[i]!) && words[i + 1] && MONTHS.includes(words[i + 1]!.slice(0, 3).toUpperCase()) && /^\d{4}$/.test(words[i + 2] ?? "")) {
      const iso = `${words[i + 2]}-${pad(MONTHS.indexOf(words[i + 1]!.slice(0, 3).toUpperCase()) + 1)}-${pad(Number(words[i]))}`;
      matchers.push((t) => t.date === iso);
      i += 3;
      continue;
    }
    const { m, used } = matcherFor(words[i]!, words[i + 1]);
    matchers.push(m);
    i += used;
  }
  const items = txns.filter((t) => {
    if (t.c.duplicateOf) return false;
    if (q.from && t.date < q.from) return false;
    if (q.to && t.date > q.to) return false;
    if (q.direction === "out" && t.debit === 0) return false;
    if (q.direction === "in" && t.credit === 0) return false;
    if (q.type && t.c.type !== q.type) return false;
    if (q.needsReview && t.c.confidence >= 0.5) return false;
    if (!matchers.length) return true;
    const hay = `${t.c.counterparty.name} ${t.c.category} ${t.description}`.toUpperCase();
    const squashed = hay.replace(/\s+/g, "");
    return matchers.every((m) => m(t, hay, squashed));
  });
  return {
    items,
    count: items.length,
    moneyOut: items.reduce((s, t) => s + t.debit, 0),
    moneyIn: items.reduce((s, t) => s + t.credit, 0),
  };
}
