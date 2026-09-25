import { test } from "node:test";
import assert from "node:assert/strict";

import { ALL_CATEGORIES, GOODS_CATEGORIES, SERVICE_CATEGORIES, categoryForItem } from "./classification.ts";
import { checkGstin } from "./gstin.ts";
import { filterOptions } from "./search.ts";
import { blockReason, checkHsn, computeInvoice, isValidPhone, validateInvoice, type InvoiceDraft, type LineDraft } from "./invoice.ts";
import { checkInvoiceNumber, invoiceFileName } from "./invoice-number.ts";
import { formatPaise } from "./money.ts";
import { GST_STATES } from "./states.ts";
import { amountInWords } from "./words.ts";

let seq = 0;
const line = (quantity: string, rate: string, gstRate: string, discount = ""): LineDraft => ({
  id: String((seq += 1)),
  kind: "goods",
  category: "",
  description: "Item",
  hsn: "9983",
  details: "",
  quantity,
  unit: "NOS",
  pricing: "rate",
  rate,
  amount: "",
  discount,
  gstRate,
  customRate: "",
});
const rupees = (paise: number) => formatPaise(paise, true);

test("GSTIN check character", () => {
  assert.equal(checkGstin("27AAPFU0939F1ZV").ok, true);
  assert.equal(checkGstin("24AAACC1206D1ZM").ok, true);
  assert.equal(checkGstin("29AAGCB7383J1Z4").ok, true);
  assert.equal(checkGstin("27AAPFU0939F1ZX").ok, false);
});

test("GSTIN with a state code outside the list is rejected", () => {
  const result = checkGstin("25AAPFU0939F1ZV");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /State code 25/);
});

test("UIN recipients get a clear not-supported message", () => {
  const result = checkGstin("0717UNO00157UNO", { allowUinMessage: true });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "UIN recipients are not supported yet.");
});

test("Intra-state: Gujarat to Gujarat, ₹10,000 at 18%", () => {
  const inv = computeInvoice([line("1", "10000", "18")], "24", "24", true);
  assert.ok(inv);
  assert.equal(inv.intraState, true);
  assert.equal(rupees(inv.cgst), "₹900.00");
  assert.equal(rupees(inv.sgst), "₹900.00");
  assert.equal(inv.igst, 0);
  assert.equal(rupees(inv.grandTotal), "₹11,800.00");
  assert.equal(inv.words, "Rupees Eleven Thousand Eight Hundred Only");
});

test("Inter-state: Gujarat to Maharashtra, ₹10,000 at 18%", () => {
  const inv = computeInvoice([line("1", "10000", "18")], "24", "27", true);
  assert.ok(inv);
  assert.equal(inv.intraState, false);
  assert.equal(rupees(inv.igst), "₹1,800.00");
  assert.equal(inv.cgst + inv.sgst, 0);
  assert.equal(rupees(inv.grandTotal), "₹11,800.00");
});

test("Multi-line intra-state with round-off", () => {
  const inv = computeInvoice(
    [line("3", "333.33", "18"), line("2", "1499.50", "5", "10"), line("1", "99.99", "18")],
    "24",
    "24",
    true,
  );
  assert.ok(inv);
  const [a, b, c] = inv.lines;
  assert.equal(rupees(a!.taxable), "₹999.99");
  assert.equal(rupees(a!.cgst), "₹90.00");
  assert.equal(rupees(a!.sgst), "₹90.00");
  assert.equal(rupees(b!.taxable), "₹2,699.10");
  assert.equal(rupees(b!.cgst), "₹67.48");
  assert.equal(rupees(b!.sgst), "₹67.48");
  assert.equal(rupees(c!.taxable), "₹99.99");
  assert.equal(rupees(c!.cgst), "₹9.00");
  assert.equal(rupees(c!.sgst), "₹9.00");
  assert.equal(rupees(inv.taxable), "₹3,799.08");
  assert.equal(rupees(inv.totalTax), "₹332.96");
  assert.equal(rupees(inv.beforeRoundOff), "₹4,132.04");
  assert.equal(rupees(inv.roundOff), "−₹0.04");
  assert.equal(rupees(inv.grandTotal), "₹4,132.00");
});

test("Round-off: 50 paise goes up, and it can be turned off", () => {
  const up = computeInvoice([line("1", "100.50", "0")], "24", "24", true);
  assert.equal(up?.grandTotal, 10100);
  assert.equal(up?.roundOff, 50);
  const off = computeInvoice([line("1", "100.50", "0")], "24", "24", false);
  assert.equal(off?.grandTotal, 10050);
  assert.equal(off?.roundOff, 0);
});

