import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyOne } from "./classify.ts";
import { runEngine, type RawTxn, type UserRule } from "./index.ts";

let n = 0;
const tx = (date: string, description: string, debit: number, credit = 0, balance: number | null = null, file = "f1"): RawTxn => ({
  id: `${file}:${(n += 1)}`,
  sourceFileId: file,
  date,
  description,
  debit,
  credit,
  balance,
});
const out = (d: string, s: string, rupees: number) => tx(d, s, Math.round(rupees * 100));
const inn = (d: string, s: string, rupees: number) => tx(d, s, 0, Math.round(rupees * 100));
const c = (t: RawTxn) => classifyOne(t);

test("Income: salary wording is income; a large one-off credit from a person is not", () => {
  const sal = c(inn("2026-07-01", "NEFT-SALARY JUL ACME TECHNOLOGIES PVT LTD", 55000));
  assert.deepEqual([sal.type, sal.category, sal.layer], ["INCOME", "Salary", "structural"]);
  const big = c(inn("2026-07-03", "UPI/CR/1/RAHUL KUMAR/SBIN/rahul@oksbi/", 90000));
  assert.equal(big.type, "TRANSFER");
  assert.equal(big.counterparty.kind, "person");
});

test("Spending: merchants by name, app tags and merchant QR codes", () => {
  assert.deepEqual([c(out("2026-07-02", "UPI-SWIGGY-swiggy@icici-ICIC0DC0099-1-Order", 456)).category, c(out("2026-07-02", "UPI-SWIGGY-swiggy@icici", 456)).type], ["Food & dining", "SPENDING"]);
  const tagged = c(out("2026-07-04", "Paid to Patel Store Tag: # Groceries UPI ID: patel@okaxis", 89));
  assert.deepEqual([tagged.type, tagged.category], ["SPENDING", "Groceries"]);
  const qr = c(out("2026-07-04", "UPI/DR/839357340410/SANJAY K/YESB/paytmqr6s1/Paym", 25));
  assert.deepEqual([qr.type, qr.counterparty.kind], ["SPENDING", "merchant"]);
});

test("Transfers: UPI to a person is a transfer (medium/low confidence), not spending", () => {
  const p = c(out("2026-07-05", "WDL TFR UPI/DR/412300000001/MOHAN LAL/SBIN/mohan@oksbi/Paym", 2000));
  assert.deepEqual([p.type, p.category, p.counterparty.kind, p.counterparty.name], ["TRANSFER", "To people", "person", "MOHAN LAL"]);
  assert.ok(p.confidence < 0.8);
});

test("Broker funding is a transfer, never a confirmed investment; MF purchase is an investment", () => {
  for (const d of ["WDL TFR FOR TRADING OF SBICAP SECURIT", "ACH D- ZERODHA BROKING-FUNDS", "UPI/DR/1/Groww/YESB/groww@yesbank/Add funds", "NEFT PAYTM MONEY LIMITED"]) {
    const r = c(out("2026-07-06", d, 5000));
    assert.deepEqual([r.type, r.category, r.counterparty.kind], ["TRANSFER", "Broker funding", "broker"], d);
  }
  const back = c(inn("2026-07-08", "DEP TFR NEFT*UTIB0000007*PAYTM MONEY LIM", 2000));
  assert.deepEqual([back.type, back.category], ["TRANSFER", "From investment platform"]);
  const mf = c(out("2026-07-07", "ACH D- ICICI PRUDENTIAL MUTUAL FUND SIP", 5000));
  assert.deepEqual([mf.type, mf.category], ["INVESTMENT", "Mutual funds"]);
});

