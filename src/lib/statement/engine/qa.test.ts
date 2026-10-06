import { test } from "node:test";
import assert from "node:assert/strict";

import { balanceCheck, detectHeader, extractTransactions } from "../detect.ts";
import { transactionsFromLines } from "../text-lines.ts";
import { classifyOne } from "./classify.ts";
import { kindFromName } from "./kinds.ts";
import { runEngine, toRaw, type RawTxn } from "./index.ts";

/** Everything here is synthetic: invented names, UPI IDs, references, dates and amounts. */
let n = 0;
const t = (date: string, description: string, debit: number, credit = 0): RawTxn => ({ id: `qa:${(n += 1)}`, sourceFileId: "qa", date, description, debit, credit, balance: null });
const out = (s: string, r: number) => classifyOne(t("2025-07-10", s, Math.round(r * 100)));
const inn = (s: string, r: number) => classifyOne(t("2025-07-10", s, 0, Math.round(r * 100)));

test("Golden: every counterparty kind", () => {
  const cases: [string, ReturnType<typeof out>][] = [
    ["person", out("UPI/DR/100000000001/AARAV MEHTA/SBIN/aarav.m@oksbi/Paym", 500)],
    ["merchant", out("UPI/DR/100000000002/SHREE GANESH TRADERS/SBIN/9000000001@ybl/Paym", 500)],
    ["government", out("UPI/DR/100000000003/FINANCE DEPARTMENT GOVT OF INDIA/SBIN/ntrp.gov@sbi/challan fee", 500)],
    ["bank", out("Paid to State Bank UPI UPI ID: sbi.coll@sbi", 500)],
    ["lender", out("UPI/DR/100000000004/NAVYA FINSERV LTD/ICIC/navya.fin@icici/EMI", 2500)],
    ["broker", out("ACH D- ZERODHA BROKING-FUNDS", 5000)],
    ["investment_platform", out("ACH D- KESARI MUTUAL FUND SIP", 1000)],
    ["wallet", out("ADD MONEY TO WALLET 1234", 300)],
    ["insurance", out("UPI/DR/100000000005/SURAKSHA LIFE INSURANCE/HDFC/suraksha@hdfc/premium", 1200)],
    ["utility", out("UPI/DR/100000000006/NORTH VIDYUT BOARD/SBIN/nvb@sbi/bill", 900)],
    ["education", out("UPI/DR/100000000007/SUNRISE PUBLIC SCHOOL/SBIN/sps@sbi/fees", 4000)],
    ["hospitality", out("Paid to Hotel Neelkamal UPI ID: neelkamal@okaxis", 1800)],
    ["healthcare", out("UPI/DR/100000000008/CITY CARE HOSPITAL/SBIN/cch@sbi/opd", 600)],
    ["other_institution", out("UPI/DR/100000000009/ORBIT SOLUTIONS PVT LTD/YESB/orbit@yes/inv", 700)],
    ["own", out("Transferred to Self, # Self Transfer", 2000)],
    ["unknown", out("XQ 0099 ZZ", 300)],
  ];
  for (const [kind, c] of cases) assert.equal(c.counterparty.kind, kind, `${kind}: got ${c.counterparty.kind} (${c.counterparty.name})`);
});

test("Golden: every economic type", () => {
  const cases: [string, ReturnType<typeof out>][] = [
    ["INCOME", inn("NEFT SALARY JUL ORBIT SOLUTIONS PVT LTD", 40000)],
    ["SPENDING", out("UPI-SWIGGY-swiggy@icici", 300)],
    ["TRANSFER", out("UPI/DR/1/AARAV MEHTA/SBIN/aarav.m@oksbi/", 500)],
    ["INVESTMENT", out("ACH D- KESARI MUTUAL FUND SIP", 1000)],
    ["DEBT_PAYMENT", out("CRED CLUB CREDIT CARD BILL", 9000)],
    ["CASH_WITHDRAWAL", out("ATM WDL-ATM CASH 0001", 2000)],
    ["REFUND", inn("UPI REVERSAL 100000000010", 250)],
    ["CASHBACK", inn("CASHBACK FROM WALLET OFFER", 20)],
    ["FEE", out("SMS ALERT CHARGES QTR", 17.7)],
    ["INTEREST", inn("CREDIT INTEREST", 41)],
    ["UNKNOWN", out("XQ 0099 ZZ", 300)],
  ];
  for (const [type, c] of cases) assert.equal(c.type, type, `${type}: got ${c.type} / ${c.category}`);
});

