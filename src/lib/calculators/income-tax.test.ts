import { test } from "node:test";
import assert from "node:assert/strict";

import { compareRegimes, newRegime, oldRegime, type TaxInput } from "./income-tax.ts";

const base: TaxInput = {
  salary: 0,
  otherIncome: 0,
  age: "below60",
  deductions80C: 0,
  deductions80D: 0,
  hraExempt: 0,
  homeLoanInterest: 0,
  npsExtra: 0,
  otherDeductions: 0,
};

test("New regime: ₹12.75 lakh salary pays nothing (₹75,000 standard deduction, ₹60,000 rebate)", () => {
  const r = newRegime({ ...base, salary: 1275000 });
  assert.equal(r.taxableIncome, 1200000);
  assert.equal(r.slabTax, 60000);
  assert.equal(r.rebate, 60000);
  assert.equal(r.totalTax, 0);
});

test("New regime marginal relief: ₹13 lakh salary pays only the ₹25,000 above ₹12 lakh, plus cess", () => {
  const r = newRegime({ ...base, salary: 1300000 });
  assert.equal(r.taxableIncome, 1225000);
  assert.equal(r.slabTax, 63750);
  assert.equal(r.rebate, 38750);
  assert.equal(r.cess, 1000);
  assert.equal(r.totalTax, 26000);
});

test("New regime: ₹20 lakh taxable is ₹2,00,000 + 4% cess", () => {
  const r = newRegime({ ...base, salary: 2075000 });
  assert.equal(r.taxableIncome, 2000000);
  assert.equal(r.slabTax, 200000);
  assert.equal(r.totalTax, 208000);
});

test("Old regime below 60: ₹10 lakh taxable is ₹1,12,500 + cess", () => {
  const r = oldRegime({ ...base, salary: 1050000 });
  assert.equal(r.taxableIncome, 1000000);
  assert.equal(r.slabTax, 112500);
  assert.equal(r.totalTax, 117000);
});

test("Old regime rebate: ₹5 lakh taxable pays nothing", () => {
  const r = oldRegime({ ...base, salary: 550000 });
  assert.equal(r.taxableIncome, 500000);
  assert.equal(r.rebate, 12500);
  assert.equal(r.totalTax, 0);
});

test("Old regime age bands: ₹6 lakh at 60–79 and at 80+", () => {
  assert.equal(oldRegime({ ...base, otherIncome: 600000, age: "60to79" }).totalTax, 31200);
  assert.equal(oldRegime({ ...base, otherIncome: 600000, age: "80plus" }).totalTax, 20800);
});

test("Old regime caps: 80C ₹1.5 lakh, home-loan interest ₹2 lakh, extra NPS ₹50,000", () => {
  const r = oldRegime({ ...base, salary: 1550000, deductions80C: 200000, homeLoanInterest: 300000, npsExtra: 60000 });
  assert.equal(r.otherDeductions, 400000);
  assert.equal(r.taxableIncome, 1100000);
  assert.equal(r.slabTax, 142500);
  assert.equal(r.totalTax, 148200);
});

test("Surcharge marginal relief just above ₹50 lakh (new regime)", () => {
  const r = newRegime({ ...base, otherIncome: 5010000 });
  assert.equal(r.slabTax, 1083000);
  assert.equal(r.surcharge, 7000);
  assert.equal(r.cess, 43600);
  assert.equal(r.totalTax, 1133600);
});

test("Full 10% surcharge at ₹60 lakh (new regime)", () => {
  const r = newRegime({ ...base, otherIncome: 6000000 });
  assert.equal(r.slabTax, 1380000);
  assert.equal(r.surcharge, 138000);
  assert.equal(r.totalTax, 1578720);
});

test("New regime surcharge is capped at 25%; old regime goes to 37% above ₹5 crore", () => {
  const n = newRegime({ ...base, otherIncome: 60000000 });
  assert.equal(n.surcharge, Math.round(n.slabTax * 0.25));
  const o = oldRegime({ ...base, otherIncome: 60000000 });
  assert.equal(o.surcharge, Math.round(o.slabTax * 0.37));
});

test("Comparison picks the lower tax and the difference", () => {
  const c = compareRegimes({ ...base, salary: 1275000 });
  assert.equal(c.newRegime.totalTax, 0);
  assert.equal(c.oldRegime.totalTax, 187200);
  assert.equal(c.better, "new");
  assert.equal(c.saving, 187200);
});

test("Bad or negative inputs are treated as zero", () => {
  const r = newRegime({ ...base, salary: -5, otherIncome: Number.NaN });
  assert.equal(r.totalTax, 0);
});
