import { test } from "node:test";
import assert from "node:assert/strict";

import { analyse, enrich } from "./analyze.ts";
import { categorize, payeeOf } from "./categorize.ts";
import { detectHeader, extractTransactions, problemReport } from "./detect.ts";
import { parseAmount, parseDate, parseDelimited } from "./parse.ts";
import { layoutGrid, type TextItem } from "./pdf-layout.ts";
import { SAMPLE_CSV } from "./sample.ts";

test("CSV: quotes, commas inside amounts, blank lines", () => {
  const rows = parseDelimited('a,b,c\n"1,234.50","x ""y""",z\r\n\n,,\n');
  assert.deepEqual(rows, [["a", "b", "c"], ["1,234.50", 'x "y"', "z"]]);
  assert.deepEqual(parseDelimited("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
});

test("Amounts in Indian formats", () => {
  assert.deepEqual(parseAmount("1,23,456.78"), { paise: 12345678, mark: null });
  assert.deepEqual(parseAmount("₹ 250"), { paise: 25000, mark: null });
  assert.deepEqual(parseAmount("(1,000.00)"), { paise: -100000, mark: null });
  assert.deepEqual(parseAmount("500.00 Dr"), { paise: 50000, mark: "dr" });
  assert.deepEqual(parseAmount("Cr 1,200"), { paise: 120000, mark: "cr" });
  assert.deepEqual(parseAmount("+ Rs.99.5"), { paise: 9950, mark: "cr" });
  assert.equal(parseAmount("-"), null);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("abc"), null);
});

test("Dates: day first, month names, ISO, Excel serials", () => {
  assert.equal(parseDate("03/09/2026"), "2026-09-03");
  assert.equal(parseDate("03-09-26"), "2026-09-03");
  assert.equal(parseDate("03 Sep 2026"), "2026-09-03");
  assert.equal(parseDate("03-Sept-2026"), "2026-09-03");
  assert.equal(parseDate("Sep 03, 2026 10:30 am"), "2026-09-03");
  assert.equal(parseDate("2026-09-03T10:00:00"), "2026-09-03");
  assert.equal(parseDate("46268"), "2026-09-03");
  assert.equal(parseDate("31/02/2026"), null);
  assert.equal(parseDate("09/13/2026", "mdy"), "2026-09-13");
});

test("Header detection across common bank layouts", () => {
  const hdfc = detectHeader([["Date", "Narration", "Chq./Ref.No.", "Value Dt", "Withdrawal Amt.", "Deposit Amt.", "Closing Balance"]])!;
  assert.deepEqual(hdfc.mapping, { date: 0, narration: 1, debit: 4, credit: 5, balance: 6 });
  const icici = detectHeader([["S No.", "Value Date", "Transaction Date", "Cheque Number", "Transaction Remarks", "Withdrawal Amount (INR )", "Deposit Amount (INR )", "Balance (INR )"]])!;
  assert.equal(icici.mapping.date, 2, "transaction date beats value date");
  const axis = detectHeader([["Tran Date", "CHQNO", "PARTICULARS", "DR", "CR", "BAL", "SOL"]])!;
  assert.deepEqual(axis.mapping, { date: 0, narration: 2, debit: 3, credit: 4, balance: 5 });
  const kotak = detectHeader([["Sl. No.", "Date", "Description", "Chq / Ref number", "Amount", "Dr / Cr", "Balance", "Dr / Cr"]])!;
  assert.deepEqual(kotak.mapping, { date: 1, narration: 2, amount: 4, drcr: 5, balance: 6 });
  assert.equal(detectHeader([["Name", "Account"], ["x", "y"]]), null);
});

test("Amount + Dr/Cr column, and continuation lines", () => {
  const grid = [
    ["Date", "Description", "Amount", "Dr / Cr", "Balance"],
    ["01/09/2026", "UPI/DR/1/SWIGGY/YESB/swiggy@yes", "250.00", "DR", "750.00"],
    ["", "Order 12345", "", "", ""],
    ["02/09/2026", "NEFT/ACME LTD", "1,000.00", "CR", "1,750.00"],
    ["", "Total", "1,250.00", "", ""],
  ];
  const ex = extractTransactions(grid, detectHeader(grid)!);
  assert.equal(ex.txns.length, 2);
  assert.equal(ex.txns[0]!.debit, 25000);
  assert.match(ex.txns[0]!.narration, /Order 12345$/);
  assert.equal(ex.txns[1]!.credit, 100000);
  assert.equal(ex.skipped, 1);
});

test("Signed amount without a Dr/Cr column", () => {
  const grid = [["Date", "Transaction Details", "Amount"], ["01-09-2026", "Paid to Swiggy", "-250"], ["02-09-2026", "Received from Ankit", "+500"]];
  const ex = extractTransactions(grid, detectHeader(grid)!);
  assert.deepEqual(ex.txns.map((t) => [t.debit, t.credit]), [[25000, 0], [0, 50000]]);
});

test("Payees from UPI, NEFT, ACH and app narrations", () => {
  assert.equal(payeeOf("UPI/DR/412300000001/RAMESH KUMAR/SBIN/ramesh@oksbi/Rent July"), "RAMESH KUMAR");
  assert.equal(payeeOf("UPI-SWIGGY-swiggy@icici-ICIC0DC0099-412300000002-Order"), "SWIGGY");
  assert.equal(payeeOf("UPI/412345/PAYMENT/swiggy@icici/ICICI Bank/abc"), "SWIGGY");
  assert.equal(payeeOf("ACH D- ZERODHA BROKING-SIP JUL"), "ZERODHA BROKING");
  assert.equal(payeeOf("Paid to Swiggy Transaction ID T123"), "SWIGGY");
  assert.equal(payeeOf("SALARY JUL 2026 ACME TECHNOLOGIES PVT LTD"), payeeOf("SALARY AUG 2026 ACME TECHNOLOGIES PVT LTD"));
});

test("Categories", () => {
  assert.equal(categorize("UPI-SWIGGY-swiggy@icici", "debit"), "Food & dining");
  assert.equal(categorize("NACH-HDFC BANK LTD-PERSONAL LOAN EMI", "debit"), "EMI & loans");
  assert.equal(categorize("ATM WDL-ATM CASH 0123", "debit"), "Cash withdrawal");
  assert.equal(categorize("UPI/DR/1/PRIYA SINGH/PUNB/priya@ybl/Udhaar", "debit"), "Sent to people");
  assert.equal(categorize("TORRENT POWER LTD", "debit"), "Bills & recharges");
  assert.equal(categorize("PAYMENT TO PARENT", "debit"), "Other spending", "RENT inside PARENT is not rent");
  assert.equal(categorize("SALARY SEP 2026", "credit"), "Salary");
  assert.equal(categorize("UPI/CR/1/ANKIT/UTIB/ankit@okaxis", "credit"), "Received from people");
});

const sample = () => {
  const grid = parseDelimited(SAMPLE_CSV);
  const header = detectHeader(grid)!;
  return { grid, header, ex: extractTransactions(grid, header) };
};

test("Sample statement: 34 transactions, totals add up to the closing balance", () => {
  const { ex } = sample();
  assert.equal(ex.txns.length, 34);
  assert.equal(ex.skipped, 1); // the closing-balance line
  const a = analyse(enrich(ex.txns))!;
  assert.equal(a.moneyIn, 1_67_712_00);
  assert.equal(a.moneyOut, 97_468_20);
  assert.equal(a.openingBalance, 7_450_00);
  assert.equal(a.closingBalance, 77_693_80);
  assert.equal(a.openingBalance! + a.net, a.closingBalance);
  assert.deepEqual([a.from, a.to], ["2026-07-01", "2026-09-30"]);
  assert.equal(a.cash, 5_000_00);
  assert.equal(a.charges, 17_70);
});

test("Sample statement: spending by category", () => {
  const a = analyse(enrich(sample().ex.txns))!;
  const by = Object.fromEntries(a.spending.map((b) => [b.key, b.amount]));
  assert.deepEqual(by, {
    Rent: 42_000_00,
    "EMI & loans": 18_600_00,
    Investments: 15_000_00,
    Shopping: 5_698_00,
    "Cash withdrawal": 5_000_00,
    Groceries: 3_315_50,
    "Food & dining": 2_417_00,
    "Travel & fuel": 1_845_00,
    "Sent to people": 1_500_00,
    Health: 780_00,
    "Bills & recharges": 698_00,
    Subscriptions: 597_00,
    "Bank charges": 17_70,
  });
  assert.equal(a.spending.reduce((s, b) => s + b.amount, 0), a.moneyOut);
});

test("Sample statement: recurring debits found, food orders and two-month bills are not", () => {
  const a = analyse(enrich(sample().ex.txns))!;
  assert.deepEqual(
    a.recurring.map((r) => [r.payee, r.typical, r.months, r.next]),
    [
      ["RAMESH KUMAR", 14_000_00, 3, "2026-10-03"],
      ["PERSONAL LOAN EMI", 6_200_00, 3, "2026-10-06"],
      ["ZERODHA BROKING", 5_000_00, 3, "2026-10-06"],
      ["NETFLIX", 199_00, 3, "2026-10-13"],
    ],
  );
  assert.equal(a.topPayees[0]!.key, "RAMESH KUMAR");
  assert.equal(a.months.length, 3);
});

test("A user's category change is respected", () => {
  const { ex } = sample();
  const priya = ex.txns.find((t) => /PRIYA/.test(t.narration))!;
  const a = analyse(enrich(ex.txns, { [priya.id]: "Other spending" }))!;
  assert.equal(a.spending.find((b) => b.key === "Sent to people"), undefined);
});

test("PDF layout: PhonePe-style lines become a table", () => {
  const items: TextItem[] = [
    { str: "Date", x: 50, y: 700, width: 25, page: 1 },
    { str: "Transaction Details", x: 120, y: 700, width: 95, page: 1 },
    { str: "Type", x: 380, y: 700, width: 25, page: 1 },
    { str: "Amount", x: 450, y: 700, width: 40, page: 1 },
    { str: "Sep 01, 2026", x: 50, y: 680, width: 55, page: 1 },
    { str: "Paid to Swiggy", x: 120, y: 680, width: 70, page: 1 },
    { str: "DEBIT", x: 380, y: 680, width: 30, page: 1 },
    { str: "₹250", x: 466, y: 680, width: 24, page: 1 },
    { str: "10:30 am", x: 50, y: 668, width: 35, page: 1 },
    { str: "Transaction ID T123", x: 120, y: 668, width: 90, page: 1 },
    { str: "Sep 02, 2026", x: 50, y: 650, width: 55, page: 2 },
    { str: "Received from Ankit", x: 120, y: 650, width: 90, page: 2 },
    { str: "CREDIT", x: 380, y: 650, width: 34, page: 2 },
    { str: "₹1,500", x: 458, y: 650, width: 32, page: 2 },
  ];
  const grid = layoutGrid(items);
  assert.deepEqual(grid[0], ["Date", "Transaction Details", "Type", "Amount"]);
  const ex = extractTransactions(grid, detectHeader(grid)!);
  assert.equal(ex.txns.length, 2);
  assert.deepEqual([ex.txns[0]!.date, ex.txns[0]!.debit, ex.txns[1]!.credit], ["2026-09-01", 25000, 150000]);
  assert.match(ex.txns[0]!.narration, /Transaction ID T123/);
});

test("Problem report shows structure only", () => {
  const { grid, header, ex } = sample();
  const report = problemReport("csv", grid, header, ex);
  assert.match(report, /Header words: txn date \| value date \| description/);
  assert.doesNotMatch(report, /RAMESH|SWIGGY|55,000|ramesh@/i);
});

import { latestFullDate, transactionsFromLines } from "./text-lines.ts";

test("Text-line fallback: Paytm-style lines with dates that have no year", () => {
  const lines = [
    "Prakash Raj",
    "Paytm Statement for 05 Jul'26 - 04 Oct'26",
    "Date & Time Transaction Details Notes & Tags Your Account Amount",
    "04 Oct 09:15 PM Paid to Swiggy State Bank Of India - 12 - Rs.250",
    "UPI ID: swiggy@icici",
    "UPI Ref No: 412300000001",
    "02 Oct 11:02 AM Received from ANKIT SHARMA State Bank Of India - 12 + Rs.1,500",
    "Page 1 of 9",
    "28 Dec 08:00 PM Paid to Airtel Prepaid #Bills - Rs.349",
  ];
  assert.equal(latestFullDate(lines), "2026-10-04");
  const r = transactionsFromLines(lines);
  assert.deepEqual(
    r.txns.map((t) => [t.date, t.debit, t.credit]),
    [["2026-10-04", 25000, 0], ["2026-10-02", 0, 150000], ["2025-12-28", 34900, 0]],
  );
  assert.match(r.txns[0]!.narration, /^PM Paid to Swiggy|^Paid to Swiggy/);
  assert.match(r.txns[0]!.narration, /swiggy@icici/);
});

test("Text-line fallback: Google Pay-style dates and amounts", () => {
  const lines = ["Transaction statement period 01 September 2026 - 30 September 2026", "01 Sep, 2026 Paid to Swiggy ₹250", "10:30 AM UPI Transaction ID: 412300000001", "03 Sep, 2026 Received from Ankit ₹1,500.50"];
  const r = transactionsFromLines(lines);
  assert.deepEqual(r.txns.map((t) => [t.date, t.debit, t.credit]), [["2026-09-01", 25000, 0], ["2026-09-03", 0, 150050]]);
});

test("Dates with an apostrophe year", () => {
  assert.equal(parseDate("05 Jul'26"), "2026-07-05");
  assert.equal(parseDate("04 Oct 09:15 PM"), null);
});

test("Text-line fallback: period line is not an entry; signed amount beats a figure in the description", () => {
  const lines = [
    "Paytm Statement for",
    "5 JUL'26 - 4 OCT'26 - Rs.2,31,396.84 + Rs.1,09,465.71",
    "11 Jul Automatic payment of ₹2000 setup for Some Fund Tag: - Rs.2,000",
    "12 Jul Paid to Kirana Store - Rs.89",
    "13 Jul Transferred to Self, # Self Transfer Rs.5,000",
    "14 Jul Received from Ankit + Rs.500",
    "15 Jul Paid to Tea Stall - Rs.20",
  ];
  const r = transactionsFromLines(lines);
  // 4 of 5 entries are signed, so the unsigned self transfer is left out (as Paytm's totals do).
  assert.deepEqual(r.txns.map((t) => [t.date, t.debit, t.credit]), [
    ["2026-07-11", 200000, 0],
    ["2026-07-12", 8900, 0],
    ["2026-07-14", 0, 50000],
    ["2026-07-15", 2000, 0],
  ]);
});

test("Self transfers are kept out of money in and money out", () => {
  const txns = [
    { id: 0, date: "2026-09-01", narration: "SALARY ACME", debit: 0, credit: 50_000_00, balance: null },
    { id: 1, date: "2026-09-02", narration: "IMPS TRANSFER TO SELF A/C 1234", debit: 20_000_00, credit: 0, balance: null },
    { id: 2, date: "2026-09-03", narration: "UPI-SWIGGY-swiggy@icici", debit: 500_00, credit: 0, balance: null },
  ];
  const a = analyse(enrich(txns))!;
  assert.deepEqual([a.moneyIn, a.moneyOut, a.selfOut, a.count], [50_000_00, 500_00, 20_000_00, 3]);
  assert.equal(a.spending.some((b) => b.key === "Self transfer"), false);
});

test("UPI app tags pick the category", () => {
  assert.equal(categorize("Paid to Patel Store Tag: # Groceries UPI ID: x@okaxis", "debit"), "Groceries");
  assert.equal(categorize("Paid to Kachru Tag: # Food UPI Ref No: 1", "debit"), "Food & dining");
});

test("PDF layout: a header split over two lines (SBI style)", () => {
  const it = (str: string, x: number, y: number): TextItem => ({ str, x, y, width: str.length * 4.2, page: 1 });
  const items: TextItem[] = [
    it("Welcome:", 40, 800),
    it("Txn", 40, 700), it("Value", 100, 700), it("Description", 170, 700), it("Ref No./Cheque", 330, 700), it("Debit", 430, 700), it("Credit", 490, 700), it("Balance", 545, 700),
    it("Date", 40, 690), it("Date", 100, 690), it("No.", 330, 690),
    it("1 Jul 2026", 40, 670), it("1 Jul 2026", 100, 670), it("BY TRANSFER-UPI/CR/412300000006/", 170, 670), it("TRANSFER FROM", 330, 670), it("2,500.00", 498, 670), it("12,500.00", 548, 670),
    it("ANKIT SHARMA/UTIB/ankit@okaxis/", 170, 660),
    it("2 Jul 2026", 40, 640), it("2 Jul 2026", 100, 640), it("TO TRANSFER-UPI/DR/412300000001/", 170, 640), it("TRANSFER TO", 330, 640), it("456.00", 446, 640), it("12,044.00", 548, 640),
  ];
  const grid = layoutGrid(items);
  assert.deepEqual(grid[0], ["Txn Date", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance"]);
  const ex = extractTransactions(grid, detectHeader(grid)!);
  assert.deepEqual(ex.txns.map((t) => [t.date, t.debit, t.credit, t.balance]), [["2026-07-01", 0, 250000, 1250000], ["2026-07-02", 45600, 0, 1204400]]);
  assert.match(ex.txns[0]!.narration, /ANKIT SHARMA/);
});

test("Unsigned bank PDF lines: amount then balance, direction from the balance", () => {
  const lines = [
    "Welcome:",
    "Statement from 01-07-2026 to 04-10-2026",
    "Txn Date Value Date Description Ref No./Cheque No. Debit Credit Balance",
    "1 Jul 2026 1 Jul 2026 Opening Balance 10,000.00",
    "1 Jul 2026 1 Jul 2026 BY TRANSFER-UPI/CR/412300000006/ TRANSFER FROM 2,500.00 12,500.00",
    "ANKIT SHARMA/UTIB/ankit@okaxis/",
    "2 Jul 2026 2 Jul 2026 TO TRANSFER-UPI/DR/412300000001/ TRANSFER TO 456.00 12,044.00",
    "SWIGGY/YESB/swiggy@yes/",
    "5 Jul 2026 5 Jul 2026 ATM WDL-ATM CASH 0123 1,000.00 11,044.00",
  ];
  const r = transactionsFromLines(lines);
  assert.deepEqual(r.txns.map((t) => [t.date, t.debit, t.credit, t.balance]), [
    ["2026-07-01", 0, 250000, 1250000],
    ["2026-07-02", 45600, 0, 1204400],
    ["2026-07-05", 100000, 0, 1104400],
  ]);
  assert.match(r.txns[0]!.narration, /^BY TRANSFER.*ANKIT SHARMA/);
});

test("Unsigned bank PDF lines, newest first", () => {
  const lines = [
    "05/07/2026 ATM WDL-ATM CASH 1,000.00 11,044.00",
    "02/07/2026 UPI/DR/1/SWIGGY 456.00 12,044.00",
    "01/07/2026 UPI/CR/2/ANKIT 2,500.00 12,500.00",
    "30/06/2026 NEFT ACME SALARY 5,000.00 10,000.00",
  ];
  const r = transactionsFromLines(lines);
  assert.deepEqual(r.txns.map((t) => [t.date, t.debit, t.credit]), [
    ["2026-07-01", 0, 250000],
    ["2026-07-02", 45600, 0],
    ["2026-07-05", 100000, 0],
  ]);
});

import { reconcileWithBalance } from "./detect.ts";

test("Balance check repairs amounts placed in the wrong column", () => {
  const txns = [
    { id: 0, date: "2026-07-01", narration: "DEP TFR UPI/CR/1/ANKIT", debit: 250000, credit: 0, balance: 1250000 },
    { id: 1, date: "2026-07-02", narration: "WDL TFR UPI/DR/2/SWIGGY", debit: 45600, credit: 0, balance: 1204400 },
    { id: 2, date: "2026-07-03", narration: "DEP TFR NEFT ACME", debit: 500000, credit: 0, balance: 1704400 },
  ];
  const r = reconcileWithBalance(txns);
  assert.deepEqual(r.txns.map((t) => [t.debit, t.credit]), [[250000, 0], [45600, 0], [0, 500000]]);
  assert.equal(r.fixed, 1); // the first entry has no earlier balance, so it is left alone
});

test("SBI codes are not payee names; loan mandates and broking are categorised", () => {
  assert.equal(payeeOf("WDL TFR UPI/DR/412300000001/RAMESH KUMAR/SBIN/ramesh@oksbi/Paym"), "RAMESH KUMAR");
  assert.equal(payeeOf("DEP TFR UPI/CR/412300000006/ANKIT SHARMA/UTIB/ankit@okaxis/"), "ANKIT SHARMA");
  assert.equal(categorize("DEBIT CMP MANDATE DEBIT TATA CAPITAL LT", "debit"), "EMI & loans");
  assert.equal(categorize("WDL TFR FOR TRADING OF SBICAP SECURIT", "debit"), "Investments");
  assert.equal(categorize("DEBIT SCHG/TIPS 26AUG26", "debit"), "Bank charges");
});

import { balanceCheck, findOpeningBalance } from "./detect.ts";

test("Entries whose figures are on their second line, and page footers that must not join", () => {
  const grid = [
    ["Txn Date", "Description", "Debit", "Credit", "Balance"],
    ["01/07/2026", "UPI/CR/1/ANKIT SHARMA", "", "", ""],
    ["", "Trip share", "", "2,500.00", "12,500.00"],
    ["02/07/2026", "UPI/DR/2/SWIGGY", "456.00", "", "12,044.00"],
    ["", "Page 1 of 3", "", "", ""],
    ["", "Total", "456.00", "2,500.00", ""],
    ["Txn Date", "Description", "Debit", "Credit", "Balance"],
    ["03/07/2026", "ATM WDL", "1,000.00", "", "11,044.00"],
    ["", "Closing Balance", "", "", "11,044.00"],
  ];
  const ex = extractTransactions(grid, detectHeader(grid)!);
  assert.deepEqual(ex.txns.map((t) => [t.date, t.debit, t.credit, t.balance]), [
    ["2026-07-01", 0, 250000, 1250000],
    ["2026-07-02", 45600, 0, 1204400],
    ["2026-07-03", 100000, 0, 1104400],
  ]);
  assert.match(ex.txns[0]!.narration, /ANKIT SHARMA Trip share/);
  assert.equal(ex.skipped, 4);
});

test("Opening balance, balance check, and the first entry's direction", () => {
  assert.equal(findOpeningBalance(["Account Name: X", "Balance as on 1 Apr 2026 : 10,000.00"]), 10_000_00);
  assert.equal(findOpeningBalance(["Opening Balance 770.11 Cr"]), 770_11);
  const txns = [
    { id: 0, date: "2026-07-01", narration: "A", debit: 250000, credit: 0, balance: 1250000 }, // wrong column
    { id: 1, date: "2026-07-02", narration: "B", debit: 45600, credit: 0, balance: 1204400 },
  ];
  assert.equal(balanceCheck(txns, 10_000_00).ok, false);
  const fixed = reconcileWithBalance(txns, 10_000_00).txns;
  assert.deepEqual(fixed.map((t) => [t.debit, t.credit]), [[0, 250000], [45600, 0]]);
  assert.deepEqual(balanceCheck(fixed, 10_000_00), { hasBalances: true, checked: 2, matched: 2, ok: true });
  // A missing row shows up as a balance that does not follow.
  const gap = [fixed[0]!, { ...fixed[1]!, balance: 1104400 }];
  assert.equal(balanceCheck(gap, 10_000_00).ok, false);
});

test("Sample statement passes the balance check", () => {
  const { ex } = sample();
  const c = balanceCheck(ex.txns);
  assert.equal(c.ok, true);
  assert.equal(c.checked, 33);
});

test("Bank PDF lines with '-' in the empty Debit or Credit column are not 'money out'", () => {
  const lines = [
    "Balance as on 1 Apr 2026 : 770.11",
    "1 Apr 2026 1 Apr 2026 DEP TFR UPI/CR/412300000006/ANKIT SHARMA/UTIB/ankit@okaxis/ - 2,500.00 3,270.11",
    "2 Apr 2026 2 Apr 2026 WDL TFR UPI/DR/412300000001/SWIGGY/YESB/swiggy@yes/ 456.00 - 2,814.11",
    "3 Apr 2026 3 Apr 2026 DEP TFR NEFT ACME - 1,000.00 3,814.11",
  ];
  const r = transactionsFromLines(lines);
  assert.equal(r.method, "balance");
  assert.deepEqual(r.txns.map((t) => [t.debit, t.credit, t.balance]), [[0, 250000, 327011], [45600, 0, 281411], [0, 100000, 381411]]);
  assert.deepEqual(balanceCheck(r.txns, findOpeningBalance(lines)), { hasBalances: true, checked: 3, matched: 3, ok: true });
});

test("Only ₹/Rs-signed statements count as UPI app statements", () => {
  const app = transactionsFromLines(["04 Oct Paid to Swiggy - Rs.250", "03 Oct Received from Ankit + Rs.500", "02 Oct Paid to Shop - Rs.20"], "2026-10-05");
  assert.equal(app.method, "signed");
  const attached = transactionsFromLines(["04/10/2026 Swiggy -250.00", "03/10/2026 Ankit +500.00"]);
  assert.equal(attached.method, "other");
});

test("SBI page footer 'Page no. 1 Balance ...' never joins an entry", () => {
  const lines = [
    "Balance as on 1 Apr 2026 : 3,770.11",
    "3 Apr 2026 3 Apr 2026 WDL TFR 004112896167 9 OF SBICAP 2,000.00 - 1,770.11",
    "SECURITIES LTD AT 10771 MAKHDUMPUR",
    "Page no. 1 Balance carried forward 1,770.11",
    "4 Apr 2026 4 Apr 2026 DEP TFR NEFT PAYTM MONEY - 2,000.00 3,770.11",
  ];
  const r = transactionsFromLines(lines);
  assert.deepEqual(r.txns.map((t) => [t.debit, t.credit, t.balance]), [[200000, 0, 177011], [0, 200000, 377011]]);
  assert.doesNotMatch(r.txns[0]!.narration, /Page|carried/);
  assert.equal(balanceCheck(r.txns, findOpeningBalance(lines)).ok, true);
});
