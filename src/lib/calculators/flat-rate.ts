/**
 * Flat-rate loans and their equivalent reducing-balance rate. A flat rate
 * charges interest on the full loan for the whole tenure; the equivalent rate
 * is the annual rate (monthly rests, as in the EMI calculator) at which the
 * same EMI would repay the same amount. No imports, so Node tests run it.
 */

export type FlatLoan = { principalPaise: number; flatRatePct: number; months: number; feePaise?: number };

export type FlatResult = {
  interestPaise: number;
  totalPaise: number;
  /** EMI rounded to the paisa for display; the rate uses the exact EMI. */
  emiPaise: number;
  /** Equivalent reducing-balance annual rate, in % (unrounded). */
  equivalentRatePct: number;
  /** The same, counting the fee as money not received. Null when there is no fee. */
  withFeeRatePct: number | null;
};

/** Present value of `months` payments of `emi` at monthly rate r. */
function presentValue(emi: number, r: number, months: number): number {
  return r === 0 ? emi * months : (emi * (1 - Math.pow(1 + r, -months))) / r;
}

/** Monthly rate r (as annual % = r × 12 × 100) at which `months` EMIs repay `amount`. */
export function impliedAnnualRatePct(amount: number, emi: number, months: number): number {
  if (emi * months <= amount) return 0;
  let lo = 0;
  let hi = 1; // 100% a month
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (presentValue(emi, mid, months) > amount) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 1200;
}

export function flatLoan({ principalPaise, flatRatePct, months, feePaise = 0 }: FlatLoan): FlatResult {
  // Interest = P × rate × months ÷ 1200, rounded to the paisa.
  const interestPaise = Math.round((principalPaise * flatRatePct * months) / 1200);
  const totalPaise = principalPaise + interestPaise;
  const emi = totalPaise / months;
  return {
    interestPaise,
    totalPaise,
    emiPaise: Math.round(emi),
    equivalentRatePct: impliedAnnualRatePct(principalPaise, emi, months),
    withFeeRatePct: feePaise > 0 && feePaise < principalPaise ? impliedAnnualRatePct(principalPaise - feePaise, emi, months) : null,
  };
}

/** Round half up to 2 decimals for display: 21.4571 → "21.46". */
export function formatRate(pct: number): string {
  return (Math.round(pct * 100 + 1e-9) / 100).toFixed(2);
}
