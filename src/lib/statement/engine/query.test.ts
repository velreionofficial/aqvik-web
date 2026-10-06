import { test } from "node:test";
import assert from "node:assert/strict";

import { queryTransactions, runEngine, type RawTxn } from "./index.ts";

let n = 0;
const t = (date: string, description: string, debit: number, credit = 0): RawTxn => ({ id: `q:${(n += 1)}`, sourceFileId: "q", date, description, debit, credit, balance: null });
const { txns } = runEngine([
  t("2026-09-05", "WDL TFR UPI/DR/412300000001/MOHAN KU/BARB/moh ankrsha/Paym", 1500_00),
  t("2026-09-20", "DEP TFR UPI/CR/412300000002/MOHAN KU/BARB/moh ankrsha/Paym", 0, 2000_00),
  t("2026-10-05", "WDL TFR UPI/DR/412300000003/APPLE ME/HDFC/app leservi/Exec", 12900_00),
  t("2026-10-05", "WDL TFR UPI/DR/412300000004/PAYTM MO/ICIC/pay tmmoney/1111", 5000_50),
  t("2026-08-11", "UPI-SWIGGY-swiggy@icici", 456_00),
]);
const q = (text: string, extra = {}) => queryTransactions(txns, { text, ...extra });

test("By name: every transaction with that person, both ways, with exact totals", () => {
  const r = q("mohan");
  assert.equal(r.count, 2);
  assert.deepEqual([r.moneyOut, r.moneyIn], [1500_00, 2000_00]);
});

test("By reference number, by date, by month", () => {
  assert.equal(q("412300000003").items[0]!.c.counterparty.name, "APPLE ME");
  assert.equal(q("05-10-2026").count, 2);
  assert.equal(q("05/10/2026").count, 2);
  assert.equal(q("2026-10-05").count, 2);
  assert.equal(q("5 Oct 2026").count, 2);
  assert.equal(q("10-2026").count, 2);
  assert.equal(q("Sep 2026").count, 2);
});

test("By amount: 12900, 12,900 and ₹12,900.00 find the same payment; paise count", () => {
  for (const s of ["12900", "12,900", "₹12,900.00"]) assert.equal(q(s).count, 1, s);
  assert.equal(q("5000.50").items[0]!.c.counterparty.name, "PAYTM MO");
  assert.equal(q("5000").count, 0);
});

test("Words combine; spaces inside names are ignored; date range and direction filters", () => {
  assert.equal(q("mohan 20-09-2026").count, 1);
  assert.equal(q("paytmmoney").count, 1);
  assert.equal(q("apple services").count, 0);
  assert.equal(q("appleservi").count, 1);
  assert.equal(q("", { from: "2026-09-01", to: "2026-09-30" }).count, 2);
  assert.equal(q("mohan", { direction: "in" }).count, 1);
  assert.equal(q("", { type: "SPENDING" }).items.every((x) => x.c.type === "SPENDING"), true);
  assert.equal(q("nobody here").count, 0);
});

test("A known subscription paid twice, a month apart, is a regular payment", () => {
  const r = runEngine([t("2026-08-04", "WDL TFR UPI/DR/1/APPLE ME/HDFC/app leservi/Exec", 12900_00), t("2026-09-04", "WDL TFR UPI/DR/2/APPLE ME/HDFC/app leservi/Exec", 12900_00), t("2026-07-01", "UPI-SWIGGY-swiggy@icici", 100_00)]);
  const sub = r.facts!.recurring.find((x) => x.counterparty === "APPLE ME")!;
  assert.deepEqual([sub.frequency, sub.isSubscription, sub.annualized], ["monthly", true, 12900_00 * 12]);
  assert.equal(r.facts!.subscriptions[0]!.frequency, "monthly");
  // Two monthly payments to an ordinary payee in a 3-month statement are still not enough.
  const plain = runEngine([t("2026-07-01", "UPI/DR/1/RAJU/SBIN/raju@oksbi/", 500_00), t("2026-08-01", "UPI/DR/2/RAJU/SBIN/raju@oksbi/", 500_00), t("2026-09-30", "UPI-SWIGGY-swiggy@icici", 100_00)]);
  assert.equal(plain.facts!.recurring.length, 0);
});
