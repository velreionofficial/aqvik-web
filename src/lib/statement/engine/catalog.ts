import type { CounterpartyKind, TxnType } from "./model.ts";

/** Names shown for each type, and the choices offered when a user corrects a transaction. */
export const TYPE_LABEL: Record<TxnType, string> = {
  INCOME: "Income",
  SPENDING: "Spending",
  TRANSFER: "Transfer",
  INVESTMENT: "Investment",
  DEBT_PAYMENT: "Debt payment",
  CASH_WITHDRAWAL: "Cash withdrawal",
  REFUND: "Refund",
  CASHBACK: "Cashback",
  FEE: "Fee",
  INTEREST: "Interest",
  UNKNOWN: "Unclassified",
};

export type Choice = { type: TxnType; category: string; kind?: CounterpartyKind };

export const OUT_CHOICES: { type: TxnType; categories: string[]; kind?: CounterpartyKind }[] = [
  { type: "SPENDING", categories: ["Food & dining", "Groceries", "Shopping", "Travel & transport", "Bills & utilities", "Subscriptions", "Rent", "Education", "Healthcare", "Insurance", "Personal care", "Gifts", "Business", "Other spending"] },
  { type: "TRANSFER", categories: ["To people", "Family", "Friend", "Loan given", "Own accounts", "Broker funding", "Wallet top-up", "Bank transfer", "Other transfer"] },
  { type: "INVESTMENT", categories: ["Mutual funds", "Stocks", "FD / RD", "Gold", "Government schemes", "Other investment"] },
  { type: "DEBT_PAYMENT", categories: ["EMI & loans", "Credit card", "Buy now, pay later", "Other debt"] },
  { type: "CASH_WITHDRAWAL", categories: ["Cash withdrawal"] },
  { type: "FEE", categories: ["Bank charges", "ATM charges", "Interest charged", "Penalties", "Other fees"] },
  { type: "UNKNOWN", categories: ["Unclassified money out"] },
];

export const IN_CHOICES: { type: TxnType; categories: string[] }[] = [
  { type: "INCOME", categories: ["Salary", "Regular income", "Business income", "Freelance", "From a company", "Dividend", "Rent received", "Other income"] },
  { type: "TRANSFER", categories: ["From people", "Family", "Friend", "Loan received", "Loan repaid to me", "Own accounts", "From investment platform", "From wallet", "Bank transfer in", "Cash deposited", "Other transfer"] },
  { type: "REFUND", categories: ["Refund"] },
  { type: "CASHBACK", categories: ["Cashback"] },
  { type: "INTEREST", categories: ["Interest"] },
  { type: "UNKNOWN", categories: ["Unclassified money in"] },
];

/** Counterparty kind implied by a user's choice, where obvious. */
export function kindFor(type: TxnType, category: string): CounterpartyKind | undefined {
  if (category === "Own accounts") return "own";
  if (["Family", "Friend", "To people", "From people", "Loan given", "Loan received", "Loan repaid to me"].includes(category)) return "person";
  if (category === "Broker funding" || category === "From investment platform") return "broker";
  if (type === "SPENDING") return "merchant";
  return undefined;
}
