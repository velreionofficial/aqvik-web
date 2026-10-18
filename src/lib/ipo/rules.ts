import type { Paise } from "./model.ts";

/**
 * Rules that change with regulation or the budget live here, each with where it comes from,
 * so one edit updates every IPO page and calculator.
 */
export const RULES = {
  /** Maximum a retail individual investor can bid in a mainboard IPO (SEBI ICDR). */
  retailMaxBid: 2_00_000_00 as Paise,
  /** Small non-institutional (sNII) bids are above the retail limit up to ₹10 lakh; above that is big NII (bNII). */
  smallNiiMaxBid: 10_00_000_00 as Paise,
  /** Most an IPO bid can be through UPI; larger bids go through ASBA net banking. */
  upiMaxBid: 5_00_000_00 as Paise,
  /** Risk factors shown per IPO: the first ones in RHP order. */
  maxRiskFactors: 5,
  /**
   * Short-term capital gains on listed equity sold within 12 months (STT paid), tax year 2026-27.
   * Re-check every Budget. The page states the rate only, never a section number.
   */
  stcgRateBp: 2000,
  /** Health and education cess on income tax. Surcharge depends on income and is not applied. */
  cessBp: 400,
  taxYearLabel: "FY 2026-27",
} as const;
