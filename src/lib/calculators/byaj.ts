/**
 * Udhaar / byaj hisaab: interest on a private loan between two dates, with
 * rates in the local forms ("2 rupaye sainkda" = ₹2 per ₹100 per month),
 * simple or compound interest, and part repayments. Exact integer maths;
 * each period's interest is rounded to the paisa (half up) when it is booked,
 * so every row of the ledger adds up. No imports, so Node tests run it.
 */

export type RateKind = "sainkda" | "annual" | "per1000";
export type Counting = "months" | "days";
export type Compounding = "simple" | "yearly" | "half" | "monthly";

export type ByajInput = {
  principalPaise: number;
  rateKind: RateKind;
  /** The rate as typed, in hundredths: "2" → 200, "1.5" → 150. */
  rateHundredths: number;
  start: string; // YYYY-MM-DD
  end: string;
  counting: Counting;
  compounding: Compounding;
  payments: { date: string; amountPaise: number }[];
};

export type LedgerRow = {
  date: string;
  kind: "payment" | "added" | "end";
  /** "3 months 0 days" or "90 days" since the previous row. */
  period: string;
  interestPaise: number;
  paidPaise: number;
  toInterestPaise: number;
  toPrincipalPaise: number;
  principalPaise: number;
  interestDuePaise: number;
};

export type ByajResult = {
  rows: LedgerRow[];
  totalInterestPaise: number;
  totalPaidPaise: number;
  principalLeftPaise: number;
  interestLeftPaise: number;
  totalDuePaise: number;
  /** Paid more than was owed on some date; the extra is not carried. */
  excessPaise: number;
  duration: string;
  /** The amounts grew beyond what can be shown exactly (about ₹90 lakh crore). */
  overflow: boolean;
};

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/** Annual rate as an exact fraction of a percent: { n, d } with annual % = n ÷ d. */
export function annualPercent(kind: RateKind, hundredths: number): { n: bigint; d: bigint } {
  const h = BigInt(hundredths);
  if (kind === "sainkda") return { n: 12n * h, d: 100n }; // ₹h/100 per ₹100 per month × 12
  if (kind === "per1000") return { n: 12n * h, d: 1000n }; // ₹h/100 per ₹1,000 per month × 12 ÷ 10
  return { n: h, d: 100n };
}

/** "24", "18", "12.6" — annual %, up to 2 decimals, trailing zeros removed. */
export function annualPercentText(kind: RateKind, hundredths: number): string {
  const { n, d } = annualPercent(kind, hundredths);
  const scaled = (n * 100n * 2n + d) / (2n * d);
  const whole = scaled / 100n;
  const frac = (scaled % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

const MS_DAY = 86_400_000;
const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
};
const fromUtc = (t: number) => new Date(t).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / MS_DAY);

/** Add months, keeping the day or using the month's last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const index = y! * 12 + (m! - 1) + months;
  const year = Math.floor(index / 12);
  const month = index % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return fromUtc(Date.UTC(year, month, Math.min(d!, last)));
}

/** Whole months and leftover days from a to b (b ≥ a). */
export function monthsAndDays(a: string, b: string): { months: number; days: number } {
  const [y1, m1] = a.split("-").map(Number);
  const [y2, m2] = b.split("-").map(Number);
  let months = (y2! - y1!) * 12 + (m2! - m1!);
  while (months > 0 && addMonths(a, months) > b) months -= 1;
  return { months, days: daysBetween(addMonths(a, months), b) };
}

