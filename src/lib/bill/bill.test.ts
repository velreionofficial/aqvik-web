import { test } from "node:test";
import assert from "node:assert/strict";

import { formatPaise } from "../gst/money.ts";
import { billFileName, buildBillView, computeBill, validateBill, type BillDraft, type BillLine } from "./bill.ts";

let seq = 0;
const line = (quantity: string, rate: string, discount = "", unit = "NOS"): BillLine => ({
  id: String((seq += 1)),
  description: "Item",
  quantity,
  unit,
  pricing: "rate",
  rate,
  amount: "",
  discount,
});
const r = (p: number) => formatPaise(p, true);

const draft = (over: Partial<BillDraft> = {}): BillDraft => ({
  kind: "bill",
  title: "BILL",
  shop: { name: "Raj General Store", address: "Tehta", phone: "9000000000" },
  number: "1",
  date: "2026-09-26",
  validUntil: "",
  customer: { name: "", phone: "", address: "" },
  lines: [line("2", "45.50"), line("1.5", "120", "", "KGS"), line("1", "500", "10")],
  roundOff: true,
  paymentMode: "Cash",
  amountPaid: "",
  taxNote: "",
  notes: "",
  ...over,
});

test("Bill totals: rate × quantity, kilograms, and a line discount", () => {
  const b = computeBill(draft());
  assert.ok(b);
  assert.deepEqual(b.lines.map((l) => r(l.amount)), ["₹91.00", "₹180.00", "₹450.00"]);
  assert.equal(r(b.subtotal), "₹771.00");
  assert.equal(r(b.totalDiscount), "₹50.00");
  assert.equal(r(b.total), "₹721.00");
  assert.equal(b.words, "Rupees Seven Hundred Twenty-One Only");
});

test("Round off to the rupee (50 paise goes up) and switching it off", () => {
  const up = computeBill(draft({ lines: [line("3", "33.50")] }));
  assert.equal(r(up!.beforeRoundOff), "₹100.50");
  assert.equal(r(up!.total), "₹101.00");
  const off = computeBill(draft({ lines: [line("3", "33.50")], roundOff: false }));
  assert.equal(r(off!.total), "₹100.50");
  assert.equal(off!.words, "Rupees One Hundred and Fifty Paise Only");
});

test("Amount received and balance due", () => {
  const b = computeBill(draft({ amountPaid: "500" }));
  assert.equal(r(b!.paid), "₹500.00");
  assert.equal(r(b!.balance), "₹221.00");
  assert.ok(validateBill(draft({ amountPaid: "800" })).amountPaid);
});

test("A total-amount line gives the rate per unit", () => {
  const b = computeBill(draft({ lines: [{ ...line("4", ""), pricing: "amount", amount: "1000" }] }));
  assert.equal(r(b!.lines[0]!.ratePaise), "₹250.00");
  assert.equal(r(b!.total), "₹1,000.00");
});

test("Quotations never show payment and check the valid-until date", () => {
  const q = draft({ kind: "quotation", title: "QUOTATION", amountPaid: "500", validUntil: "2026-10-10", taxNote: "Taxes extra as applicable" });
  const b = computeBill(q)!;
  assert.equal(b.paid, 0);
  const view = buildBillView(q, b);
  assert.deepEqual(view.payment, []);
  assert.deepEqual(view.details[2], ["Valid until", "10-10-2026"]);
  assert.equal(view.taxNote, "Taxes extra as applicable");
  assert.ok(validateBill({ ...q, validUntil: "2026-09-01" }).validUntil);
});

test("No tax lines ever appear on a simple bill", () => {
  const view = buildBillView(draft(), computeBill(draft())!);
  const text = JSON.stringify(view);
  assert.doesNotMatch(text, /GST|CGST|SGST|IGST|TAX INVOICE|Bill of Supply/i);
});

test("Required fields and file name", () => {
  const e = validateBill(draft({ shop: { name: "", address: "", phone: "abc" }, number: "" }));
  assert.ok(e["shop.name"] && e["shop.phone"] && e.number);
  assert.equal(billFileName("BILL/0001", "2026-09-26", "bill"), "BILL_0001_2026-09-26.pdf");
});