test("Government: kind is not type — tax, fee, scholarship, subsidy, refund, unclear PFMS", () => {
  const tax = out("UPI/DR/1/INCOME TAX DEPARTMENT/SBIN/itd@sbi/advance tax challan", 5000);
  assert.deepEqual([tax.type, tax.category, tax.counterparty.kind], ["SPENDING", "Taxes & government fees", "government"]);
  const fee = out("NEFT*SBIN0000001*NAGAR NIGAM TRADE LICENCE FEE", 1500);
  assert.deepEqual([fee.type, fee.category], ["SPENDING", "Taxes & government fees"]);
  const scholarship = inn("NEFT*SBIN0000002*PFMS SCHOLARSHIP POST MATRIC", 12000);
  assert.deepEqual([scholarship.type, scholarship.category, scholarship.counterparty.kind], ["INCOME", "Government payment", "government"]);
  assert.ok(scholarship.confidence >= 0.5 && scholarship.confidence < 0.8, "medium confidence");
  const subsidy = inn("NEFT*SBIN0000003*PFMS DBT GAS SUBSIDY", 210);
  assert.equal(subsidy.type, "INCOME");
  const refund = inn("NEFT*SBIN0000004*CBDT INCOME TAX REFUND AY 2025-26", 3100);
  assert.deepEqual([refund.type, refund.counterparty.kind], ["REFUND", "government"]);
  const unclear = inn("NEFT*SBIN0000005*PFMS 0000123", 4000);
  assert.deepEqual([unclear.type, unclear.category], ["TRANSFER", "From government"]);
  assert.ok(unclear.confidence < 0.5, "PFMS alone is low confidence, not income");
  const toGovtUnclear = out("UPI/DR/1/STATE TREASURY/SBIN/treasury@sbi/", 800);
  assert.deepEqual([toGovtUnclear.type, toGovtUnclear.category], ["TRANSFER", "To government"]);
});

test("Government and bank: no false positives from ordinary words", () => {
  assert.equal(kindFromName("SHARMA DEPARTMENT STORE")?.kind, "merchant");
  assert.equal(kindFromName("GOVIND KUMAR"), null);
  assert.equal(kindFromName("GOIL CHAND"), null);
  assert.equal(kindFromName("BANKE BIHARI"), null);
  assert.equal(kindFromName("PUBLICITY HOUSE"), null);
  assert.equal(kindFromName("RESTORE GADGETS")?.kind, undefined);
  // Paytm prints the user's own bank on every line; the counterparty is still the person.
  const p = out("Paid to Riya Kapoor State Bank Of India - 12 UPI ID: riya.k@okhdfcbank UPI Ref No: 100000000011", 750);
  assert.deepEqual([p.counterparty.name, p.counterparty.kind, p.type], ["RIYA KAPOOR", "person", "TRANSFER"]);
});

test("Merchant using a personal UPI ID; person using a merchant-like QR ID", () => {
  const shop = out("UPI/DR/1/SHREE GANESH TRADERS/SBIN/9000000001@ybl/Paym", 340);
  assert.deepEqual([shop.type, shop.counterparty.kind], ["SPENDING", "merchant"]);
  assert.ok(shop.confidence < 0.8);
  const qr = out("UPI/DR/1/RAHUL VERMA/YESB/paytmqr281005/Paym", 120);
  assert.deepEqual([qr.type, qr.counterparty.kind], ["SPENDING", "merchant"]);
  assert.ok(qr.confidence < 0.8, "surfaced as uncertain-ish, not high confidence");
});

