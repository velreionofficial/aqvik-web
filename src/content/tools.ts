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
  title: "Free Financial Tools — EMI, SIP, FD, GST & More | AQVIK",
  description:
    "Free EMI, SIP, SWP, loan prepayment, credit card, FD, RD and GST calculators and a GST invoice generator. Everything runs in your browser; nothing is sent or stored.",
  h1: "Free financial tools.",
  intro:
    "Quick, private calculators for loans, cards, deposits and GST, and a GST invoice generator. Everything runs in your browser - nothing you enter is sent or stored.",
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

/* ---------------------------------------------------------------------------
 * Second set of tools (GST calculator, loan prepayment, credit card, FD, RD).
 * Shared legal copy is fixed by the tools brief; rates are always user-entered.
 * ------------------------------------------------------------------------- */

export const moneyToolDisclaimer =
  "Estimates for illustration only, based on the numbers you enter. Your bank or lender may calculate differently. This is not financial, tax or legal advice.";

export const lenderRateNote =
  "Enter the rate from your bank or lender. Rates change; this tool does not know current rates.";

export const moneyToolCta = {
  line: "Keep track of EMIs, bills and money you lend to friends in one place.",
  button: "Join the beta",
} as const;

export type ToolCopyWithNote = ToolCopy & { note: string };

export const gstCalcTool: ToolCopyWithNote = {
  slug: "gst-calculator",
  name: "GST Calculator",
  cardLine: "Add GST to a price or take it out, with the CGST, SGST or IGST split.",
  title: "GST Calculator — Add or Remove GST | AQVIK",
  description: "Add GST to an amount or remove it from a GST-inclusive price, with the CGST and SGST or IGST split.",
  h1: "GST calculator",
  intro: "Add GST to a price, or work out how much GST is inside a price that already includes it.",
  how: [
    "When the amount excludes GST, CGST and SGST are each half the rate applied to the amount, rounded to the paisa; between states, IGST is the full rate. The total is the amount plus the tax.",
    "When the amount includes GST, the taxable value is the amount × 100 ÷ (100 + rate), rounded to the paisa, and GST is the difference. CGST is half of that, rounded, and SGST is the rest, so the parts always add up exactly.",
  ],
  faqs: [
    {
      question: "When do I use CGST and SGST, and when IGST?",
      answer:
        "CGST and SGST (or UTGST in some union territories) apply when the supplier and the place of supply are in the same state. IGST applies when they are in different states.",
    },
    {
      question: "How do I remove GST from a price?",
      answer:
        "Choose \"Amount includes GST\". The taxable value is the price × 100 ÷ (100 + GST rate), and the GST is the price minus that value.",
    },
    {
      question: "Which GST rate should I use?",
      answer:
        "The rate depends on the exact goods or service and its HSN or SAC code. Rates were revised in 2025, so check the current rate for your item on the GST portal or with your tax professional.",
    },
  ],
  note: "GST rates were revised in 2025. Choose the current rate for your item.",
};

export const prepaymentTool: ToolCopyWithNote = {
  slug: "loan-prepayment-calculator",
  name: "Loan Prepayment Calculator",
  cardLine: "See how much interest and time a part-payment could save on your loan.",
  title: "Loan Prepayment Calculator — Interest Saved | AQVIK",
  description: "See how a one-time, monthly or yearly part-payment changes your loan's interest, tenure or EMI.",
  h1: "Loan prepayment calculator",
  intro: "Paying extra on a loan? Compare the interest and time left with and without a part-payment.",
  how: [
    "The EMI is the loan amount × monthly rate × (1 + monthly rate)^months ÷ ((1 + monthly rate)^months − 1), rounded to the paisa. The monthly rate is the annual rate divided by 12.",
    "Each month, interest is charged on the balance and rounded to the paisa, like a real loan schedule. The rest of the EMI reduces the balance. The last instalment pays exactly what is left, so the loan ends on time.",
    "A prepayment is taken off the balance after that month's EMI. With \"Reduce tenure\" the EMI stays the same and the loan ends sooner; with \"Reduce EMI\" the EMI is worked out again on the remaining balance over the remaining months.",
    "Because interest is rounded every month here, the total without prepayment can differ by a few paise from the EMI calculator, which works at full precision. Both are correct for their method.",
  ],
  faqs: [
    {
      question: "Is it better to reduce the tenure or the EMI?",
      answer:
        "Reducing the tenure usually saves more interest, because the loan is repaid sooner. Reducing the EMI lowers your monthly outgo instead. Compare both above for your numbers.",
    },
    {
      question: "Does my bank charge for prepaying?",
      answer:
        "It depends on your loan. Some loans carry a prepayment or foreclosure charge. Check your loan agreement or ask your lender before prepaying.",
    },
    {
      question: "Why is my bank's figure slightly different?",
      answer:
        "Banks may count days differently, change a floating rate during the loan, or apply prepayments on a different date. Treat this as an estimate.",
    },
  ],
  note: "Some loans carry a prepayment or foreclosure charge, and tax benefits on home-loan interest are not included. Check your loan terms before prepaying.",
};

