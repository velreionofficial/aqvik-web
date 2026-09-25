import { test } from "node:test";
import assert from "node:assert/strict";

import { flatLoan, formatRate } from "./flat-rate.ts";
import { planGoal } from "./goal.ts";

const L = 1_00_000_00;

test("Flat 12% for 12 months on ₹1,00,000: EMI ₹9,333.33, equivalent 21.46%", () => {
  const r = flatLoan({ principalPaise: L, flatRatePct: 12, months: 12 });
  assert.equal(r.interestPaise, 12_000_00);
  assert.equal(r.totalPaise, 1_12_000_00);
  assert.equal(r.emiPaise, 9_333_33);
  assert.equal(formatRate(r.equivalentRatePct), "21.46");
  assert.equal(r.withFeeRatePct, null);
});

test("Flat 10% for 24 months is 18.16%; 14% for 36 months is 24.40%", () => {
  const a = flatLoan({ principalPaise: L, flatRatePct: 10, months: 24 });
  assert.equal(a.emiPaise, 5_000_00);
  assert.equal(formatRate(a.equivalentRatePct), "18.16");
  assert.equal(formatRate(flatLoan({ principalPaise: L, flatRatePct: 14, months: 36 }).equivalentRatePct), "24.40");
});

test("'0% EMI' with a ₹2,000 fee over 12 months costs 3.75% a year", () => {
  const r = flatLoan({ principalPaise: L, flatRatePct: 0, months: 12, feePaise: 2_000_00 });
  assert.equal(r.interestPaise, 0);
  assert.equal(formatRate(r.equivalentRatePct), "0.00");
  assert.equal(formatRate(r.withFeeRatePct!), "3.75");
});

test("Flat 12% for 12 months with a ₹1,000 fee is 23.41%", () => {
  const r = flatLoan({ principalPaise: L, flatRatePct: 12, months: 12, feePaise: 1_000_00 });
  assert.equal(formatRate(r.withFeeRatePct!), "23.41");
});

const goal = { costTodayPaise: 10_00_000_00, years: 10, inflationBp: 600, returnBp: 1200, savedPaise: 0 };

test("Goal ₹10 lakh today, 10 years, 6% inflation, 12% return", () => {
  const r = planGoal(goal);
  assert.equal(r.goalPaise, 17_90_847_70);
  assert.equal(r.monthlySipPaise, 7_707_91);
  assert.equal(r.lumpSumTodayPaise, 5_42_617_50);
  assert.equal(r.covered, false);
});

test("With ₹2 lakh already saved the SIP falls to ₹4,866.90", () => {
  const r = planGoal({ ...goal, savedPaise: 2_00_000_00 });
  assert.equal(r.monthlySipPaise, 4_866_90);
  assert.equal(r.lumpSumTodayPaise, 3_42_617_50);
});

test("Savings that already cover the goal need no SIP", () => {
  const r = planGoal({ ...goal, savedPaise: 10_00_000_00 });
  assert.equal(r.covered, true);
  assert.equal(r.monthlySipPaise, 0);
  assert.equal(r.lumpSumTodayPaise, 0);
});

test("0% return and 0% inflation: goal ÷ months", () => {
  const r = planGoal({ costTodayPaise: 1_20_000_00, years: 1, inflationBp: 0, returnBp: 0, savedPaise: 0 });
  assert.equal(r.goalPaise, 1_20_000_00);
  assert.equal(r.monthlySipPaise, 10_000_00);
  assert.equal(r.totalSipPaise, 1_20_000_00);
});
