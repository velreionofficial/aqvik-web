/** Invoice number rules (CGST Rule 46(b)): up to 16 characters; letters, digits, "-" and "/". */

export const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9/-]+$/;

export function checkInvoiceNumber(value: string): string | null {
  const text = value.trim();
  if (text === "") return "Enter an invoice number.";
  if (text.length > 16) return "An invoice number can have at most 16 characters.";
  if (!INVOICE_NUMBER_PATTERN.test(text)) {
    return 'Use only letters, numbers, hyphen "-" and slash "/".';
  }
  return null;
}

/** INV/2026-27/0001 on 2026-09-25 → "INV_2026_27_0001_2026-09-25" */
export function invoiceFileName(invoiceNumber: string, isoDate: string, extension: "pdf" | "xlsx"): string {
  const base = invoiceNumber.trim().replace(/[/-]/g, "_") || "invoice";
  return `${base}_${isoDate || "undated"}.${extension}`;
}
