import type { FinancialFacts } from "./facts.ts";
import type { ClassifiedTxn, Paise, TxnType } from "./model.ts";

/**
 * The 60-second Money Review: one confirmation question, a per-month snapshot that can be saved
 * on the user's device, and a deterministic "what changed since last month". Everything here is
 * derived from FinancialFacts and classified transactions; nothing is estimated.
 */

export type QuestionOption = { label: string; type: TxnType; category: string };
export type ReviewQuestion = {
  counterparty: string;
  direction: "in" | "out";
  total: Paise;
  count: number;
  options: QuestionOption[];
};

/** Every option maps to an existing type and category, so an answer never invents a new meaning. */
const IN_OPTIONS: QuestionOption[] = [
  { label: "Salary or payment for work", type: "INCOME", category: "Regular income" },
  { label: "Business or sales", type: "INCOME", category: "Business income" },
  { label: "Family support", type: "TRANSFER", category: "Family" },
  { label: "Friend", type: "TRANSFER", category: "Friend" },
  { label: "Money returned to me", type: "TRANSFER", category: "Loan repaid to me" },
  { label: "A loan I have to repay", type: "TRANSFER", category: "Loan received" },
  { label: "My own account", type: "TRANSFER", category: "Own accounts" },
  { label: "Refund", type: "REFUND", category: "Refund" },
];
const OUT_OPTIONS: QuestionOption[] = [
  { label: "Shopping or a service", type: "SPENDING", category: "Other spending" },
  { label: "Rent", type: "SPENDING", category: "Rent" },
  { label: "Business expense", type: "SPENDING", category: "Business" },
  { label: "Family", type: "TRANSFER", category: "Family" },
  { label: "Friend", type: "TRANSFER", category: "Friend" },
  { label: "Money I lent", type: "TRANSFER", category: "Loan given" },
  { label: "Repaying a loan", type: "DEBT_PAYMENT", category: "Other debt" },
  { label: "My own account", type: "TRANSFER", category: "Own accounts" },
];

/** Categories where we know how money moved but not what it was: worth one question. */
const AMBIGUOUS_IN = new Set(["From people", "Bank transfer in", "From a business", "From a company", "From government", "Unclassified money in"]);
const AMBIGUOUS_OUT = new Set(["To people", "Bank transfer", "Unclassified money out"]);

/**
 * The single most useful question: the counterparty with the largest total in an ambiguous
 * category (money in first, because it decides income), at least ₹1,000, not already set by the user.
 */
export function reviewQuestion(txns: ClassifiedTxn[]): ReviewQuestion | null {
  const pick = (dir: "in" | "out") => {
    const groups = new Map<string, { total: Paise; count: number }>();
    for (const t of txns) {
      if (t.c.duplicateOf || t.c.layer.startsWith("user")) continue;
      const amount = dir === "in" ? t.credit : t.debit;
      if (!amount || !(dir === "in" ? AMBIGUOUS_IN : AMBIGUOUS_OUT).has(t.c.category)) continue;
      const name = t.c.counterparty.name;
      if (!name || name === "Unknown") continue;
      const g = groups.get(name) ?? { total: 0, count: 0 };
      g.total += amount;
      g.count += 1;
      groups.set(name, g);
    }
    const best = [...groups.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))[0];
    return best && best[1].total >= 1_000_00 ? { counterparty: best[0], direction: dir, total: best[1].total, count: best[1].count, options: dir === "in" ? IN_OPTIONS : OUT_OPTIONS } : null;
  };
  return pick("in") ?? pick("out");
}

/** What is saved for a month: totals and the names of regular payments. No descriptions, no references. */
export type MonthSnapshot = {
  month: string; // YYYY-MM
  partial: boolean;
  moneyIn: Paise;
  moneyOut: Paise;
  income: Paise;
  spending: Paise;
  otherTransfersOut: Paise;
  debt: Paise;
  platforms: Paise;
  cash: Paise;
  fees: Paise;
  byCategory: Record<string, Paise>;
  /** Regular payments active this month: name and amount. */
  regular: { name: string; amount: Paise }[];
};

export function monthSnapshots(f: FinancialFacts, txns: ClassifiedTxn[]): MonthSnapshot[] {
  const dateOf = new Map(txns.map((t) => [t.id, t.date]));
  return f.monthly.map((m) => ({
    month: m.month,
    partial: m.partial,
    moneyIn: m.moneyIn,
    moneyOut: m.moneyOut,
    income: m.income,
    spending: m.spending,
    otherTransfersOut: m.otherTransfersOut,
    debt: m.debt,
    platforms: m.brokerFunding,
    cash: m.cash,
    fees: m.fees,
    byCategory: { ...m.byCategory },
    regular: f.recurring
      .filter((r) => r.direction === "out" && r.txnIds.some((id) => dateOf.get(id)?.startsWith(m.month)))
      .map((r) => ({ name: r.counterparty, amount: r.typical })),
  }));
}

