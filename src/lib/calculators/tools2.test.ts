import { test } from "node:test";
import assert from "node:assert/strict";

import { formatPaise } from "../gst/money.ts";
import { payOffCard } from "./credit-card.ts";
import { fdMaturityPaise, rdMaturityPaise } from "./deposits.ts";
import { calculateGst } from "./gst-calc.ts";
import { loanSchedule } from "./prepayment.ts";

const r = (paise: number) => formatPaise(paise, true);

test("GST calculator: brief values", () => {
  const a = calculateGst({ amountPaise: 100000, rateBp: 1800, mode: "exclusive", intraState: true });
  assert.deepEqual([r(a.cgst), r(a.sgst), r(a.total)], ["₹90.00", "₹90.00", "₹1,180.00"]);
  const b = calculateGst({ amountPaise: 100000, rateBp: 1800, mode: "exclusive", intraState: false });
  assert.deepEqual([r(b.igst), r(b.total)], ["₹180.00", "₹1,180.00"]);
  const c = calculateGst({ amountPaise: 118000, rateBp: 1800, mode: "inclusive", intraState: true });
  assert.deepEqual([r(c.taxable), r(c.gst), r(c.cgst), r(c.sgst)], ["₹1,000.00", "₹180.00", "₹90.00", "₹90.00"]);
  const d = calculateGst({ amountPaise: 99900, rateBp: 1800, mode: "inclusive", intraState: true });
  assert.deepEqual([r(d.taxable), r(d.gst), r(d.cgst), r(d.sgst)], ["₹846.61", "₹152.39", "₹76.20", "₹76.19"]);
  const e = calculateGst({ amountPaise: 249999, rateBp: 500, mode: "exclusive", intraState: true });
  assert.deepEqual([r(e.cgst), r(e.sgst), r(e.total)], ["₹62.50", "₹62.50", "₹2,624.99"]);
});

const loan = { principalPaise: 100000000, rateBp: 850, months: 240 } as const;

test("Prepayment: no prepayment", () => {
  const s = loanSchedule({ ...loan, prepayment: { type: "none" }, after: "reduce-tenure" });
  assert.equal(r(s.emi), "₹8,678.23");
  assert.equal(s.months, 240);
  assert.equal(r(s.totalInterest), "₹10,82,776.63");
  assert.equal(r(s.finalInstalment), "₹8,679.66");
});

test("Prepayment: one-time ₹2,00,000 after EMI 12, reduce tenure", () => {
  const base = loanSchedule({ ...loan, prepayment: { type: "none" }, after: "reduce-tenure" });
  const s = loanSchedule({ ...loan, prepayment: { type: "once", amountPaise: 20000000, afterEmi: 12 }, after: "reduce-tenure" });
  assert.equal(s.months, 156);
  assert.equal(r(s.totalInterest), "₹5,49,146.06");
  assert.equal(r(base.totalInterest - s.totalInterest), "₹5,33,630.57");
  assert.equal(base.months - s.months, 84);
  assert.equal(r(s.finalInstalment), "₹4,020.41");
});

test("Prepayment: one-time ₹2,00,000 after EMI 12, reduce EMI", () => {
  const base = loanSchedule({ ...loan, prepayment: { type: "none" }, after: "reduce-tenure" });
  const s = loanSchedule({ ...loan, prepayment: { type: "once", amountPaise: 20000000, afterEmi: 12 }, after: "reduce-emi" });
  assert.equal(r(s.newEmi ?? 0), "₹6,907.34");
  assert.equal(s.months, 240);
  assert.equal(r(s.totalInterest), "₹8,79,013.02");
  assert.equal(r(base.totalInterest - s.totalInterest), "₹2,03,763.61");
});

test("Prepayment: extra ₹5,000 every month, reduce tenure", () => {
  const base = loanSchedule({ ...loan, prepayment: { type: "none" }, after: "reduce-tenure" });
  const s = loanSchedule({ ...loan, prepayment: { type: "monthly", amountPaise: 500000 }, after: "reduce-tenure" });
  assert.equal(s.months, 104);
  assert.equal(r(s.totalInterest), "₹4,13,709.26");
  assert.equal(r(base.totalInterest - s.totalInterest), "₹6,69,067.37");
});

const card = { balancePaise: 5000000, monthlyRateBp: 350, minimumBp: 500, floorPaise: 20000, gstOnInterest: true };

test("Credit card: minimum due only", () => {
  const s = payOffCard(card);
  assert.equal(s.months, 277);
  assert.equal(s.cleared, true);
  assert.deepEqual([r(s.totalInterest), r(s.totalGst), r(s.totalPaid)], ["₹1,53,419.44", "₹27,615.49", "₹2,31,034.93"]);
});

test("Credit card: fixed ₹5,000 a month", () => {
  const s = payOffCard({ ...card, fixedPaise: 500000 });
  assert.equal(s.months, 14);
  assert.deepEqual([r(s.totalInterest), r(s.totalGst), r(s.totalPaid)], ["₹13,416.92", "₹2,415.04", "₹65,831.96"]);
});

test("Credit card: a payment below the interest never clears (capped at 100 years)", () => {
  const s = payOffCard({ ...card, fixedPaise: 100000 });
  assert.equal(s.cleared, false);
  assert.equal(s.months, 1200);
});

test("FD: brief values", () => {
  assert.equal(r(fdMaturityPaise(10000000, 7, 60, 4)), "₹1,41,477.82");
  assert.equal(r(fdMaturityPaise(10000000, 7, 60, 12)), "₹1,41,762.53");
  assert.equal(r(fdMaturityPaise(10000000, 7, 60, 1)), "₹1,40,255.17");
  assert.equal(r(fdMaturityPaise(10000000, 7.25, 18, 4)), "₹1,11,379.85");
  assert.equal(r(fdMaturityPaise(25000000, 6.5, 13, 4)), "₹2,68,094.76");
});

test("RD: brief values", () => {
  assert.equal(r(rdMaturityPaise(500000, 7, 60)), "₹3,59,663.95");
  assert.equal(r(rdMaturityPaise(200000, 6.5, 12)), "₹24,857.29");
  assert.equal(r(rdMaturityPaise(1000000, 7.5, 36)), "₹4,04,530.22");
});
