import { test } from "node:test";
import assert from "node:assert/strict";

import { futureCostPaise, realReturnBp, toBasisPoints, todaysValuePaise, yearlyPath } from "./inflation.ts";

test("Future cost: ₹1,00,000 at 6% for 10 years is ₹1,79,084.77", () => {
  assert.equal(futureCostPaise(1_00_000_00, 600, 10), 1_79_084_77);
});

test("Today's value: ₹1,00,000 in 10 years at 6% is ₹55,839.48 today", () => {
  assert.equal(todaysValuePaise(1_00_000_00, 600, 10), 55_839_48);
});

test("A ₹50 lakh home at 7% for 15 years costs ₹1,37,95,157.70", () => {
  // 1.07^15 = 2.759031540...
  assert.equal(futureCostPaise(50_00_000_00, 700, 15), 1_37_95_157_70);
});

test("0% inflation leaves the amount unchanged; one year is simple", () => {
  assert.equal(futureCostPaise(12_345_67, 0, 30), 12_345_67);
  assert.equal(futureCostPaise(1_000_00, 550, 1), 1_055_00);
  assert.equal(todaysValuePaise(1_055_00, 550, 1), 1_000_00);
});

test("Real return: 7% with 6% inflation is 0.94%; 5% with 6% is −0.94%", () => {
  assert.equal(realReturnBp(700, 600), 94);
  assert.equal(realReturnBp(500, 600), -94);
  assert.equal(realReturnBp(600, 600), 0);
  assert.equal(realReturnBp(1200, 600), 566); // 1.12 ÷ 1.06 − 1 = 5.66%
});

test("Year-by-year path ends at the same figure", () => {
  const path = yearlyPath(1_00_000_00, 600, 10, "future");
  assert.equal(path.length, 10);
  assert.equal(path[0], 1_06_000_00);
  assert.equal(path[9], 1_79_084_77);
});

test("Rates up to 2 decimals only", () => {
  assert.equal(toBasisPoints(6.25), 625);
  assert.equal(toBasisPoints(6.255), null);
  assert.equal(toBasisPoints(-1), null);
});
