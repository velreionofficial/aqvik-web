import { test } from "node:test";
import assert from "node:assert/strict";

import { runEngine, type RawTxn } from "./index.ts";
import { inr } from "./insights.ts";

let n = 0;
const t = (date: string, description: string, debit: number, credit = 0): RawTxn => ({ id: `f:${(n += 1)}`, sourceFileId: "f", date, description, debit, credit, balance: null });
const out = (d: string, s: string, r: number) => t(d, s, Math.round(r * 100));
const inn = (d: string, s: string, r: number) => t(d, s, 0, Math.round(r * 100));
const run = (txns: RawTxn[]) => runEngine(txns);

const salary = ["2026-07-01", "2026-08-01", "2026-09-01"].map((d) => inn(d, "NEFT SALARY ACME PVT LTD", 50000));
const closeSep = out("2026-09-30", "UPI-SWIGGY-swiggy@icici", 100);

test("Trends: partial months are left out of averages and comparisons", () => {
  const r = run([
    out("2026-06-20", "UPI-AMAZON-amazon@apl", 9000), // statement starts 20 Jun: June is partial
    ...salary,
    out("2026-07-10", "UPI-AMAZON-amazon@apl", 4000),
    out("2026-08-10", "UPI-AMAZON-amazon@apl", 5000),
    out("2026-09-10", "UPI-AMAZON-amazon@apl", 6000),
    closeSep,
  ]);
  const tr = r.facts!.trends;
  assert.deepEqual(tr.fullMonths, ["2026-07", "2026-08", "2026-09"]);
  assert.equal(r.facts!.monthly[0]!.partial, true);
  assert.equal(tr.avgMonthlySpending, Math.round((4000_00 + 5000_00 + 6100_00) / 3));
  assert.deepEqual(tr.highestSpendingMonth, { month: "2026-09", amount: 6100_00 });
  assert.deepEqual(tr.changes.map((c) => c.spendingBp), [null, 2500, 2200]);
});

test("Unusual: a category jump in the last full month, with its transactions", () => {
  const r = run([
    ...salary,
    out("2026-07-05", "UPI-MYNTRA-myntra@ybl", 3000),
    out("2026-08-05", "UPI-MYNTRA-myntra@ybl", 3200),
    out("2026-09-05", "UPI-MYNTRA-myntra@ybl", 4000),
    out("2026-09-20", "UPI-FLIPKART-fk@axl", 6000),
    closeSep,
  ]);
  const spike = r.insights!.unusual.find((i) => i.id === "spike-Shopping")!;
  assert.ok(spike);
  assert.equal(spike.title, "Shopping went up in Sep 2026");
  assert.match(spike.detail, /₹10,000 against an average of ₹3,100/);
  assert.equal(spike.txnIds.length, 2);
});

test("Unusual: larger than usual payment to the same payee; new regular payment; penalties", () => {
  const r = run([
    ...salary,
    ...["2026-07-02", "2026-07-16", "2026-08-02", "2026-08-16"].map((d) => out(d, "UPI/DR/1/RAMU DOODH/SBIN/ramu@oksbi/", 600)),
    out("2026-09-02", "UPI/DR/1/RAMU DOODH/SBIN/ramu@oksbi/", 6000),
    out("2026-08-12", "NETFLIX", 199),
    out("2026-09-12", "NETFLIX", 199),
    out("2026-08-20", "NACH RETURN CHARGES", 590),
    closeSep,
  ]);
  const ids = r.insights!.unusual.map((i) => i.id);
  assert.ok(ids.some((i) => i.startsWith("bigger-")));
  assert.ok(ids.includes("new-regular-NETFLIX"));
  const pen = r.insights!.unusual.find((i) => i.id === "penalties")!;
  assert.equal(pen.level, "review");
  assert.equal(pen.amount, 590_00);
});

test("Leaks: possible double payment, many small payments, two video subscriptions, charges", () => {
  const smalls = Array.from({ length: 48 }, (_, i) => out(`2026-0${7 + Math.floor(i / 16)}-${String((i % 16) + 1).padStart(2, "0")}`, "UPI-CHAIWALA-chai@paytmqr", 30));
  const r = run([
    ...salary,
    ...smalls,
    out("2026-08-03", "UPI-AMAZON-amazon@apl", 1299),
    out("2026-08-03", "UPI-AMAZON-amazon@apl", 1299),
    out("2026-07-12", "NETFLIX", 199),
    out("2026-07-14", "HOTSTAR", 299),
    out("2026-07-31", "SMS ALERT CHARGES", 17.7),
    closeSep,
  ]);
  const ids = r.insights!.leaks.map((l) => l.id);
  assert.ok(ids.some((i) => i.startsWith("double-")));
  const small = r.insights!.leaks.find((l) => l.id === "small-payments")!;
  assert.equal(small.amount, 48 * 30_00 + 199_00 + 100_00); // tea stall, Netflix ₹199 and the ₹100 order are all under ₹200
  assert.ok(ids.includes("subs-video streaming"));
  assert.ok(ids.includes("fees"));
});

test("Health snapshot levels, and 'unknown' without income", () => {
  const h = run([...salary, out("2026-07-05", "TATA CAPITAL EMI", 30000), out("2026-08-05", "TATA CAPITAL EMI", 30000), out("2026-09-05", "TATA CAPITAL EMI", 30000), closeSep]).insights!.health;
  const by = Object.fromEntries(h.map((x) => [x.id, x.level]));
  assert.equal(by["debt"], "review"); // 60% of income
  assert.equal(by["commitments"], "review");
  const none = run([out("2026-07-01", "UPI-SWIGGY-swiggy@icici", 300)]).insights!.health;
  assert.equal(none.find((x) => x.id === "savings")!.level, "unknown");
});

