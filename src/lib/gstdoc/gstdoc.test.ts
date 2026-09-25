import { test } from "node:test";
import assert from "node:assert/strict";

import type { LineDraft } from "../gst/invoice.ts";
import { formatPaise } from "../gst/money.ts";
import { panNeeded, receipts, receiptText, stampNeeded, validateRent, type RentDraft } from "../rent/rent-receipt.ts";
import { buildBosView, COMPOSITION_DECLARATION, computeBos, validateBos, type BosDraft } from "./bill-of-supply.ts";
import { buildChallanView, computeChallan, validateChallan, type ChallanDraft } from "./delivery-challan.ts";
import { buildNoteView, computeNote, creditNoteDeadline, lateInvoices, noteBlockReason, validateNote, type NoteDraft } from "./credit-debit-note.ts";

const r = (p: number) => formatPaise(p, true);
let seq = 0;
const line = (quantity: string, rate: string, gstRate = "18", hsn = "2523"): LineDraft => ({
  id: String((seq += 1)),
  kind: "goods",
  category: "",
  description: "Cement",
  hsn,
  details: "",
  quantity,
  unit: "BAG",
  pricing: "rate",
  rate,
  amount: "",
  discount: "",
  gstRate,
  customRate: "",
});

const GJ = "24AAACC1206D1ZM"; // valid GSTIN, Gujarat (24)
const MH = "27AAPFU0939F1ZV"; // valid GSTIN, Maharashtra (27)

const bos = (over: Partial<BosDraft> = {}): BosDraft => ({
  issuer: "composition",
  turnover: "upto5",
  supplier: { legalName: "Raj Traders", tradeName: "", address: "Surat", gstin: GJ, phone: "" },
  number: "BOS/1",
  date: "2026-09-26",
  recipient: { registered: false, name: "", address: "", gstin: "" },
  lines: [line("10", "380"), { ...line("3", "33.50"), discount: "" }],
  roundOff: true,
  notes: "",
  ...over,
});

test("Bill of Supply never adds tax, even when a line had a GST rate", () => {
  const result = computeBos(bos())!;
  assert.equal(r(result.taxable), "₹3,900.50");
  assert.equal(result.cgst + result.sgst + result.igst, 0);
  assert.equal(r(result.grand), "₹3,901.00");
  assert.equal(result.words, "Rupees Three Thousand Nine Hundred One Only");
});

test("Composition declaration is printed at the top, only for composition", () => {
  const view = buildBosView(bos(), computeBos(bos())!);
  assert.equal(view.topNote, COMPOSITION_DECLARATION);
  assert.equal(view.title, "BILL OF SUPPLY");
  assert.doesNotMatch(JSON.stringify(view), /CGST|SGST|IGST|TAX INVOICE/);
  const exempt = buildBosView(bos({ issuer: "exempt" }), computeBos(bos())!);
  assert.equal(exempt.topNote, undefined);
});

test("Bill of Supply validation: GSTIN, 16-character number, registered recipient", () => {
  const e = validateBos(bos({ supplier: { legalName: "", tradeName: "", address: "", gstin: "24AAACC1206D1ZX", phone: "" }, number: "BOS/2026-27/000001", recipient: { registered: true, name: "", address: "", gstin: "" } }));
  assert.ok(e["supplier.legalName"] && e["supplier.gstin"] && e.number && e["recipient.gstin"]);
  assert.match(e.number!, /bill number/);
  assert.deepEqual(validateBos(bos()), {});
});

const challan = (over: Partial<ChallanDraft> = {}): ChallanDraft => ({
  purpose: "job-work",
  copy: "ORIGINAL FOR CONSIGNEE",
  consigner: { registered: true, name: "Raj Traders", address: "Surat", gstin: GJ, stateCode: "" },
  consignee: { registered: false, name: "Job worker", address: "Mumbai", gstin: "", stateCode: "27" },
  number: "DC/1",
  date: "2026-09-26",
  provisionalQuantity: false,
  lines: [line("100", "380")],
  transport: { vehicle: "gj05ab1234", transporter: "", eWayBill: "" },
  notes: "",
  ...over,
});

