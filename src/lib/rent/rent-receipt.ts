import { formatPaise, parseScaled } from "../gst/money.ts";
import { amountInWords } from "../gst/words.ts";

/**
 * Monthly rent receipts, one per month in the chosen period. Two rules from
 * common HRA practice are surfaced, never enforced: the landlord's PAN is
 * needed when the rent for the year is above ₹1,00,000, and a receipt for a
 * cash payment above ₹5,000 needs a revenue stamp signed across.
 */

export const PAYMENT_MODES = ["Bank transfer", "UPI", "Cheque", "Cash"] as const;
export const PAN_LIMIT_PAISE = 1_00_000_00;
export const STAMP_LIMIT_PAISE = 5_000_00;
export const MAX_MONTHS = 24;

export type RentDraft = {
  tenant: string;
  landlord: string;
  landlordPan: string;
  landlordAddress: string;
  property: string;
  monthlyRent: string;
  from: string; // "2026-04"
  to: string; // "2027-03"
  mode: (typeof PAYMENT_MODES)[number];
  /** Date printed on each receipt: first or last day of that month. */
  receiptDay: "first" | "last";
};

export type RentReceipt = { month: string; date: string; amount: number };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthRange(from: string, to: string): { year: number; month: number }[] | null {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  if (!fy || !fm || !ty || !tm) return null;
  const count = (ty - fy) * 12 + (tm - fm) + 1;
  if (count < 1 || count > MAX_MONTHS) return null;
  return Array.from({ length: count }, (_, i) => {
    const index = fm - 1 + i;
    return { year: fy + Math.floor(index / 12), month: (index % 12) + 1 };
  });
}

export function isValidPan(value: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());
}

export function receipts(draft: RentDraft): RentReceipt[] | null {
  const amount = parseScaled(draft.monthlyRent, 2);
  const range = monthRange(draft.from, draft.to);
  if (amount === null || amount === 0 || !range) return null;
  return range.map(({ year, month }) => {
    const day = draft.receiptDay === "first" ? 1 : new Date(Date.UTC(year, month, 0)).getUTCDate();
    return {
      month: `${MONTHS[month - 1]} ${year}`,
      date: `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`,
      amount,
    };
  });
}

/** Rent over any 12 consecutive months above ₹1,00,000, which is when the PAN is asked for. */
export function panNeeded(draft: RentDraft): boolean {
  const amount = parseScaled(draft.monthlyRent, 2);
  return amount !== null && amount * 12 > PAN_LIMIT_PAISE;
}

export function stampNeeded(draft: RentDraft): boolean {
  const amount = parseScaled(draft.monthlyRent, 2);
  return draft.mode === "Cash" && amount !== null && amount > STAMP_LIMIT_PAISE;
}

export function validateRent(draft: RentDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.tenant.trim() === "") errors.tenant = "Enter the tenant's name.";
  if (draft.landlord.trim() === "") errors.landlord = "Enter the landlord's name.";
  if (draft.property.trim() === "") errors.property = "Enter the address of the rented property.";
  const amount = parseScaled(draft.monthlyRent, 2);
  if (amount === null || amount === 0) errors.monthlyRent = "Enter the monthly rent, up to 2 decimals.";
  if (draft.landlordPan.trim() !== "" && !isValidPan(draft.landlordPan)) {
    errors.landlordPan = "A PAN has 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).";
  }
  if (!draft.from) errors.from = "Choose the first month.";
  if (!draft.to) errors.to = "Choose the last month.";
  if (draft.from && draft.to && !monthRange(draft.from, draft.to)) {
    errors.to = `The last month must be after the first, and at most ${MAX_MONTHS} months in total.`;
  }
  return errors;
}

export function receiptText(draft: RentDraft, receipt: RentReceipt): string {
  return `Received a sum of ₹${formatPaise(receipt.amount)} (${amountInWords(receipt.amount)}) from ${draft.tenant.trim()} towards the rent of ${draft.property.trim()} for the month of ${receipt.month}, paid by ${draft.mode === "UPI" ? "UPI" : draft.mode.toLowerCase()}.`;
}
