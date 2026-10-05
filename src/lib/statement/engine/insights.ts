import type { FinancialFacts } from "./facts.ts";
import type { ClassifiedTxn, Paise } from "./model.ts";

/**
 * Insights from the financial facts (and, where a transaction must be named,
 * the classified transactions). Deterministic: every number comes from the
 * facts layer, and every insight lists the transactions behind it.
 *
 * Wording rules: "unusual", never "fraud"; "worth a look", never "waste";
 * nothing about the user's choices being good or bad.
 */

export type Level = "info" | "watch" | "review";
export type Insight = { id: string; kind: "unusual" | "leak" | "trend"; level: Level; title: string; detail: string; amount: Paise | null; txnIds: string[] };
export type HealthItem = { id: string; label: string; level: "good" | "watch" | "review" | "unknown"; value: string; explain: string };
export type StoryLine = { id: string; text: string };
export type Insights = { story: StoryLine[]; health: HealthItem[]; unusual: Insight[]; leaks: Insight[]; checklist: StoryLine[] };

/** "₹1,23,456" or "₹57,350.50": exact, with paise only when there are any, so prose matches the report. */
export const inr = (paise: Paise) => {
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / 100).toLocaleString("en-IN");
  const p = abs % 100;
  return `${paise < 0 ? "−" : ""}₹${whole}${p ? `.${String(p).padStart(2, "0")}` : ""}`;
};
const pctText = (bp: number) => `${Math.round(Math.abs(bp) / 100)}%`;
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthName = (ym: string) => `${MONTH[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTH[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
};

/** Streaming services by kind, to spot more than one of the same kind. */
const STREAMING: Record<string, string[]> = {
  "video streaming": ["NETFLIX", "HOTSTAR", "JIOHOTSTAR", "DISNEY", "PRIME VIDEO", "AMAZON PRIME", "SONYLIV", "ZEE5", "JIOCINEMA"],
  "music streaming": ["SPOTIFY", "GAANA", "WYNK", "JIOSAAVN", "YOUTUBE MUSIC", "APPLE MUSIC"],
};

export function buildInsights(f: FinancialFacts, all: ClassifiedTxn[]): Insights {
  const txns = all.filter((t) => !t.c.duplicateOf);
  const outs = txns.filter((t) => t.debit > 0);
  const unusual: Insight[] = [];
  const leaks: Insight[] = [];
  const lastFull = f.trends.fullMonths[f.trends.fullMonths.length - 1];
  const earlierFull = f.trends.fullMonths.slice(0, -1);

  // --- Unusual activity ---------------------------------------------------
  // 1. A payment much larger than usual to the same counterparty (3+ earlier payments).
  const byParty = new Map<string, ClassifiedTxn[]>();
  for (const t of outs) byParty.set(t.c.counterparty.name, [...(byParty.get(t.c.counterparty.name) ?? []), t]);
  for (const [name, list] of byParty) {
    if (list.length < 4 || name === "Unknown") continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    // The usual amount is the median of all payments to this payee; a few large ones barely move it.
    const usual = median(sorted.map((x) => x.debit));
    for (let i = 3; i < sorted.length; i += 1) {
      const t = sorted[i]!;
      if (t.debit >= usual * 3 && t.debit - usual >= 2_000_00) {
        unusual.push({ id: `bigger-${t.id}`, kind: "unusual", level: "watch", title: `Larger than usual payment to ${name}`, detail: `${inr(t.debit)} on ${dayLabel(t.date)}; you usually pay about ${inr(usual)}.`, amount: t.debit, txnIds: [t.id] });
      }
    }
  }
  // 2. Large one-off amounts among all money out (at least ₹10,000 and 5× the typical payment).
  const typicalOut = median(outs.map((t) => t.debit));
  const big = outs.filter((t) => t.debit >= 10_000_00 && t.debit >= typicalOut * 5 && (byParty.get(t.c.counterparty.name)?.length ?? 0) <= 2);
  for (const t of big.sort((a, b) => b.debit - a.debit).slice(0, 3)) {
    unusual.push({ id: `large-${t.id}`, kind: "unusual", level: "info", title: t.c.type === "TRANSFER" ? "Large transfer" : "Large payment", detail: `${inr(t.debit)} to ${t.c.counterparty.name} on ${dayLabel(t.date)}.`, amount: t.debit, txnIds: [t.id] });
  }
  // 3. A regular payment that started recently (its first payment is in the last two months).
  const months = f.period.months;
  const recentFrom = months[Math.max(0, months.length - 2)]!;
  if (months.length >= 3) {
    for (const r of f.recurring.filter((x) => x.direction === "out" && x.first.slice(0, 7) >= recentFrom)) {
      unusual.push({ id: `new-regular-${r.counterparty}`, kind: "unusual", level: "watch", title: `New regular payment: ${r.counterparty}`, detail: `${inr(r.typical)} ${r.frequency}, started ${dayLabel(r.first)} (≈ ${inr(r.annualized)} a year).`, amount: r.typical, txnIds: r.txnIds });
    }
  }
  // 3b. A possible new regular payment: the same amount to the same payee in each of the
  //     last two months, about a month apart, and never before in the statement.
  if (months.length >= 3) {
    const known = new Set(f.recurring.map((r) => r.counterparty));
    for (const [name, list] of byParty) {
      if (known.has(name) || name === "Unknown" || list.length !== 2) continue;
      const [a, b] = [...list].sort((x, y) => x.date.localeCompare(y.date));
      const gap = (Date.parse(b!.date) - Date.parse(a!.date)) / 86_400_000;
      if (a!.date.slice(0, 7) < recentFrom || a!.date.slice(0, 7) === b!.date.slice(0, 7) || gap < 26 || gap > 35) continue;
      if (Math.abs(a!.debit - b!.debit) > a!.debit * 0.15 || ["CASH_WITHDRAWAL", "FEE"].includes(b!.c.type)) continue;
      unusual.push({ id: `new-regular-${name}`, kind: "unusual", level: "info", title: `Possible new regular payment: ${name}`, detail: `${inr(b!.debit)} on ${dayLabel(a!.date)} and ${dayLabel(b!.date)}, and not before in this statement.`, amount: b!.debit, txnIds: [a!.id, b!.id] });
    }
  }
  // 4. Penalties, bounce and minimum-balance charges.
  const penalties = outs.filter((t) => t.c.type === "FEE" && ["Penalties & late fees", "Bounce & return charges", "Minimum balance charges"].includes(t.c.category));
  if (penalties.length) {
    const total = penalties.reduce((s, t) => s + t.debit, 0);
    unusual.push({ id: "penalties", kind: "unusual", level: "review", title: "Penalty or bounce charges", detail: `${penalties.length} ${penalties.length === 1 ? "charge" : "charges"} totalling ${inr(total)} (${[...new Set(penalties.map((t) => t.c.category.toLowerCase()))].join(", ")}).`, amount: total, txnIds: penalties.map((t) => t.id) });
  }
  // 5. Cash withdrawals much larger than your usual one.
  const cash = outs.filter((t) => t.c.type === "CASH_WITHDRAWAL");
  const usualCash = median(cash.map((t) => t.debit));
  for (const t of cash.filter((x) => cash.length >= 3 && x.debit >= usualCash * 2 && x.debit >= 10_000_00)) {
    unusual.push({ id: `cash-${t.id}`, kind: "unusual", level: "info", title: "Larger cash withdrawal than usual", detail: `${inr(t.debit)} on ${dayLabel(t.date)}; your usual withdrawal is about ${inr(usualCash)}.`, amount: t.debit, txnIds: [t.id] });
  }
  // 6. Category spikes: the last full month against the average of the earlier full months.
  if (lastFull && earlierFull.length) {
    const lastMonth = f.monthly.find((m) => m.month === lastFull)!;
    const earlier = f.monthly.filter((m) => earlierFull.includes(m.month));
    for (const [cat, amount] of Object.entries(lastMonth.byCategory)) {
      const before = Math.round(earlier.reduce((s, m) => s + (m.byCategory[cat] ?? 0), 0) / earlier.length);
      if (before > 0 && amount >= before * 1.5 && amount - before >= 2_000_00) {
        const ids = outs.filter((t) => t.c.type === "SPENDING" && t.c.category === cat && t.date.startsWith(lastFull)).map((t) => t.id);
        unusual.push({ id: `spike-${cat}`, kind: "trend", level: "watch", title: `${cat} went up in ${monthName(lastFull)}`, detail: `${inr(amount)} against an average of ${inr(before)} in the earlier months (up ${pctText(Math.round(((amount - before) * 10_000) / before))}).`, amount, txnIds: ids });
      }
    }
  }

  // --- Potential money leaks ---------------------------------------------
  // 1. Possible double payment: same counterparty, same amount, same day (₹200 or more).
  const seen = new Map<string, ClassifiedTxn>();
  for (const t of outs.filter((x) => x.c.type === "SPENDING" && x.debit >= 200_00)) {
    const key = `${t.date}|${t.c.counterparty.name}|${t.debit}`;
    const first = seen.get(key);
    if (first) leaks.push({ id: `double-${t.id}`, kind: "leak", level: "review", title: `Possible double payment to ${t.c.counterparty.name}`, detail: `Two payments of ${inr(t.debit)} on ${dayLabel(t.date)}. If you were charged twice, the merchant can refund it.`, amount: t.debit, txnIds: [first.id, t.id] });
    else seen.set(key, t);
  }
  // 2. Many small payments: at least 15 a month under ₹200 on average.
  const small = outs.filter((t) => t.c.type === "SPENDING" && t.debit < 200_00);
  const monthCount = Math.max(1, months.length);
  if (small.length / monthCount >= 15) {
    const total = small.reduce((s, t) => s + t.debit, 0);
    leaks.push({ id: "small-payments", kind: "leak", level: "info", title: "Many small payments", detail: `${small.length} payments under ₹200 added up to ${inr(total)} (about ${inr(Math.round(total / monthCount))} a month). Small amounts are easy to miss.`, amount: total, txnIds: small.map((t) => t.id) });
  }
  // 3. More than one subscription of the same kind.
  for (const [kind, words] of Object.entries(STREAMING)) {
    const subs = f.subscriptions.filter((s) => words.some((w) => s.counterparty.toUpperCase().includes(w)));
    if (subs.length >= 2) {
      leaks.push({ id: `subs-${kind}`, kind: "leak", level: "watch", title: `${subs.length} ${kind} subscriptions`, detail: `${subs.map((s) => s.counterparty).join(", ")}. Check you still want each one.`, amount: subs.reduce((s, x) => s + (x.monthlyEquivalent ?? x.typical), 0), txnIds: subs.flatMap((s) => s.txnIds) });
    }
  }
  // 4. Bank charges, if any.
  if (f.fees > 0) {
    leaks.push({ id: "fees", kind: "leak", level: f.fees >= 500_00 ? "watch" : "info", title: "Bank and card charges", detail: `${inr(f.fees)} in ${f.feeTxnIds.length} ${f.feeTxnIds.length === 1 ? "charge" : "charges"}. You can ask your bank about any you don't recognise.`, amount: f.fees, txnIds: f.feeTxnIds });
  }

  return { story: story(f), health: health(f), unusual, leaks, checklist: checklist(f, unusual, leaks) };
}

