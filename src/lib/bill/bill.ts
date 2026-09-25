import { formatPaise, formatScaled, mulDivRound, parseScaled } from "../gst/money.ts";
import { amountInWords } from "../gst/words.ts";

/**
 * Simple bill (for shops not registered under GST) and quotation. No tax is
 * ever added here: an unregistered business cannot charge GST, and a quotation
 * is only an offer. Integer paise, quantities in thousandths, half-up rounding.
 */

export type BillKind = "bill" | "quotation";
export const BILL_TITLES = ["BILL", "CASH MEMO", "ESTIMATE"] as const;
export const PAYMENT_MODES = ["", "Cash", "UPI", "Bank transfer", "Card", "Credit (udhaar)"] as const;

export type BillLine = {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  pricing: "rate" | "amount";
  rate: string;
  amount: string;
  discount: string;
};

export type BillDraft = {
  kind: BillKind;
  title: (typeof BILL_TITLES)[number] | "QUOTATION";
  shop: { name: string; address: string; phone: string };
  number: string;
  date: string;
  /** Quotations only: last date the prices hold. */
  validUntil: string;
  customer: { name: string; phone: string; address: string };
  lines: BillLine[];
  roundOff: boolean;
  paymentMode: (typeof PAYMENT_MODES)[number];
  /** Bills only: amount received now, if any. */
  amountPaid: string;
  /** Quotations only: how taxes are treated, as free text shown on the document. */
  taxNote: string;
  notes: string;
};

export type ComputedBillLine = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  ratePaise: number;
  discountBp: number;
  gross: number;
  discount: number;
  amount: number;
};

export type ComputedBill = {
  lines: ComputedBillLine[];
  subtotal: number;
  totalDiscount: number;
  beforeRoundOff: number;
  roundOff: number;
  total: number;
  paid: number;
  balance: number;
  words: string;
};

export function computeBillLine(line: BillLine): ComputedBillLine | null {
  const quantity = parseScaled(line.quantity, 3);
  const discountBp = line.discount.trim() === "" ? 0 : parseScaled(line.discount, 2);
  if (quantity === null || quantity === 0 || discountBp === null || discountBp > 100_00) return null;

  let gross: number;
  let ratePaise: number;
  if (line.pricing === "amount") {
    const amount = parseScaled(line.amount, 2);
    if (amount === null) return null;
    gross = amount;
    ratePaise = mulDivRound(amount, 1000, quantity);
  } else {
    const rate = parseScaled(line.rate, 2);
    if (rate === null) return null;
    ratePaise = rate;
    gross = mulDivRound(quantity, rate, 1000);
  }
  const discount = mulDivRound(gross, discountBp, 10000);
  return {
    id: line.id,
    description: line.description.trim(),
    quantity,
    unit: line.unit,
    ratePaise,
    discountBp,
    gross,
    discount,
    amount: gross - discount,
  };
}

export function computeBill(draft: Pick<BillDraft, "lines" | "roundOff" | "amountPaid" | "kind">): ComputedBill | null {
  const lines: ComputedBillLine[] = [];
  for (const line of draft.lines) {
    const computed = computeBillLine(line);
    if (!computed) return null;
    lines.push(computed);
  }
  const subtotal = lines.reduce((sum, l) => sum + l.gross, 0);
  const totalDiscount = lines.reduce((sum, l) => sum + l.discount, 0);
  const beforeRoundOff = subtotal - totalDiscount;
  const total = draft.roundOff ? Math.floor((beforeRoundOff + 50) / 100) * 100 : beforeRoundOff;
  const paid =
    draft.kind === "bill" && draft.amountPaid.trim() !== "" ? (parseScaled(draft.amountPaid, 2) ?? 0) : 0;
  return {
    lines,
    subtotal,
    totalDiscount,
    beforeRoundOff,
    roundOff: total - beforeRoundOff,
    total,
    paid,
    balance: total - paid,
    words: amountInWords(total),
  };
}

export type BillErrors = Record<string, string>;

/** Optional phone: empty, or 6 to 15 digits with an optional +, spaces or hyphens. */
function phoneOk(value: string): boolean {
  const text = value.trim();
  if (text === "") return true;
  if (!/^\+?[0-9][0-9 -]*$/.test(text)) return false;
  const digits = text.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15;
}

