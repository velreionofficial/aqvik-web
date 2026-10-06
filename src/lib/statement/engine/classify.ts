import { hasWord, payeeOf } from "../categorize.ts";
import { ENTITIES } from "./entities.ts";
import { kindFromName } from "./kinds.ts";
import {
  IN_TYPES,
  OUT_TYPES,
  layerRank,
  type Classification,
  type CounterpartyKind,
  type Layer,
  type PaymentMethod,
  type RawTxn,
  type TxnType,
  type UserEdit,
  type UserRule,
} from "./model.ts";

/**
 * Classification precedence (strongest first). A weaker layer never replaces a
 * stronger one:
 *
 *   1. user-rule   "everything from MOHAN is Family" (hard override)
 *   2. user-edit   a decision on one transaction
 *   3. structural  bank codes: ATM, charges, interest, salary, self transfer, refund words…
 *   4. entity      known names: brokers, AMCs, lenders, merchants, wallets
 *   5. channel     how it was paid: UPI to a person or a merchant, NEFT, auto-debit
 *   6. behaviour   patterns across transactions (see links.ts); may only replace "fallback"
 *   7. fallback    UNKNOWN
 *
 * Uncertainty is preferred to a wrong interpretation: weak evidence gives a
 * low confidence, and no evidence gives UNKNOWN.
 */

const W = (t: string) => ` ${t.toUpperCase().replace(/\s+/g, " ")} `;
const any = (t: string, words: string[]) => words.some((w) => hasWord(t, w));

export function paymentMethod(description: string): PaymentMethod {
  const t = W(description);
  if (any(t, ["ATM", "ATW", "NWD", "CASH WDL", "CWDR"])) return "ATM";
  if (any(t, ["NACH", "ACH", "ECS", "MANDATE", "SI ", "AUTOPAY", "AUTO DEBIT"])) return "AUTO_DEBIT";
  if (/(^|[^A-Z])UPI([^A-Z]|$)/.test(t) || /@[A-Z]/.test(t) || /PAID TO|RECEIVED FROM/.test(t)) return "UPI";
  if (any(t, ["NEFT"])) return "NEFT";
  if (any(t, ["IMPS", "MMT"])) return "IMPS";
  if (any(t, ["RTGS"])) return "RTGS";
  if (any(t, ["POS", "ECOM", "CARD"])) return "CARD";
  if (any(t, ["CHQ", "CHEQUE", "CLG", "CLEARING"])) return "CHEQUE";
  if (any(t, ["CASH DEP", "BY CASH", "CASH DEPOSIT"])) return "CASH";
  if (any(t, ["INB", "TRANSFER", "TFR", "TRF"])) return "INTERNAL";
  return "OTHER";
}

type Candidate = { type: TxnType; category: string; kind: CounterpartyKind; confidence: number; layer: Layer; reason: string };

const SELF_WORDS = ["TRANSFERRED TO SELF", "TRANSFER TO SELF", "SELF TRANSFER", "RECEIVED FROM SELF", "TO SELF", "FROM SELF", "OWN ACCOUNT", "SELF A/C"];

const WHOLE = new Map<string, RegExp>();
function wholeWord(w: string): RegExp {
  let re = WHOLE.get(w);
  if (!re) {
    re = new RegExp(`(^|[^A-Z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Z0-9]|$)`);
    WHOLE.set(w, re);
  }
  return re;
}

/**
 * Kind of bank or card charge, if the description is one. Order matters: the
 * most specific wording first ("GST ON ATM CHG" is GST, "ATM CHG" is an ATM charge).
 */