export const creditCardTool: ToolCopyWithNote = {
  slug: "credit-card-interest-calculator",
  name: "Credit Card Interest Calculator",
  cardLine: "See what paying only the minimum due really costs, and how long it takes.",
  title: "Credit Card Interest Calculator — Minimum Due Cost | AQVIK",
  description: "See how long a credit card balance takes to clear, and what it costs, if you pay only the minimum due.",
  h1: "Credit card interest calculator",
  intro: "Find out how long a card balance takes to clear if you pay only the minimum due, compared with a fixed amount each month.",
  how: [
    "Assumptions: no new purchases, no late fees, and every payment made on time.",
    "Each month, interest is the balance × the monthly rate, rounded to the paisa. If GST is on, 18% of the interest is added. The statement is the balance plus interest plus GST.",
    "The minimum due is the larger of the minimum percentage of the statement and the minimum amount. The payment is the minimum due (or your fixed amount), never more than the statement, and the rest carries forward.",
    "The calculation stops when the balance reaches zero, or after 100 years.",
  ],
  faqs: [
    {
      question: "Why does paying the minimum take so long?",
      answer:
        "Most of a small minimum payment goes to interest and GST, so the balance falls very slowly. Paying a fixed, larger amount clears it much faster.",
    },
    {
      question: "What monthly rate should I enter?",
      answer:
        "Use the monthly finance charge shown on your card statement or in your card's terms. It is often quoted per month.",
    },
    {
      question: "Is GST charged on card interest?",
      answer:
        "Yes, GST applies to interest and fees charged by card issuers. You can switch it off above to compare.",
    },
  ],
  note: "Real cards charge interest daily from each transaction date, stop the interest-free period while you carry a balance, and may add late fees. Your actual cost can be higher. Check your card statement for your rate.",
};

const depositTaxNote =
  "Shows the pre-tax amount for a cumulative FD. Interest may be taxable and TDS may apply. Payout FDs are not covered yet.";

export const fdTool: ToolCopyWithNote = {
  slug: "fd-calculator",
  name: "FD Calculator",
  cardLine: "Maturity amount and interest on a cumulative fixed deposit.",
  title: "FD Calculator — Fixed Deposit Maturity | AQVIK",
  description: "Work out the maturity amount and interest on a cumulative fixed deposit, with quarterly, monthly, half-yearly or yearly compounding.",
  h1: "FD calculator",
  intro: "Work out what a cumulative fixed deposit grows to by maturity.",
  how: [
    "Interest is added at the end of each compounding period (quarterly by default) and then earns interest itself.",
    "Maturity = deposit × (1 + rate ÷ (100 × periods per year))^(whole periods). Any months left over after the last whole period earn simple interest: × (1 + rate ÷ 100 × leftover months ÷ 12).",
    "The result is rounded to the paisa only at the end.",
  ],
  faqs: [
    {
      question: "What is a cumulative FD?",
      answer:
        "In a cumulative FD the interest is not paid out; it is added to the deposit and paid with it at maturity. In a payout FD the interest is paid monthly or quarterly instead, which this tool does not cover yet.",
    },
    {
      question: "Is FD interest taxable?",
      answer:
        "FD interest is generally taxable as income, and the bank may deduct TDS. This calculator shows the amount before tax.",
    },
    {
      question: "Why does compounding frequency matter?",
      answer:
        "The more often interest is compounded, the sooner it starts earning interest itself, so the maturity amount is slightly higher.",
    },
  ],
  note: depositTaxNote,
};

export const rdTool: ToolCopyWithNote = {
  slug: "rd-calculator",
  name: "RD Calculator",
  cardLine: "Maturity amount of a recurring deposit, with quarterly compounding.",
  title: "RD Calculator — Recurring Deposit Maturity | AQVIK",
  description: "Work out the maturity amount and interest on a recurring deposit with quarterly compounding.",
  h1: "RD calculator",
  intro: "Work out what a fixed monthly deposit grows to by maturity.",
  how: [
    "Compounding is quarterly, as most banks use for recurring deposits.",
    "Each deposit is made at the start of its month and grows until maturity: the deposit made in month k of n grows for (n − k + 1) months, at (1 + rate ÷ 400)^(months ÷ 3).",
    "The maturity amount is the sum of all deposits with their growth, rounded to the paisa only at the end.",
  ],
  faqs: [
    {
      question: "How is an RD different from an FD?",
      answer:
        "An FD is one lump sum deposited once. An RD is a fixed amount deposited every month for a chosen period.",
    },
    {
      question: "What tenure can I choose?",
      answer:
        "Banks usually offer RDs in multiples of 3 months. The calculator accepts any number of months so you can compare.",
    },
    {
      question: "Is RD interest taxable?",
      answer:
        "RD interest is generally taxable as income, and TDS may apply. This calculator shows the amount before tax.",
    },
  ],
  note: "Shows the pre-tax amount for a recurring deposit. Interest may be taxable and TDS may apply.",
};

export const moneyTools = [gstCalcTool, prepaymentTool, creditCardTool, fdTool, rdTool] as const;
