/**
 * Copy for the free tools at /tools. Titles, the disclaimer and the call to
 * action are fixed by the tools brief; do not add claims about returns or
 * about AQVIK tracking investments (it does not connect to banks or brokers).
 */

export type ToolFaq = { question: string; answer: string };

export const toolDisclaimer =
  "Estimates for illustration only. Actual returns and loan terms vary, and market-linked investments carry risk. This is not financial advice.";

export const toolCta = {
  line: "Tracking EMIs, bills and money you lend to friends? AQVIK keeps it all in one record.",
  button: "Join the beta",
} as const;

export const toolsIndex = {
  title: "Free Financial Tools — EMI, SIP, SWP & GST Invoice | AQVIK",
  description:
    "Free EMI, SIP and SWP calculators and a GST invoice generator with Indian number formatting. Everything runs in your browser; nothing is sent or stored.",
  h1: "Free financial tools.",
  intro:
    "Quick, private calculators for loans and investments, and a GST invoice generator. Everything runs in your browser - nothing you enter is sent or stored.",
} as const;

export type ToolCopy = {
  slug: string;
  name: string;
  cardLine: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  how: readonly string[];
  faqs: readonly ToolFaq[];
};

export const emiTool: ToolCopy = {
  slug: "emi-calculator",
  name: "EMI Calculator",
  cardLine: "Monthly EMI, total interest and a year-by-year repayment schedule.",
  title: "EMI Calculator — Home, Car & Personal Loan EMI | AQVIK",
  description:
    "Calculate the monthly EMI, total interest and repayment schedule for a home, car or personal loan.",
  h1: "EMI calculator",
  intro:
    "Work out the monthly instalment on a home, car or personal loan, and see how much of what you pay goes to interest.",
  how: [
    "The monthly rate is the annual rate divided by 12, and the number of instalments is the tenure in months.",
    "EMI = loan amount × monthly rate × (1 + monthly rate)^months ÷ ((1 + monthly rate)^months − 1). At 0% interest, the EMI is simply the loan amount divided by the number of months.",
    "Each month, interest is charged on the balance still owed; the rest of the EMI reduces the balance. Total interest is the EMI times the number of months, minus the loan amount.",
  ],
  faqs: [
    {
      question: "What is an EMI?",
      answer:
        "An equated monthly instalment is the fixed amount you pay each month until a loan is repaid. Early EMIs are mostly interest; later ones are mostly principal.",
    },
    {
      question: "Why might my bank's EMI differ from this?",
      answer:
        "Banks may add processing fees, insurance or GST on charges, use a floating rate that changes over the loan, or count days differently. Use your loan agreement for the exact figure.",
    },
    {
      question: "Does a longer tenure save money?",
      answer:
        "A longer tenure lowers the EMI but usually raises the total interest you pay, because the balance stays outstanding for longer. Compare the total interest for different tenures above.",
    },
  ],
};

export const sipTool: ToolCopy = {
  slug: "sip-calculator",
  name: "SIP Calculator",
  cardLine: "Estimate what a monthly investment could grow to, with an optional yearly step-up.",
  title: "SIP Calculator — Mutual Fund SIP Returns | AQVIK",
  description:
    "Estimate the future value of a monthly SIP at an expected return, with an optional yearly step-up.",
  h1: "SIP calculator",
  intro:
    "Estimate what a fixed monthly investment could grow to over time at an expected rate of return.",
  how: [
    "The monthly rate is the expected annual return divided by 12, and each instalment is invested at the start of the month.",
    "Future value = monthly amount × ((1 + monthly rate)^months − 1) ÷ monthly rate × (1 + monthly rate).",
    "With a yearly step-up, the calculator works month by month and raises the monthly amount by the step-up percentage every 12 months.",
  ],
  faqs: [
    {
      question: "Will I actually earn this return?",
      answer:
        "No. Mutual fund returns depend on the market and change from year to year. The calculator assumes one steady rate so you can compare scenarios; real results will differ.",
    },
    {
      question: "What is a step-up SIP?",
      answer:
        "A step-up SIP raises your monthly investment by a fixed percentage each year, for example as your income grows.",
    },
    {
      question: "Does this include taxes and fund charges?",
      answer:
        "No. Expense ratios, exit loads and capital-gains tax are not included, so the amount you actually receive will be lower than the estimate.",
    },
  ],
};

export const swpTool: ToolCopy = {
  slug: "swp-calculator",
  name: "SWP Calculator",
  cardLine: "See how long a corpus lasts with a fixed monthly withdrawal.",
  title: "SWP Calculator — Systematic Withdrawal Plan | AQVIK",
  description:
    "See how a corpus changes with a fixed monthly withdrawal, and when it would run out.",
  h1: "SWP calculator",
  intro:
    "See how a lump sum changes when you withdraw a fixed amount every month, and whether it lasts for the period you choose.",
  how: [
    "The monthly rate is the expected annual return divided by 12.",
    "Each month, the withdrawal is taken first - never more than the balance - and then the remaining balance grows by the monthly rate.",
    "If the balance reaches zero before the period ends, the calculator shows the month in which it runs out.",
  ],
  faqs: [
    {
      question: "What is an SWP?",
      answer:
        "A systematic withdrawal plan takes a fixed amount out of an investment at regular intervals, while the rest stays invested.",
    },
    {
      question: "Why does my corpus run out?",
      answer:
        "If you withdraw more each month than the corpus earns, the balance falls every month until it reaches zero. A smaller withdrawal or a higher return makes it last longer.",
    },
    {
      question: "Does this include tax on withdrawals?",
      answer:
        "No. Withdrawals from mutual funds can be taxed as capital gains, and exit loads may apply. The calculator shows amounts before tax.",
    },
  ],
};

export const tools = [emiTool, sipTool, swpTool] as const;
