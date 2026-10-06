import { hasWord } from "../categorize.ts";
import { SUBSCRIPTION_WORDS } from "./entities.ts";
import type { ClassifiedTxn, Paise, TxnType } from "./model.ts";

/**
 * Payments that repeat. A series is the same counterparty, in the same
 * direction, at about the same amount (within 15% of the typical amount), at
 * a steady interval. Next dates are estimates from the usual gap, never
 * promises. All amounts are integer paise.
 */

export type Frequency = "weekly" | "monthly" | "quarterly" | "yearly";

const FREQS: { f: Frequency; lo: number; hi: number; perYear: number; min: number }[] = [
  { f: "weekly", lo: 6, hi: 8, perYear: 52, min: 3 },
  { f: "monthly", lo: 26, hi: 35, perYear: 12, min: 2 },
  { f: "quarterly", lo: 84, hi: 98, perYear: 4, min: 2 },
  { f: "yearly", lo: 350, hi: 380, perYear: 1, min: 2 },
];

export type CommitmentKind = "Subscriptions" | "Loans & EMIs" | "Insurance" | "Investments & platforms" | "Rent" | "Bills" | "To people" | "Other";

export type RecurringFact = {
  counterparty: string;
  direction: "out" | "in";
  frequency: Frequency;
  type: TxnType;
  category: string;
  kind: CommitmentKind;
  typical: Paise;
  occurrences: number;
  first: string;
  last: string;
  /** Estimated from the usual gap; may not happen. */
  nextEstimate: string;
  annualized: Paise;
  /** The yearly cost spread over 12 months. */
  monthlyEquivalent: Paise;
  confidence: number;
  isSubscription: boolean;
  txnIds: string[];
};

export type SubscriptionFact = {
  counterparty: string;
  frequency: Frequency | "seen once" | "irregular";
  typical: Paise;
  last: string;
  annualized: Paise | null;
  monthlyEquivalent: Paise | null;
  txnIds: string[];
};

const dayNo = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;
const isoOf = (d: number) => new Date(d * 86_400_000).toISOString().slice(0, 10);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
};
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

export const isSubscriptionText = (description: string, category: string) =>
  category === "Subscriptions" || SUBSCRIPTION_WORDS.some((w) => hasWord(` ${description.toUpperCase()} `, w));

function kindOf(t: ClassifiedTxn, subscription: boolean): CommitmentKind {
  if (subscription) return "Subscriptions";
  if (t.c.type === "DEBT_PAYMENT") return "Loans & EMIs";
  if (t.c.category === "Insurance") return "Insurance";
  if (t.c.type === "INVESTMENT" || t.c.category === "Broker funding") return "Investments & platforms";
  if (t.c.category === "Rent") return "Rent";
  if (t.c.category === "Bills & utilities") return "Bills";
  if (t.c.counterparty.kind === "person") return "To people";
  return "Other";
}

/** Find repeating series among non-duplicate transactions. Cash, fees and interest are left out. */
export function detectRecurring(txns: ClassifiedTxn[], spanMonths: number): RecurringFact[] {
  const groups = new Map<string, ClassifiedTxn[]>();
  for (const t of txns) {
    if (t.c.duplicateOf || ["CASH_WITHDRAWAL", "FEE", "INTEREST"].includes(t.c.type)) continue;
    const name = norm(t.c.counterparty.name);
    if (!name || name === "UNKNOWN") continue;
    const key = `${t.debit > 0 ? "out" : "in"}|${name}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const out: RecurringFact[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const direction = key.startsWith("out") ? "out" : "in";
    const amount = (t: ClassifiedTxn) => t.debit || t.credit;
    const items = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const typical = median(items.map(amount));
    const steady = items.filter((t) => Math.abs(amount(t) - typical) <= typical * 0.15);
    if (steady.length < 2) continue;
    // A merchant paid often at many different amounts (food orders) is not a series.
    if (list.length > steady.length * 2) continue;
    const gaps = steady.slice(1).map((t, i) => dayNo(t.date) - dayNo(steady[i]!.date));
    const gap = median(gaps);
    const freq = FREQS.find((q) => gap >= q.lo && gap <= q.hi && gaps.filter((g) => g >= q.lo && g <= q.hi).length >= gaps.length * 0.7);
    if (!freq) continue;
    const last = steady[steady.length - 1]!;
    const subscription = direction === "out" && isSubscriptionText(last.description, last.c.category);
    // Two payments a month apart are enough for a known subscription (it may have started recently);
    // anything else needs three in a statement of three months or more.
    const needed = freq.f === "monthly" ? (subscription ? 2 : Math.min(3, Math.max(2, spanMonths))) : freq.min;
    if (steady.length < needed) continue;
    const varies = steady.some((t) => Math.abs(amount(t) - typical) > typical * 0.05);
    const annualized = typical * freq.perYear;
    out.push({
      counterparty: last.c.counterparty.name,
      direction,
      frequency: freq.f,
      type: last.c.type,
      category: last.c.category,
      kind: direction === "out" ? kindOf(last, subscription) : "Other",
      typical,
      occurrences: steady.length,
      first: steady[0]!.date,
      last: last.date,
      nextEstimate: isoOf(dayNo(last.date) + gap),
      annualized,
      monthlyEquivalent: Math.round(annualized / 12),
      confidence: Math.min(0.95, 0.6 + 0.1 * (steady.length - 2)) - (varies ? 0.1 : 0),
      isSubscription: subscription,
      txnIds: steady.map((t) => t.id),
    });
  }
  return out.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent || a.counterparty.localeCompare(b.counterparty));
}

/** Subscriptions: repeating ones, plus subscription payments seen only once in the period. */
export function subscriptions(txns: ClassifiedTxn[], recurring: RecurringFact[]): SubscriptionFact[] {
  const inSeries = new Set(recurring.flatMap((r) => r.txnIds));
  const fromSeries: SubscriptionFact[] = recurring
    .filter((r) => r.isSubscription)
    .map((r) => ({ counterparty: r.counterparty, frequency: r.frequency, typical: r.typical, last: r.last, annualized: r.annualized, monthlyEquivalent: r.monthlyEquivalent, txnIds: r.txnIds }));
  const seen = new Map<string, ClassifiedTxn[]>();
  for (const t of txns) {
    if (t.debit === 0 || t.c.duplicateOf || inSeries.has(t.id) || t.c.type !== "SPENDING" || !isSubscriptionText(t.description, t.c.category)) continue;
    seen.set(t.c.counterparty.name, [...(seen.get(t.c.counterparty.name) ?? []), t]);
  }
  const once: SubscriptionFact[] = [...seen.entries()].map(([name, list]) => {
    const last = [...list].sort((a, b) => a.date.localeCompare(b.date)).pop()!;
    return { counterparty: name, frequency: list.length === 1 ? ("seen once" as const) : ("irregular" as const), typical: last.debit, last: last.date, annualized: null, monthlyEquivalent: null, txnIds: list.map((t) => t.id) };
  });
  return [...fromSeries, ...once];
}
