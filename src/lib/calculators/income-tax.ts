/**
 * Income tax for a resident individual, tax year 2026-27 (FY 2026-27), old vs
 * new regime, on income taxed at normal slab rates. Capital gains and other
 * special-rate income, agricultural income and non-residents are out of scope.
 *
 * Rules (Income-tax Act, 2025, in force from 1 April 2026; Budget 2026 kept the
 * slabs unchanged):
 * - New regime (s.202): 0–4L nil, 4–8L 5%, 8–12L 10%, 12–16L 15%, 16–20L 20%,
 *   20–24L 25%, above 24L 30%. Standard deduction ₹75,000 on salary/pension.
 *   Rebate (s.156(2)): up to ₹60,000 when total income ≤ ₹12 lakh; above that,
 *   tax cannot exceed the income above ₹12 lakh (marginal relief).
 * - Old regime: nil up to ₹2.5L (₹3L at 60–79, ₹5L at 80+), 5% to ₹5L, 20% to
 *   ₹10L, 30% above. Standard deduction ₹50,000. Rebate (s.156(1)) up to
 *   ₹12,500 when total income ≤ ₹5 lakh.
 * - Surcharge: 10% above ₹50L, 15% above ₹1Cr, 25% above ₹2Cr, 37% above ₹5Cr
 *   (new regime capped at 25%), with marginal relief at each threshold.
 * - Health and education cess: 4% of tax plus surcharge.
 * All amounts are rupees. No imports, so Node tests run it directly.
 */

export type AgeBand = "below60" | "60to79" | "80plus";

export type TaxInput = {
  /** Gross salary or pension for the year. */
  salary: number;
  /** Other income taxed at slab rates: interest, rent after its deductions, etc. */
  otherIncome: number;
  age: AgeBand;
  /** Old regime only. */
  deductions80C: number;
  deductions80D: number;
  hraExempt: number;
  homeLoanInterest: number;
  npsExtra: number;
  otherDeductions: number;
};

export type RegimeResult = {
  grossIncome: number;
  standardDeduction: number;
  otherDeductions: number;
  taxableIncome: number;
  slabTax: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
};

export const LIMITS = {
  sec80C: 150000,
  homeLoanInterest: 200000,
  npsExtra: 50000,
  stdNew: 75000,
  stdOld: 50000,
} as const;

type Slab = readonly [upTo: number, rate: number];

const NEW_SLABS: readonly Slab[] = [
  [400000, 0],
  [800000, 5],
  [1200000, 10],
  [1600000, 15],
  [2000000, 20],
  [2400000, 25],
  [Infinity, 30],
];

function oldSlabs(age: AgeBand): readonly Slab[] {
  const nil = age === "80plus" ? 500000 : age === "60to79" ? 300000 : 250000;
  const slabs: Slab[] = [[nil, 0]];
  if (nil < 500000) slabs.push([500000, 5]);
  slabs.push([1000000, 20], [Infinity, 30]);
  return slabs;
}

export function slabTax(income: number, slabs: readonly Slab[]): number {
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of slabs) {
    if (income <= from) break;
    tax += ((Math.min(income, upTo) - from) * rate) / 100;
    from = upTo;
  }
  return tax;
}

/** Surcharge thresholds and the rate above each one. */
const SURCHARGE: readonly (readonly [threshold: number, rate: number])[] = [
  [5000000, 10],
  [10000000, 15],
  [20000000, 25],
  [50000000, 37],
];

/**
 * Surcharge with marginal relief: tax + surcharge may not exceed the tax and
 * surcharge at the threshold just crossed plus the income above it.
 */
