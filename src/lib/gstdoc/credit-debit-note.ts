import { checkGstin } from "../gst/gstin.ts";
import { isValidPhone, type LineDraft, type Turnover } from "../gst/invoice.ts";
import { formatPaise } from "../gst/money.ts";
import { findState } from "../gst/states.ts";
import { amountInWords } from "../gst/words.ts";
import {
  checkDocNumber,
  computeLines,
  displayDate,
  stateText,
  taxTable,
  taxTotals,
  validateLines,
  type Errors,
  type LineTotals,
} from "./lines.ts";
import { lines as nonEmpty, type DocView } from "./view.ts";

/**
 * Credit and debit notes under Section 34, with the particulars of CGST
 * Rule 53: nature of the document, supplier and recipient, serial number and
 * date, the original invoice's number and date, the value, rate and tax
 * credited or debited, and signature.
 */

export type NoteType = "credit" | "debit";

export const NOTE_REASONS: Record<NoteType, readonly string[]> = {
  credit: [
    "Goods returned by the recipient",
    "Taxable value or tax charged in the invoice was more than payable",
    "Services supplied were found to be deficient",
  ],
  debit: ["Taxable value or tax charged in the invoice was less than payable"],
};

export type OriginalInvoice = { id: string; number: string; date: string };

export type NoteDraft = {
  type: NoteType;
  turnover: Turnover;
  eInvoiceExempt: boolean;
  /** SEZ and export notes need IGST and extra declarations; not supported, like the invoice tool. */
  sezOrExport: boolean;
  /** The original invoice was under reverse charge: tax is shown but the recipient pays it. */
  reverseCharge: boolean;
  supplier: { legalName: string; tradeName: string; address: string; gstin: string; phone: string };
  number: string;
  date: string;
  /** Section 34 allows one note against one or more invoices. */
  originals: OriginalInvoice[];
  reason: string;
  recipient: { registered: boolean; name: string; address: string; gstin: string; stateCode: string };
  placeOfSupply: string;
  lines: LineDraft[];
  notes: string;
};

/** Same limits as the invoice tool: e-invoicing applies to notes as well. */
export function noteBlockReason(draft: Pick<NoteDraft, "turnover" | "eInvoiceExempt" | "recipient" | "sezOrExport">): string | null {
  if (draft.sezOrExport) return "Notes for supplies to SEZ units and exports are not supported yet.";
  if (draft.turnover === "above500") {
    return "Businesses above ₹500 crore must report credit and debit notes on the e-invoice portal, so this tool cannot create them.";
  }
  if (draft.turnover === "5to500" && draft.recipient.registered && !draft.eInvoiceExempt) {
    return "Between ₹5 crore and ₹500 crore, notes to a registered buyer must be e-invoiced on the IRP, which this tool cannot do. If your business is exempt from e-invoicing, tick the box above.";
  }
  return null;
}

export type NoteResult = LineTotals & {
  intraState: boolean;
  utgst: boolean;
  /** Amount the note credits or debits to the recipient: without tax under reverse charge. */
  payable: number;
  words: string;
};

/**
 * Section 34(2): a credit note reduces tax only if declared by 30 November
 * after the end of the financial year of the supply (or the annual return,
 * if filed earlier). Returns that 30 November as YYYY-MM-DD.
 */
export function creditNoteDeadline(invoiceIso: string): string | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(invoiceIso);
  if (!match) return null;
  const year = Number(match[1]);
  const fyEnd = Number(match[2]) >= 4 ? year + 1 : year;
  return `${fyEnd}-11-30`;
}

/** Original invoices whose credit-note deadline is before the note's date. */
export function lateInvoices(draft: Pick<NoteDraft, "type" | "date" | "originals">): OriginalInvoice[] {
  if (draft.type !== "credit" || !draft.date) return [];
  return draft.originals.filter((o) => {
    const deadline = creditNoteDeadline(o.date);
    return deadline !== null && draft.date > deadline;
  });
}

export function computeNote(draft: NoteDraft): NoteResult | null {
  const supplier = checkGstin(draft.supplier.gstin);
  if (!supplier.ok || !draft.placeOfSupply) return null;
  const intraState = supplier.stateCode === draft.placeOfSupply;
  const totals = computeLines(draft.lines, intraState, true);
  if (!totals) return null;
  const payable = draft.reverseCharge ? totals.taxable : totals.total;
  return {
    ...totals,
    intraState,
    utgst: Boolean(findState(draft.placeOfSupply)?.utgst),
    payable,
    words: amountInWords(payable),
  };
}

