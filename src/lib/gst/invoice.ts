import { findCategory } from "./classification.ts";
import { checkGstin } from "./gstin.ts";
import { checkInvoiceNumber } from "./invoice-number.ts";
import { mulDivRound, parseScaled } from "./money.ts";
import { findState } from "./states.ts";
import { amountInWords } from "./words.ts";

/**
 * The invoice model, its tax calculation and its validation. Everything is in
 * integers: amounts in paise, quantities in thousandths, percentages in basis
 * points (18% = 1800). Rounding is half-up, per line and per tax.
 */

/** GST 2.0 slabs (from 22 September 2025) plus the special rates that continue. */
export const GST_RATE_OPTIONS = ["0", "0.25", "1.5", "3", "5", "18", "40"] as const;

/**
 * Aggregate turnover in the previous financial year decides the HSN digits
 * (Notification 78/2020-CT) and whether e-invoicing or a B2C dynamic QR code
 * applies, neither of which this tool can produce.
 */
export type Turnover = "" | "upto5" | "5to500" | "above500";

/** Rule 46(s) declaration, printed only when the user says the business is exempt. */
export const EINVOICE_EXEMPT_DECLARATION =
  "I/We hereby declare that though our aggregate turnover in any preceding financial year from 2017-18 onwards is more than the aggregate turnover notified under sub-rule (4) of rule 48, we are not required to prepare an invoice in terms of the provisions of the said sub-rule.";
/** GST Unique Quantity Codes (UQC), with their standard descriptions. */
export const UNITS = [
  { code: "NOS", name: "Numbers" },
  { code: "PCS", name: "Pieces" },
  { code: "MTS", name: "Metric ton" },
  { code: "TON", name: "Tonnes" },
  { code: "QTL", name: "Quintal" },
  { code: "KGS", name: "Kilograms" },
  { code: "GMS", name: "Grammes" },
  { code: "BAG", name: "Bags" },
  { code: "BDL", name: "Bundles" },
  { code: "BOX", name: "Box" },
  { code: "BTL", name: "Bottles" },
  { code: "CAN", name: "Cans" },
  { code: "CBM", name: "Cubic meters" },
  { code: "CTN", name: "Cartons" },
  { code: "DOZ", name: "Dozens" },
  { code: "DRM", name: "Drums" },
  { code: "KLR", name: "Kilolitre" },
  { code: "KME", name: "Kilometre" },
  { code: "LTR", name: "Litres" },
  { code: "MLT", name: "Millilitre" },
  { code: "MTR", name: "Meters" },
  { code: "PAC", name: "Packs" },
  { code: "PRS", name: "Pairs" },
  { code: "ROL", name: "Rolls" },
  { code: "SET", name: "Sets" },
  { code: "SQF", name: "Square feet" },
  { code: "SQM", name: "Square meters" },
  { code: "SQY", name: "Square yards" },
  { code: "UNT", name: "Units" },
  { code: "OTH", name: "Others" },
] as const;

export type Pricing = "rate" | "amount";
export const COPY_LABELS = [
  "Original for Recipient",
  "Duplicate for Transporter",
  "Triplicate for Supplier",
] as const;

/** Below this taxable value (in paise), an unregistered recipient's details are optional. */
export const UNREGISTERED_DETAILS_THRESHOLD = 50000_00;

export type ItemKind = "goods" | "service";

export type LineDraft = {
  id: string;
  /** Goods use HSN codes; services use SAC codes, which start with 99. */
  kind: ItemKind;
  /** Category id from the item picker, used only to filter suggestions. */
  category: string;
  description: string;
  hsn: string;
  /** Optional exact name or particulars: brand, model, grade, vehicle no., period. */
  details: string;
  quantity: string;
  unit: string;
  /** "rate": quantity × rate per unit. "amount": the user enters the line amount directly. */
  pricing: Pricing;
  rate: string;
  amount: string;
  discount: string;
  /** One of GST_RATE_OPTIONS, or "other". */
  gstRate: string;
  customRate: string;
};