export function feeKind(t: string): string | null {
  // Whole words only: "RECHARGE" must not read as "CHARGE".
  const any = (text: string, words: string[]) => words.some((w) => wholeWord(w).test(text));
  if (!any(t, ["CHARGES", "CHARGE", "CHRG", "CHGS", "CHG", "SCHG", "SMS ALERT", "MIN BAL", "NON MAINT", "ANNUAL FEE", "AMC", "PENAL", "PENALTY", "LATE FEE", "LATE PAYMENT FEE", "ECS RETURN", "NACH RETURN", "ACH RETURN", "CHQ RETURN", "BOUNCE", "DEBIT CARD FEE", "CARD FEE", "GST ON", "SERVICE CHARGE", "FINANCE CHARGE", "OVERLIMIT", "PROCESSING FEE"])) return null;
  if (any(t, ["GST", "IGST", "CGST", "SGST"])) return "GST on charges";
  if (any(t, ["ECS RETURN", "NACH RETURN", "ACH RETURN", "CHQ RETURN", "BOUNCE", "RETURN CHG", "RTN CHG"])) return "Bounce & return charges";
  if (any(t, ["LATE FEE", "LATE PAYMENT FEE", "OVERLIMIT", "PENAL", "PENALTY"])) return "Penalties & late fees";
  if (any(t, ["MIN BAL", "NON MAINT", "MAB", "AMB"])) return "Minimum balance charges";
  if (any(t, ["ATM", "ATW", "NFS"])) return "ATM charges";
  if (any(t, ["SMS"])) return "SMS charges";
  if (any(t, ["ANNUAL FEE", "DEBIT CARD FEE", "CARD FEE", "AMC"])) return "Card & account fees";
  if (any(t, ["FINANCE CHARGE", "PROCESSING FEE"])) return "Finance charges";
  if (any(t, ["SCHG", "SERVICE CHARGE"])) return "Service charges";
  return "Other bank charges";
}

/** Bank codes and explicit words: strong, structural evidence. */
function structural(t: string, out: boolean): Candidate | null {
  const c = (type: TxnType, category: string, kind: CounterpartyKind, confidence: number, reason: string): Candidate => ({ type, category, kind, confidence, layer: "structural", reason });
  // Explicit self-transfer wording only; a name that resembles the holder is not enough.
  if (SELF_WORDS.some((w) => t.includes(w))) return c("TRANSFER", "Own accounts", "own", 0.85, "The statement marks this as a self transfer");
  if (out) {
    const fee = feeKind(t);
    if (fee) return c("FEE", fee, "bank", 0.9, "Bank or card charge code in the description");
    if (any(t, ["ATM", "ATW", "NWD", "CASH WDL", "CASH WITHDRAWAL", "CWDR", "SELF WITHDRAWAL"])) return c("CASH_WITHDRAWAL", "Cash withdrawal", "own", 0.95, "ATM / cash withdrawal code");
    if (any(t, ["CREDIT CARD", "CC PAYMENT", "CARD PAYMENT", "CRED CLUB", "CREDCLUB", "CC BILL"])) return c("DEBT_PAYMENT", "Credit card", "lender", 0.85, "Credit card bill payment");
    if (any(t, ["INTEREST", "INT CHARGED"])) return c("FEE", "Interest charged", "bank", 0.7, "Interest debited");
    return null;
  }
  if (any(t, ["INT.PD", "INT PD", "INTEREST", "INT CREDIT", "INT.CR", "SB INT", "CREDIT INTEREST"])) return c("INTEREST", "Interest", "bank", 0.95, "Interest credited by the bank");
  if (any(t, ["CASHBACK", "CASH BACK"])) return c("CASHBACK", "Cashback", "merchant", 0.9, "Cashback wording");
  if (any(t, ["REFUND", "REVERSAL", "REVERSED", "CHARGEBACK", "RFND"])) return c("REFUND", "Refund", "merchant", 0.85, "Refund / reversal wording");
  if (any(t, ["SALARY", "SAL CREDIT", "SAL FOR", "PAYROLL", "SAL "])) return c("INCOME", "Salary", "other_institution", 0.9, "Salary wording in the description");
  if (any(t, ["DIVIDEND", "DIV "])) return c("INCOME", "Dividend", "other_institution", 0.85, "Dividend wording");
  if (any(t, ["CASH DEP", "BY CASH", "CASH DEPOSIT"])) return c("TRANSFER", "Cash deposited", "own", 0.8, "Cash deposit");
  return null;
}

function entity(t: string, out: boolean): Candidate | null {
  // Banks such as SBI cut names short and break UPI IDs with spaces ("pay tmmoney"), so long
  // single-word names are also looked for in the text with spaces removed.
  const squashed = t.replace(/\s+/g, "");
  for (const e of ENTITIES) {
    const word = e.words.find((w) => hasWord(t, w) || (w.length >= 8 && !w.includes(" ") && squashed.includes(w)));
    if (!word) continue;
    const target = out ? e.out : e.in;
    if (!target) continue;
    return { type: target.type, category: target.category, kind: e.kind, confidence: e.confidence, layer: "entity", reason: e.kind === "broker" ? `"${word}" is an investment platform` : `"${word}" in the description` };
  }
  return null;
}