export function validateBill(draft: BillDraft): BillErrors {
  const errors: BillErrors = {};
  const need = (key: string, value: string, message: string) => {
    if (value.trim() === "") errors[key] = message;
  };
  const noun = draft.kind === "quotation" ? "quotation" : "bill";

  need("shop.name", draft.shop.name, "Enter your shop or business name.");
  if (!phoneOk(draft.shop.phone)) errors["shop.phone"] = "Use digits only, with an optional +, spaces or hyphens.";
  if (!phoneOk(draft.customer.phone)) errors["customer.phone"] = "Use digits only, with an optional +, spaces or hyphens.";
  need("number", draft.number, `Enter a ${noun} number.`);
  if (draft.number.trim().length > 30) errors.number = `Keep the ${noun} number to 30 characters.`;
  need("date", draft.date, "Enter the date.");
  if (draft.kind === "quotation" && draft.validUntil && draft.date && draft.validUntil < draft.date) {
    errors.validUntil = "The valid-until date cannot be before the quotation date.";
  }

  if (draft.lines.length === 0) errors.lines = "Add at least one item.";
  for (const line of draft.lines) {
    const key = `lines.${line.id}`;
    need(`${key}.description`, line.description, "Enter the item name.");
    const quantity = parseScaled(line.quantity, 3);
    if (quantity === null || quantity === 0) errors[`${key}.quantity`] = "Enter a quantity above 0, up to 3 decimals.";
    if (line.pricing === "amount") {
      if (parseScaled(line.amount, 2) === null) errors[`${key}.amount`] = "Enter the amount, up to 2 decimals.";
    } else if (parseScaled(line.rate, 2) === null) {
      errors[`${key}.rate`] = "Enter the price per unit, up to 2 decimals.";
    }
    if (line.discount.trim() !== "") {
      const discount = parseScaled(line.discount, 2);
      if (discount === null || discount > 100_00) errors[`${key}.discount`] = "Enter a discount from 0 to 100%.";
    }
  }

  if (draft.kind === "bill" && draft.amountPaid.trim() !== "") {
    const paid = parseScaled(draft.amountPaid, 2);
    const computed = computeBill(draft);
    if (paid === null) errors.amountPaid = "Enter the amount received, up to 2 decimals.";
    else if (computed && paid > computed.total) errors.amountPaid = "Amount received cannot be more than the total.";
  }
  return errors;
}

/** Strings for the preview and the PDF, so both always agree. */
export type BillView = {
  title: string;
  shop: { name: string; address: string; phone: string };
  details: [string, string][];
  customer: { name: string; phone: string; address: string } | null;
  lines: { sno: number; description: string; quantity: string; unit: string; rate: string; discount: string; amount: string }[];
  totals: [string, string][];
  total: string;
  words: string;
  payment: [string, string][];
  taxNote: string;
  notes: string;
  signatoryFor: string;
};

export function displayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

export function buildBillView(draft: BillDraft, bill: ComputedBill): BillView {
  const money = (p: number) => formatPaise(p);
  const isQuote = draft.kind === "quotation";
  const totals: [string, string][] = [["Subtotal", money(bill.subtotal)]];
  if (bill.totalDiscount) totals.push(["Discount", `−${money(bill.totalDiscount)}`]);
  if (draft.roundOff && bill.roundOff) totals.push(["Round off", money(bill.roundOff)]);

  const payment: [string, string][] = [];
  if (!isQuote) {
    if (draft.paymentMode) payment.push(["Payment mode", draft.paymentMode]);
    if (draft.amountPaid.trim() !== "") {
      payment.push(["Amount received", `₹${money(bill.paid)}`]);
      payment.push(["Balance due", `₹${money(bill.balance)}`]);
    }
  }

  const customerHas = draft.customer.name.trim() || draft.customer.phone.trim() || draft.customer.address.trim();

  return {
    title: draft.title,
    shop: { name: draft.shop.name.trim(), address: draft.shop.address.trim(), phone: draft.shop.phone.trim() },
    details: [
      [isQuote ? "Quotation No." : "Bill No.", draft.number.trim()],
      ["Date", displayDate(draft.date)],
      ...((isQuote && draft.validUntil ? [["Valid until", displayDate(draft.validUntil)]] : []) as [string, string][]),
    ],
    customer: customerHas
      ? { name: draft.customer.name.trim(), phone: draft.customer.phone.trim(), address: draft.customer.address.trim() }
      : null,
    lines: bill.lines.map((l, i) => ({
      sno: i + 1,
      description: l.description,
      quantity: formatScaled(l.quantity, 3),
      unit: l.unit,
      rate: money(l.ratePaise),
      discount: l.discountBp ? `${formatScaled(l.discountBp, 2)}%` : "—",
      amount: money(l.amount),
    })),
    totals,
    total: money(bill.total),
    words: bill.words,
    payment,
    taxNote: isQuote ? draft.taxNote.trim() : "",
    notes: draft.notes.trim(),
    signatoryFor: draft.shop.name.trim(),
  };
}

/** "BILL/0001" on 2026-09-26 → "BILL_0001_2026-09-26.pdf" */
export function billFileName(number: string, iso: string, fallback: string): string {
  const base = number.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || fallback;
  return `${base}_${iso || "undated"}.pdf`;
}
