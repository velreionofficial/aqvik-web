import type { ToolFaq } from "@/content/tools";

/** Copy for the udhaar / byaj calculator. English with the Hindi terms people search for. */

export const byajTool = {
  slug: "byaj-calculator",
  name: "Udhaar & Byaj Calculator",
  cardLine: "Interest on money lent or borrowed, in rupaye sainkda or % a year, with repayments in between.",
  title: "Byaj Calculator — Udhaar Interest in Rupaye Sainkda | AQVIK",
  description:
    "Work out byaj on udhaar between two dates: rupaye sainkda or % a year, simple or byaj par byaj, with part repayments and a clear ledger. Free PDF.",
  h1: "Udhaar & byaj calculator",
  intro:
    "Lent money to someone, or borrowed it? Enter the amount, the rate the way you agreed it (for example 2 rupaye sainkda), the dates and any repayments, and see the interest and what is still due.",
} as const;

export const rateKinds = [
  { value: "sainkda", label: "Rupaye sainkda", help: "₹ per ₹100 per month. \"2 rupaye sainkda\" means ₹2 on every ₹100 each month." },
  { value: "annual", label: "% per year", help: "The yearly rate, as a bank would quote it." },
  { value: "per1000", label: "₹ per ₹1,000 / month", help: "₹ on every ₹1,000 each month." },
] as const;

export const countingOptions = [
  { value: "months", label: "Months + days", help: "Whole months, and leftover days as a share of a 30-day month. The usual way for udhaar." },
  { value: "days", label: "Exact days", help: "Days between the dates ÷ 365." },
] as const;

export const byajTypeOptions = [
  { value: "simple", label: "Simple (saada byaj)" },
  { value: "compound", label: "Byaj par byaj" },
] as const;

export const compoundOptions = [
  { value: "yearly", label: "Every year" },
  { value: "half", label: "Every 6 months" },
  { value: "monthly", label: "Every month" },
] as const;

export const byajCopy = {
  repaymentsHint:
    "Each repayment first clears the interest due on that date; the rest reduces the amount lent.",
  compoundHint: "Unpaid interest is added to the amount lent on these dates, and then earns interest itself.",
  legalNote:
    "Lending money as a business can need a licence under state money-lending laws, and some states limit the interest that can be charged. For loans between family and friends this is only a calculator.",
  disclaimer:
    "For working out interest from the figures you enter. It is not legal or financial advice, and what you and the other person agreed is what applies.",
  cta: "Keep every udhaar in one place, seen by both sides — try AQVIK.",
};

export const byajFaqs: readonly ToolFaq[] = [
  {
    question: "What does \"2 rupaye sainkda\" mean?",
    answer:
      "It means ₹2 of interest on every ₹100 for each month. On ₹50,000 that is ₹1,000 a month, and over a year it works out to 24%, far more than most bank loans.",
  },
  {
    question: "What is byaj par byaj?",
    answer:
      "Compound interest: unpaid interest is added to the amount lent at set times, usually once a year, and then earns interest too. On ₹50,000 at 2 rupaye sainkda, two years of simple interest is ₹24,000, and with yearly byaj par byaj it is ₹26,880.",
  },
  {
    question: "How are repayments in between counted?",
    answer:
      "On the date of a repayment, the interest due up to that day is worked out first. The repayment clears that interest, and whatever is left reduces the amount lent, so interest after that is on the smaller amount.",
  },
  {
    question: "Why do \"months + days\" and \"exact days\" give different answers?",
    answer:
      "Months + days treats every month as equal and counts leftover days as a share of 30, which is the usual way for udhaar. Exact days divides the actual number of days by 365. Use the way you agreed.",
  },
];
