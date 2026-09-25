/**
 * Inflation maths with exact integers: amounts in paise, rates in basis
 * points (6.25% = 625), whole years. Rounded to the paisa (half up) only at
 * the end. No imports, so the tests can run this file directly with Node.
 */

const BP = 10_000n;

/** a ÷ b rounded half up (a, b > 0). */
function divRound(a: bigint, b: bigint): bigint {
  return (2n * a + b) / (2n * b);
}

/** "6.25" → 625; up to 2 decimals, 0 to 100. */
export function toBasisPoints(ratePct: number): number | null {
  const bp = Math.round(ratePct * 100);
  return Number.isFinite(ratePct) && Math.abs(ratePct * 100 - bp) < 1e-6 && bp >= 0 && bp <= 10_000 ? bp : null;
}

/** Cost after `years` of inflation: P × (1 + r)^n. */
export function futureCostPaise(todayPaise: number, rateBp: number, years: number): number {
  const n = BigInt(years);
  return Number(divRound(BigInt(todayPaise) * (BP + BigInt(rateBp)) ** n, BP ** n));
}

/** What an amount received after `years` is worth in today's money: P ÷ (1 + r)^n. */
export function todaysValuePaise(laterPaise: number, rateBp: number, years: number): number {
  const n = BigInt(years);
  return Number(divRound(BigInt(laterPaise) * BP ** n, (BP + BigInt(rateBp)) ** n));
}

/**
 * Real return after inflation, in hundredths of a percent (rounded half away
 * from zero): ((1 + return) ÷ (1 + inflation) − 1) × 100.
 */
export function realReturnBp(returnBp: number, inflationBp: number): number {
  const num = (BP + BigInt(returnBp)) * BP - (BP + BigInt(inflationBp)) * BP; // × 10^4 for bp
  const den = BP + BigInt(inflationBp);
  const negative = num < 0n;
  const q = divRound(negative ? -num : num, den);
  return Number(negative ? -q : q);
}

/** Value at the end of each year 1..n, for the chart. */
export function yearlyPath(amountPaise: number, rateBp: number, years: number, mode: "future" | "today"): number[] {
  return Array.from({ length: years }, (_, i) =>
    mode === "future" ? futureCostPaise(amountPaise, rateBp, i + 1) : todaysValuePaise(amountPaise, rateBp, i + 1),
  );
}
