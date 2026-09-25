import { test } from "node:test";
import assert from "node:assert/strict";

import { calculateEmi, calculateSip, calculateSwp } from "./finance.ts";
import { formatRupees, formatShort } from "./format.ts";

/** Compares at the paisa, the precision the calculators display. */
const paise = (value: number) => formatRupees(value);

test("EMI: ₹10,00,000 at 8.5% for 20 years", () => {
  const r = calculateEmi({ principal: 1000000, annualRatePct: 8.5, months: 240 });
  assert.equal(paise(r.emi), "₹8,678.23");
  assert.equal(paise(r.totalInterest), "₹10,82,775.76");
  assert.equal(paise(r.totalPayable), "₹20,82,775.76");
  assert.equal(r.schedule.length, 20);
  assert.equal(r.schedule[19]?.balance, 0);
  const principalRepaid = r.schedule.reduce((sum, row) => sum + row.principalPaid, 0);
  assert.equal(paise(principalRepaid), "₹10,00,000.00");
});

test("EMI: ₹1,20,000 at 0% for 1 year", () => {
  const r = calculateEmi({ principal: 120000, annualRatePct: 0, months: 12 });
  assert.equal(paise(r.emi), "₹10,000.00");
  assert.equal(paise(r.totalInterest), "₹0.00");
});

test("EMI: tenure in months that is not a whole number of years", () => {
  const r = calculateEmi({ principal: 500000, annualRatePct: 10, months: 30 });
  assert.equal(r.schedule.length, 3);
  assert.equal(r.schedule[2]?.balance, 0);
});

test("SIP: ₹5,000/month at 12% for 10 years", () => {
  const r = calculateSip({ monthlyInvestment: 5000, annualReturnPct: 12, years: 10 });
  assert.equal(paise(r.invested), "₹6,00,000.00");
  assert.equal(paise(r.value), "₹11,61,695.38");
  assert.equal(paise(r.returns), "₹5,61,695.38");
  assert.equal(r.yearly.length, 10);
});

test("SIP: a 0% step-up gives the same result as the formula", () => {
  const withZero = calculateSip({ monthlyInvestment: 5000, annualReturnPct: 12, years: 10, stepUpPct: 0 });
  const tiny = calculateSip({ monthlyInvestment: 5000, annualReturnPct: 12, years: 10, stepUpPct: 1e-12 });
  assert.equal(paise(withZero.value), paise(tiny.value));
});

test("SIP: a 10% step-up raises the amount every 12 months", () => {
  const r = calculateSip({ monthlyInvestment: 1000, annualReturnPct: 12, years: 2, stepUpPct: 10 });
  assert.equal(paise(r.invested), "₹25,200.00"); // 12 × 1,000 + 12 × 1,100
});

test("SWP: ₹10,00,000, ₹10,000/month, 8%, 10 years", () => {
  const r = calculateSwp({ corpus: 1000000, monthlyWithdrawal: 10000, annualReturnPct: 8, years: 10 });
  assert.equal(paise(r.totalWithdrawn), "₹12,00,000.00");
  assert.equal(paise(r.finalValue), "₹3,77,983.48");
  assert.equal(r.runsOutMonth, null);
});

test("SWP: ₹10,00,000, ₹15,000/month, 8%, 10 years runs out in month 88", () => {
  const r = calculateSwp({ corpus: 1000000, monthlyWithdrawal: 15000, annualReturnPct: 8, years: 10 });
  assert.equal(r.runsOutMonth, 88);
  assert.equal(paise(r.totalWithdrawn), "₹13,15,005.94");
  assert.equal(r.finalValue, 0);
  for (const row of r.yearly) assert.ok(row.balance >= 0);
});

test("Formatting: Indian grouping, short form, and no NaN on screen", () => {
  assert.equal(formatRupees(1161695.38, false), "₹11,61,695");
  assert.equal(formatShort(1161695.38), "₹11.6 lakh");
  assert.equal(formatShort(12500000), "₹1.3 crore");
  assert.equal(formatShort(99999), null);
  assert.equal(formatRupees(Number.NaN), "—");
  assert.equal(formatRupees(Number.POSITIVE_INFINITY), "—");
});