test("UTGST applies in Chandigarh, SGST in Delhi", () => {
  assert.equal(computeInvoice([line("1", "100", "18")], "04", "04", true)?.stateTaxLabel, "UTGST");
  assert.equal(computeInvoice([line("1", "100", "18")], "07", "07", true)?.stateTaxLabel, "SGST");
});

test("Place of supply list: 36 states and UTs plus 97, no 25", () => {
  assert.equal(GST_STATES.length, 37);
  assert.ok(GST_STATES.some((s) => s.code === "97"));
  assert.ok(!GST_STATES.some((s) => s.code === "25"));
});

test("Amount in words, Indian system", () => {
  assert.equal(
    amountInWords(12345678_50),
    "Rupees One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight and Fifty Paise Only",
  );
});

test("Invoice number rules and file name", () => {
  assert.equal(checkInvoiceNumber("INV/2026-27/0001"), null);
  assert.notEqual(checkInvoiceNumber("INV/2026-27/00001X"), null);
  assert.notEqual(checkInvoiceNumber("INV#1"), null);
  assert.equal(invoiceFileName("INV/2026-27/0001", "2026-09-25", "pdf"), "INV_2026_27_0001_2026-09-25.pdf");
});

test("Unregistered recipient at ₹50,000 or more needs name, address and state", () => {
  const draft: InvoiceDraft = {
    copyLabel: "Original for Recipient",
    supplier: { legalName: "Test Traders", tradeName: "", address: "Ahmedabad", gstin: "24AAACC1206D1ZM", phone: "" },
    invoiceNumber: "INV/2026-27/0001",
    invoiceDate: "2026-09-25",
    recipient: { registered: false, name: "", address: "", gstin: "", stateCode: "", phone: "" },
    placeOfSupply: "24",
    shipToDifferent: false,
    shipTo: { name: "", address: "", stateCode: "" },
    reverseCharge: false,
    sezOrExport: false,
    turnover: "upto5",
    eInvoiceExempt: false,
    transport: { orderNumber: "", vehicleNumber: "", eWayBill: "", transporter: "", from: "", to: "" },
    lines: [line("1", "50000", "18")],
    roundOff: true,
    bank: { accountName: "", bankName: "", accountNumber: "", ifsc: "" },
    notes: "",
    signature: null,
  };
  const errors = validateInvoice(draft);
  assert.ok(errors["recipient.name"]);
  assert.ok(errors["recipient.address"]);
  assert.ok(errors["recipient.stateCode"]);

  const small = validateInvoice({ ...draft, lines: [line("1", "49999.99", "18")] });
  assert.equal(small["recipient.name"], undefined);
});

test("Phone numbers are optional and loosely checked", () => {
  assert.equal(isValidPhone(""), true);
  assert.equal(isValidPhone("7903316395"), true);
  assert.equal(isValidPhone("+91 79033-16395"), true);
  assert.equal(isValidPhone("call me"), false);
  assert.equal(isValidPhone("123"), false);
});

test("Rate per ton, and an amount typed directly, give the same line", () => {
  const perTon = computeInvoice([{ ...line("30.5", "1500", "5"), unit: "MTS" }], "10", "10", false);
  assert.equal(rupees(perTon!.taxable), "₹45,750.00");
  const byAmount = computeInvoice(
    [{ ...line("30.5", "", "5"), unit: "MTS", pricing: "amount", amount: "45750" }],
    "10",
    "10",
    false,
  );
  assert.equal(rupees(byAmount!.taxable), "₹45,750.00");
  assert.equal(rupees(byAmount!.lines[0]!.ratePaise), "₹1,500.00");
  assert.equal(rupees(byAmount!.cgst), "₹1,143.75");
});

test("Amount mode: a monthly charge with quantity 1", () => {
  const inv = computeInvoice(
    [{ ...line("1", "", "18"), unit: "OTH", pricing: "amount", amount: "25000" }],
    "10",
    "10",
    true,
  );
  assert.equal(rupees(inv!.grandTotal), "₹29,500.00");
});

test("HSN digits follow turnover (Notification 78/2020)", () => {
  assert.equal(checkHsn("2517", "upto5", true), null);
  assert.notEqual(checkHsn("251", "upto5", true), null);
  assert.equal(checkHsn("", "upto5", false), null); // B2C up to 5 crore: optional
  assert.notEqual(checkHsn("", "upto5", true), null);
  assert.notEqual(checkHsn("2517", "5to500", false), null); // above 5 crore: 6 digits
  assert.equal(checkHsn("251710", "5to500", false), null);
});