/** Things worth checking before relying on the report. */
function checklist(f: FinancialFacts, unusual: Insight[], leaks: Insight[]): StoryLine[] {
  const items: StoryLine[] = [];
  const transfersIn = f.moneyInParts.find((p) => p.label === "Transfers in")?.amount ?? 0;
  if (!f.incomeReliable && transfersIn > f.trueIncome) {
    items.push({ id: "income", text: `Most money in (${inr(transfersIn)}) came as transfers, so income looks small (${inr(f.trueIncome)}). If some of it is income, such as salary, family support or payment for work, mark it as Income and the income-based figures will appear.` });
  }
  if (f.lowConfidence) items.push({ id: "low", text: `${f.lowConfidence} ${f.lowConfidence === 1 ? "transaction has" : "transactions have"} a low-confidence type. Check them with the "Needs review" filter.` });
  if (f.unknownOut || f.unknownIn) items.push({ id: "unknown", text: `${inr(f.unknownOut)} out and ${inr(f.unknownIn)} in could not be classified.` });
  const people = f.topPeopleOut.reduce((s, b) => s + b.amount, 0);
  if (people) items.push({ id: "people", text: `Payments to people (${inr(f.transfersOutByCategory.find((b) => b.key === "To people")?.amount ?? people)}) are counted as transfers. Some may be shops using a personal UPI ID; mark those as spending.` });
  if (f.brokerFunding) items.push({ id: "broker", text: `${inr(f.brokerFunding)} sent to investment platforms is not confirmed as invested. Your broker's statement shows what was bought.` });
  if (f.cashWithdrawals) items.push({ id: "cash", text: `${inr(f.cashWithdrawals)} was withdrawn as cash. What it was spent on is not in the statement.` });
  if (f.subscriptions.length) items.push({ id: "subs", text: `Check that each of the ${f.subscriptions.length} ${f.subscriptions.length === 1 ? "subscription" : "subscriptions"} is still something you want.` });
  for (const i of [...unusual, ...leaks].filter((x) => x.level === "review")) items.push({ id: `review-${i.id}`, text: `${i.title}: ${i.detail}` });
  if (f.duplicatesExcluded) items.push({ id: "dupes", text: `${f.duplicatesExcluded} ${f.duplicatesExcluded === 1 ? "entry" : "entries"} appeared in more than one statement and ${f.duplicatesExcluded === 1 ? "was" : "were"} counted once.` });
  return items;
}