export function surchargeOn(income: number, tax: number, taxAt: (income: number) => number, cap: number): number {
  let k = -1;
  for (let i = 0; i < SURCHARGE.length; i += 1) if (income > SURCHARGE[i]![0]) k = i;
  if (k < 0) return 0;
  const threshold = SURCHARGE[k]![0];
  const rate = Math.min(SURCHARGE[k]![1], cap);
  const prevRate = k === 0 ? 0 : Math.min(SURCHARGE[k - 1]![1], cap);
  const full = (tax * rate) / 100;
  const maxTotal = taxAt(threshold) * (1 + prevRate / 100) + (income - threshold);
  return Math.max(0, Math.min(full, maxTotal - tax));
}

const clamp = (v: number, max = Infinity) => Math.max(0, Math.min(Number.isFinite(v) ? v : 0, max));

export function newRegime(input: TaxInput): RegimeResult {
  const salary = clamp(input.salary);
  const other = clamp(input.otherIncome);
  const grossIncome = salary + other;
  const standardDeduction = Math.min(LIMITS.stdNew, salary);
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);
  const slabTaxAmt = slabTax(taxableIncome, NEW_SLABS);
  let rebate = 0;
  if (taxableIncome <= 1200000) rebate = Math.min(slabTaxAmt, 60000);
  else rebate = Math.max(0, slabTaxAmt - (taxableIncome - 1200000));
  const afterRebate = slabTaxAmt - rebate;
  const surcharge = surchargeOn(taxableIncome, afterRebate, (i) => slabTax(i, NEW_SLABS), 25);
  const cess = ((afterRebate + surcharge) * 4) / 100;
  return finish({ grossIncome, standardDeduction, otherDeductions: 0, taxableIncome, slabTax: slabTaxAmt, rebate, surcharge, cess });
}

export function oldRegime(input: TaxInput): RegimeResult {
  const salary = clamp(input.salary);
  const other = clamp(input.otherIncome);
  const grossIncome = salary + other;
  const standardDeduction = Math.min(LIMITS.stdOld, salary);
  const hra = Math.min(clamp(input.hraExempt), salary);
  const otherDeductions =
    hra +
    clamp(input.deductions80C, LIMITS.sec80C) +
    clamp(input.deductions80D) +
    clamp(input.homeLoanInterest, LIMITS.homeLoanInterest) +
    clamp(input.npsExtra, LIMITS.npsExtra) +
    clamp(input.otherDeductions);
  const taxableIncome = Math.max(0, grossIncome - standardDeduction - otherDeductions);
  const slabs = oldSlabs(input.age);
  const slabTaxAmt = slabTax(taxableIncome, slabs);
  const rebate = taxableIncome <= 500000 ? Math.min(slabTaxAmt, 12500) : 0;
  const afterRebate = slabTaxAmt - rebate;
  const surcharge = surchargeOn(taxableIncome, afterRebate, (i) => slabTax(i, slabs), 37);
  const cess = ((afterRebate + surcharge) * 4) / 100;
  return finish({ grossIncome, standardDeduction, otherDeductions, taxableIncome, slabTax: slabTaxAmt, rebate, surcharge, cess });
}

function finish(r: Omit<RegimeResult, "totalTax">): RegimeResult {
  const round = (v: number) => Math.round(v);
  const out = {
    grossIncome: round(r.grossIncome),
    standardDeduction: round(r.standardDeduction),
    otherDeductions: round(r.otherDeductions),
    taxableIncome: round(r.taxableIncome),
    slabTax: round(r.slabTax),
    rebate: round(r.rebate),
    surcharge: round(r.surcharge),
    cess: round(r.cess),
  };
  return { ...out, totalTax: Math.max(0, out.slabTax - out.rebate + out.surcharge + out.cess) };
}

export function compareRegimes(input: TaxInput) {
  const n = newRegime(input);
  const o = oldRegime(input);
  const better: "new" | "old" | "same" = n.totalTax < o.totalTax ? "new" : o.totalTax < n.totalTax ? "old" : "same";
  return { newRegime: n, oldRegime: o, better, saving: Math.abs(n.totalTax - o.totalTax) };
}