/** UPI app tags printed with an entry ("Tag: # Groceries"). */
const APP_TAGS: [RegExp, string][] = [
  [/^GROCER/, "Groceries"],
  [/^(FOOD|DINING|RESTAURANT)/, "Food & dining"],
  [/^SHOPPING/, "Shopping"],
  [/^(TRAVEL|FUEL|TRANSPORT|CAB)/, "Travel & transport"],
  [/^(BILL|RECHARGE|UTILIT)/, "Bills & utilities"],
  [/^(ENTERTAINMENT|MOVIE|CINEMA|GAMING|GAMES)/, "Entertainment"],
  [/^SUBSCRIPTION/, "Subscriptions"],
  [/^(HEALTH|MEDICAL|MEDICINE)/, "Healthcare"],
  [/^EDUCATION/, "Education"],
  [/^RENT/, "Rent"],
];

const MERCHANT_VPA = /(PAYTMQR|QR|BHARATPE|OKBIZ|BIZ|MERCHANT|RAZORPAY|RZP|CASHFREE|BILLDESK|PAYU|GPAY-\d|\.MID|MSWIPE|PINELABS|EZETAP)/;
const COMPANY = /\b(PVT|PRIVATE|LTD|LIMITED|LLP|TECHNOLOGIES|ENTERPRISES|SOLUTIONS|SERVICES|INDUSTRIES|CORPORATION|CORP|COMPANY|TRADERS|AGENCY)\b/;

function channel(t: string, out: boolean, method: PaymentMethod): Candidate | null {
  const c = (type: TxnType, category: string, kind: CounterpartyKind, confidence: number, reason: string): Candidate => ({ type, category, kind, confidence, layer: "channel", reason });
  const tag = /#\s*([A-Z][A-Z &]+)/.exec(t)?.[1]?.trim();
  const tagged = tag ? APP_TAGS.find(([re]) => re.test(tag)) : undefined;
  if (out && tagged) return c("SPENDING", tagged[1], "merchant", 0.7, `Tagged "${tag}" in the app`);
  if (method === "CARD" && out) return c("SPENDING", "Other spending", "merchant", 0.6, "Card payment at a merchant");
  if (method === "AUTO_DEBIT" && out) return c("UNKNOWN", "Auto-debit", "other_institution", 0.35, "Auto-debit (mandate) to a company we could not identify");
  if (method === "UPI") {
    const vpa = /([A-Z0-9._-]+)@([A-Z]+)/.exec(t.replace(/\s/g, ""));
    if (MERCHANT_VPA.test(t) || COMPANY.test(t)) {
      return out ? c("SPENDING", "Other spending", "merchant", 0.55, "UPI payment to a merchant (QR / business UPI ID)") : c("REFUND", "Refund", "merchant", 0.4, "UPI money from a merchant");
    }
    const looksPerson = Boolean(vpa) || /(UPI\/(DR|CR)\/\d+\/[A-Z][A-Z .]{2,})|PAID TO [A-Z]|RECEIVED FROM [A-Z]|MONEY SENT TO/.test(t);
    if (looksPerson) return out ? c("TRANSFER", "To people", "person", 0.5, "UPI payment to an individual's UPI ID (could also be a small shop)") : c("TRANSFER", "From people", "person", 0.5, "UPI payment from an individual");
  }
  if (method === "NEFT" || method === "IMPS" || method === "RTGS" || method === "INTERNAL") {
    if (!out && COMPANY.test(t)) return c("INCOME", "From a company", "other_institution", 0.55, "Bank transfer from a company");
    return out ? c("TRANSFER", "Bank transfer", "unknown", 0.4, "Bank transfer (NEFT/IMPS) to an account") : c("TRANSFER", "Bank transfer in", "unknown", 0.4, "Bank transfer (NEFT/IMPS) received");
  }
  if (method === "CHEQUE") return c("UNKNOWN", out ? "Cheque paid" : "Cheque received", "unknown", 0.3, "Cheque or clearing entry");
  return null;
}

export function fits(type: TxnType, out: boolean): boolean {
  return out ? OUT_TYPES.has(type) : IN_TYPES.has(type);
}