function periodText(a: string, b: string, counting: Counting): string {
  if (counting === "days") {
    const n = daysBetween(a, b);
    return `${n} day${n === 1 ? "" : "s"}`;
  }
  const { months, days } = monthsAndDays(a, b);
  return `${months} month${months === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Interest on `principal` from a to b, rounded to the paisa (half up).
 * Months + days: principal × annual% ÷ 100 × (months + days ÷ 30) ÷ 12.
 * Exact days: principal × annual% ÷ 100 × days ÷ 365.
 */
function interestFor(principal: bigint, rate: { n: bigint; d: bigint }, a: string, b: string, counting: Counting): bigint {
  if (principal <= 0n || b <= a) return 0n;
  let num: bigint;
  let den: bigint;
  if (counting === "days") {
    num = principal * rate.n * BigInt(daysBetween(a, b));
    den = rate.d * 100n * 365n;
  } else {
    const { months, days } = monthsAndDays(a, b);
    num = principal * rate.n * BigInt(months * 30 + days);
    den = rate.d * 100n * 30n * 12n;
  }
  return (2n * num + den) / (2n * den);
}

const STEP: Record<Exclude<Compounding, "simple">, number> = { yearly: 12, half: 6, monthly: 1 };

export function validateByaj(input: ByajInput): string[] {
  const errors: string[] = [];
  if (input.principalPaise <= 0) errors.push("Enter the amount lent.");
  if (input.rateHundredths < 0) errors.push("Enter a rate of 0 or more.");
  const maxRate = input.rateKind === "sainkda" ? 10_00 : input.rateKind === "per1000" ? 100_00 : 120_00;
  if (input.rateHundredths > maxRate) errors.push("That rate is above 120% a year; check the figure and the rate type.");
  if (input.principalPaise > 100_00_00_000_00) errors.push("Keep the amount within ₹100 crore.");
  if (!input.start || !input.end) errors.push("Enter both dates.");
  else if (input.end < input.start) errors.push("The end date must be on or after the start date.");
  else if (daysBetween(input.start, input.end) > 50 * 366) errors.push("Keep the period within 50 years.");
  input.payments.forEach((p, i) => {
    if (!p.date || p.amountPaise <= 0) errors.push(`Repayment ${i + 1}: enter a date and an amount.`);
    else if (p.date <= input.start || p.date > input.end) errors.push(`Repayment ${i + 1}: the date must be after the start date and not after the end date.`);
  });
  return errors;
}

export function calculateByaj(input: ByajInput): ByajResult {
  const rate = annualPercent(input.rateKind, input.rateHundredths);
  // Events: repayments, and dates when interest is added to the principal.
  type Event = { date: string; kind: "payment" | "added"; amount: bigint };
  const events: Event[] = input.payments
    .map((p) => ({ date: p.date, kind: "payment" as const, amount: BigInt(p.amountPaise) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (input.compounding !== "simple") {
    const step = STEP[input.compounding];
    for (let k = 1; ; k += 1) {
      const date = addMonths(input.start, k * step);
      if (date >= input.end) break;
      events.push({ date, kind: "added", amount: 0n });
    }
    // On the same date, add interest first, then apply the repayment.
    events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.kind === "added" ? -1 : b.kind === "added" ? 1 : 0));
  }

  let principal = BigInt(input.principalPaise);
  let due = 0n; // interest booked but not yet paid or added
  let totalInterest = 0n;
  let totalPaid = 0n;
  let excess = 0n;
  let last = input.start;
  const rows: LedgerRow[] = [];

  const accrue = (date: string) => {
    const i = interestFor(principal, rate, last, date, input.counting);
    const period = periodText(last, date, input.counting);
    due += i;
    totalInterest += i;
    last = date;
    return { i, period };
  };

  for (const e of events) {
    const { i, period } = accrue(e.date);
    if (e.kind === "added") {
      principal += due;
      due = 0n;
      rows.push({ date: e.date, kind: "added", period, interestPaise: Number(i), paidPaise: 0, toInterestPaise: 0, toPrincipalPaise: 0, principalPaise: Number(principal), interestDuePaise: 0 });
    } else {
      const toInterest = e.amount < due ? e.amount : due;
      due -= toInterest;
      let toPrincipal = e.amount - toInterest;
      if (toPrincipal > principal) {
        excess += toPrincipal - principal;
        toPrincipal = principal;
      }
      principal -= toPrincipal;
      totalPaid += e.amount;
      rows.push({ date: e.date, kind: "payment", period, interestPaise: Number(i), paidPaise: Number(e.amount), toInterestPaise: Number(toInterest), toPrincipalPaise: Number(toPrincipal), principalPaise: Number(principal), interestDuePaise: Number(due) });
    }
  }
  const { i, period } = accrue(input.end);
  rows.push({ date: input.end, kind: "end", period, interestPaise: Number(i), paidPaise: 0, toInterestPaise: 0, toPrincipalPaise: 0, principalPaise: Number(principal), interestDuePaise: Number(due) });

  return {
    rows,
    overflow: principal + due + totalInterest > MAX_SAFE,
    totalInterestPaise: Number(totalInterest),
    totalPaidPaise: Number(totalPaid),
    principalLeftPaise: Number(principal),
    interestLeftPaise: Number(due),
    totalDuePaise: Number(principal + due),
    excessPaise: Number(excess),
    duration: periodText(input.start, input.end, input.counting),
  };
}
