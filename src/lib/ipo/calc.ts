import type { Ipo, IpoStatus, Paise } from "./model.ts";
import { RULES } from "./rules.ts";

/** Amount payable for `lots` lots at `price` per share (bid at cut-off = upper band). */
export const bidAmount = (ipo: Pick<Ipo, "lotSize">, lots: number, price: Paise): Paise => lots * ipo.lotSize * price;

/** The most lots a retail investor can bid without crossing the retail limit, at a given price. */
export function maxRetailLots(lotSize: number, price: Paise, limit: Paise = RULES.retailMaxBid): number {
  if (lotSize <= 0 || price <= 0) return 0;
  return Math.floor(limit / (lotSize * price));
}

export type GainResult = {
  shares: number;
  invested: Paise;
  saleValue: Paise;
  gain: Paise;
  /** Short-term capital gains tax plus cess, only on a gain; no surcharge, no brokerage. */
  tax: Paise;
  netGain: Paise;
};

/**
 * A hypothetical sale: what selling `shares` bought at `issuePrice` at a price the USER types
 * would leave, if sold within 12 months. We never suggest a sale price. Tax is rounded to the
 * nearest paisa; a loss has no tax here (set-off is the user's). STT, stamp duty, brokerage,
 * exchange charges, surcharge and slab differences are not included.
 */
export function saleEstimate(shares: number, issuePrice: Paise, salePrice: Paise, rateBp: number = RULES.stcgRateBp, cessBp: number = RULES.cessBp): GainResult {
  const invested = shares * issuePrice;
  const saleValue = shares * salePrice;
  const gain = saleValue - invested;
  const base = gain > 0 ? Math.round((gain * rateBp) / 10_000) : 0;
  const tax = base + Math.round((base * cessBp) / 10_000);
  return { shares, invested, saleValue, gain, tax, netGain: gain - tax };
}

export type BidCategory = "retail" | "small-nii" | "big-nii";

/**
 * Which individual-investor category a mainboard bid of `amount` falls in, and whether UPI can be
 * used for it. Retail up to ₹2 lakh; small NII above that to ₹10 lakh; big NII above ₹10 lakh.
 */
export function bidCategory(amount: Paise): { category: BidCategory; upi: boolean } {
  const category: BidCategory = amount <= RULES.retailMaxBid ? "retail" : amount <= RULES.smallNiiMaxBid ? "small-nii" : "big-nii";
  return { category, upi: amount <= RULES.upiMaxBid };
}

/** Status on a given IST date (YYYY-MM-DD). */
export function ipoStatus(ipo: Pick<Ipo, "timeline">, today: string): IpoStatus {
  const t = ipo.timeline;
  if (t.listing && today >= t.listing) return "listed";
  if (t.allotment && today >= t.allotment) return "allotment-out";
  if (today > t.close) return "closed";
  if (today >= t.open) return "open";
  return "upcoming";
}

/** Today's date in India, whatever the server's time zone. */
export const todayIST = (now: Date = new Date()): string => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** Whole days from `today` to `date` (negative once past). */
export const daysUntil = (date: string, today: string) => Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