test("Challan for job work: value only, place of supply when inter-State, copy label", () => {
  const result = computeChallan(challan())!;
  assert.equal(result.withTax, false);
  assert.equal(result.intraState, false);
  const view = buildChallanView(challan(), result);
  assert.equal(view.copyLabel, "ORIGINAL FOR CONSIGNEE");
  assert.deepEqual(view.details.find(([k]) => k === "Place of supply"), ["Place of supply", "Maharashtra (27)"]);
  assert.deepEqual(view.grand, ["Total value", "₹38,000.00"]);
  assert.ok(!view.columns.some((c) => c.label.includes("GST")));
  assert.deepEqual(view.details.find(([k]) => k === "Vehicle No."), ["Vehicle No.", "GJ05AB1234"]);
});

test("Challan for supply shows tax (IGST inter-State, CGST+SGST within the State)", () => {
  const inter = computeChallan(challan({ purpose: "invoice-later" }))!;
  assert.equal(r(inter.igst), "₹6,840.00");
  const intra = computeChallan(challan({ purpose: "liquid-gas", consignee: { registered: false, name: "A", address: "B", gstin: "", stateCode: "24" } }))!;
  assert.deepEqual([r(intra.cgst), r(intra.sgst), r(intra.total)], ["₹3,420.00", "₹3,420.00", "₹44,840.00"]);
  const view = buildChallanView(challan({ purpose: "liquid-gas", provisionalQuantity: true }), inter);
  assert.match(view.rows[0]![3]!, /prov\./);
});

test("Challan validation needs a purpose and the consignee's state", () => {
  const e = validateChallan(challan({ purpose: "", consignee: { registered: false, name: "", address: "", gstin: "", stateCode: "" } }));
  assert.ok(e.purpose && e["consignee.stateCode"] && e["consignee.name"]);
});

const note = (over: Partial<NoteDraft> = {}): NoteDraft => ({
  type: "credit",
  turnover: "upto5",
  eInvoiceExempt: false,
  sezOrExport: false,
  reverseCharge: false,
  supplier: { legalName: "Raj Traders", tradeName: "", address: "Surat", gstin: GJ, phone: "" },
  number: "CN/1",
  date: "2026-09-26",
  originals: [{ id: "o1", number: "INV/42", date: "2026-09-01" }],
  reason: "Goods returned by the recipient",
  recipient: { registered: true, name: "Buyer", address: "Mumbai", gstin: MH, stateCode: "" },
  placeOfSupply: "27",
  lines: [line("10", "380")],
  notes: "",
  ...over,
});

test("Credit note: IGST inter-State, reference to the original invoice, nature of document", () => {
  const result = computeNote(note())!;
  assert.deepEqual([r(result.taxable), r(result.igst), r(result.total)], ["₹3,800.00", "₹684.00", "₹4,484.00"]);
  const view = buildNoteView(note(), result);
  assert.equal(view.title, "CREDIT NOTE");
  assert.deepEqual(view.details[0], ["Nature of document", "Credit note"]);
  assert.deepEqual(view.details.find(([k]) => k === "Against invoice No."), ["Against invoice No.", "INV/42"]);
  assert.deepEqual(view.grand, ["Total credited", "₹4,484.00"]);
});

test("Debit note within the State splits CGST and SGST", () => {
  const result = computeNote(note({ type: "debit", placeOfSupply: "24" }))!;
  assert.deepEqual([r(result.cgst), r(result.sgst)], ["₹342.00", "₹342.00"]);
  assert.equal(buildNoteView(note({ type: "debit" }), result).title, "DEBIT NOTE");
});