test("Cinema is entertainment, never a subscription; a known service seen once is only 'possible'", () => {
  const r = runEngine([
    t("2025-08-20", "Paid to PVR Cinemas Tag: # Entertainment UPI ID: pvr@axis", 600_00),
    t("2025-09-21", "Paid to PVR Cinemas Tag: # Entertainment UPI ID: pvr@axis", 600_00),
    t("2025-09-25", "Paid to Google One storage", 130_00),
  ]);
  assert.deepEqual(r.txns.map((x) => x.c.category), ["Entertainment", "Entertainment", "Subscriptions"]);
  assert.deepEqual(r.facts!.subscriptions.map((s) => [s.counterparty, s.frequency, s.possible]), [["GOOGLE ONE STORAGE", "seen once", true]]);
  assert.equal(r.facts!.subscriptionLikeSpending, 130_00);
  assert.equal(r.facts!.detectedSubscriptionsMonthly, 0);
  assert.equal(r.facts!.recurring.some((x) => x.isSubscription), false);
});

test("Top merchants, institutions and people hold only their own kinds", () => {
  const f = runEngine([
    t("2025-07-01", "UPI-SWIGGY-swiggy@icici", 300_00),
    t("2025-07-02", "Paid to Hotel Neelkamal UPI ID: neelkamal@okaxis", 1800_00),
    t("2025-07-03", "UPI/DR/1/AARAV MEHTA/SBIN/aarav.m@oksbi/", 500_00),
    t("2025-07-04", "UPI/DR/1/FINANCE DEPARTMENT GOVT OF INDIA/SBIN/ntrp.gov@sbi/challan fee", 500_00),
    t("2025-07-05", "Paid to State Bank UPI UPI ID: sbi.coll@sbi", 200_00),
  ]).facts!;
  assert.deepEqual(f.topMerchants.map((b) => b.key).sort(), ["HOTEL NEELKAMAL", "SWIGGY"]);
  assert.deepEqual(f.topPeopleOut.map((b) => b.key), ["AARAV MEHTA"]);
  assert.deepEqual(f.topInstitutions.map((b) => b.key).sort(), ["FINANCE DEPARTMENT GOVT OF INDIA", "STATE BANK"]);
});

test("Recurring: groups, average amount; an EMI is never a subscription", () => {
  const f = runEngine([
    ...["2025-07-05", "2025-08-05", "2025-09-05"].map((d) => t(d, "NAVYA FINSERV EMI", 2500_00)),
    ...["2025-07-12", "2025-08-12", "2025-09-12"].map((d, i) => t(d, "NETFLIX", (199 + i * 10) * 100)),
  ]).facts!;
  const by = Object.fromEntries(f.recurring.map((r) => [r.counterparty, r]));
  assert.equal(by["NAVYA FINSERV EMI"]!.group, "debt");
  assert.equal(by["NETFLIX"]!.group, "subscription");
  assert.equal(by["NETFLIX"]!.averageAmount, 209_00);
});

test("Uncertain = automatic and below 0.5; a user decision removes it from the count", () => {
  const raw = [t("2025-07-01", "XQ 0099 ZZ", 300_00), t("2025-07-02", "UPI/DR/1/AARAV MEHTA/SBIN/aarav.m@oksbi/", 500_00)];
  assert.equal(runEngine(raw).facts!.lowConfidence, 1);
  assert.equal(runEngine(raw, [], [{ txnId: raw[0]!.id, set: { type: "SPENDING", category: "Other spending" } }]).facts!.lowConfidence, 0);
});

test("A user's kind correction (person → merchant) wins over every automatic rule", () => {
  const raw = [t("2025-07-01", "UPI/DR/1/AARAV MEHTA/SBIN/aarav.m@oksbi/", 500_00)];
  const r = runEngine(raw, [{ id: "r", counterparty: "AARAV MEHTA", set: { type: "SPENDING", category: "Groceries", kind: "merchant" } }]);
  assert.deepEqual([r.txns[0]!.c.type, r.txns[0]!.c.counterparty.kind, r.txns[0]!.c.layer], ["SPENDING", "merchant", "user-rule"]);
  assert.deepEqual(r.facts!.topMerchants.map((b) => b.key), ["AARAV MEHTA"]);
  assert.deepEqual(r.facts!.topPeopleOut, []);
});

