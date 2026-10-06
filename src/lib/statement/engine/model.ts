/**
 * AQVIK money engine: domain-independent types. Nothing here knows about React,
 * the website copy or a particular bank, so the same engine can serve the
 * statement analyzer, the app and Business OS bank reconciliation.
 *
 * Money is always integer paise. Raw statement data is never modified; every
 * interpretation lives in a separate Classification.
 */

export type Paise = number;

/** One statement line, exactly as read and balance-checked. */
export type RawTxn = {
  /** Stable within an analysis: `${sourceFileId}:${row}`. */
  id: string;
  sourceFileId: string;
  date: string; // YYYY-MM-DD
  description: string;
  debit: Paise;
  credit: Paise;
  balance: Paise | null;
};

export const TXN_TYPES = [
  "INCOME",
  "SPENDING",
  "TRANSFER",
  "INVESTMENT",
  "DEBT_PAYMENT",
  "CASH_WITHDRAWAL",
  "REFUND",
  "CASHBACK",
  "FEE",
  "INTEREST",
  "UNKNOWN",
] as const;
export type TxnType = (typeof TXN_TYPES)[number];

/** Types that only make sense for money out, or only for money in. */
export const OUT_TYPES: ReadonlySet<TxnType> = new Set(["SPENDING", "INVESTMENT", "DEBT_PAYMENT", "CASH_WITHDRAWAL", "FEE", "TRANSFER", "UNKNOWN"]);
export const IN_TYPES: ReadonlySet<TxnType> = new Set(["INCOME", "REFUND", "CASHBACK", "INTEREST", "TRANSFER", "UNKNOWN"]);

/**
 * Who the other side is. Kind says nothing by itself about the economic type: money from a
 * government body is not automatically income, and a payment to a merchant is not automatically
 * spending. Type is decided from direction, description, channel, entities and links.
 */
export const COUNTERPARTY_KINDS = [
  "person",
  "merchant",
  "government",
  "bank",
  "lender",
  "broker",
  "investment_platform",
  "wallet",
  "insurance",
  "utility",
  "education",
  "hospitality",
  "healthcare",
  "other_institution",
  "own",
  "unknown",
] as const;
export type CounterpartyKind = (typeof COUNTERPARTY_KINDS)[number];

/** Kinds that sell goods or services: these make up "Top merchants". */
export const MERCHANT_KINDS: ReadonlySet<CounterpartyKind> = new Set(["merchant", "hospitality", "utility", "education", "healthcare"]);
/** Kinds shown as "Top institutions". */
export const INSTITUTION_KINDS: ReadonlySet<CounterpartyKind> = new Set(["government", "bank", "lender", "insurance", "other_institution"]);
export type PaymentMethod = "UPI" | "NEFT" | "IMPS" | "RTGS" | "ATM" | "AUTO_DEBIT" | "CARD" | "CHEQUE" | "CASH" | "INTERNAL" | "OTHER";

/**
 * Where a classification came from, strongest first. A lower layer can never
 * replace a higher one: an explicit user rule always wins.
 */
export const LAYERS = ["user-rule", "user-edit", "structural", "entity", "channel", "behaviour", "fallback"] as const;
export type Layer = (typeof LAYERS)[number];
export const layerRank = (l: Layer) => LAYERS.indexOf(l);

export type Band = "high" | "medium" | "low";
export const band = (confidence: number): Band => (confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low");

export type Classification = {
  type: TxnType;
  /** Human category within the type, e.g. "Food & dining", "Broker funding", "Salary". */
  category: string;
  counterparty: { name: string; kind: CounterpartyKind };
  method: PaymentMethod;
  /** 0–1. User decisions are 1. */
  confidence: number;
  layer: Layer;
  /** Plain-language evidence, most important first. */
  reasons: string[];
  /** Links found across transactions. */
  refundOf?: string;
  duplicateOf?: string;
  pairId?: string;
};

export type ClassifiedTxn = RawTxn & { c: Classification };

/** "Everything from MOHAN is Family": a hard rule the engine never overrides. */
export type UserRule = {
  id: string;
  /** Matches the counterparty name exactly (case-insensitive). */
  counterparty: string;
  set: { type: TxnType; category: string; kind?: CounterpartyKind };
};

/** A decision on one transaction. */
export type UserEdit = { txnId: string; set: { type: TxnType; category: string; kind?: CounterpartyKind } };

export type Bucket = { key: string; amount: Paise; count: number };
