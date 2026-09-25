/**
 * Maths for the EMI, SIP and SWP calculators.
 *
 * Pure functions only: no UI, no formatting, no rounding. Values are carried
 * at full precision and rounded only when displayed, so totals always agree
 * with the headline figures (for example, total interest is derived from the
 * unrounded EMI, not from the EMI rounded to the paisa).
 *
 * Keep this file free of imports so the tests can run it directly with Node.
 */

/** Monthly rate as a fraction, from an annual percentage. */
export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 12 / 100;
}

/** Treats values within a tiny epsilon of zero as zero (floating-point dust). */
function clean(value: number): number {
  return Math.abs(value) < 1e-6 ? 0 : value;
}

/* ------------------------------------------------------------------ EMI -- */

export type EmiInput = {
  principal: number;
  annualRatePct: number;
  months: number;
};

export type EmiYearRow = {
  year: number;
  principalPaid: number;
  interestPaid: number;
  /** Outstanding balance at the end of this year. */
  balance: number;
};

export type EmiResult = {
  emi: number;
  totalInterest: number;
  totalPayable: number;
  schedule: EmiYearRow[];
};

/**
 * EMI = P × r × (1 + r)^n / ((1 + r)^n − 1), with r the monthly rate and n
 * the number of months. At 0% the loan is simply split evenly: P / n.
 */
export function emiAmount({ principal, annualRatePct, months }: EmiInput): number {
  const r = monthlyRate(annualRatePct);
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

export function calculateEmi(input: EmiInput): EmiResult {
  const { principal, annualRatePct, months } = input;
  const emi = emiAmount(input);
  const totalPayable = emi * months;
  const r = monthlyRate(annualRatePct);

  const schedule: EmiYearRow[] = [];
  let balance = principal;
  let principalPaid = 0;
  let interestPaid = 0;

  for (let month = 1; month <= months; month += 1) {
    const interest = balance * r;
    const towardsPrincipal = emi - interest;
    balance -= towardsPrincipal;
    interestPaid += interest;
    principalPaid += towardsPrincipal;

    if (month % 12 === 0 || month === months) {
      schedule.push({
        year: Math.ceil(month / 12),
        principalPaid,
        interestPaid,
        balance: Math.max(0, clean(balance)),
      });
      principalPaid = 0;
      interestPaid = 0;
    }
  }

  return { emi, totalInterest: totalPayable - principal, totalPayable, schedule };
}

/* ------------------------------------------------------------------ SIP -- */

export type SipInput = {
  monthlyInvestment: number;
  annualReturnPct: number;
  years: number;
  /** Raise the monthly amount by this percentage every 12 months. Optional. */
  stepUpPct?: number;
};

export type SipYearRow = {
  year: number;
  invested: number;
  value: number;
};

export type SipResult = {
  invested: number;
  value: number;
  returns: number;
  yearly: SipYearRow[];
};

/**
 * Investment at the start of each month. Without a step-up this equals
 * P × [((1 + i)^n − 1) / i] × (1 + i); with a step-up the monthly amount rises
 * every 12 months, so it is simulated month by month.
 */
export function calculateSip({
  monthlyInvestment,
  annualReturnPct,
  years,
  stepUpPct = 0,
}: SipInput): SipResult {
  const i = monthlyRate(annualReturnPct);
  const months = years * 12;
  const yearly: SipYearRow[] = [];

  let amount = monthlyInvestment;
  let invested = 0;
  let value = 0;

  for (let month = 1; month <= months; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) {
      amount *= 1 + stepUpPct / 100;
    }
    invested += amount;
    value = (value + amount) * (1 + i);

    if (month % 12 === 0) {
      yearly.push({ year: month / 12, invested, value });
    }
  }

  // Without a step-up, report the closed-form value so the headline figure is
  // exactly the textbook formula rather than an accumulated sum.
  if (stepUpPct === 0) {
    value =
      i === 0
        ? monthlyInvestment * months
        : monthlyInvestment * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
    const last = yearly[yearly.length - 1];
    if (last) last.value = value;
  }

  return { invested, value, returns: value - invested, yearly };
}

/* ------------------------------------------------------------------ SWP -- */

export type SwpInput = {
  corpus: number;
  monthlyWithdrawal: number;
  annualReturnPct: number;
  years: number;
};

export type SwpYearRow = {
  year: number;
  withdrawn: number;
  /** Balance at the end of this year (0 once the corpus has run out). */
  balance: number;
};

export type SwpResult = {
  totalWithdrawn: number;
  finalValue: number;
  /** Month (1-based) in which the corpus ran out, or null if it lasted. */
  runsOutMonth: number | null;
  yearly: SwpYearRow[];
};

/**
 * Month by month: withdraw first (never more than the balance), then grow what
 * is left by the monthly rate.
 */
export function calculateSwp({
  corpus,
  monthlyWithdrawal,
  annualReturnPct,
  years,
}: SwpInput): SwpResult {
  const i = monthlyRate(annualReturnPct);
  const months = years * 12;
  const yearly: SwpYearRow[] = [];

  let balance = corpus;
  let totalWithdrawn = 0;
  let withdrawnThisYear = 0;
  let runsOutMonth: number | null = null;

  for (let month = 1; month <= months; month += 1) {
    if (runsOutMonth === null) {
      const withdrawal = Math.min(monthlyWithdrawal, balance);
      balance = clean(balance - withdrawal);
      totalWithdrawn += withdrawal;
      withdrawnThisYear += withdrawal;

      if (balance <= 0) {
        balance = 0;
        runsOutMonth = month;
      } else {
        balance *= 1 + i;
      }
    }

    if (month % 12 === 0) {
      yearly.push({ year: month / 12, withdrawn: withdrawnThisYear, balance });
      withdrawnThisYear = 0;
    }
  }

  return { totalWithdrawn, finalValue: balance, runsOutMonth, yearly };
}