test("Edge cases: zero-value rows, negative balances, missing counterparty", () => {
  const grid = [["Date", "Description", "Debit", "Credit", "Balance"], ["01/07/2025", "ZERO ROW", "0.00", "0.00", "100.00"], ["02/07/2025", "ATM WDL", "500.00", "", "400.00 Dr"]];
  const ex = extractTransactions(grid, detectHeader(grid)!);
  assert.equal(ex.txns.length, 1);
  assert.equal(ex.skipped, 1);
  assert.equal(ex.txns[0]!.balance, -40000);
  assert.equal(balanceCheck([{ id: 0, date: "2025-07-01", narration: "a", debit: 0, credit: 10000, balance: -30000 }, { id: 1, date: "2025-07-02", narration: "b", debit: 5000, credit: 0, balance: -35000 }]).ok, true);
  const empty = classifyOne(t("2025-07-03", "", 100_00));
  assert.equal(empty.type, "UNKNOWN");
  assert.ok(empty.reasons.length > 0);
});

test("10,000+ transactions: every one classified, totals exact, fast", () => {
  const names = ["UPI-SWIGGY-swiggy@icici", "UPI/DR/1/AARAV MEHTA/SBIN/aarav.m@oksbi/", "NAVYA FINSERV EMI", "ATM WDL", "UPI/CR/2/RIYA KAPOOR/SBIN/riya@oksbi/", "NEFT SALARY ORBIT PVT LTD", "NEFT*SBIN*PFMS 001", "XQ 0099"];
  const raw: RawTxn[] = Array.from({ length: 12_000 }, (_, i) => {
    const s = names[i % names.length]!;
    const credit = /\/CR\/|SALARY|PFMS/.test(s);
    return { id: `big:${i}`, sourceFileId: "big", date: new Date(Date.UTC(2024, 0, 1) + Math.floor(i / 16) * 86_400_000).toISOString().slice(0, 10), description: s, debit: credit ? 0 : 1_00 + (i % 97), credit: credit ? 5_00 + (i % 13) : 0, balance: null };
  });
  const t0 = performance.now();
  const r = runEngine(raw);
  const ms = performance.now() - t0;
  assert.equal(r.txns.length, 12_000);
  assert.ok(r.txns.every((x) => x.c.type && x.c.category && x.c.counterparty && x.c.method && x.c.reasons.length && x.c.confidence > 0));
  assert.equal(r.facts!.moneyOutParts.reduce((s, p) => s + p.amount, 0), raw.reduce((s, x) => s + x.debit, 0));
  assert.equal(r.facts!.moneyInParts.reduce((s, p) => s + p.amount, 0), raw.reduce((s, x) => s + x.credit, 0));
  assert.ok(ms < 5000, `took ${Math.round(ms)} ms`);
});

/**
 * Synthetic Paytm-style statement. Invented people, shops, UPI IDs, references, dates and amounts;
 * it reproduces the shapes of a real Paytm export, not any real data.
 */
const SYNTHETIC_PAYTM = [
  "Paytm Statement for",
  "03 JUL'25 - 06 OCT'25 - Rs.37,123.50 + Rs.2,800",
  "Date & Time Transaction Details Notes & Tags Your Account Amount",
  "05 Jul 09:10 AM Paid to Aarav Mehta State Bank Of India - 12 - Rs.1,200",
  "UPI ID: aarav.m@oksbi UPI Ref No: 100000000101",
  "06 Jul 10:00 AM Paid to Shree Ganesh Kirana Store State Bank Of India - 12 - Rs.340.50",
  "UPI ID: 9000000001@ybl UPI Ref No: 100000000102",
  "08 Jul 11:30 AM Paid to Finance Department Govt of India NTRP challan State Bank Of India - 12 - Rs.500",
  "10 Jul 04:00 PM Received from PFMS State Bank Of India - 12 + Rs.2,000",
  "12 Jul 09:00 AM Paid to Zerodha Broking State Bank Of India - 12 - Rs.5,000",
  "15 Jul 08:00 AM Paid to SafeGold Digital Gold State Bank Of India - 12 - Rs.10",
  "15 Jul 08:05 AM Paid to Bajaj Finance State Bank Of India - 12 - Rs.2,500",
  "Page 1 of 3",
  "12 Aug 07:00 AM Paid to Netflix State Bank Of India - 12 - Rs.199",
  "20 Aug 09:45 PM Paid to PVR Cinemas Tag: # Entertainment State Bank Of India - 12 - Rs.600",
  "22 Aug 01:00 PM Paid to Amazon State Bank Of India - 12 - Rs.1,500",
  "25 Aug 02:00 PM Received from Amazon UPI Ref No: 100000000103 refund for order State Bank Of India - 12 + Rs.500",
  "01 Sep 06:00 PM Paid to Kabir Singh State Bank Of India - 12 - Rs.25,000",
  "12 Sep 07:00 AM Paid to Netflix State Bank Of India - 12 - Rs.199",
  "04 Oct 11:11 AM UPI txn 998877660011 State Bank Of India - 12 - Rs.75",
  "05 Oct 06:30 PM Received from Hotel Sunrise UPI Ref No: 100000000104 reversal State Bank Of India - 12 + Rs.300",
];