export type Change = { id: string; text: string };

const inr = (p: Paise) => {
  const abs = Math.abs(p);
  const pp = abs % 100;
  return `₹${Math.floor(abs / 100).toLocaleString("en-IN")}${pp ? `.${String(pp).padStart(2, "0")}` : ""}`;
};
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthName = (ym: string) => `${MONTH[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/**
 * Differences worth saying out loud: a total that moved by at least ₹500 and 10%, the two biggest
 * category moves of at least ₹1,000, and regular payments that started or stopped.
 */
export function compareMonths(prev: MonthSnapshot, cur: MonthSnapshot): Change[] {
  const out: Change[] = [];
  const total = (id: string, label: string, a: Paise, b: Paise) => {
    const d = b - a;
    if (Math.abs(d) < 500_00 || (a > 0 && Math.abs(d) * 10 < a)) return;
    const pct = a > 0 ? ` (${d > 0 ? "up" : "down"} ${Math.round((Math.abs(d) * 100) / a)}%)` : "";
    out.push({ id, text: `${label}: ${inr(b)} in ${monthName(cur.month)} against ${inr(a)} in ${monthName(prev.month)}${pct}.` });
  };
  total("spending", "Actual spending", prev.spending, cur.spending);
  total("income", "Income", prev.income, cur.income);
  total("debt", "Debt payments", prev.debt, cur.debt);
  total("transfers", "Transfers out", prev.otherTransfersOut, cur.otherTransfersOut);
  total("platforms", "Sent to investment platforms", prev.platforms, cur.platforms);
  total("cash", "Cash withdrawn", prev.cash, cur.cash);
  if (cur.fees > prev.fees && cur.fees - prev.fees >= 100_00) out.push({ id: "fees", text: `Bank charges went up to ${inr(cur.fees)} from ${inr(prev.fees)}.` });

  const cats = new Set([...Object.keys(prev.byCategory), ...Object.keys(cur.byCategory)]);
  const moves = [...cats]
    .map((c) => ({ c, d: (cur.byCategory[c] ?? 0) - (prev.byCategory[c] ?? 0) }))
    .filter((x) => Math.abs(x.d) >= 1_000_00)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d) || a.c.localeCompare(b.c))
    .slice(0, 2);
  for (const m of moves) out.push({ id: `cat-${m.c}`, text: `${m.c} ${m.d > 0 ? "up" : "down"} by ${inr(Math.abs(m.d))}.` });

  const prevNames = new Set(prev.regular.map((r) => r.name));
  const curNames = new Set(cur.regular.map((r) => r.name));
  for (const r of cur.regular.filter((x) => !prevNames.has(x.name))) out.push({ id: `new-${r.name}`, text: `New regular payment: ${r.name}, ${inr(r.amount)}.` });
  for (const r of prev.regular.filter((x) => !curNames.has(x.name))) out.push({ id: `stopped-${r.name}`, text: `Regular payment not seen this month: ${r.name}.` });
  return out;
}

export type Comparison = { prev: MonthSnapshot; cur: MonthSnapshot; source: "statement" | "saved"; changes: Change[] };

const prevMonthOf = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y! - 1}-12` : `${y}-${String(m! - 1).padStart(2, "0")}`;
};

/**
 * Compare the latest full month with the month before it: from this statement if it has both,
 * otherwise from a month saved earlier on this device. Partial months are never compared.
 */
export function pickComparison(current: MonthSnapshot[], saved: MonthSnapshot[]): Comparison | null {
  const full = current.filter((m) => !m.partial);
  const cur = full[full.length - 1];
  if (!cur) return null;
  const want = prevMonthOf(cur.month);
  const inFile = full.find((m) => m.month === want);
  if (inFile) return { prev: inFile, cur, source: "statement", changes: compareMonths(inFile, cur) };
  const fromSaved = saved.find((m) => m.month === want && !m.partial);
  if (fromSaved) return { prev: fromSaved, cur, source: "saved", changes: compareMonths(fromSaved, cur) };
  return null;
}

/** Merge new snapshots into saved ones: a newer full month replaces an older or partial copy. */
export function mergeSnapshots(saved: MonthSnapshot[], incoming: MonthSnapshot[]): MonthSnapshot[] {
  const map = new Map(saved.map((m) => [m.month, m]));
  for (const m of incoming) {
    const old = map.get(m.month);
    if (!old || old.partial || !m.partial) map.set(m.month, m);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-24);
}