test("Notes follow the e-invoice limits and date order", () => {
  assert.ok(noteBlockReason(note({ turnover: "above500" })));
  assert.ok(noteBlockReason(note({ turnover: "5to500" })));
  assert.equal(noteBlockReason(note({ turnover: "5to500", eInvoiceExempt: true })), null);
  assert.ok(noteBlockReason(note({ sezOrExport: true })));
  const e = validateNote(note({ originals: [{ id: "o1", number: "", date: "2026-10-01" }] }));
  assert.ok(e["originals.o1.number"] && e["originals.o1.date"]);
  const dup = validateNote(note({ originals: [{ id: "a", number: "INV/1", date: "2026-09-01" }, { id: "b", number: "inv/1", date: "2026-09-02" }] }));
  assert.ok(dup["originals.b.number"]);
  assert.deepEqual(validateNote(note()), {});
});

const rent = (over: Partial<RentDraft> = {}): RentDraft => ({
  tenant: "Amit Kumar",
  landlord: "Suresh Singh",
  landlordPan: "",
  landlordAddress: "",
  property: "Flat 2, Patna",
  monthlyRent: "9000",
  from: "2026-04",
  to: "2027-03",
  mode: "Bank transfer",
  receiptDay: "last",
  ...over,
});

test("Rent receipts: one per month across the year end, last day of each month", () => {
  const list = receipts(rent())!;
  assert.equal(list.length, 12);
  assert.deepEqual([list[0]!.month, list[0]!.date], ["April 2026", "30-04-2026"]);
  assert.deepEqual([list[10]!.month, list[10]!.date], ["February 2027", "28-02-2027"]);
  assert.equal(receipts(rent({ receiptDay: "first" }))![11]!.date, "01-03-2027");
  assert.match(receiptText(rent(), list[0]!), /Rupees Nine Thousand Only.*April 2026, paid by bank transfer\./);
  assert.match(receiptText(rent({ mode: "UPI" }), list[0]!), /paid by UPI\./);
});

test("Rent receipts: PAN and revenue stamp rules, and validation", () => {
  assert.equal(panNeeded(rent()), true); // 9,000 × 12 = 1,08,000
  assert.equal(panNeeded(rent({ monthlyRent: "8333" })), false);
  assert.equal(stampNeeded(rent({ mode: "Cash" })), true);
  assert.equal(stampNeeded(rent({ mode: "Cash", monthlyRent: "5000" })), false);
  assert.equal(stampNeeded(rent({ mode: "UPI" })), false);
  const e = validateRent(rent({ landlordPan: "ABCDE12345", to: "2026-03" }));
  assert.ok(e.landlordPan && e.to);
  assert.deepEqual(validateRent(rent({ landlordPan: "abcde1234f" })), {});
});

test("Note against several invoices lists them all", () => {
  const draft = note({ originals: [{ id: "a", number: "INV/1", date: "2026-08-01" }, { id: "b", number: "INV/7", date: "2026-09-05" }] });
  const view = buildNoteView(draft, computeNote(draft)!);
  assert.deepEqual(view.details.find(([k]) => k === "Against invoices"), ["Against invoices", "INV/1 dated 01-08-2026; INV/7 dated 05-09-2026"]);
  assert.deepEqual(validateNote(draft), {});
});

test("Credit note deadline: 30 November after the financial year of the invoice", () => {
  assert.equal(creditNoteDeadline("2026-09-01"), "2027-11-30");
  assert.equal(creditNoteDeadline("2027-03-31"), "2027-11-30");
  assert.equal(creditNoteDeadline("2027-04-01"), "2028-11-30");
  const late = note({ date: "2027-12-01", originals: [{ id: "a", number: "INV/1", date: "2026-05-01" }, { id: "b", number: "INV/2", date: "2027-05-01" }] });
  assert.deepEqual(lateInvoices(late).map((o) => o.number), ["INV/1"]);
  assert.deepEqual(lateInvoices({ ...late, type: "debit" }), []);
});

test("Reverse charge: tax shown but not in the total credited", () => {
  const draft = note({ reverseCharge: true });
  const result = computeNote(draft)!;
  assert.equal(r(result.igst), "₹684.00");
  assert.equal(r(result.payable), "₹3,800.00");
  const view = buildNoteView(draft, result);
  assert.deepEqual(view.grand, ["Total credited", "₹3,800.00"]);
  assert.ok(view.extras.some((e) => e.label === "Reverse charge"));
});
