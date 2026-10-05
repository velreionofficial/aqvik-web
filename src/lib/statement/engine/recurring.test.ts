import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyOne, feeKind } from "./classify.ts";
import { runEngine, type RawTxn } from "./index.ts";

let n = 0;
const t = (date: string, description: string, debit: number, credit = 0): RawTxn => ({ id: `f:${(n += 1)}`, sourceFileId: "f", date, description, debit, credit, balance: null });
const out = (d: string, s: string, r: number) => t(d, s, Math.round(r * 100));
const inn = (d: string, s: string, r: number) => t(d, s, 0, Math.round(r * 100));
const series = (dates: string[], s: string, r: number) => dates.map((d) => out(d, s, r));

test("Frequencies: weekly, monthly, every 3 months and yearly, with annual cost", () => {
  const weekly = series(["2026-07-01", "2026-07-08", "2026-07-15", "2026-07-22"], "UPI/DR/1/MILKMAN/SBIN/milk@oksbi/", 350);
  const monthly = series(["2026-04-05", "2026-05-05", "2026-06-05", "2026-07-05"], "TATA CAPITAL EMI", 7200);
  const quarterly = series(["2026-01-10", "2026-04-10", "2026-07-10"], "LIC PREMIUM", 4500);
  const yearly = series(["2025-03-01", "2026-03-01"], "AMAZON PRIME ANNUAL", 1499);
  const f = runEngine([...weekly, ...monthly, ...quarterly, ...yearly]).facts!;
  const by = Object.fromEntries(f.recurring.map((r) => [r.counterparty, [r.frequency, r.annualized, r.monthlyEquivalent, r.kind]]));
  assert.deepEqual(by["MILKMAN"], ["weekly", 350_00 * 52, Math.round((350_00 * 52) / 12), "To people"]);
  assert.deepEqual(by["TATA CAPITAL EMI"], ["monthly", 7_200_00 * 12, 7_200_00, "Loans & EMIs"]);
  assert.deepEqual(by["LIC PREMIUM"], ["quarterly", 4_500_00 * 4, 1_500_00, "Insurance"]);
  assert.deepEqual(by["AMAZON PRIME ANNUAL"], ["yearly", 1_499_00, Math.round(1_499_00 / 12), "Subscriptions"]);
  assert.equal(f.commitments.annual, 350_00 * 52 + 7_200_00 * 12 + 4_500_00 * 4 + 1_499_00);
});

test("Next date is an estimate from the usual gap", () => {
  const f = runEngine(series(["2026-07-12", "2026-08-12", "2026-09-12"], "UPI/DR/1/NETFLIX/HDFC/netflix@hdfcbank/", 199)).facts!;
  assert.equal(f.recurring[0]!.nextEstimate, "2026-10-13");
});

test("Not recurring: food orders at varying amounts, irregular gaps, two-month gaps, one-offs", () => {
  const food = [...series(["2026-07-01", "2026-07-03", "2026-07-09", "2026-07-20", "2026-08-02", "2026-08-30"], "UPI-SWIGGY-swiggy@icici", 400), out("2026-07-05", "UPI-SWIGGY-swiggy@icici", 1200), out("2026-07-28", "UPI-SWIGGY-swiggy@icici", 90)];
  const irregular = series(["2026-07-01", "2026-07-19", "2026-09-30"], "UPI/DR/1/RAJU/SBIN/raju@oksbi/", 500);
  const bimonthly = series(["2026-07-15", "2026-09-15"], "AIRTEL RECHARGE", 349);
  const f = runEngine([...food, ...irregular, ...bimonthly, out("2026-08-01", "IRCTC TICKET", 1845)]).facts!;
  assert.deepEqual(f.recurring, []);
  assert.equal(f.commitments.monthly, 0);
});

test("A small price change still counts; confidence drops when amounts vary", () => {
  const f = runEngine([out("2026-07-05", "SPOTIFY", 119), out("2026-08-05", "SPOTIFY", 119), out("2026-09-05", "SPOTIFY", 129)]).facts!;
  const r = f.recurring[0]!;
  assert.equal(r.frequency, "monthly");
  assert.equal(r.typical, 119_00);
  assert.ok(r.confidence < 0.8);
  assert.equal(r.isSubscription, true);
});

test("Subscriptions: repeating ones and ones seen once; never called 'unused'", () => {
  const f = runEngine([...series(["2026-07-12", "2026-08-12", "2026-09-12"], "NETFLIX", 199), out("2026-08-20", "GOOGLE ONE STORAGE", 130), out("2026-07-01", "UPI-SWIGGY-swiggy@icici", 400)]).facts!;
  assert.deepEqual(f.subscriptions.map((s) => [s.counterparty, s.frequency, s.annualized]), [
    ["NETFLIX", "monthly", 199_00 * 12],
    ["GOOGLE ONE STORAGE", "seen once", null],
  ]);
});

test("Regular income in, commitments as a share of income", () => {
  const salary = ["2026-07-01", "2026-08-01", "2026-09-01"].map((d) => inn(d, "NEFT SALARY ACME PVT LTD", 50000));
  const emi = series(["2026-07-05", "2026-08-05", "2026-09-05"], "TATA CAPITAL EMI", 10000);
  const f = runEngine([...salary, ...emi]).facts!;
  assert.deepEqual(f.recurring.filter((r) => r.direction === "in").map((r) => [r.counterparty, r.frequency]), [["NEFT SALARY ACME PVT LTD", "monthly"]]);
  assert.equal(f.commitments.monthly, 10_000_00);
  assert.equal(f.commitments.shareOfIncomeBp, 2000); // ₹10,000 of ₹50,000 a month = 20%
  assert.deepEqual(f.commitments.byKind, [{ key: "Loans & EMIs", amount: 10_000_00, count: 1 }]);
});

test("Fees: each kind of charge, and RECHARGE is not a charge", () => {
  const W = (s: string) => ` ${s} `;
  assert.deepEqual(
    ["SMS ALERT CHARGES QTR", "GST ON ATM CHG", "ATM CHG NFS", "NACH RETURN CHARGES", "DEBIT SCHG/TIPS", "MIN BAL CHGS", "CC LATE FEE", "DEBIT CARD ANNUAL FEE"].map((d) => feeKind(W(d))),
    ["SMS charges", "GST on charges", "ATM charges", "Bounce & return charges", "Service charges", "Minimum balance charges", "Penalties & late fees", "Card & account fees"],
  );
  assert.equal(feeKind(W("AIRTEL RECHARGE")), null);
  assert.equal(classifyOne(out("2026-07-01", "AIRTEL RECHARGE", 349)).type, "SPENDING");
  const f = runEngine([out("2026-07-31", "SMS ALERT CHARGES QTR", 17.7), out("2026-08-02", "GST ON ATM CHG", 3.6), out("2026-08-02", "ATM CHG NFS", 20), out("2026-08-05", "AIRTEL RECHARGE", 349)]).facts!;
  assert.equal(f.fees, 41_30);
  assert.equal(f.feeTxnIds.length, 3);
  assert.deepEqual(f.feesByCategory.map((b) => b.key).sort(), ["ATM charges", "GST on charges", "SMS charges"]);
});

test("Fees, cash and interest are never 'regular payments'", () => {
  const f = runEngine([
    ...series(["2026-07-31", "2026-08-31", "2026-09-30"], "SMS ALERT CHARGES", 17.7),
    ...series(["2026-07-10", "2026-08-10", "2026-09-10"], "ATM WDL", 2000),
  ]).facts!;
  assert.deepEqual(f.recurring, []);
});
