/**
 * Fixed and recurring deposit maturity, pre-tax. Rounded to the paisa only at
 * the end. No imports, so the tests can run this file directly with Node.
 */

export type Compounding = 1 | 2 | 4 | 12;

/**
 * Cumulative FD: whole compounding periods compound; leftover months earn
 * simple interest. Maturity = P × (1 + rate/(100f))^periods ×
 * (1 + rate/100 × leftover months/12).
 */
export function fdMaturityPaise(principalPaise: number, ratePct: number, months: number, f: Compounding): number {
  const monthsPerPeriod = 12 / f;
  const periods = Math.floor(months / monthsPerPeriod);
  const leftover = months - periods * monthsPerPeriod;
  const value =
    principalPaise * Math.pow(1 + ratePct / (100 * f), periods) * (1 + (ratePct / 100) * (leftover / 12));
  return Math.round(value);
}

/**
 * RD with quarterly compounding: the deposit made at the start of month k of n
 * grows for (n − k + 1) months: deposit × (1 + rate/400)^((n − k + 1)/3).
 */
export function rdMaturityPaise(depositPaise: number, ratePct: number, months: number): number {
  const i = ratePct / 400;
  let total = 0;
  for (let k = 1; k <= months; k += 1) {
    total += depositPaise * Math.pow(1 + i, (months - k + 1) / 3);
  }
  return Math.round(total);
}
