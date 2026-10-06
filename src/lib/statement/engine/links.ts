import { canReplace } from "./classify.ts";
import { nameMatches, type StatementContext } from "./context.ts";
import type { ClassifiedTxn, Paise, RawTxn } from "./model.ts";

/**
 * Evidence that needs more than one transaction. Behaviour is the weakest
 * automatic layer: it may only replace a "fallback" (UNKNOWN) classification,
 * and otherwise only adds links, reasons and confidence within the same type.
 */

const day = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

/**
 * The same transaction listed twice. Across files (overlapping statements) the
 * same date, amount, direction and description is a duplicate. Within one
 * balance-checked file every line moved the balance, so only a line that repeats
 * the balance as well is a duplicate.
 */
export function markDuplicates(txns: ClassifiedTxn[]): ClassifiedTxn[] {
  const seen = new Map<string, ClassifiedTxn>();
  return txns.map((t) => {
    const key = `${t.date}|${t.debit}|${t.credit}|${norm(t.description)}`;
    const first = seen.get(key);
    if (!first) {
      seen.set(key, t);
      return t;
    }
    const sameFile = first.sourceFileId === t.sourceFileId;
    if (sameFile && (t.balance === null || first.balance !== t.balance)) return t;
    return { ...t, c: { ...t.c, duplicateOf: first.id, reasons: [`Same as ${first.id} (listed twice)`, ...t.c.reasons] } };
  });
}

/**
 * Link refunds to the spending they reverse: a refund (or an unclassified credit)
 * from a merchant paid within the previous 60 days, for no more than what is
 * still unrefunded on that payment. Unlinked refunds stay refunds but do not
 * reduce spending.
 */
export function linkRefunds(txns: ClassifiedTxn[]): ClassifiedTxn[] {
  const remaining = new Map<string, Paise>();
  const out = [...txns];
  const byDate = out.map((t, i) => ({ t, i })).sort((a, b) => a.t.date.localeCompare(b.t.date));
  for (const { t, i } of byDate) {
    if (t.c.duplicateOf || t.credit === 0) continue;
    const isRefund = t.c.type === "REFUND";
    const unknown = t.c.type === "UNKNOWN" && canReplace(t.c.layer, "behaviour");
    if (!isRefund && !unknown) continue;
    const name = norm(t.c.counterparty.name);
    const candidates = byDate
      .map((x) => x.t)
      .filter((d) => d.debit > 0 && !d.c.duplicateOf && d.c.type === "SPENDING" && norm(d.c.counterparty.name) === name && day(t.date) - day(d.date) >= 0 && day(t.date) - day(d.date) <= 60)
      .filter((d) => (remaining.get(d.id) ?? d.debit) >= t.credit)
      .sort((a, b) => b.date.localeCompare(a.date));
    const match = candidates[0];
    if (!match) continue;
    remaining.set(match.id, (remaining.get(match.id) ?? match.debit) - t.credit);
    out[i] = {
      ...t,
      c: {
        ...t.c,
        type: "REFUND",
        category: "Refund",
        layer: isRefund ? t.c.layer : "behaviour",
        confidence: isRefund ? Math.max(t.c.confidence, t.c.layer === "structural" ? 0.9 : 0.7) : 0.6,
        refundOf: match.id,
        reasons: [`Refund of the ${match.date} payment to ${match.c.counterparty.name}`, ...t.c.reasons],
      },
    };
  }
  return out;
}

/**
 * Money received regularly: the same payer in at least two different months, at
 * a similar amount (within 10%), of at least ₹5,000. This never turns a transfer
 * into income by itself (a stronger layer decided the type); it confirms income
 * that is already income, and can only turn an UNKNOWN credit into income.
 */