export type InvoiceDraft = {
  copyLabel: (typeof COPY_LABELS)[number];
  /** tradeName and phone are optional; the legal name is what Rule 46 requires. */
  supplier: { legalName: string; tradeName: string; address: string; gstin: string; phone: string };
  invoiceNumber: string;
  invoiceDate: string;
  recipient: { registered: boolean; name: string; address: string; gstin: string; stateCode: string; phone: string };
  placeOfSupply: string;
  shipToDifferent: boolean;
  shipTo: { name: string; address: string; stateCode: string };
  reverseCharge: boolean;
  sezOrExport: boolean;
  turnover: Turnover;
  /** Business above the e-invoice threshold that is exempt from e-invoicing. */
  eInvoiceExempt: boolean;
  /** Optional details printed with the invoice details. */
  transport: {
    orderNumber: string;
    vehicleNumber: string;
    eWayBill: string;
    transporter: string;
    from: string;
    to: string;
  };
  lines: LineDraft[];
  roundOff: boolean;
  bank: { accountName: string; bankName: string; accountNumber: string; ifsc: string };
  notes: string;
  signature: string | null;
};

export type ComputedLine = {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  ratePaise: number;
  discountBp: number;
  gstBp: number;
  gross: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export type ComputedInvoice = {
  intraState: boolean;
  /** "SGST" or "UTGST", from the place of supply. */
  stateTaxLabel: "SGST" | "UTGST";
  lines: ComputedLine[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  beforeRoundOff: number;
  roundOff: number;
  grandTotal: number;
  words: string;
  /** Tax is shown but payable by the recipient; the grand total excludes it. */
  reverseCharge: boolean;
};

export function gstBasisPoints(line: Pick<LineDraft, "gstRate" | "customRate">): number | null {
  const text = line.gstRate === "other" ? line.customRate : line.gstRate;
  const bp = parseScaled(text, 2);
  return bp !== null && bp <= 100_00 ? bp : null;
}

/** Taxable value and taxes for one line; null if any number on it is invalid. */
export function computeLine(line: LineDraft, intraState: boolean): ComputedLine | null {
  const quantity = parseScaled(line.quantity, 3);
  const discountBp = line.discount.trim() === "" ? 0 : parseScaled(line.discount, 2);
  const gstBp = gstBasisPoints(line);
  if (quantity === null || quantity === 0 || discountBp === null || discountBp > 100_00 || gstBp === null) {
    return null;
  }

  // Either quantity × rate, or an amount typed directly, in which case the rate
  // shown on the invoice is that amount per unit, rounded to the paisa.
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
  const taxable = gross - discount;
  const cgst = intraState ? mulDivRound(taxable, gstBp, 20000) : 0;
  const sgst = cgst;
  const igst = intraState ? 0 : mulDivRound(taxable, gstBp, 10000);

  return {
    id: line.id,
    description: line.details.trim() ? `${line.description.trim()} - ${line.details.trim()}` : line.description.trim(),
    hsn: line.hsn.trim(),
    quantity,
    unit: line.unit,
    ratePaise,
    discountBp,
    gstBp,
    gross,
    discount,
    taxable,
    cgst,
    sgst,
    igst,
    total: taxable + cgst + sgst + igst,
  };
}

export function computeInvoice(
  lines: readonly LineDraft[],
  supplierStateCode: string,
  placeOfSupply: string,
  roundOff: boolean,
  reverseCharge = false,
): ComputedInvoice | null {
  if (!supplierStateCode || !placeOfSupply) return null;
  const intraState = supplierStateCode === placeOfSupply;
  const computed: ComputedLine[] = [];
  for (const line of lines) {
    const result = computeLine(line, intraState);
    if (!result) return null;
    computed.push(reverseCharge ? { ...result, total: result.taxable } : result);
  }

  const sum = (key: "taxable" | "cgst" | "sgst" | "igst") =>
    computed.reduce((total, line) => total + line[key], 0);
  const taxable = sum("taxable");
  const cgst = sum("cgst");
  const sgst = sum("sgst");
  const igst = sum("igst");
  const totalTax = cgst + sgst + igst;
  // Under reverse charge the recipient pays the GST to the government, so it is
  // shown on the invoice but not added to the amount the supplier collects.
  const beforeRoundOff = reverseCharge ? taxable : taxable + totalTax;
  const grandTotal = roundOff ? Math.floor((beforeRoundOff + 50) / 100) * 100 : beforeRoundOff;

  return {
    intraState,
    stateTaxLabel: findState(placeOfSupply)?.utgst ? "UTGST" : "SGST",
    lines: computed,
    taxable,
    cgst,
    sgst,
    igst,
    totalTax,
    beforeRoundOff,
    roundOff: grandTotal - beforeRoundOff,
    grandTotal,
    words: amountInWords(grandTotal),
    reverseCharge,
  };
}

export type FieldErrors = Record<string, string>;

/**
 * HSN/SAC digits (Notification 78/2020-CT): at least 4 digits up to ₹5 crore
 * turnover, at least 6 above it. Up to ₹5 crore, HSN is optional on supplies
 * to unregistered persons.
 */
export function checkHsn(
  hsn: string,
  turnover: Turnover,
  recipientRegistered: boolean,
  kind: ItemKind = "goods",
): string | null {
  const code = hsn.trim();
  if (code === "" && turnover === "upto5" && !recipientRegistered) return null;
  if (kind === "service" && code !== "" && !code.startsWith("99")) {
    return "SAC codes for services start with 99 (for example 9965 for goods transport).";
  }
  if (kind === "goods" && code.startsWith("99")) {
    return "Codes starting with 99 are SAC codes for services. Choose \"Service\" above, or check the HSN code.";
  }
  const min = turnover === "upto5" || turnover === "" ? 4 : 6;
  if (!/^[0-9]+$/.test(code) || code.length < min || code.length > 8) {
    return `HSN/SAC must be ${min} to 8 digits${turnover === "upto5" || turnover === "" ? "" : " for turnover above ₹5 crore"}.`;
  }
  return null;
}

/**
 * Reasons this tool must not produce the document at all. Returns a message,
 * or null when a Tax Invoice can be made here.
 */
export function blockReason(draft: Pick<InvoiceDraft, "sezOrExport" | "turnover" | "eInvoiceExempt" | "recipient">): string | null {
  if (draft.sezOrExport) return "Supplies to SEZ units and exports are not supported yet.";
  if (draft.turnover === "above500") {
    return "Businesses with turnover above ₹500 crore must issue e-invoices for B2B supplies and put a dynamic QR code on B2C invoices. This tool cannot create either, so it cannot be used for your invoices.";
  }
  if (draft.turnover === "5to500" && draft.recipient.registered && !draft.eInvoiceExempt) {
    return "Your turnover is above ₹5 crore, so invoices to registered buyers (B2B) must be e-invoices registered on the IRP with an IRN and QR code. This tool cannot create them. If your business is legally exempt from e-invoicing, tick the exemption box below.";
  }
  return null;
}

/** Optional phone: empty, or 6 to 15 digits with an optional leading +, spaces or hyphens. */
export function isValidPhone(value: string): boolean {
  const text = value.trim();
  if (text === "") return true;
  if (!/^\+?[0-9][0-9 -]*$/.test(text)) return false;
  const digits = text.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15;
}

/**
 * Checks every field the Tax Invoice needs. Keys are stable field paths
 * ("supplier.gstin", "lines.<id>.hsn") so the form can show errors inline.
 */
export function validateInvoice(draft: InvoiceDraft): FieldErrors {
  const errors: FieldErrors = {};
  const need = (key: string, value: string, message: string) => {
    if (value.trim() === "") errors[key] = message;
  };

  need("supplier.legalName", draft.supplier.legalName, "Enter the supplier's legal name.");
  if (!draft.turnover) errors.turnover = "Choose your turnover in the previous financial year.";
  const phoneError = "Use digits only, with an optional +, spaces or hyphens.";
  if (!isValidPhone(draft.supplier.phone)) errors["supplier.phone"] = phoneError;
  if (!isValidPhone(draft.recipient.phone)) errors["recipient.phone"] = phoneError;
  need("supplier.address", draft.supplier.address, "Enter the supplier's address.");
  const supplierGstin = checkGstin(draft.supplier.gstin);
  if (!supplierGstin.ok) errors["supplier.gstin"] = supplierGstin.error;

  const numberError = checkInvoiceNumber(draft.invoiceNumber);
  if (numberError) errors.invoiceNumber = numberError;
  need("invoiceDate", draft.invoiceDate, "Enter the invoice date.");
  need("placeOfSupply", draft.placeOfSupply, "Choose the place of supply.");
  if (draft.placeOfSupply && !findState(draft.placeOfSupply)) errors.placeOfSupply = "Choose a valid place of supply.";

  if (draft.lines.length === 0) errors.lines = "Add at least one item.";
  for (const line of draft.lines) {
    const key = `lines.${line.id}`;
    need(`${key}.description`, line.description, "Enter a description.");
    const hsnError = checkHsn(line.hsn, draft.turnover, draft.recipient.registered, line.kind);
    if (hsnError) {
      errors[`${key}.hsn`] = hsnError;
    } else {
      const category = findCategory(line.category);
      const code = line.hsn.trim();
      if (category && code !== "" && !code.startsWith(category.prefix)) {
        errors[`${key}.hsn`] = `Codes in "${category.name}" start with ${category.prefix}. Check the code or the category.`;
      }
    }
    const quantity = parseScaled(line.quantity, 3);
    if (quantity === null || quantity === 0) errors[`${key}.quantity`] = "Enter a quantity above 0, up to 3 decimals.";
    if (line.pricing === "amount") {
      if (parseScaled(line.amount, 2) === null) errors[`${key}.amount`] = "Enter the amount, up to 2 decimals.";
    } else if (parseScaled(line.rate, 2) === null) {
      errors[`${key}.rate`] = "Enter a rate, up to 2 decimals.";
    }
    if (line.discount.trim() !== "") {
      const discount = parseScaled(line.discount, 2);
      if (discount === null || discount > 100_00) errors[`${key}.discount`] = "Enter a discount from 0 to 100%.";
    }
    if (gstBasisPoints(line) === null) errors[`${key}.gstRate`] = "Enter a GST rate from 0 to 100%, up to 2 decimals.";
  }

  const recipient = draft.recipient;
  if (recipient.registered) {
    need("recipient.name", recipient.name, "Enter the recipient's name.");
    need("recipient.address", recipient.address, "Enter the recipient's address.");
    const check = checkGstin(recipient.gstin, { allowUinMessage: true });
    if (!check.ok) errors["recipient.gstin"] = check.error;
  } else {
    const computed = supplierGstin.ok
      ? computeInvoice(draft.lines, supplierGstin.stateCode, draft.placeOfSupply, false, draft.reverseCharge)
      : null;
    if (computed && computed.taxable >= UNREGISTERED_DETAILS_THRESHOLD) {
      const why = "Required when the recipient is unregistered and the taxable value is ₹50,000 or more.";
      need("recipient.name", recipient.name, why);
      const deliveryAddress = draft.shipToDifferent ? draft.shipTo.address : recipient.address;
      if (deliveryAddress.trim() === "") errors[draft.shipToDifferent ? "shipTo.address" : "recipient.address"] = why;
      const deliveryState = draft.shipToDifferent ? draft.shipTo.stateCode : recipient.stateCode;
      if (!deliveryState) errors[draft.shipToDifferent ? "shipTo.stateCode" : "recipient.stateCode"] = why;
    }
  }

  if (draft.shipToDifferent) need("shipTo.address", draft.shipTo.address, errors["shipTo.address"] ?? "Enter the ship-to address.");

  return errors;
}

/** The state code on a registered recipient's GSTIN, else the chosen state. */
export function recipientStateCode(draft: InvoiceDraft): string {
  if (draft.recipient.registered) {
    const check = checkGstin(draft.recipient.gstin);
    return check.ok ? check.stateCode : "";
  }
  return draft.recipient.stateCode;
}
