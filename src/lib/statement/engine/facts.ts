import type { Bucket, ClassifiedTxn, Paise, TxnType } from "./model.ts";
import { detectRecurring, subscriptions, type RecurringFact, type SubscriptionFact } from "./recurring.ts";

export type { RecurringFact, SubscriptionFact };

/**
 * Financial facts: every total the report, exports and (later) Ask AQVIK use.
 * Computed once from classified transactions; nothing downstream adds money up
 * on its own. Duplicates are excluded. All values are integer paise.
 *
 * Identity kept by construction (and tested): the debits of all types add up to
 * money out, and the credits of all types to money in.
 */

export type MonthFacts = {
  month: string; // YYYY-MM
  moneyIn: Paise;
  moneyOut: Paise;
  income: Paise;
  spending: Paise;
  investments: Paise;
  brokerFunding: Paise;
  debt: Paise;
  transfersOut: Paise;
  cash: Paise;
  fees: Paise;
  net: Paise;
  /** The statement covers only part of this month (it starts or ends mid-month). */
  partial: boolean;
  /** Spending by category in this month (after linked refunds are not applied per category). */
  byCategory: Record<string, Paise>;
};

export type Trends = {
  /** Months the statement fully covers; averages and comparisons use only these. */
  fullMonths: string[];
  avgMonthlyIncome: Paise | null;
  avgMonthlySpending: Paise | null;
  highestSpendingMonth: { month: string; amount: Paise } | null;
  highestIncomeMonth: { month: string; amount: Paise } | null;
  /** Change against the previous full month, in basis points; null when there is nothing to compare. */
  changes: { month: string; spendingBp: number | null; incomeBp: number | null }[];
};

export type FinancialFacts = {
  period: { from: string; to: string; months: string[] };
  count: number;
  duplicatesExcluded: number;
  raw: { moneyIn: Paise; moneyOut: Paise; net: Paise; openingBalance: Paise | null; closingBalance: Paise | null };
  trueIncome: Paise;
  incomeBySource: Bucket[];
  grossSpending: Paise;
  refundsLinked: Paise;
  actualSpending: Paise;
  refundsUnlinked: Paise;
  cashback: Paise;
  spendingByCategory: Bucket[];
  investmentsConfirmed: Paise;
  investmentsByCategory: Bucket[];
  brokerFunding: Paise;
  fromInvestments: Paise;
  debtPayments: Paise;
  debtByCategory: Bucket[];
  transfersOut: Paise;
  transfersIn: Paise;
  transfersOutByCategory: Bucket[];
  cashWithdrawals: Paise;
  fees: Paise;
  feesByCategory: Bucket[];
  interest: Paise;
  unknownOut: Paise;
  unknownIn: Paise;
  netCashFlow: Paise;
  /** Share of income left after spending, fees, debt and cash, in basis points; null without income. */
  savingsRateBp: number | null;
  /** Confirmed investments as a share of income, in basis points; null without income. */
  investmentRateBp: number | null;
  monthly: MonthFacts[];
  trends: Trends;
  /** Repeating payments out (commitments) and in (regular income). */
  recurring: RecurringFact[];
  subscriptions: SubscriptionFact[];
  commitments: {
    /** Outgoing repeating payments, as a monthly equivalent. */
    monthly: Paise;
    annual: Paise;
    byKind: Bucket[];
    /** Monthly commitments as a share of average monthly true income, in basis points; null without income. */
    shareOfIncomeBp: number | null;
  };
  feeTxnIds: string[];
  topMerchants: Bucket[];
  topPeopleOut: Bucket[];
  topPeopleIn: Bucket[];
  largestOut: string[];
  lowConfidence: number;
  byType: { out: Record<TxnType, Paise>; in: Record<TxnType, Paise> };
  /** Where money out went; the parts always add up to raw.moneyOut. */
  moneyOutParts: { label: string; amount: Paise }[];
  /** Where money in came from; the parts always add up to raw.moneyIn. */
  moneyInParts: { label: string; amount: Paise }[];
  /**
   * Enough income to compare things with: at least ₹1,000 a month and at least 10% of
   * money in. When false, income-based percentages are null rather than meaningless.
   */
  incomeReliable: boolean;
};

