import { SELF, categorize, payeeOf, type Category } from "./categorize.ts";
import type { Txn } from "./detect.ts";

/**
 * Summaries of a statement: money in and out, by category, by month, by
 * payee, recurring debits, largest transactions, cash and bank charges.
 * Amounts are integer paise; nothing is rounded here.
 */

export type Enriched = Txn & { category: Category; payee: string };

export function enrich(txns: Txn[], overrides: Record<number, Category> = {}): Enriched[] {
  return txns.map((t) => ({
    ...t,
    category: overrides[t.id] ?? categorize(t.narration, t.debit > 0 ? "debit" : "credit"),
    payee: payeeOf(t.narration),
  }));
}

export type Bucket = { key: string; amount: number; count: number };
export type Recurring = { payee: string; category: Category; typical: number; count: number; months: number; last: string; next: string };

export type Analysis = {
  from: string;
  to: string;
  count: number;
  moneyIn: number;
  moneyOut: number;
  net: number;
  openingBalance: number | null;
  closingBalance: number | null;
  spending: Bucket[];
  income: Bucket[];
  months: { month: string; in: number; out: number }[];
  topPayees: Bucket[];
  topSenders: Bucket[];
  recurring: Recurring[];
  largest: Enriched[];
  cash: number;
  charges: number;
  /** Moved between the user's own accounts; left out of money in, money out and categories. */
  selfOut: number;
  selfIn: number;
};

function group(items: Enriched[], key: (t: Enriched) => string, amount: (t: Enriched) => number): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const t of items) {
    const k = key(t);
    const b = map.get(k) ?? { key: k, amount: 0, count: 0 };
    b.amount += amount(t);
    b.count += 1;
    map.set(k, b);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount || a.key.localeCompare(b.key));
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
};
const dayNumber = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;
const isoFromDay = (d: number) => new Date(d * 86_400_000).toISOString().slice(0, 10);

/**
 * Monthly debits to the same payee at about the same amount: amounts within
 * 15% of the median, in at least two different months (three if the
 * statement spans three or more), roughly a month apart, and not more than
 * about one a month (so frequent food orders are not called subscriptions).
 */
export function findRecurring(debits: Enriched[], spanMonths: number): Recurring[] {
  const out: Recurring[] = [];
  for (const g of group(debits, (t) => t.payee, (t) => t.debit)) {
    if (g.key === "Unknown" || g.count < 2) continue;
    const items = debits.filter((t) => t.payee === g.key).sort((a, b) => a.date.localeCompare(b.date));
    const typical = median(items.map((t) => t.debit));
    const steady = items.filter((t) => Math.abs(t.debit - typical) <= typical * 0.15);
    const months = new Set(steady.map((t) => t.date.slice(0, 7))).size;
    const need = Math.min(3, Math.max(2, spanMonths));
    if (months < need || steady.length > months * 1.5) continue;
    const gaps = steady.slice(1).map((t, i) => dayNumber(t.date) - dayNumber(steady[i]!.date));
    const gap = median(gaps);
    if (gap < 25 || gap > 35) continue;
    const last = steady[steady.length - 1]!;
    out.push({
      payee: g.key,
      category: last.category,
      typical,
      count: steady.length,
      months,
      last: last.date,
      next: isoFromDay(dayNumber(last.date) + gap),
    });
  }
  return out.sort((a, b) => b.typical - a.typical);
}

export function analyse(items: Enriched[]): Analysis | null {
  if (items.length === 0) return null;
  const all = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const sorted = all.filter((t) => t.category !== SELF);
  const debits = sorted.filter((t) => t.debit > 0);
  const credits = sorted.filter((t) => t.credit > 0);
  const selfOut = all.filter((t) => t.category === SELF).reduce((s, t) => s + t.debit, 0);
  const selfIn = all.filter((t) => t.category === SELF).reduce((s, t) => s + t.credit, 0);
  const moneyIn = credits.reduce((s, t) => s + t.credit, 0);
  const moneyOut = debits.reduce((s, t) => s + t.debit, 0);
  const from = all[0]!.date;
  const to = all[all.length - 1]!.date;

  const monthMap = new Map<string, { in: number; out: number }>();
  for (const t of sorted) {
    const m = monthMap.get(t.date.slice(0, 7)) ?? { in: 0, out: 0 };
    m.in += t.credit;
    m.out += t.debit;
    monthMap.set(t.date.slice(0, 7), m);
  }
  const months = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));

  const first = all.find((t) => t.balance !== null);
  const last = [...all].reverse().find((t) => t.balance !== null);
  const openingBalance = first && first.balance !== null ? first.balance + first.debit - first.credit : null;

  return {
    from,
    to,
    count: all.length,
    moneyIn,
    moneyOut,
    net: moneyIn - moneyOut,
    openingBalance,
    closingBalance: last?.balance ?? null,
    spending: group(debits, (t) => t.category, (t) => t.debit),
    income: group(credits, (t) => t.category, (t) => t.credit),
    months,
    topPayees: group(debits.filter((t) => t.category !== "Cash withdrawal" && t.category !== "Bank charges"), (t) => t.payee, (t) => t.debit).slice(0, 10),
    topSenders: group(credits, (t) => t.payee, (t) => t.credit).slice(0, 5),
    recurring: findRecurring(debits, months.length),
    largest: [...debits].sort((a, b) => b.debit - a.debit).slice(0, 5),
    cash: debits.filter((t) => t.category === "Cash withdrawal").reduce((s, t) => s + t.debit, 0),
    charges: debits.filter((t) => t.category === "Bank charges").reduce((s, t) => s + t.debit, 0),
    selfOut,
    selfIn,
  };
}

/** Share of a total as a whole-number percent string (display only). */
export const share = (part: number, total: number) => (total > 0 ? `${Math.round((part * 100) / total)}%` : "0%");