test("Money story: every number is the facts' number, exactly", () => {
  const r = run([...salary, out("2026-07-05", "UPI-AMAZON-amazon@apl", 2000.5), out("2026-07-06", "ACH D- ZERODHA BROKING", 5000), out("2026-07-31", "SMS ALERT CHARGES", 17.7)]);
  const f = r.facts!;
  const text = r.insights!.story.map((s) => s.text).join(" ");
  assert.ok(text.includes(inr(f.trueIncome)) && text.includes(inr(f.actualSpending)));
  assert.match(text, /₹2,000\.50 went on spending/);
  assert.match(text, /₹17\.70 went on bank and card charges/);
  assert.match(text, new RegExp(`${inr(f.raw.moneyOut - f.grossSpending).replace(".", "\\.")} of the`));
});

test("Wording: no fraud, waste or verdicts anywhere in insights", () => {
  const r = run([...salary, out("2026-08-03", "UPI-AMAZON-amazon@apl", 1299), out("2026-08-03", "UPI-AMAZON-amazon@apl", 1299), out("2026-08-20", "NACH RETURN CHARGES", 590), out("2026-09-25", "UPI/DR/1/X/SBIN/x@oksbi/", 90000)]);
  const all = JSON.stringify(r.insights);
  assert.doesNotMatch(all, /fraud|scam|waste|wasted|bad habit|you should|unused/i);
});

test("A quiet, steady statement raises no unusual activity", () => {
  const r = run([...salary, ...["2026-07-05", "2026-08-05", "2026-09-05"].map((d) => out(d, "TATA CAPITAL EMI", 5000)), closeSep]);
  assert.deepEqual(r.insights!.unusual, []);
});

test("Multiple statements: overlapping entries counted once, totals are the union", () => {
  const julAug: RawTxn[] = [
    { id: "a:1", sourceFileId: "a", date: "2026-07-01", description: "NEFT SALARY ACME PVT LTD", debit: 0, credit: 50000_00, balance: 60000_00 },
    { id: "a:2", sourceFileId: "a", date: "2026-08-03", description: "UPI-SWIGGY-swiggy@icici", debit: 500_00, credit: 0, balance: 59500_00 },
  ];
  const augSep: RawTxn[] = [
    { id: "b:1", sourceFileId: "b", date: "2026-08-03", description: "UPI-SWIGGY-swiggy@icici", debit: 500_00, credit: 0, balance: 59500_00 },
    { id: "b:2", sourceFileId: "b", date: "2026-09-01", description: "NEFT SALARY ACME PVT LTD", debit: 0, credit: 50000_00, balance: 109500_00 },
  ];
  const r = runEngine([...julAug, ...augSep]);
  assert.equal(r.facts!.duplicatesExcluded, 1);
  assert.equal(r.facts!.raw.moneyOut, 500_00);
  assert.equal(r.facts!.trueIncome, 100000_00);
  assert.ok(r.insights!.checklist.some((c) => c.id === "dupes"));
});

test("Review checklist names what to check, with exact amounts", () => {
  const r = runEngine([
    inn("2026-07-01", "NEFT SALARY ACME PVT LTD", 50000),
    out("2026-07-03", "ACH D- ZERODHA BROKING", 5000),
    out("2026-07-04", "ATM WDL", 2000.5),
    out("2026-07-05", "XYZ 000", 300),
    out("2026-07-06", "UPI/DR/1/MOHAN/SBIN/mohan@oksbi/", 700),
  ]);
  const text = r.insights!.checklist.map((c) => c.text).join(" | ");
  assert.match(text, /₹5,000 sent to investment platforms is not confirmed as invested/);
  assert.match(text, /₹2,000\.50 was withdrawn as cash/);
  assert.match(text, /Payments to people \(₹700\)/);
  assert.match(text, /₹300 out and ₹0 in could not be classified/);
});

test("Little income, big transfers in: no meaningless percentages, a clear note instead", () => {
  const r = runEngine([
    inn("2026-07-01", "CREDIT INTEREST", 151.97),
    inn("2026-07-02", "NEFT SMALL CO PVT LTD", 151.97),
    ...["2026-07-03", "2026-08-03", "2026-09-03"].map((d) => inn(d, "UPI/CR/1/PAPA/SBIN/papa@oksbi/", 40000)),
    ...["2026-07-05", "2026-08-05", "2026-09-05"].map((d) => out(d, "TATA CAPITAL EMI", 7200)),
    out("2026-07-09", "UPI-FLIPKART-fk@axl", 2387),
  ]);
  const f = r.facts!;
  assert.equal(f.incomeReliable, false);
  assert.equal(f.savingsRateBp, null);
  assert.equal(f.commitments.shareOfIncomeBp, null);
  const health = Object.fromEntries(r.insights!.health.map((h) => [h.id, h]));
  assert.equal(health["savings"]!.level, "unknown");
  assert.equal(health["debt"]!.level, "unknown");
  assert.doesNotMatch(JSON.stringify(r.insights!.health), /\d{4,}%/);
  assert.ok(r.insights!.checklist.some((c) => c.id === "income"));
  assert.equal(f.moneyInParts.reduce((s, p) => s + p.amount, 0), f.raw.moneyIn);
  assert.equal(r.insights!.story[0]!.text, "Between 1 Jul 2026 and 5 Sep 2026, ₹1,20,303.94 came into your account and ₹23,987 went out.");
});
