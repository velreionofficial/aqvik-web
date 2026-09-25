import { test } from "node:test";
import assert from "node:assert/strict";

import { addMonths, annualPercentText, calculateByaj, monthsAndDays, validateByaj, type ByajInput } from "./byaj.ts";

const base: ByajInput = {
  principalPaise: 50_000_00,
  rateKind: "sainkda",
  rateHundredths: 200,
  start: "2026-01-01",
  end: "2026-08-15",
  counting: "months",
  compounding: "simple",
  payments: [],
};

test("Rate forms: 2 rupaye sainkda = 24%, ₹15 per ₹1,000 a month = 18%, 1.25 sainkda = 15%", () => {
  assert.equal(annualPercentText("sainkda", 200), "24");
  assert.equal(annualPercentText("per1000", 1500), "18");
  assert.equal(annualPercentText("sainkda", 125), "15");
  assert.equal(annualPercentText("annual", 1250), "12.5");
});

test("Months and days, with month-end dates", () => {
  assert.deepEqual(monthsAndDays("2026-01-01", "2026-08-15"), { months: 7, days: 14 });
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.deepEqual(monthsAndDays("2026-01-31", "2026-02-28"), { months: 1, days: 0 });
  assert.deepEqual(monthsAndDays("2026-01-15", "2026-01-14"), { months: 0, days: -1 });
});

test("₹50,000 at 2 rupaye sainkda, 1 Jan to 15 Aug 2026: ₹7,466.67 (months + days)", () => {
  const r = calculateByaj(base);
  assert.equal(r.duration, "7 months 14 days");
  assert.equal(r.totalInterestPaise, 7_466_67);
  assert.equal(r.totalDuePaise, 57_466_67);
});

test("The same by exact days: 226 days, ₹7,430.14", () => {
  const r = calculateByaj({ ...base, counting: "days" });
  assert.equal(r.duration, "226 days");
  assert.equal(r.totalInterestPaise, 7_430_14);
});

test("Two years: simple ₹24,000; byaj par byaj yearly ₹26,880", () => {
  const two = { ...base, end: "2028-01-01" };
  assert.equal(calculateByaj(two).totalInterestPaise, 24_000_00);
  const c = calculateByaj({ ...two, compounding: "yearly" });
  assert.equal(c.totalInterestPaise, 26_880_00);
  assert.equal(c.rows[0]!.kind, "added");
  assert.equal(c.rows[0]!.principalPaise, 62_000_00);
});

test("Repayment of ₹10,000 on 1 Apr: interest first, rest reduces the principal", () => {
  const r = calculateByaj({ ...base, payments: [{ date: "2026-04-01", amountPaise: 10_000_00 }] });
  const pay = r.rows[0]!;
  assert.equal(pay.period, "3 months 0 days");
  assert.equal(pay.interestPaise, 3_000_00);
  assert.equal(pay.toInterestPaise, 3_000_00);
  assert.equal(pay.toPrincipalPaise, 7_000_00);
  assert.equal(pay.principalPaise, 43_000_00);
  const end = r.rows[1]!;
  assert.equal(end.period, "4 months 14 days");
  assert.equal(end.interestPaise, 3_841_33);
  assert.equal(r.totalInterestPaise, 6_841_33);
  assert.equal(r.totalDuePaise, 46_841_33);
  assert.equal(r.totalPaidPaise, 10_000_00);
});

test("A small repayment only pays part of the interest", () => {
  const r = calculateByaj({ ...base, payments: [{ date: "2026-04-01", amountPaise: 1_000_00 }] });
  assert.equal(r.rows[0]!.interestDuePaise, 2_000_00);
  assert.equal(r.rows[0]!.principalPaise, 50_000_00);
  assert.equal(r.totalDuePaise, 50_000_00 + 2_000_00 + 4_466_67);
});

test("Paying more than is owed is reported, not carried", () => {
  const r = calculateByaj({ ...base, payments: [{ date: "2026-04-01", amountPaise: 60_000_00 }] });
  assert.equal(r.excessPaise, 7_000_00);
  assert.equal(r.totalDuePaise, 0);
});

test("Validation", () => {
  assert.deepEqual(validateByaj(base), []);
  assert.ok(validateByaj({ ...base, end: "2025-12-31" }).length);
  assert.ok(validateByaj({ ...base, payments: [{ date: "2026-09-01", amountPaise: 100 }] }).length);
  assert.ok(validateByaj({ ...base, rateHundredths: 2890 }).length);
  assert.equal(calculateByaj(base).overflow, false);
  assert.equal(calculateByaj({ ...base, rateHundredths: 1000, compounding: "monthly", end: "2076-01-01" }).overflow, true);
});