function story(f: FinancialFacts): StoryLine[] {
  const lines: StoryLine[] = [];
  const period = `${dayLabel(f.period.from)} and ${dayLabel(f.period.to)}`;
  lines.push({ id: "bank", text: `Between ${period}, ${inr(f.raw.moneyIn)} came into your account and ${inr(f.raw.moneyOut)} went out.` });
  lines.push({ id: "summary", text: `Of this, ${inr(f.trueIncome)} was income and ${inr(f.actualSpending)} went on spending.` });
  const notSpending = f.raw.moneyOut - f.grossSpending;
  if (notSpending > 0) lines.push({ id: "not-spending", text: `${inr(notSpending)} of the ${inr(f.raw.moneyOut)} that left your account was not spending: it went to transfers, investment platforms, debt payments, cash and fees.` });
  const topCat = f.spendingByCategory[0];
  if (topCat && f.grossSpending > 0) lines.push({ id: "top-category", text: `Your biggest spending category was ${topCat.key}: ${inr(topCat.amount)}, ${Math.round((topCat.amount * 100) / f.grossSpending)}% of spending.` });
  const regular = f.recurring.filter((r) => r.direction === "out");
  if (regular.length) lines.push({ id: "regular", text: `You have ${regular.length} regular ${regular.length === 1 ? "payment" : "payments"}, about ${inr(f.commitments.monthly)} a month.` });
  const last = f.trends.changes[f.trends.changes.length - 1];
  if (last && last.spendingBp !== null && Math.abs(last.spendingBp) >= 1000) {
    const prev = f.trends.fullMonths[f.trends.fullMonths.length - 2]!;
    lines.push({ id: "trend", text: `Spending in ${monthName(last.month)} was ${pctText(last.spendingBp)} ${last.spendingBp > 0 ? "higher" : "lower"} than in ${monthName(prev)}.` });
  }
  if (f.fees > 0) lines.push({ id: "fees", text: `${inr(f.fees)} went on bank and card charges.` });
  if (f.unknownOut > 0) lines.push({ id: "unknown", text: `${inr(f.unknownOut)} of money out could not be classified; you can check it in the list below.` });
  return lines;
}

