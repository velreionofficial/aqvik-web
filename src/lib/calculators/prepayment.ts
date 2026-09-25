import { mulDivRound } from "../gst/money.ts";

/**
 * Loan schedule with prepayments, month by month, in integer paise.
 *
 * - EMI = P × r × (1+r)^n / ((1+r)^n − 1), r = annual rate / 1200, rounded
 *   to the paisa.
 * - Interest each month = balance × r, rounded half-up to the paisa.
 * - The final instalment pays the exact remaining balance plus interest. It
 *   comes when that sum is no more than the EMI, or in the last month of the
 *   tenure, so a 20-year loan ends in exactly 240 months.
 * - A prepayment is applied after that month's EMI, never more than the
 *   balance. "Reduce EMI" recomputes the EMI on the remaining balance over the
 *   remaining months.
 *
 * Because interest is rounded every month, the no-prepayment total can differ
 * by a few paise from the EMI calculator, which works at full precision.
 */

export type Prepayment =
  | { type: "none" }
  | { type: "once"; amountPaise: number; afterEmi: number }
  | { type: "monthly"; amountPaise: number }
  | { type: "yearly"; amountPaise: number };

export type ScheduleInput = {
  principalPaise: number;
  /** Annual rate in basis points: 8.5% = 850. */
  rateBp: number;
  months: number;
  prepayment: Prepayment;
  /** Only for a one-time prepayment. */
  after: "reduce-tenure" | "reduce-emi";
};

export type ScheduleYear = { year: number; balance: number; interest: number };

export type ScheduleResult = {
  emi: number;
  /** EMI after a one-time prepayment with "reduce EMI"; else null. */
  newEmi: number | null;
  months: number;
  totalInterest: number;
  totalPrepaid: number;
  finalInstalment: number;
  yearly: ScheduleYear[];
};

/** EMI in paise, rounded to the paisa. */
export function emiPaise(principalPaise: number, rateBp: number, months: number): number {
  if (rateBp === 0) return Math.round(principalPaise / months);
  const r = rateBp / 120000;
  const growth = Math.pow(1 + r, months);
  return Math.round((principalPaise * r * growth) / (growth - 1));
}

export function loanSchedule({ principalPaise, rateBp, months, prepayment, after }: ScheduleInput): ScheduleResult {
  const firstEmi = emiPaise(principalPaise, rateBp, months);
  let emi = firstEmi;
  let newEmi: number | null = null;
  let balance = principalPaise;
  let totalInterest = 0;
  let totalPrepaid = 0;
  let finalInstalment = 0;
  let yearInterest = 0;
  let month = 0;
  const yearly: ScheduleYear[] = [];

  while (balance > 0 && month < months) {
    month += 1;
    const interest = mulDivRound(balance, rateBp, 120000);
    totalInterest += interest;
    yearInterest += interest;

    if (balance + interest <= emi || month === months) {
      finalInstalment = balance + interest;
      balance = 0;
    } else {
      balance = balance + interest - emi;
    }

    if (balance > 0 && prepayment.type !== "none") {
      const due =
        (prepayment.type === "once" && month === prepayment.afterEmi) ||
        prepayment.type === "monthly" ||
        (prepayment.type === "yearly" && month % 12 === 0);
      if (due) {
        const paid = Math.min(prepayment.amountPaise, balance);
        balance -= paid;
        totalPrepaid += paid;
        if (prepayment.type === "once" && after === "reduce-emi" && balance > 0) {
          emi = emiPaise(balance, rateBp, months - month);
          newEmi = emi;
        }
      }
    }

    if (month % 12 === 0 || balance === 0) {
      yearly.push({ year: Math.ceil(month / 12), balance, interest: yearInterest });
      yearInterest = 0;
    }
  }

  return { emi: firstEmi, newEmi, months: month, totalInterest, totalPrepaid, finalInstalment, yearly };
}
