import { checkGstin } from "./gstin.ts";
import { EINVOICE_EXEMPT_DECLARATION, recipientStateCode, type ComputedInvoice, type InvoiceDraft } from "./invoice.ts";
import { formatPaise, formatScaled } from "./money.ts";
import { stateLabel } from "./states.ts";

/**
 * One printable view of the invoice, shared by the on-screen preview, the PDF
 * and the Excel file so the three can never disagree. Strings only.
 */

export type TaxCell = { rate: string; amount: string };

export type InvoiceViewLine = {
  sno: number;
  description: string;
  /** "Service" for services, empty for goods. */
  kindLabel: string;
  hsn: string;
  quantity: string;
  unit: string;
  rate: string;
  discount: string;
  taxable: string;
  gstRate: string;
  cgst: TaxCell;
  sgst: TaxCell;
  igst: TaxCell;
  total: string;
};

export type InvoiceView = {
  title: "TAX INVOICE";
  copyLabel: string;
  supplier: { tradeName: string; name: string; address: string; gstin: string; state: string; phone: string };
  details: readonly [string, string][];
  billTo: { name: string; address: string; gstin: string; state: string; phone: string };
  shipTo: { name: string; address: string; state: string } | null;
  stateTaxLabel: "SGST" | "UTGST";
  lines: InvoiceViewLine[];
  totals: readonly [string, string][];
  grandTotal: string;
  words: string;
  taxSummary: { rate: string; taxable: string; cgst: string; sgst: string; igst: string }[];
  bank: readonly [string, string][];
  notes: string;
  signature: string | null;
  signatoryFor: string;
  /** Reverse-charge statement, when tax is payable by the recipient. */
  reverseChargeNote: string | null;
  /** Rule 46(s) declaration, when the business is exempt from e-invoicing. */
  declaration: string | null;
  /** Raw numbers for the spreadsheet (rupees, not paise). */
  numbers: {
    lines: { quantity: number; rate: number; discountPct: number; taxable: number; gstPct: number; cgst: number; sgst: number; igst: number; total: number }[];
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    roundOff: number;
    grandTotal: number;
    summary: { gstPct: number; taxable: number; cgst: number; sgst: number; igst: number }[];
  };
};

const pct = (bp: number) => `${formatScaled(bp, 2)}%`;
/** Half a rate in basis points, e.g. 1800 → "9%", 25 → "0.125%". */
const halfPct = (bp: number) => `${formatScaled(bp * 5, 3)}%`;
const money = (paise: number) => formatPaise(paise);

export function displayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