/**
 * Classification depends only on the description and direction, so it is cached
 * (statements repeat the same descriptions, and every user edit re-runs the engine).
 */
const CACHE = new Map<string, Omit<Classification, never>>();
const CACHE_LIMIT = 50_000;

/** Classify one transaction from its own text (no cross-transaction evidence). */
export function classifyOne(txn: RawTxn): Classification {
  const key = `${txn.debit > 0 ? "o" : "i"}|${txn.credit > 0 && txn.credit <= 10_00 ? "tiny|" : ""}${txn.description}`;
  const hit = CACHE.get(key);
  if (hit) return { ...hit, counterparty: { ...hit.counterparty }, reasons: [...hit.reasons] };
  const result = classifyFresh(txn);
  if (CACHE.size >= CACHE_LIMIT) CACHE.clear();
  CACHE.set(key, result);
  return { ...result, counterparty: { ...result.counterparty }, reasons: [...result.reasons] };
}

/** Categories the channel layer gives when it knows only how money moved, not what it was. */
const DEFAULT_CATEGORIES = new Set(["To people", "From people", "Bank transfer", "Bank transfer in", "Cheque paid", "Cheque received"]);

const has = (t: string, words: string[]) => words.some((w) => wholeWord(w).test(t));
const TAX_WORDS = ["TAX", "GST", "CHALLAN", "FEE", "FEES", "LICENCE", "LICENSE", "REGISTRATION", "NTRP", "STAMP DUTY", "PENALTY", "FINE"];
const GOVT_INCOME = ["SALARY", "PENSION", "SCHOLARSHIP", "SUBSIDY", "DBT", "BENEFIT", "STIPEND", "HONORARIUM", "KISAN", "INCENTIVE", "ALLOWANCE", "WAGES", "MGNREGA"];
const REFUND_WORDS = ["REFUND", "REVERSAL", "REVERSED", "RFND", "TAX REFUND", "ITR REFUND"];
const ENTERTAINMENT_WORDS = ["CINEMA", "CINEMAS", "MULTIPLEX", "PVR", "INOX", "BOOKMYSHOW"];

/**
 * Economic type from a counterparty kind, used only when the channel layer had nothing better
 * than a default. Kind alone never makes income: government money needs income wording to be
 * income, and is otherwise a transfer with low confidence (PFMS alone is not enough).
 */
function fromKind(kind: string, w: string, t: string, out: boolean): Candidate | null {
  const c = (type: TxnType, category: string, confidence: number, reason: string): Candidate => ({ type, category, kind: kind as CounterpartyKind, confidence, layer: "entity", reason });
  switch (kind) {
    case "government":
      if (out) return has(t, TAX_WORDS) ? c("SPENDING", "Taxes & government fees", 0.75, `Payment to a government body ("${w}") for a tax or fee`) : c("TRANSFER", "To government", 0.4, `Payment to a government body ("${w}"); purpose not stated`);
      if (has(t, REFUND_WORDS)) return c("REFUND", "Refund", 0.75, `Refund from a government body ("${w}")`);
      if (has(t, GOVT_INCOME)) return c("INCOME", "Government payment", has(t, ["SALARY", "PENSION"]) ? 0.8 : 0.6, `Payment from a government body ("${w}") with income wording`);
      return c("TRANSFER", "From government", 0.35, `From a government body or payment system ("${w}"); purpose not stated`);
    case "bank":
      return out ? c("TRANSFER", "Bank transfer", 0.4, `Paid to a bank ("${w}")`) : c("TRANSFER", "From bank", 0.4, `Received from a bank ("${w}")`);
    case "lender":
      return out ? c("DEBT_PAYMENT", "EMI & loans", 0.6, `Paid to a lender ("${w}")`) : c("TRANSFER", "Loan received", 0.5, `Received from a lender ("${w}")`);
    case "insurance":
      return out ? c("SPENDING", "Insurance", 0.65, `Paid to an insurer ("${w}")`) : c("TRANSFER", "From insurance", 0.4, `Received from an insurer ("${w}")`);
    case "broker":
      return out ? c("TRANSFER", "Broker funding", 0.7, `"${w}" is an investment platform`) : c("TRANSFER", "From investment platform", 0.7, `"${w}" is an investment platform`);
    case "wallet":
      return out ? c("TRANSFER", "Wallet top-up", 0.6, `"${w}" is a wallet`) : c("TRANSFER", "From wallet", 0.6, `"${w}" is a wallet`);
    case "healthcare":
    case "education":
    case "utility":
    case "hospitality":
    case "merchant": {
      if (!out) return c("TRANSFER", "From a business", 0.4, `Received from a business ("${w}")`);
      const category =
        kind === "healthcare" ? "Healthcare" : kind === "education" ? "Education" : kind === "utility" ? "Bills & utilities" : kind === "hospitality" ? "Hotels & restaurants" : has(t, ENTERTAINMENT_WORDS) ? "Entertainment" : "Other spending";
      return c("SPENDING", category, 0.6, `Business name ("${w}")`);
    }
    case "other_institution":
      return out ? c("SPENDING", "Other spending", 0.45, `Paid to a company or organisation ("${w}")`) : c("TRANSFER", "From a company", 0.4, `Received from a company or organisation ("${w}")`);
    default:
      return null;
  }
}

