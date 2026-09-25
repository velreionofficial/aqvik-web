import { mulDivRound } from "../gst/money.ts";

/**
 * Cost of carrying a credit card balance, month by month, in integer paise.
 * Assumes no new purchases, no late fees and on-time payments.
 *
 * interest = balance × monthly rate; GST = 18% of interest (if on);
 * statement = balance + interest + GST; minimum due = max(statement × min%,
 * floor); payment = min(statement, minimum due or the fixed amount).
 * Stops when the balance is 0, or after 100 years.
 */

export const MAX_MONTHS = 1200;

export type CardInput = {
  balancePaise: number;
  /** Monthly rate in basis points: 3.5% = 350. */
  monthlyRateBp: number;
  /** Minimum due as a share of the statement, in basis points: 5% = 500. */
  minimumBp: number;
  floorPaise: number;
  gstOnInterest: boolean;
  /** Pay this every month instead of the minimum due. */
  fixedPaise?: number;
};

export type CardResult = {
  months: number;
  cleared: boolean;
  totalInterest: number;
  totalGst: number;
  totalPaid: number;
  /** Balance after each month, for the chart. */
  balances: number[];
};

export function payOffCard({
  balancePaise,
  monthlyRateBp,
  minimumBp,
  floorPaise,
  gstOnInterest,
  fixedPaise,
}: CardInput): CardResult {
  let balance = balancePaise;
  let totalInterest = 0;
  let totalGst = 0;
  let totalPaid = 0;
  let months = 0;
  const balances: number[] = [];

  while (balance > 0 && months < MAX_MONTHS) {
    months += 1;
    const interest = mulDivRound(balance, monthlyRateBp, 10000);
    const gst = gstOnInterest ? mulDivRound(interest, 18, 100) : 0;
    const statement = balance + interest + gst;
    const minimumDue = Math.max(mulDivRound(statement, minimumBp, 10000), floorPaise);
    const payment = Math.min(statement, fixedPaise ?? minimumDue);
    totalInterest += interest;
    totalGst += gst;
    totalPaid += payment;
    balance = statement - payment;
    balances.push(balance);
  }

  return { months, cleared: balance === 0, totalInterest, totalGst, totalPaid, balances };
}