test("Debt, cash, fees, interest, cashback, refunds, unknown", () => {
  assert.deepEqual([c(out("2026-07-05", "DEBIT CMP MANDATE DEBIT TATA CAPITAL LT", 7200)).type, c(out("2026-07-05", "DEBIT CMP MANDATE DEBIT TATA CAPITAL LT", 7200)).category], ["DEBT_PAYMENT", "EMI & loans"]);
  assert.equal(c(out("2026-07-05", "CRED CLUB CREDIT CARD BILL", 12000)).category, "Credit card");
  assert.equal(c(out("2026-07-05", "SIMPL PAYMENT", 900)).category, "Buy now, pay later");
  assert.equal(c(out("2026-07-09", "ATM WDL-ATM CASH 0123 MG ROAD", 2000)).type, "CASH_WITHDRAWAL");
  const fee = c(out("2026-07-31", "SMS ALERT CHARGES QTR", 17.7));
  assert.deepEqual([fee.type, fee.category], ["FEE", "SMS charges"]);
  assert.equal(c(out("2026-08-26", "DEBIT SCHG/TIPS 26AUG26", 3.17)).type, "FEE");
  assert.equal(c(inn("2026-09-30", "CREDIT INTEREST", 212)).type, "INTEREST");
  assert.equal(c(inn("2026-09-12", "CASHBACK FROM PAYTM", 15)).type, "CASHBACK");
  assert.equal(c(inn("2026-09-12", "UPI REVERSAL 412300000099", 499)).type, "REFUND");
  const unk = c(out("2026-09-13", "XYZ 0099 ABC", 300));
  assert.deepEqual([unk.type, unk.layer, unk.confidence < 0.5], ["UNKNOWN", "fallback", true]);
  assert.deepEqual([c(out("2026-09-13", "ACH D- SOME UNKNOWN CO", 999)).type, c(out("2026-09-13", "ACH D- SOME UNKNOWN CO", 999)).method], ["UNKNOWN", "AUTO_DEBIT"]);
});

test("Every classification carries a confidence band input and plain reasons", () => {
  for (const d of ["UPI-SWIGGY-swiggy@icici", "ATM WDL", "NOTHING HERE 123"]) {
    const r = c(out("2026-07-01", d, 10));
    assert.ok(r.confidence > 0 && r.confidence <= 1);
    assert.ok(r.reasons.length >= 1 && r.reasons[0]!.length > 5);
  }
});

test("Self transfer only with explicit wording; a name like the holder's is not enough", () => {
  assert.deepEqual([c(out("2026-07-10", "Transferred to Self, # Self Transfer", 5000)).counterparty.kind, c(out("2026-07-10", "IMPS TRANSFER TO SELF A/C 1234", 5000)).category], ["own", "Own accounts"]);
  const lookalike = c(out("2026-07-10", "UPI/DR/1/PRAKASH RAJ/SBIN/prakash@oksbi/", 5000));
  assert.notEqual(lookalike.counterparty.kind, "own");
  assert.equal(lookalike.type, "TRANSFER");
});

test("User rule is a hard override; user edit beats automation; rule beats edit", () => {
  const a = out("2026-07-05", "UPI-SWIGGY-swiggy@icici-x", 500);
  const b = out("2026-08-05", "UPI-SWIGGY-swiggy@icici-y", 700);
  const salary = inn("2026-07-01", "SALARY JUL ACME", 50000);
  const rules: UserRule[] = [{ id: "r1", counterparty: "swiggy", set: { type: "TRANSFER", category: "Family", kind: "person" } }];
  const { txns } = runEngine([a, b, salary], rules, [{ txnId: a.id, set: { type: "SPENDING", category: "Shopping" } }, { txnId: salary.id, set: { type: "TRANSFER", category: "From people" } }]);
  assert.deepEqual(txns.map((t) => [t.c.type, t.c.category, t.c.layer, t.c.confidence]), [
    ["TRANSFER", "Family", "user-rule", 1],
    ["TRANSFER", "Family", "user-rule", 1],
    ["TRANSFER", "From people", "user-edit", 1],
  ]);
  // A decision that does not fit the direction (spending on money received) is ignored, not forced.
  const r = runEngine([salary], [], [{ txnId: salary.id, set: { type: "SPENDING", category: "Food & dining" } }]);
  assert.equal(r.txns[0]!.c.type, "INCOME");
});