test("E-invoicing and QR thresholds block the tool where it cannot comply", () => {
  const base = { sezOrExport: false, eInvoiceExempt: false, recipient: { registered: true, name: "", address: "", gstin: "", stateCode: "", phone: "" } };
  assert.equal(blockReason({ ...base, turnover: "upto5" }), null);
  assert.notEqual(blockReason({ ...base, turnover: "5to500" }), null); // B2B above 5 crore
  assert.equal(blockReason({ ...base, turnover: "5to500", eInvoiceExempt: true }), null);
  assert.equal(blockReason({ ...base, turnover: "5to500", recipient: { ...base.recipient, registered: false } }), null); // B2C
  assert.notEqual(blockReason({ ...base, turnover: "above500", recipient: { ...base.recipient, registered: false } }), null);
  assert.notEqual(blockReason({ ...base, turnover: "upto5", sezOrExport: true }), null);
});

test("Reverse charge: tax is shown but not added to the amount payable", () => {
  const inv = computeInvoice([{ ...line("1", "10000", "5"), kind: "service" }], "10", "10", true, true);
  assert.equal(rupees(inv!.totalTax), "₹500.00");
  assert.equal(rupees(inv!.grandTotal), "₹10,000.00");
  assert.equal(inv!.words, "Rupees Ten Thousand Only");
});

test("Services need SAC codes (starting 99); goods must not use them", () => {
  assert.equal(checkHsn("9965", "upto5", true, "service"), null);
  assert.notEqual(checkHsn("2505", "upto5", true, "service"), null);
  assert.notEqual(checkHsn("9967", "upto5", true, "goods"), null);
});

test("Classification covers every HSN chapter and SAC heading", () => {
  const chapters = GOODS_CATEGORIES.map((c) => c.prefix);
  assert.equal(chapters.length, 96); // 01 to 97, 77 reserved
  for (let n = 1; n <= 97; n += 1) {
    if (n === 77) continue;
    assert.ok(chapters.includes(String(n).padStart(2, "0")), `chapter ${n}`);
  }
  assert.equal(SERVICE_CATEGORIES.length, 31);
  assert.ok(SERVICE_CATEGORIES.every((c) => /^99[0-9]{2}$/.test(c.prefix)));
  assert.equal(new Set(ALL_CATEGORIES.map((c) => c.id)).size, ALL_CATEGORIES.length);
});

test("Typing a known item finds its category", () => {
  assert.equal(categoryForItem("cement")?.id, "hsn-25");
  assert.equal(categoryForItem("Freight charges")?.id, "sac-9965");
  assert.equal(categoryForItem("something new"), undefined);
});

test("The code must match the chosen category", () => {
  const draft = {
    copyLabel: "Original for Recipient" as const,
    supplier: { legalName: "A", tradeName: "", address: "B", gstin: "24AAACC1206D1ZM", phone: "" },
    invoiceNumber: "INV/1", invoiceDate: "2026-09-25",
    recipient: { registered: true, name: "C", address: "D", gstin: "27AAPFU0939F1ZV", stateCode: "", phone: "" },
    placeOfSupply: "24", shipToDifferent: false, shipTo: { name: "", address: "", stateCode: "" },
    reverseCharge: false, sezOrExport: false, turnover: "upto5" as const, eInvoiceExempt: false,
    transport: { orderNumber: "", vehicleNumber: "", eWayBill: "", transporter: "", from: "", to: "" },
    lines: [{ ...line("1", "100", "18"), category: "hsn-25", hsn: "7214" }],
    roundOff: true, bank: { accountName: "", bankName: "", accountNumber: "", ifsc: "" }, notes: "", signature: null,
  };
  const key = `lines.${draft.lines[0]!.id}.hsn`;
  assert.match(validateInvoice(draft)[key] ?? "", /start with 25/);
  assert.equal(validateInvoice({ ...draft, lines: [{ ...draft.lines[0]!, hsn: "2523" }] })[key], undefined);
});

test("Type-ahead: starts-with first, then word matches, then codes", () => {
  const options = [
    { value: "a", label: "Stone dust" },
    { value: "b", label: "Tiles" },
    { value: "c", label: "Truck hire with driver", code: "9966" },
    { value: "d", label: "Sand (Balu)" },
  ];
  const t = filterOptions("t", options).map((o) => o.value);
  assert.deepEqual(t, ["b", "c"]);
  assert.deepEqual(filterOptions("bal", options).map((o) => o.value), ["d"]);
  assert.deepEqual(filterOptions("996", options).map((o) => o.value), ["c"]);
  assert.equal(filterOptions("", options).length, 4);
});