const sum = (xs: ClassifiedTxn[], f: (t: ClassifiedTxn) => Paise) => xs.reduce((s, t) => s + f(t), 0);

function buckets(xs: ClassifiedTxn[], key: (t: ClassifiedTxn) => string, amount: (t: ClassifiedTxn) => Paise): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const t of xs) {
    const k = key(t);
    const b = map.get(k) ?? { key: k, amount: 0, count: 0 };
    b.amount += amount(t);
    b.count += 1;
    map.set(k, b);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount || a.key.localeCompare(b.key));
}


const ZERO = (): Record<TxnType, Paise> => ({ INCOME: 0, SPENDING: 0, TRANSFER: 0, INVESTMENT: 0, DEBT_PAYMENT: 0, CASH_WITHDRAWAL: 0, REFUND: 0, CASHBACK: 0, FEE: 0, INTEREST: 0, UNKNOWN: 0 });

export function computeFacts(all: ClassifiedTxn[]): FinancialFacts | null {
  const txns = [...all].filter((t) => !t.c.duplicateOf).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  if (!txns.length) return null;
  const outs = txns.filter((t) => t.debit > 0);
  const ins = txns.filter((t) => t.credit > 0);
  const ofType = (xs: ClassifiedTxn[], type: TxnType) => xs.filter((t) => t.c.type === type);

  const byType = { out: ZERO(), in: ZERO() };
  for (const t of outs) byType.out[t.c.type] += t.debit;
  for (const t of ins) byType.in[t.c.type] += t.credit;

  const spending = ofType(outs, "SPENDING");
  const grossSpending = sum(spending, (t) => t.debit);
  const refunds = ofType(ins, "REFUND");
  // A linked refund reduces spending only if the payment it reverses is still counted as spending.
  const spendingIds = new Set(spending.map((t) => t.id));
  const refundsLinked = sum(refunds.filter((t) => t.c.refundOf && spendingIds.has(t.c.refundOf)), (t) => t.credit);
  const transfersOut = ofType(outs, "TRANSFER");
  const transfersIn = ofType(ins, "TRANSFER");
  const brokerFunding = sum(transfersOut.filter((t) => t.c.category === "Broker funding"), (t) => t.debit);
  const fromInvestments = sum(transfersIn.filter((t) => t.c.counterparty.kind === "broker" || /investment|FD \/ RD/i.test(t.c.category)), (t) => t.credit);

  const moneyIn = sum(ins, (t) => t.credit);
  const moneyOut = sum(outs, (t) => t.debit);
  const trueIncome = byType.in.INCOME;
  const actualSpending = grossSpending - refundsLinked;
  const first = txns.find((t) => t.balance !== null);
  const last = [...txns].reverse().find((t) => t.balance !== null);

  const monthMap = new Map<string, MonthFacts>();
  for (const t of txns) {
    const k = t.date.slice(0, 7);
    const m = monthMap.get(k) ?? { month: k, moneyIn: 0, moneyOut: 0, income: 0, spending: 0, investments: 0, brokerFunding: 0, debt: 0, transfersOut: 0, cash: 0, fees: 0, net: 0, partial: false, byCategory: {} };
    if (t.debit && t.c.type === "SPENDING") m.byCategory[t.c.category] = (m.byCategory[t.c.category] ?? 0) + t.debit;
    m.moneyIn += t.credit;
    m.moneyOut += t.debit;
    if (t.credit && t.c.type === "INCOME") m.income += t.credit;
    if (t.debit && t.c.type === "SPENDING") m.spending += t.debit;
    if (t.credit && t.c.type === "REFUND" && t.c.refundOf && spendingIds.has(t.c.refundOf)) m.spending -= t.credit;
    if (t.debit && t.c.type === "INVESTMENT") m.investments += t.debit;
    if (t.debit && t.c.type === "TRANSFER" && t.c.category === "Broker funding") m.brokerFunding += t.debit;
    if (t.debit && t.c.type === "DEBT_PAYMENT") m.debt += t.debit;
    if (t.debit && t.c.type === "TRANSFER") m.transfersOut += t.debit;
    if (t.debit && t.c.type === "CASH_WITHDRAWAL") m.cash += t.debit;
    if (t.debit && t.c.type === "FEE") m.fees += t.debit;
    m.net = m.moneyIn - m.moneyOut;
    monthMap.set(k, m);
  }
  const monthly = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month));
  const from = txns[0]!.date;
  const to = txns[txns.length - 1]!.date;
  for (const m of monthly) {
    const [y, mo] = m.month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y!, mo!, 0)).getUTCDate();
    // A month counts as full if the statement covers it to within 2 days at either end.
    const startsLate = m.month === from.slice(0, 7) && Number(from.slice(8, 10)) > 3;
    const endsEarly = m.month === to.slice(0, 7) && Number(to.slice(8, 10)) < lastDay - 2;
    m.partial = startsLate || endsEarly;
  }
  const full = monthly.filter((m) => !m.partial);
  const avg = (f: (m: MonthFacts) => Paise) => (full.length ? Math.round(full.reduce((s, m) => s + f(m), 0) / full.length) : null);
  const top = (f: (m: MonthFacts) => Paise) =>
    full.length ? full.reduce((best, m) => (f(m) > best.amount ? { month: m.month, amount: f(m) } : best), { month: full[0]!.month, amount: f(full[0]!) }) : null;
  const change = (cur: Paise, prev: Paise) => (prev > 0 ? Math.round(((cur - prev) * 10_000) / prev) : null);
  const trends: Trends = {
    fullMonths: full.map((m) => m.month),
    avgMonthlyIncome: avg((m) => m.income),
    avgMonthlySpending: avg((m) => m.spending),
    highestSpendingMonth: top((m) => m.spending),
    highestIncomeMonth: top((m) => m.income),
    changes: full.map((m, i) => ({ month: m.month, spendingBp: i ? change(m.spending, full[i - 1]!.spending) : null, incomeBp: i ? change(m.income, full[i - 1]!.income) : null })),
  };

  const recurring = detectRecurring(txns, monthly.length);
  const recurringOut = recurring.filter((r) => r.direction === "out");
  const commitmentMonthly = recurringOut.reduce((s, r) => s + r.monthlyEquivalent, 0);
  const commitmentAnnual = recurringOut.reduce((s, r) => s + r.annualized, 0);
  const incomeBase = trueIncome + byType.in.INTEREST;
  const incomeReliable = trueIncome > 0 && trueIncome >= moneyIn * 0.1 && trueIncome >= 1_000_00 * Math.max(1, monthly.length);
  const kept = incomeBase - actualSpending - byType.out.FEE - byType.out.DEBT_PAYMENT - byType.out.CASH_WITHDRAWAL;
  const bp = (part: number, whole: number) => (incomeReliable && whole > 0 ? Math.round((part * 10_000) / whole) : null);

  return {
    period: { from, to, months: monthly.map((m) => m.month) },
    count: txns.length,
    duplicatesExcluded: all.length - txns.length,
    raw: {
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
      openingBalance: first && first.balance !== null ? first.balance + first.debit - first.credit : null,
      closingBalance: last?.balance ?? null,
    },
    trueIncome,
    incomeBySource: buckets(ofType(ins, "INCOME"), (t) => t.c.category, (t) => t.credit),
    grossSpending,
    refundsLinked,
    actualSpending,
    refundsUnlinked: byType.in.REFUND - refundsLinked,
    cashback: byType.in.CASHBACK,
    spendingByCategory: buckets(spending, (t) => t.c.category, (t) => t.debit),
    investmentsConfirmed: byType.out.INVESTMENT,
    investmentsByCategory: buckets(ofType(outs, "INVESTMENT"), (t) => t.c.category, (t) => t.debit),
    brokerFunding,
    fromInvestments,
    debtPayments: byType.out.DEBT_PAYMENT,
    debtByCategory: buckets(ofType(outs, "DEBT_PAYMENT"), (t) => t.c.category, (t) => t.debit),
    transfersOut: byType.out.TRANSFER,
    transfersIn: byType.in.TRANSFER,
    transfersOutByCategory: buckets(transfersOut, (t) => t.c.category, (t) => t.debit),
    cashWithdrawals: byType.out.CASH_WITHDRAWAL,
    fees: byType.out.FEE,
    feesByCategory: buckets(ofType(outs, "FEE"), (t) => t.c.category, (t) => t.debit),
    interest: byType.in.INTEREST,
    unknownOut: byType.out.UNKNOWN,
    unknownIn: byType.in.UNKNOWN,
    netCashFlow: moneyIn - moneyOut,
    savingsRateBp: bp(kept, incomeBase),
    investmentRateBp: bp(byType.out.INVESTMENT, incomeBase),
    monthly,
    trends,
    recurring,
    subscriptions: subscriptions(txns, recurring),
    commitments: {
      monthly: commitmentMonthly,
      annual: commitmentAnnual,
      byKind: (() => {
        const m = new Map<string, Bucket>();
        for (const r of recurringOut) {
          const b = m.get(r.kind) ?? { key: r.kind, amount: 0, count: 0 };
          b.amount += r.monthlyEquivalent;
          b.count += 1;
          m.set(r.kind, b);
        }
        return [...m.values()].sort((a, b) => b.amount - a.amount);
      })(),
      shareOfIncomeBp: incomeReliable ? Math.round((commitmentMonthly * 10_000 * monthly.length) / trueIncome) : null,
    },
    feeTxnIds: ofType(outs, "FEE").map((t) => t.id),
    topMerchants: buckets(spending.filter((t) => t.c.counterparty.kind === "merchant" || t.c.counterparty.kind === "institution"), (t) => t.c.counterparty.name, (t) => t.debit).slice(0, 10),
    topPeopleOut: buckets(outs.filter((t) => t.c.counterparty.kind === "person"), (t) => t.c.counterparty.name, (t) => t.debit).slice(0, 10),
    topPeopleIn: buckets(ins.filter((t) => t.c.counterparty.kind === "person"), (t) => t.c.counterparty.name, (t) => t.credit).slice(0, 10),
    largestOut: [...outs].sort((a, b) => b.debit - a.debit).slice(0, 5).map((t) => t.id),
    lowConfidence: txns.filter((t) => t.c.confidence < 0.5).length,
    byType,
    moneyOutParts: [
      { label: "Spending", amount: byType.out.SPENDING },
      { label: "Transfers", amount: byType.out.TRANSFER - brokerFunding },
      { label: "Sent to investment platforms", amount: brokerFunding },
      { label: "Investments", amount: byType.out.INVESTMENT },
      { label: "Debt payments", amount: byType.out.DEBT_PAYMENT },
      { label: "Cash withdrawn", amount: byType.out.CASH_WITHDRAWAL },
      { label: "Fees", amount: byType.out.FEE },
      { label: "Unclassified", amount: byType.out.UNKNOWN },
    ].filter((p) => p.amount > 0),
    moneyInParts: [
      { label: "Income", amount: byType.in.INCOME },
      { label: "Transfers in", amount: byType.in.TRANSFER - fromInvestments },
      { label: "From investment platforms", amount: fromInvestments },
      { label: "Refunds", amount: byType.in.REFUND },
      { label: "Cashback", amount: byType.in.CASHBACK },
      { label: "Interest", amount: byType.in.INTEREST },
      { label: "Unclassified", amount: byType.in.UNKNOWN },
    ].filter((p) => p.amount > 0),
    incomeReliable,
  };
}