function classifyFresh(txn: RawTxn): Classification {
  const out = txn.debit > 0;
  const t = W(txn.description);
  const method = paymentMethod(txn.description);
  const name = payeeOf(txn.description);
  let found = structural(t, out) ?? entity(t, out) ?? channel(t, out, method);
  const named = kindFromName(name, txn.description);
  if (named) {
    if (!found || (found.layer === "channel" && DEFAULT_CATEGORIES.has(found.category))) {
      // The channel only knew how money moved; the name tells us who the other side is.
      found = fromKind(named.kind, named.word, t, out) ?? found;
    } else if (["unknown", "other_institution", "merchant"].includes(found.kind) && named.kind !== "merchant") {
      // Keep the type a stronger rule decided; only make the kind more precise.
      found = { ...found, kind: named.kind };
    } else if (found.kind === "unknown") {
      found = { ...found, kind: named.kind };
    }
  } else if (found && found.kind === "unknown" && found.layer === "entity") {
    // e.g. rent paid by UPI to an individual
    const ch = channel(t, out, method);
    if (ch?.kind === "person") found = { ...found, kind: "person" };
  }
  // ₹10 or less from a lender or payments company is an account check ("penny drop"), not a loan.
  if (found && !out && txn.credit <= 10_00 && found.category === "Loan received") {
    found = { ...found, category: "Account verification", reason: "A tiny credit from a lender, usually an account check" };
  }
  if (found && fits(found.type, out)) {
    return { type: found.type, category: found.category, counterparty: { name, kind: found.kind }, method, confidence: found.confidence, layer: found.layer, reasons: [found.reason] };
  }
  return {
    type: "UNKNOWN",
    category: out ? "Unclassified money out" : "Unclassified money in",
    counterparty: { name, kind: "unknown" },
    method,
    confidence: 0.2,
    layer: "fallback",
    reasons: ["No clear evidence in the description"],
  };
}

/** Apply a user decision if it fits the direction; user decisions are certain. */
function applyUser(c: Classification, set: UserEdit["set"], out: boolean, layer: "user-rule" | "user-edit", reason: string): Classification {
  if (!fits(set.type, out)) return c;
  return {
    ...c,
    type: set.type,
    category: set.category,
    counterparty: { ...c.counterparty, kind: set.kind ?? c.counterparty.kind },
    confidence: 1,
    layer,
    reasons: [reason, ...c.reasons.filter((r) => !r.startsWith("You "))],
  };
}

/**
 * Final say of the user over the engine. Rules beat edits, edits beat everything
 * automatic. Called after behaviour links, so nothing automatic runs afterwards.
 */
export function applyUserDecisions(c: Classification, txn: RawTxn, rules: UserRule[], edits: UserEdit[]): Classification {
  const out = txn.debit > 0;
  let result = c;
  const edit = edits.find((e) => e.txnId === txn.id);
  if (edit) result = applyUser(result, edit.set, out, "user-edit", "You set this transaction");
  const rule = rules.find((r) => r.counterparty.toUpperCase() === c.counterparty.name.toUpperCase());
  if (rule) result = applyUser(result, rule.set, out, "user-rule", `You set every payment with ${rule.counterparty}`);
  return result;
}

/** May a classification from `incoming` replace one from `current`? Only a stronger (lower-ranked) layer may. */
export const canReplace = (current: Layer, incoming: Layer) => layerRank(incoming) < layerRank(current);