test("Refund linkage: gross, refund, net spending", () => {
  const buy = out("2026-07-10", "UPI-AMAZON-amazon@apl-1", 2000);
  const refund = inn("2026-07-20", "UPI-AMAZON-amazon@apl-REFUND", 500);
  const stray = inn("2026-07-21", "REFUND FROM OTHER SHOP", 300);
  const { txns, facts } = runEngine([buy, refund, stray]);
  assert.equal(txns[1]!.c.refundOf, buy.id);
  assert.equal(txns[2]!.c.refundOf, undefined);
  assert.deepEqual([facts!.grossSpending, facts!.refundsLinked, facts!.actualSpending, facts!.refundsUnlinked], [2_000_00, 500_00, 1_500_00, 300_00]);
});

test("Duplicates: across overlapping files excluded; same-file lines that moved the balance kept", () => {
  const a = tx("2026-07-05", "UPI-SWIGGY-swiggy@icici", 45600, 0, 100000, "jan");
  const again = tx("2026-07-05", "UPI-SWIGGY-swiggy@icici", 45600, 0, 100000, "feb");
  const second = tx("2026-07-05", "UPI-SWIGGY-swiggy@icici", 45600, 0, 54400, "jan");
  const { txns, facts } = runEngine([a, again, second]);
  assert.equal(txns[1]!.c.duplicateOf, a.id);
  assert.equal(txns[2]!.c.duplicateOf, undefined);
  assert.equal(facts!.duplicatesExcluded, 1);
  assert.equal(facts!.raw.moneyOut, 91200);
});

test("Regular income confirms income; never turns a person's transfers into income", () => {
  const r = runEngine([
    inn("2026-07-01", "NEFT ACME TECHNOLOGIES PVT LTD", 40000),
    inn("2026-08-01", "NEFT ACME TECHNOLOGIES PVT LTD", 40000),
    inn("2026-07-03", "UPI/CR/1/RAHUL KUMAR/SBIN/rahul@oksbi/", 10000),
    inn("2026-08-03", "UPI/CR/2/RAHUL KUMAR/SBIN/rahul@oksbi/", 10000),
  ]);
  assert.deepEqual(r.txns.map((t) => [t.c.type, t.c.category]), [
    ["INCOME", "Regular income"],
    ["INCOME", "Regular income"],
    ["TRANSFER", "From people"],
    ["TRANSFER", "From people"],
  ]);
  assert.equal(r.facts!.trueIncome, 80_000_00);
});

test("Round trip: sent and received back is linked, not income", () => {
  const r = runEngine([out("2026-07-01", "UPI/DR/1/ANKIT/SBIN/ankit@oksbi/", 3000), inn("2026-07-06", "UPI/CR/2/ANKIT/SBIN/ankit@oksbi/", 3000)]);
  assert.ok(r.txns[0]!.c.pairId && r.txns[0]!.c.pairId === r.txns[1]!.c.pairId);
  assert.equal(r.facts!.trueIncome, 0);
});

test("Facts: exact paise and the identity money out = sum of types (adversarial mix)", () => {
  const set = [
    inn("2026-07-01", "SALARY JUL ACME", 55000.01),
    out("2026-07-02", "UPI-SWIGGY-swiggy@icici", 456.33),
    out("2026-07-03", "ACH D- ZERODHA BROKING", 5000),
    out("2026-07-04", "TATA CAPITAL EMI", 7200),
    out("2026-07-05", "ATM WDL", 1000),
    out("2026-07-06", "SMS ALERT CHARGES", 17.7),
    out("2026-07-07", "UPI/DR/1/MOHAN/SBIN/mohan@oksbi/", 2000),
    out("2026-07-08", "??? 000", 0.01),
    inn("2026-07-09", "CREDIT INTEREST", 0.99),
    inn("2026-07-10", "CASHBACK", 15),
    out("2026-07-11", "ACH D- ICICI PRU MUTUAL FUND", 1000),
  ];
  const f = runEngine(set).facts!;
  const outTotal = Object.values(f.byType.out).reduce((a, b) => a + b, 0);
  const inTotal = Object.values(f.byType.in).reduce((a, b) => a + b, 0);
  assert.equal(outTotal, f.raw.moneyOut);
  assert.equal(inTotal, f.raw.moneyIn);
  assert.deepEqual(
    [f.trueIncome, f.actualSpending, f.brokerFunding, f.investmentsConfirmed, f.debtPayments, f.cashWithdrawals, f.fees, f.interest, f.cashback, f.unknownOut, f.transfersOut],
    [55_000_01, 456_33, 5_000_00, 1_000_00, 7_200_00, 1_000_00, 17_70, 99, 15_00, 1, 7_000_00],
  );
  assert.equal(f.netCashFlow, f.raw.moneyIn - f.raw.moneyOut);
  assert.equal(f.moneyOutParts.reduce((s2, p) => s2 + p.amount, 0), f.raw.moneyOut);
  assert.equal(f.raw.moneyOut, 16_674_04);
});