export function buildInvoiceView(draft: InvoiceDraft, invoice: ComputedInvoice): InvoiceView {
  const supplierCheck = checkGstin(draft.supplier.gstin);
  const supplierState = supplierCheck.ok ? stateLabel(supplierCheck.stateCode) : "";
  const recipientState = stateLabel(recipientStateCode(draft));
  const label = invoice.stateTaxLabel;

  const lines: InvoiceViewLine[] = invoice.lines.map((line, index) => ({
    sno: index + 1,
    description: line.description,
    kindLabel: draft.lines.find((l) => l.id === line.id)?.kind === "service" ? "Service" : "",
    hsn: line.hsn,
    quantity: formatScaled(line.quantity, 3),
    unit: line.unit,
    rate: money(line.ratePaise),
    discount: line.discountBp ? pct(line.discountBp) : "—",
    taxable: money(line.taxable),
    gstRate: pct(line.gstBp),
    cgst: { rate: invoice.intraState ? halfPct(line.gstBp) : "0%", amount: money(line.cgst) },
    sgst: { rate: invoice.intraState ? halfPct(line.gstBp) : "0%", amount: money(line.sgst) },
    igst: { rate: invoice.intraState ? "0%" : pct(line.gstBp), amount: money(line.igst) },
    total: money(line.total),
  }));

  const byRate = new Map<number, { taxable: number; cgst: number; sgst: number; igst: number }>();
  for (const line of invoice.lines) {
    const row = byRate.get(line.gstBp) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    row.taxable += line.taxable;
    row.cgst += line.cgst;
    row.sgst += line.sgst;
    row.igst += line.igst;
    byRate.set(line.gstBp, row);
  }

  const totals: [string, string][] = [
    ["Taxable value", money(invoice.taxable)],
    ["CGST", money(invoice.cgst)],
    [label, money(invoice.sgst)],
    ["IGST", money(invoice.igst)],
  ];
  if (invoice.reverseCharge) {
    totals.push(["GST payable by recipient (reverse charge)", money(invoice.totalTax)]);
  }
  if (draft.roundOff) {
    totals.push(["Total before round off", money(invoice.beforeRoundOff)]);
    totals.push(["Round off", money(invoice.roundOff)]);
  }

  const bank: [string, string][] = (
    [
      ["Account name", draft.bank.accountName],
      ["Bank", draft.bank.bankName],
      ["Account number", draft.bank.accountNumber],
      ["IFSC", draft.bank.ifsc],
    ] as [string, string][]
  ).filter(([, value]) => value.trim() !== "");

  const rupees = (paise: number) => paise / 100;

  return {
    title: "TAX INVOICE",
    copyLabel: draft.copyLabel,
    supplier: {
      tradeName: draft.supplier.tradeName.trim(),
      phone: draft.supplier.phone.trim(),
      name: draft.supplier.legalName.trim(),
      address: draft.supplier.address.trim(),
      gstin: supplierCheck.ok ? supplierCheck.gstin : draft.supplier.gstin.trim().toUpperCase(),
      state: supplierState,
    },
    details: [
      ["Invoice No.", draft.invoiceNumber.trim()],
      ["Invoice date", displayDate(draft.invoiceDate)],
      ["Place of supply", stateLabel(draft.placeOfSupply)],
      ["Reverse charge", draft.reverseCharge ? "Yes" : "No"],
      ...(
        [
          ["Buyer's order no.", draft.transport.orderNumber],
          ["Vehicle no.", draft.transport.vehicleNumber.toUpperCase()],
          ["E-way bill no.", draft.transport.eWayBill],
          ["Transporter", draft.transport.transporter],
          ["From", draft.transport.from],
          ["To", draft.transport.to],
        ] as [string, string][]
      )
        .map(([k, v]) => [k, v.trim()] as [string, string])
        .filter(([, v]) => v !== ""),
    ],
    billTo: {
      name: draft.recipient.name.trim(),
      address: draft.recipient.address.trim(),
      gstin: draft.recipient.registered ? draft.recipient.gstin.trim().toUpperCase() : "Unregistered",
      state: recipientState,
      phone: draft.recipient.phone.trim(),
    },
    shipTo: draft.shipToDifferent
      ? {
          name: draft.shipTo.name.trim(),
          address: draft.shipTo.address.trim(),
          state: stateLabel(draft.shipTo.stateCode),
        }
      : null,
    stateTaxLabel: label,
    lines,
    totals,
    grandTotal: money(invoice.grandTotal),
    words: invoice.words,
    taxSummary: [...byRate.entries()]
      .sort(([a], [b]) => a - b)
      .map(([bp, row]) => ({
        rate: pct(bp),
        taxable: money(row.taxable),
        cgst: money(row.cgst),
        sgst: money(row.sgst),
        igst: money(row.igst),
      })),
    bank,
    notes: draft.notes.trim(),
    signature: draft.signature,
    signatoryFor: draft.supplier.tradeName.trim() || draft.supplier.legalName.trim(),
    reverseChargeNote: invoice.reverseCharge
      ? "GST on this invoice is payable by the recipient under reverse charge and is not included in the amount payable to the supplier."
      : null,
    declaration: draft.turnover === "5to500" && draft.eInvoiceExempt ? EINVOICE_EXEMPT_DECLARATION : null,
    numbers: {
      lines: invoice.lines.map((line) => ({
        quantity: line.quantity / 1000,
        rate: rupees(line.ratePaise),
        discountPct: line.discountBp / 100,
        taxable: rupees(line.taxable),
        gstPct: line.gstBp / 100,
        cgst: rupees(line.cgst),
        sgst: rupees(line.sgst),
        igst: rupees(line.igst),
        total: rupees(line.total),
      })),
      taxable: rupees(invoice.taxable),
      cgst: rupees(invoice.cgst),
      sgst: rupees(invoice.sgst),
      igst: rupees(invoice.igst),
      roundOff: rupees(invoice.roundOff),
      grandTotal: rupees(invoice.grandTotal),
      summary: [...byRate.entries()]
        .sort(([a], [b]) => a - b)
        .map(([bp, row]) => ({
          gstPct: bp / 100,
          taxable: rupees(row.taxable),
          cgst: rupees(row.cgst),
          sgst: rupees(row.sgst),
          igst: rupees(row.igst),
        })),
    },
  };
}
