import { test } from "node:test";
import assert from "node:assert/strict";

import { compareMonths, mergeSnapshots, monthSnapshots, pickComparison, reviewQuestion, runEngine, type MonthSnapshot, type RawTxn } from "./index.ts";

/** Synthetic data only. */
let n = 0;
const t = (date: string, description: string, debit: number, credit = 0): RawTxn => ({ id: `rv:${(n += 1)}`, sourceFileId: "rv", date, description, debit, credit, balance: null });
const snap = (month: string, over: Partial<MonthSnapshot> = {}): MonthSnapshot => ({ month, partial: false, moneyIn: 0, moneyOut: 0, income: 0, spending: 0, otherTransfersOut: 0, debt: 0, platforms: 0, cash: 0, fees: 0, byCategory: {}, regular: [], ...over });

test("The question asks about the biggest unclear money in first, and skips what the user already set", () => {
  const raw = [
    t("2025-08-02", "UPI/CR/1/MAHESH PRASAD/SBIN/mahesh.p@oksbi/", 0, 25000_00),
    t("2025-09-02", "UPI/CR/2/MAHESH PRASAD/SBIN/mahesh.p@oksbi/", 0, 25000_00),
    t("2025-08-05", "UPI/CR/3/NEHA JAIN/SBIN/neha.j@oksbi/", 0, 3000_00),
    t("2025-08-06", "UPI/DR/4/VIKAS RAO/SBIN/vikas.r@oksbi/", 90000_00),
  ];
  const q = reviewQuestion(runEngine(raw).txns)!;
  assert.deepEqual([q.counterparty, q.direction, q.total, q.count], ["MAHESH PRASAD", "in", 50000_00, 2]);
  assert.deepEqual(q.options.map((o) => o.label), ["Salary or payment for work", "Business or sales", "Family support", "Friend", "Money returned to me", "A loan I have to repay", "My own account", "Refund"]);
  // Once answered (a rule), the next question moves on.
  const after = runEngine(raw, [{ id: "r", counterparty: "MAHESH PRASAD", set: { type: "TRANSFER", category: "Family" } }]);
  assert.equal(reviewQuestion(after.txns)!.counterparty, "NEHA JAIN");
  // Answering changes the facts immediately: family support is not income, "Income" is.
  const asIncome = runEngine(raw, [{ id: "r", counterparty: "MAHESH PRASAD", set: { type: "INCOME", category: "Regular income" } }]);
  assert.equal(asIncome.facts!.trueIncome, 50000_00);
  assert.equal(after.facts!.trueIncome, 0);
});

test("No question when nothing is unclear or amounts are small", () => {
  assert.equal(reviewQuestion(runEngine([t("2025-08-01", "UPI-SWIGGY-swiggy@icici", 300_00), t("2025-08-02", "UPI/CR/1/NEHA JAIN/SBIN/neha.j@oksbi/", 0, 500_00)]).txns), null);
});

test("Month snapshots come from the facts, with regular payments active that month", () => {
  const r = runEngine([
    ...["2025-07-05", "2025-08-05", "2025-09-05"].map((d) => t(d, "NAVYA FINSERV EMI", 2500_00)),
    t("2025-07-01", "UPI-SWIGGY-swiggy@icici", 400_00),
    t("2025-09-30", "UPI-SWIGGY-swiggy@icici", 100_00),
  ]);
  const s = monthSnapshots(r.facts!, r.txns);
  assert.deepEqual(s.map((m) => [m.month, m.debt, m.spending, m.regular.map((x) => x.name)]), [
    ["2025-07", 2500_00, 400_00, ["NAVYA FINSERV EMI"]],
    ["2025-08", 2500_00, 0, ["NAVYA FINSERV EMI"]],
    ["2025-09", 2500_00, 100_00, ["NAVYA FINSERV EMI"]],
  ]);
  assert.equal(JSON.stringify(s).includes("swiggy@"), false, "no raw descriptions or UPI IDs in a snapshot");
});