export function validateNote(draft: NoteDraft): Errors {
  const errors: Errors = {};
  const noun = draft.type === "credit" ? "credit note" : "debit note";
  if (!draft.turnover) errors.turnover = "Choose your turnover in the previous financial year.";
  if (draft.supplier.legalName.trim() === "") errors["supplier.legalName"] = "Enter your legal name.";
  if (draft.supplier.address.trim() === "") errors["supplier.address"] = "Enter your address.";
  const gstin = checkGstin(draft.supplier.gstin);
  if (!gstin.ok) errors["supplier.gstin"] = gstin.error;
  if (!isValidPhone(draft.supplier.phone)) errors["supplier.phone"] = "Use digits only, with an optional +, spaces or hyphens.";
  const numberError = checkDocNumber(draft.number, noun);
  if (numberError) errors.number = numberError;
  if (draft.date.trim() === "") errors.date = "Enter the date.";
  if (draft.originals.length === 0) errors.originals = "Add the original invoice.";
  const seen = new Set<string>();
  for (const o of draft.originals) {
    const key = `originals.${o.id}`;
    const number = o.number.trim().toUpperCase();
    if (number === "") errors[`${key}.number`] = "Enter the original invoice number.";
    else {
      const originalError = checkDocNumber(o.number, "invoice");
      if (originalError) errors[`${key}.number`] = originalError;
      else if (seen.has(number)) errors[`${key}.number`] = "This invoice is already listed.";
      seen.add(number);
    }
    if (o.date.trim() === "") errors[`${key}.date`] = "Enter the original invoice date.";
    else if (draft.date && o.date > draft.date) errors[`${key}.date`] = `The invoice date cannot be after the ${noun} date.`;
  }
  if (draft.reason.trim() === "") errors.reason = "Choose or write the reason.";
  if (!draft.placeOfSupply || !findState(draft.placeOfSupply)) errors.placeOfSupply = "Choose the place of supply.";

  const r = draft.recipient;
  if (r.name.trim() === "") errors["recipient.name"] = "Enter the recipient's name.";
  if (r.address.trim() === "") errors["recipient.address"] = "Enter the recipient's address.";
  if (r.registered) {
    const check = checkGstin(r.gstin, { allowUinMessage: true });
    if (!check.ok) errors["recipient.gstin"] = check.error;
  } else if (!r.stateCode) {
    errors["recipient.stateCode"] = "Choose the recipient's state.";
  }
  validateLines(draft.lines, draft.turnover, r.registered, true, errors);
  return errors;
}

export function buildNoteView(draft: NoteDraft, result: NoteResult): DocView {
  const s = draft.supplier;
  const r = draft.recipient;
  const table = taxTable(result, result.intraState, result.utgst);
  const title = draft.type === "credit" ? "CREDIT NOTE" : "DEBIT NOTE";
  const refs = draft.originals.map((o) => `${o.number.trim()} dated ${displayDate(o.date)}`);
  return {
    title,
    issuer: {
      tradeName: s.tradeName.trim() || undefined,
      heading: "Supplier",
      lines: nonEmpty(s.legalName, s.address, `GSTIN: ${s.gstin.trim().toUpperCase()}`, s.phone && `Phone: ${s.phone}`),
    },
    details: [
      ["Nature of document", draft.type === "credit" ? "Credit note" : "Debit note"],
      [`${draft.type === "credit" ? "Credit" : "Debit"} note No.`, draft.number.trim()],
      ["Date", displayDate(draft.date)],
      ...(draft.originals.length === 1
        ? ([
            ["Against invoice No.", draft.originals[0]!.number.trim()],
            ["Invoice date", displayDate(draft.originals[0]!.date)],
          ] as [string, string][])
        : ([["Against invoices", refs.join("; ")]] as [string, string][])),
      ...(draft.reverseCharge ? ([["Reverse charge", "Yes"]] as [string, string][]) : []),
      ["Place of supply", stateText(draft.placeOfSupply)],
    ],
    parties: [
      {
        heading: "Recipient",
        lines: r.registered
          ? nonEmpty(r.name, r.address, `GSTIN: ${r.gstin.trim().toUpperCase()}`)
          : nonEmpty(r.name, r.address, `State: ${stateText(r.stateCode)}`),
      },
    ],
    ...table,
    totals: taxTotals(result, result.intraState, result.utgst),
    grand: [draft.type === "credit" ? "Total credited" : "Total debited", `₹${formatPaise(result.payable)}`],
    words: result.words,
    extras: [
      ...(draft.reverseCharge
        ? [{ label: "Reverse charge", text: "Tax on this note is payable by the recipient under reverse charge and is not included in the total." }]
        : []),
      ...(draft.reason.trim() ? [{ label: "Reason", text: draft.reason.trim() }] : []),
      ...(draft.notes.trim() ? [{ label: "Notes", text: draft.notes.trim() }] : []),
    ],
    signatoryFor: s.legalName.trim(),
  };
}