function health(f: FinancialFacts): HealthItem[] {
  const items: HealthItem[] = [];
  const noIncome =
    f.trueIncome > 0
      ? "Too little income found in this statement to compare with; most money in came as transfers."
      : "No income found in this statement to compare with.";
  const pct = (bp: number) => `${Math.round(bp / 100)}%`;
  const months = Math.max(1, f.period.months.length);
  const level = (v: number, good: (x: number) => boolean, watch: (x: number) => boolean) => (good(v) ? "good" : watch(v) ? "watch" : "review");

  const netShare = f.raw.moneyIn > 0 ? Math.round((f.netCashFlow * 10_000) / f.raw.moneyIn) : null;
  items.push({
    id: "cash-flow",
    label: "Cash flow",
    level: netShare === null ? "unknown" : level(netShare, (x) => x >= 0, (x) => x >= -1000),
    value: inr(f.netCashFlow),
    explain: "Money in minus money out over the period.",
  });
  items.push(
    f.savingsRateBp === null
      ? { id: "savings", label: "Kept from income", level: "unknown", value: "—", explain: noIncome }
      : { id: "savings", label: "Kept from income", level: level(f.savingsRateBp, (x) => x >= 2000, (x) => x >= 0), value: pct(f.savingsRateBp), explain: "Income left after spending, fees, debt payments and cash (cash is counted as used)." },
  );
  items.push(
    f.commitments.shareOfIncomeBp === null
      ? { id: "commitments", label: "Regular payments", level: "unknown", value: `${inr(f.commitments.monthly)} a month`, explain: noIncome }
      : { id: "commitments", label: "Regular payments", level: level(f.commitments.shareOfIncomeBp, (x) => x <= 3000, (x) => x <= 5000), value: `${pct(f.commitments.shareOfIncomeBp)} of income`, explain: "Payments that repeat, as a share of monthly income." },
  );
  const debtShare = f.incomeReliable ? Math.round((f.debtPayments * 10_000) / f.trueIncome) : null;
  items.push(
    debtShare === null
      ? { id: "debt", label: "Debt payments", level: f.debtPayments ? "unknown" : "good", value: inr(f.debtPayments), explain: f.debtPayments ? noIncome : "No debt payments in this statement." }
      : { id: "debt", label: "Debt payments", level: level(debtShare, (x) => x <= 2000, (x) => x <= 4000), value: `${pct(debtShare)} of income`, explain: "EMIs, loans, card bills and pay-later, as a share of income." },
  );
  const penalties = f.feesByCategory.filter((b) => ["Penalties & late fees", "Bounce & return charges", "Minimum balance charges"].includes(b.key)).reduce((s, b) => s + b.amount, 0);
  items.push({
    id: "fees",
    label: "Charges",
    level: penalties > 0 ? "review" : f.fees / months > 100_00 ? "watch" : "good",
    value: inr(f.fees),
    explain: penalties > 0 ? "Includes penalty, bounce or minimum-balance charges." : "Bank and card charges in the period.",
  });
  const last = f.trends.changes[f.trends.changes.length - 1];
  items.push(
    !last || last.spendingBp === null
      ? { id: "trend", label: "Spending trend", level: "unknown", value: "—", explain: "Needs at least two full months." }
      : { id: "trend", label: "Spending trend", level: level(last.spendingBp, (x) => x <= 1000, (x) => x <= 3000), value: `${last.spendingBp > 0 ? "+" : last.spendingBp < 0 ? "−" : ""}${pct(Math.abs(last.spendingBp))}`, explain: `${monthName(last.month)} against the month before.` },
  );
  return items;
}
