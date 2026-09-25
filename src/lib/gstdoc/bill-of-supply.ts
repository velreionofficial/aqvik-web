import { checkGstin } from "../gst/gstin.ts";
import { isValidPhone, type LineDraft } from "../gst/invoice.ts";
import { formatPaise } from "../gst/money.ts";
import { amountInWords } from "../gst/words.ts";
import { checkDocNumber, computeLines, displayDate, validateLines, valueTable, type Errors, type LineTotals } from "./lines.ts";
import { lines as nonEmpty, type DocView } from "./view.ts";

/**
 * Bill of Supply (CGST Rule 49), issued instead of a tax invoice by a
 * composition taxpayer, or by a registered person supplying exempt goods or
 * services. It never carries tax. A composition taxpayer must print the
 * declaration below at the top (Rule 5(1)(f)).
 */

export const COMPOSITION_DECLARATION = "composition taxable person, not eligible to collect tax on supplies";

export type BosIssuer = "" | "composition" | "exempt";

export type BosDraft = {
  issuer: BosIssuer;
  /** Only decides the HSN digits: 4 up to ₹5 crore, 6 above. */
  turnover: "upto5" | "above5";
  supplier: { legalName: string; tradeName: string; address: string; gstin: string; phone: string };
  number: string;
  date: string;
  recipient: { registered: boolean; name: string; address: string; gstin: string };
  lines: LineDraft[];
  roundOff: boolean;
  notes: string;
};

export type BosResult = LineTotals & { roundOff: number; grand: number; words: string };

export function computeBos(draft: Pick<BosDraft, "lines" | "roundOff">): BosResult | null {
  const totals = computeLines(draft.lines, true, false);
  if (!totals) return null;
  const grand = draft.roundOff ? Math.floor((totals.taxable + 50) / 100) * 100 : totals.taxable;
  return { ...totals, roundOff: grand - totals.taxable, grand, words: amountInWords(grand) };
}

export function validateBos(draft: BosDraft): Errors {
  const errors: Errors = {};
  if (!draft.issuer) errors.issuer = "Choose why you issue a Bill of Supply.";
  if (draft.supplier.legalName.trim() === "") errors["supplier.legalName"] = "Enter your legal name.";
  if (draft.supplier.address.trim() === "") errors["supplier.address"] = "Enter your address.";
  const gstin = checkGstin(draft.supplier.gstin);
  if (!gstin.ok) errors["supplier.gstin"] = gstin.error;
  if (!isValidPhone(draft.supplier.phone)) errors["supplier.phone"] = "Use digits only, with an optional +, spaces or hyphens.";
  const numberError = checkDocNumber(draft.number, "bill");
  if (numberError) errors.number = numberError;
  if (draft.date.trim() === "") errors.date = "Enter the date.";
  if (draft.recipient.registered) {
    if (draft.recipient.name.trim() === "") errors["recipient.name"] = "Enter the recipient's name.";
    if (draft.recipient.address.trim() === "") errors["recipient.address"] = "Enter the recipient's address.";
    const r = checkGstin(draft.recipient.gstin, { allowUinMessage: true });
    if (!r.ok) errors["recipient.gstin"] = r.error;
  }
  validateLines(draft.lines, draft.turnover === "above5" ? "5to500" : "upto5", draft.recipient.registered, false, errors);
  return errors;
}

export function buildBosView(draft: BosDraft, result: BosResult): DocView {
  const s = draft.supplier;
  const r = draft.recipient;
  const recipientLines = r.registered
    ? nonEmpty(r.name, r.address, `GSTIN: ${r.gstin.trim().toUpperCase()}`)
    : nonEmpty(r.name, r.address);
  const table = valueTable(result);
  const totals: [string, string][] = [["Value before discount", formatPaise(result.gross)]];
  if (result.discount) totals.push(["Discount", `−${formatPaise(result.discount)}`]);
  if (draft.roundOff && result.roundOff) totals.push(["Round off", formatPaise(result.roundOff)]);
  return {
    title: "BILL OF SUPPLY",
    topNote: draft.issuer === "composition" ? COMPOSITION_DECLARATION : undefined,
    issuer: {
      tradeName: s.tradeName.trim() || undefined,
      heading: "Supplier",
      lines: nonEmpty(s.legalName, s.address, `GSTIN: ${s.gstin.trim().toUpperCase()}`, s.phone && `Phone: ${s.phone}`),
    },
    details: [
      ["Bill No.", draft.number.trim()],
      ["Date", displayDate(draft.date)],
    ],
    parties: recipientLines.length ? [{ heading: "Recipient", lines: recipientLines }] : [],
    ...table,
    totals,
    grand: ["Total", `₹${formatPaise(result.grand)}`],
    words: result.words,
    extras: nonEmpty(draft.notes).map((text) => ({ label: "Notes", text })),
    signatoryFor: s.legalName.trim(),
  };
}
