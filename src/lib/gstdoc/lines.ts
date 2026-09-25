import { findCategory } from "../gst/classification.ts";
import { checkInvoiceNumber } from "../gst/invoice-number.ts";
import { checkHsn, computeLine, gstBasisPoints, type ComputedLine, type LineDraft, type Turnover } from "../gst/invoice.ts";
import { formatPaise, formatScaled, parseScaled } from "../gst/money.ts";
import { findState } from "../gst/states.ts";
import type { DocColumn } from "./view.ts";

/** Item lines shared by the Bill of Supply, Delivery Challan and Credit/Debit Note. */

export type Errors = Record<string, string>;

export type LineTotals = {
  lines: ComputedLine[];
  gross: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

/** withTax false: every line is treated as 0% and no tax is ever added. */
export function computeLines(lines: LineDraft[], intraState: boolean, withTax: boolean): LineTotals | null {
  const computed: ComputedLine[] = [];
  for (const line of lines) {
    const c = computeLine(withTax ? line : { ...line, gstRate: "0", customRate: "" }, intraState);
    if (!c) return null;
    computed.push(c);
  }
  const sum = (pick: (c: ComputedLine) => number) => computed.reduce((s, c) => s + pick(c), 0);
  return {
    lines: computed,
    gross: sum((c) => c.gross),
    discount: sum((c) => c.discount),
    taxable: sum((c) => c.taxable),
    cgst: sum((c) => c.cgst),
    sgst: sum((c) => c.sgst),
    igst: sum((c) => c.igst),
    total: sum((c) => c.total),
  };
}

export function validateLines(
  lines: LineDraft[],
  turnover: Turnover,
  recipientRegistered: boolean,
  withTax: boolean,
  errors: Errors,
): void {
  if (lines.length === 0) errors.lines = "Add at least one item.";
  for (const line of lines) {
    const key = `lines.${line.id}`;
    if (line.description.trim() === "") errors[`${key}.description`] = "Enter a description.";
    const hsnError = checkHsn(line.hsn, turnover, recipientRegistered, line.kind);
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
    if (withTax && gstBasisPoints(line) === null) errors[`${key}.gstRate`] = "Enter a GST rate from 0 to 100%, up to 2 decimals.";
  }
}

/** Document number: up to 16 characters, letters, digits, "-" and "/" (Rules 49, 53, 55). */
export function checkDocNumber(value: string, noun: string): string | null {
  const error = checkInvoiceNumber(value);
  return error ? error.replace(/an invoice number/gi, `a ${noun} number`).replace(/invoice number/gi, `${noun} number`) : null;
}

export function stateText(code: string): string {
  const state = findState(code);
  return state ? `${state.name} (${state.code})` : "";
}

export function displayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

/** Item table without tax (Bill of Supply, challan not for supply). */
export function valueTable(totals: LineTotals, provisional = false): { columns: DocColumn[]; rows: string[][] } {
  return {
    columns: [
      { label: "#" },
      { label: "Description" },
      { label: "HSN/SAC" },
      { label: "Qty", align: "right" },
      { label: "Unit" },
      { label: "Rate (₹)", align: "right" },
      { label: "Disc.", align: "right" },
      { label: "Value (₹)", align: "right" },
    ],
    rows: totals.lines.map((l, i) => [
      String(i + 1),
      l.description,
      l.hsn || "—",
      `${formatScaled(l.quantity, 3)}${provisional ? " (prov.)" : ""}`,
      l.unit,
      formatPaise(l.ratePaise),
      l.discountBp ? `${formatScaled(l.discountBp, 2)}%` : "—",
      formatPaise(l.taxable),
    ]),
  };
}

/** Item table with tax columns (credit/debit note, challan for supply). */
export function taxTable(
  totals: LineTotals,
  intraState: boolean,
  utgst: boolean,
  provisional = false,
): { columns: DocColumn[]; rows: string[][] } {
  const stateTax = utgst ? "UTGST" : "SGST";
  return {
    columns: [
      { label: "#" },
      { label: "Description" },
      { label: "HSN/SAC" },
      { label: "Qty", align: "right" },
      { label: "Unit" },
      { label: "Rate (₹)", align: "right" },
      { label: "Taxable (₹)", align: "right" },
      { label: "GST %", align: "right" },
      ...(intraState
        ? [
            { label: "CGST (₹)", align: "right" as const },
            { label: `${stateTax} (₹)`, align: "right" as const },
          ]
        : [{ label: "IGST (₹)", align: "right" as const }]),
      { label: "Total (₹)", align: "right" },
    ],
    rows: totals.lines.map((l, i) => [
      String(i + 1),
      l.description,
      l.hsn || "—",
      `${formatScaled(l.quantity, 3)}${provisional ? " (prov.)" : ""}`,
      l.unit,
      formatPaise(l.ratePaise),
      formatPaise(l.taxable),
      formatScaled(l.gstBp, 2),
      ...(intraState ? [formatPaise(l.cgst), formatPaise(l.sgst)] : [formatPaise(l.igst)]),
      formatPaise(l.total),
    ]),
  };
}

export function taxTotals(totals: LineTotals, intraState: boolean, utgst: boolean): [string, string][] {
  const rows: [string, string][] = [["Taxable value", formatPaise(totals.taxable)]];
  if (intraState) {
    rows.push(["CGST", formatPaise(totals.cgst)], [utgst ? "UTGST" : "SGST", formatPaise(totals.sgst)]);
  } else {
    rows.push(["IGST", formatPaise(totals.igst)]);
  }
  return rows;
}