test("What changed: totals with thresholds, top category moves, new and stopped regular payments", () => {
  const prev = snap("2025-08", { spending: 20000_00, income: 50000_00, debt: 2500_00, fees: 0, byCategory: { Shopping: 3000_00, Groceries: 6000_00 }, regular: [{ name: "NETFLIX", amount: 199_00 }, { name: "GYM", amount: 800_00 }] });
  const cur = snap("2025-09", { spending: 26000_00, income: 50200_00, debt: 2500_00, fees: 150_00, byCategory: { Shopping: 9000_00, Groceries: 6200_00 }, regular: [{ name: "NETFLIX", amount: 199_00 }, { name: "SPOTIFY", amount: 119_00 }] });
  assert.deepEqual(compareMonths(prev, cur).map((c) => c.text), [
    "Actual spending: ₹26,000 in Sep 2025 against ₹20,000 in Aug 2025 (up 30%).",
    "Bank charges went up to ₹150 from ₹0.",
    "Shopping up by ₹6,000.",
    "New regular payment: SPOTIFY, ₹119.",
    "Regular payment not seen this month: GYM.",
  ]);
  assert.deepEqual(compareMonths(prev, prev), []);
});

test("Comparison: from the same statement first, else from a saved month; never partial months", () => {
  const jul = snap("2025-07", { spending: 1_00 });
  const aug = snap("2025-08", { spending: 2_00 });
  const sepPartial = snap("2025-09", { partial: true });
  assert.equal(pickComparison([jul, aug, sepPartial], [])!.source, "statement");
  assert.equal(pickComparison([jul, aug, sepPartial], [])!.cur.month, "2025-08");
  const savedJul = snap("2025-07", { spending: 5_00 });
  const r = pickComparison([aug, sepPartial], [savedJul])!;
  assert.deepEqual([r.source, r.prev.month, r.cur.month], ["saved", "2025-07", "2025-08"]);
  assert.equal(pickComparison([aug], []), null);
  assert.equal(pickComparison([aug], [snap("2025-07", { partial: true })]), null);
});

test("Saving merges months: a full month replaces a partial copy, never the other way", () => {
  const merged = mergeSnapshots([snap("2025-08", { partial: true, spending: 1_00 }), snap("2025-07", { spending: 7_00 })], [snap("2025-08", { spending: 8_00 }), snap("2025-07", { partial: true, spending: 9_00 })]);
  assert.deepEqual(merged.map((m) => [m.month, m.spending, m.partial]), [["2025-07", 7_00, false], ["2025-08", 8_00, false]]);
});

import { monthlyReminderIcs } from "../calendar.ts";

test("Calendar reminder: monthly on the 2nd from next month, including across a year end", () => {
  const ics = monthlyReminderIcs(new Date(2025, 11, 20, 9, 0), "https://aqvik.com/tools/bank-statement-analyzer");
  assert.match(ics, /DTSTART:20260102T100000/);
  assert.match(ics, /RRULE:FREQ=MONTHLY;BYMONTHDAY=2/);
  assert.match(monthlyReminderIcs(new Date(2025, 6, 3), "x"), /DTSTART:20250802T100000/);
  assert.doesNotMatch(ics, /₹|\d{6,}@/);
});

import { IN_CHOICES, OUT_CHOICES } from "./catalog.ts";
import { fits } from "./classify.ts";

test("Every answer option is an existing choice and fits its direction", () => {
  const raw = [t("2025-08-02", "UPI/CR/1/ASHA RANI/SBIN/asha.r@oksbi/", 0, 5000_00), t("2025-08-06", "UPI/DR/4/VIKAS RAO/SBIN/vikas.r@oksbi/", 9000_00)];
  const inQ = reviewQuestion(runEngine(raw).txns)!;
  const outQ = reviewQuestion(runEngine(raw, [{ id: "r", counterparty: "ASHA RANI", set: { type: "TRANSFER", category: "Friend" } }]).txns)!;
  assert.equal(outQ.direction, "out");
  for (const [q, choices, out] of [[inQ, IN_CHOICES, false], [outQ, OUT_CHOICES, true]] as const) {
    for (const o of q.options) {
      assert.ok(fits(o.type, out), `${o.label} fits`);
      assert.ok(choices.some((g) => g.type === o.type && g.categories.includes(o.category)), `${o.label} is a catalog choice`);
    }
  }
  // "Friend" money in is a transfer, not income.
  const friend = runEngine(raw, [{ id: "r", counterparty: "ASHA RANI", set: { type: "TRANSFER", category: "Friend", kind: "person" } }]);
  assert.equal(friend.facts!.trueIncome, 0);
});