test("Synthetic Paytm regression: classification, exact reconciliation, partial months", () => {
  const lines = transactionsFromLines(SYNTHETIC_PAYTM);
  assert.equal(lines.method, "signed");
  assert.equal(lines.txns.length, 15);
  const { txns, facts: f, insights } = runEngine(toRaw(lines.txns, "paytm"));
  const by = (name: string) => txns.find((x) => x.c.counterparty.name.startsWith(name))!.c;
  assert.deepEqual([by("AARAV MEHTA").type, by("AARAV MEHTA").counterparty.kind], ["TRANSFER", "person"]);
  assert.deepEqual([by("SHREE GANESH KIRANA STORE").type, by("SHREE GANESH KIRANA STORE").category], ["SPENDING", "Groceries"]);
  assert.equal(by("FINANCE DEPARTMENT GOVT OF INDIA").category, "Taxes & government fees");
  assert.equal(by("FINANCE DEPARTMENT GOVT OF INDIA").counterparty.kind, "government");
  assert.deepEqual([by("PFMS").type, by("PFMS").category], ["TRANSFER", "From government"]);
  assert.equal(by("ZERODHA BROKING").category, "Broker funding");
  assert.equal(by("SAFEGOLD DIGITAL GOLD").type, "INVESTMENT");
  assert.equal(by("BAJAJ FINANCE").type, "DEBT_PAYMENT");
  assert.equal(by("PVR CINEMAS").category, "Entertainment");
  assert.equal(by("HOTEL SUNRISE").type, "REFUND");
  const amazonRefund = txns.find((x) => x.credit && x.c.counterparty.name === "AMAZON")!;
  assert.ok(amazonRefund.c.refundOf);
  const anon = txns.find((x) => /UPI TXN/i.test(x.description))!.c;
  assert.equal(anon.type, "UNKNOWN");
  assert.notEqual(anon.counterparty.kind, "bank", "the user's own bank is never the counterparty");

  assert.deepEqual([f!.raw.moneyOut, f!.raw.moneyIn, f!.netCashFlow], [37_123_50, 2_800_00, -34_323_50]);
  assert.deepEqual(
    { gross: f!.grossSpending, refundLinked: f!.refundsLinked, actual: f!.actualSpending, transfers: f!.transfersOut, platforms: f!.brokerFunding, invest: f!.investmentsConfirmed, debt: f!.debtPayments, unknown: f!.unknownOut, refunds: f!.refundsLinked + f!.refundsUnlinked },
    { gross: 3_338_50, refundLinked: 500_00, actual: 2_838_50, transfers: 31_200_00, platforms: 5_000_00, invest: 10_00, debt: 2_500_00, unknown: 75_00, refunds: 800_00 },
  );
  assert.equal(f!.moneyOutParts.reduce((s, p) => s + p.amount, 0), f!.raw.moneyOut);
  assert.equal(f!.moneyInParts.reduce((s, p) => s + p.amount, 0), f!.raw.moneyIn);
  assert.equal(f!.trueIncome, 0, "government money without income wording is not income");
  assert.deepEqual(f!.subscriptions.map((s) => [s.counterparty, s.frequency]), [["NETFLIX", "monthly"]]);
  assert.deepEqual(f!.monthly.filter((m) => m.partial).map((m) => m.month), ["2025-07", "2025-10"]);
  assert.deepEqual(f!.trends.fullMonths, ["2025-08", "2025-09"]);
  assert.ok(insights!.unusual.some((i) => i.title === "Large transfer" && i.amount === 25_000_00));
  assert.deepEqual(f!.topPeopleOut.map((b) => b.key), ["KABIR SINGH", "AARAV MEHTA"]);
  assert.ok(!f!.topPeopleIn.some((b) => b.key === "PFMS"));
});