export function markRegularIncome(txns: ClassifiedTxn[]): ClassifiedTxn[] {
  const groups = new Map<string, ClassifiedTxn[]>();
  for (const t of txns) {
    if (t.credit === 0 || t.c.duplicateOf) continue;
    const k = norm(t.c.counterparty.name);
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  const regular = new Set<string>();
  for (const items of groups.values()) {
    const sorted = [...items].map((t) => t.credit).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    if (median < 5_000_00) continue;
    const steady = items.filter((t) => Math.abs(t.credit - median) <= median * 0.1);
    if (new Set(steady.map((t) => t.date.slice(0, 7))).size < 2) continue;
    for (const t of steady) regular.add(t.id);
  }
  return txns.map((t) => {
    if (!regular.has(t.id)) return t;
    if (t.c.type === "INCOME") {
      return { ...t, c: { ...t.c, category: t.c.category === "Salary" ? "Salary" : "Regular income", confidence: Math.max(t.c.confidence, 0.8), reasons: [...t.c.reasons, "Received every month from the same payer"] } };
    }
    if (t.c.type === "UNKNOWN" && canReplace(t.c.layer, "behaviour")) {
      return { ...t, c: { ...t.c, type: "INCOME", category: "Regular income", layer: "behaviour", confidence: 0.6, reasons: ["Received every month from the same payer, at a similar amount", ...t.c.reasons] } };
    }
    return { ...t, c: { ...t.c, reasons: [...t.c.reasons, "Received every month from the same payer"] } };
  });
}

/** Sent to someone and received back the same amount within 10 days: a round trip, not spending or income. */
export function markRoundTrips(txns: ClassifiedTxn[]): ClassifiedTxn[] {
  const out = [...txns];
  const used = new Set<string>();
  // Credits indexed by counterparty and amount, so each debit looks only at its own candidates.
  const credits = new Map<string, number[]>();
  txns.forEach((c, j) => {
    if (c.credit === 0 || c.c.duplicateOf) return;
    const k = `${norm(c.c.counterparty.name)}|${c.credit}`;
    credits.set(k, [...(credits.get(k) ?? []), j]);
  });
  txns.forEach((d, i) => {
    if (d.debit === 0 || d.c.duplicateOf || used.has(d.id)) return;
    const name = norm(d.c.counterparty.name);
    const j = (credits.get(`${name}|${d.debit}`) ?? []).find((k) => {
      const c = txns[k]!;
      return !used.has(c.id) && day(c.date) - day(d.date) >= 0 && day(c.date) - day(d.date) <= 10;
    }) ?? -1;
    if (j < 0) return;
    const c = txns[j]!;
    if (!["TRANSFER", "UNKNOWN"].includes(d.c.type) || !["TRANSFER", "UNKNOWN"].includes(c.c.type)) return;
    used.add(d.id);
    used.add(c.id);
    const pairId = `${d.id}~${c.id}`;
    const mark = (t: ClassifiedTxn): ClassifiedTxn =>
      t.c.type === "UNKNOWN" && canReplace(t.c.layer, "behaviour")
        ? { ...t, c: { ...t.c, type: "TRANSFER", category: t.debit ? "To people" : "From people", layer: "behaviour", confidence: 0.6, pairId, reasons: ["Same amount sent and received back within 10 days", ...t.c.reasons] } }
        : { ...t, c: { ...t.c, pairId, reasons: [...t.c.reasons, "Same amount sent and received back within 10 days"] } };
    out[i] = mark(d);
    out[j] = mark(c);
  });
  return out;
}

/**
 * Transfers to and from people whose name matches the statement header. Own account needs two
 * signals: the name matches the account holder AND money moves both ways (2+ times each). A
 * care-of name marks the transfers as Family. Only the category changes; they stay transfers.
 */
export function markHolderAndFamily(txns: ClassifiedTxn[], ctx: StatementContext): ClassifiedTxn[] {
  if (!ctx.holderNames.length && !ctx.familyNames.length) return txns;
  const flows = new Map<string, { out: number; in: number }>();
  for (const t of txns) {
    if (t.c.type !== "TRANSFER" || t.c.counterparty.kind !== "person" || t.c.duplicateOf) continue;
    const k = norm(t.c.counterparty.name);
    const f = flows.get(k) ?? { out: 0, in: 0 };
    if (t.debit) f.out += 1;
    else f.in += 1;
    flows.set(k, f);
  }
  return txns.map((t) => {
    if (t.c.type !== "TRANSFER" || t.c.counterparty.kind !== "person" || !canReplace(t.c.layer, "structural")) return t;
    const name = t.c.counterparty.name;
    const f = flows.get(norm(name)) ?? { out: 0, in: 0 };
    if (ctx.holderNames.some((h) => nameMatches(name, h)) && f.out >= 2 && f.in >= 2) {
      return { ...t, c: { ...t.c, category: "Own accounts", counterparty: { ...t.c.counterparty, kind: "own" }, confidence: 0.65, reasons: ["Name matches the account holder on this statement, and money moves both ways often", ...t.c.reasons] } };
    }
    if (ctx.familyNames.some((h) => nameMatches(name, h))) {
      return { ...t, c: { ...t.c, category: "Family", confidence: 0.6, reasons: ["Name matches the care-of (family) name on this statement", ...t.c.reasons] } };
    }
    return t;
  });
}

export const toRaw = (txns: { date: string; narration: string; debit: number; credit: number; balance: number | null }[], sourceFileId: string): RawTxn[] =>
  txns.map((t, i) => ({ id: `${sourceFileId}:${i + 1}`, sourceFileId, date: t.date, description: t.narration, debit: t.debit, credit: t.credit, balance: t.balance }));