test("Adversarial: empty input, zero-income savings rate, odd descriptions do not crash", () => {
  assert.equal(runEngine([]).facts, null);
  const f = runEngine([out("2026-07-01", "", 100), out("2026-07-02", "////", 200), out("2026-07-03", "@@@", 300)]).facts!;
  assert.equal(f.savingsRateBp, null);
  assert.equal(f.unknownOut + f.transfersOut + f.actualSpending, 600_00);
});

import { maskText } from "../mask.ts";

test("Masking hides account numbers, references and UPI IDs on screen", () => {
  const m = maskText("UPI/DR/412300000001/RAMESH KUMAR/SBIN/ramesh@oksbi/A/c 00976921620 9876543210");
  assert.equal(m, "UPI/DR/••••0001/RAMESH KUMAR/SBIN/ra•••@oksbi/A/c ••••1620 ••••3210");
});

import { detectHeader, extractTransactions } from "../detect.ts";
import { parseDelimited } from "../parse.ts";
import { SAMPLE_CSV } from "../sample.ts";
import { toRaw } from "./links.ts";

test("Dashboard facts on the sample statement: money out is split, never shown as spending", () => {
  const grid = parseDelimited(SAMPLE_CSV);
  const { facts: f } = runEngine(toRaw(extractTransactions(grid, detectHeader(grid)!).txns, "sample"));
  assert.ok(f);
  assert.deepEqual(
    {
      trueIncome: f.trueIncome,
      actualSpending: f.actualSpending,
      investments: f.investmentsConfirmed,
      brokerFunding: f.brokerFunding,
      debt: f.debtPayments,
      transfers: f.transfersOut,
      cash: f.cashWithdrawals,
      refunds: f.refundsLinked + f.refundsUnlinked,
      fees: f.fees,
      interest: f.interest,
      net: f.netCashFlow,
      moneyOut: f.raw.moneyOut,
    },
    {
      trueIncome: 1_65_000_00,
      actualSpending: 57_350_50,
      investments: 0,
      brokerFunding: 15_000_00,
      debt: 18_600_00,
      transfers: 16_500_00,
      cash: 5_000_00,
      refunds: 0,
      fees: 17_70,
      interest: 212_00,
      net: 70_243_80,
      moneyOut: 97_468_20,
    },
  );
  assert.ok(f.actualSpending < f.raw.moneyOut);
  assert.equal(f.moneyOutParts.reduce((s, p) => s + p.amount, 0), f.raw.moneyOut);
  assert.deepEqual(f.recurring.filter((r) => r.direction === "in").map((r) => [r.counterparty, r.frequency, r.monthlyEquivalent]), [["SALARY ACME TECHNOLOGIES PVT LTD", "monthly", 55_000_00]]);
  assert.deepEqual(f.recurring.filter((r) => r.direction === "out").map((r) => [r.counterparty, r.annualized]), [
    ["RAMESH KUMAR", 1_68_000_00],
    ["PERSONAL LOAN EMI", 74_400_00],
    ["ZERODHA BROKING", 60_000_00],
    ["NETFLIX", 2_388_00],
  ]);
});
