/**
 * IPO data model. Every IPO is one typed file in src/content/ipos, filled in by hand from
 * official documents (the RHP filed with SEBI, exchange notices, the registrar). Nothing is
 * scraped and nothing updates live.
 *
 * Deliberately absent, so they cannot be added by accident:
 *   - grey market premium (GMP): an unofficial, unregulated market SEBI has warned about
 *   - ratings, "apply / avoid" calls or target prices: that would be investment advice
 *   - live subscription figures copied from exchanges: we link to the exchange instead
 *   - share prices, listing price, P/E or market cap: market data and valuation are out of scope
 *   - an allotment-chance number: the real chance depends on application counts we do not have
 *
 * Editorial policy (keep it this way; see ipoCopy.editorialPolicy): AQVIK takes no payment from
 * issuers, lead managers, registrars or brokers for IPO pages, carries no broker referral or
 * affiliate links on them, and shows no IPO-specific advertising.
 *
 * Money is integer paise; dates are YYYY-MM-DD in IST.
 */

export type Paise = number;
export type IsoDate = string;

export type Board = "mainboard" | "sme";
export type Exchange = "NSE" | "BSE";

export type SourceKind =
  /** RHP / prospectus filed with SEBI, an exchange notice, or the registrar's own site. */
  | "official"
  /** A news or market site, used only for cross-checking. */
  | "secondary";

export type Source = { label: string; url: string; kind: SourceKind };

/** A category of investors and the share of the issue reserved for it, as worded in the RHP. */
export type Reservation = { category: string; share: string };

/**
 * A summary of the restated financial information in the RHP. Only these lines, never the full
 * statements: the RHP is the full record and is linked. Every figure is integer paise, entered
 * after converting from the RHP's unit (₹ million or ₹ crore), which is recorded in `rhpUnit`.
 */
export type FinancialPeriod = {
  /** As written in the RHP, e.g. "FY 2025" or "Q1 FY 2026 (3 months to 30 Jun 2025)". */
  label: string;
  /** Last day of the period, used to keep periods in order. */
  endsOn: IsoDate;
  /** Months covered: 12 for a full year, fewer for a stub period. */
  months: number;
  revenue: Paise;
  profitAfterTax: Paise;
  netWorth: Paise;
  totalBorrowings: Paise;
  /** Left out when the summary used (e.g. the abridged prospectus) does not state it. */
  totalAssets?: Paise;
};

export type Financials = {
  /** "Restated consolidated" or "Restated standalone", as titled in the RHP. */
  basis: "restated consolidated" | "restated standalone";
  /** The unit the RHP uses, kept so anyone checking knows how figures were converted. */
  rhpUnit: "₹ million" | "₹ lakh" | "₹ crore";
  /** Page number(s) in the RHP where these figures appear. */
  rhpPages: string;
  /** Oldest first. */
  periods: FinancialPeriod[];
};

export type IpoTimeline = {
  open: IsoDate;
  close: IsoDate;
  /** The dates after closing are tentative until the exchange confirms them. */
  allotment?: IsoDate;
  refunds?: IsoDate;
  creditToDemat?: IsoDate;
  listing?: IsoDate;
};

export type Ipo = {
  slug: string;
  company: string;
  /** One neutral line on what the company does, from the RHP. No opinions. */
  about: string;
  board: Board;
  exchanges: Exchange[];
  issueType: "book-built" | "fixed-price";
  faceValue: Paise;
  /** For a fixed-price issue, low and high are the same. */
  priceBand: { low: Paise; high: Paise };
  /** Shares in one lot (the minimum bid). */
  lotSize: number;
  /** Retail lots allowed, as stated in the RHP. */
  retailLots: { min: number; max: number };
  issueSize: {
    totalShares: number;
    /** Amount at the upper price band. */
    totalAmount: Paise;
    freshAmount: Paise;
    offerForSaleAmount: Paise;
  };
  reservations: Reservation[];
  /** Per-share discount for eligible employees, if any. */
  employeeDiscount?: Paise;
  /**
   * Portions reserved outside the net issue (employees, shareholders of a parent), as in the RHP's
   * "The Issue" / "Issue Structure". `amount` is the rupee size printed in the RHP.
   */
  reservedPortions?: {
    kind: "employee" | "shareholder";
    who: string;
    amount: Paise;
    /** Most one person can bid in this portion. */
    maxBid: Paise;
    allotment: string;
  }[];
  /** How the net issue is split, in % as printed in the RHP. */
  netIssueSplit?: { qibMaxPct: number; anchorMaxPctOfQib: number; niiMinPct: number; retailMinPct: number };
  /** Special quotas such as "Shareholders of Reliance Industries Ltd.: up to ₹2 lakh". */
  specialQuotas?: string[];
  timeline: IpoTimeline;
  registrar: { name: string; allotmentStatusUrl: string };
  leadManagers: string[];
  /** Objects of the issue, summarised from the RHP. */
  objects?: string[];
  /** Summary of restated financials from the RHP; required before publishing. */
  financials?: Financials;
  /**
   * What the company does, in plain words a first-time investor understands, written by a person
   * from the RHP's "Our Business" section: facts only (what it sells, to whom, where), no praise.
   */
  business?: { points: string[]; rhpPages: string };
  /**
   * The company's own risk factors. Selection is mechanical, never editorial: the FIRST risk
   * factors in the order the RHP lists them (up to 5), each summarised faithfully, plus the page
   * range of the whole "Risk Factors" section so readers are sent to the full list.
   */
  riskFactors?: {
    section: { fromPage: number; toPage: number };
    /** Where the order comes from when it is not the RHP itself, e.g. "the abridged prospectus (pp. 13–14)". */
    listedIn?: string;
    /** rhpPage is optional only when `listedIn` names the document the order comes from. */
    items: { text: string; rhpPage?: number }[];
  };
  /** Official documents, linked in full. The RHP link is required to publish. */
  documents?: { rhp?: string; abridgedProspectus?: string; basisOfAllotment?: string };
  /** Anchor investor allocation, from the exchange notice (usually one working day before opening). */
  anchor?: { allocatedOn: IsoDate; amount: Paise };
  /** Every change made after publishing, newest last, shown on the page. */
  corrections?: { on: IsoDate; note: string }[];
  sources: Source[];
  /** When a person last checked every field against the sources. */
  verifiedOn: IsoDate;
  /**
   * Only published IPOs appear on the website. An IPO can be published only when it passes
   * validateIpo() (which requires at least one official source).
   */
  published: boolean;
};

export type IpoStatus = "upcoming" | "open" | "closed" | "allotment-out" | "listed";
