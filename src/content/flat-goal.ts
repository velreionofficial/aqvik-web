import type { ToolCopyWithNote } from "@/content/tools";

/** Copy for the flat vs reducing rate calculator and the goal planner. */

export const flatRateTool: ToolCopyWithNote = {
  slug: "flat-vs-reducing-rate-calculator",
  name: "Flat vs Reducing Rate Calculator",
  cardLine: "See the real reducing-balance rate behind a flat-rate or \"0% EMI\" loan, fees included.",
  title: "Flat vs Reducing Interest Rate Calculator — Real Loan Rate | AQVIK",
  description:
    "Convert a flat interest rate into the equivalent reducing-balance rate, see the EMI and total interest, and what a processing fee adds to a \"0% EMI\" offer.",
  h1: "Flat vs reducing rate calculator",
  intro:
    "Some loans quote a flat rate, which charges interest on the full amount for the whole tenure even as you repay it. Enter the offer and see the reducing-balance rate it works out to, the way home and personal loans are usually quoted.",
  how: [
    "Flat interest = Loan amount × flat rate ÷ 100 × months ÷ 12. EMI = (Loan amount + flat interest) ÷ months.",
    "The equivalent reducing rate is the yearly rate, with monthly rests, at which the same EMI for the same months repays the same loan amount. It is found by trying rates until the two match, then rounded to 2 decimals.",
    "With a processing fee, the loan amount you actually receive is smaller, while the EMI stays the same, so the rate is worked out on the amount after the fee.",
    "This is the same monthly-rest method the EMI calculator uses. Lenders may also add GST on fees, insurance or other charges; add them to the fee to include them.",
  ],
  faqs: [
    {
      question: "What is the difference between a flat and a reducing rate?",
      answer:
        "A reducing rate charges interest only on the amount you still owe, which falls every month. A flat rate charges interest on the original amount for the whole tenure. So the same number, say 12%, costs much more as a flat rate.",
    },
    {
      question: "Is a \"0% EMI\" offer really free?",
      answer:
        "The interest may be zero, but a processing fee or other charge paid upfront means you receive less than you repay. Enter the fee here to see what it works out to as a yearly rate.",
    },
    {
      question: "Which rate should I compare between lenders?",
      answer:
        "Compare like with like: reducing-balance rates, including all fees. Ask the lender for the annual percentage rate (APR) and the full list of charges in the key fact statement before you sign.",
    },
  ],
  note: "The result depends on the numbers you enter. Your lender's loan agreement and key fact statement are what apply.",
};

export const goalTool: ToolCopyWithNote = {
  slug: "goal-planner",
  name: "Goal Planner",
  cardLine: "How much to invest each month for a goal like education, a home or a wedding, after inflation.",
  title: "Goal Planner — Monthly SIP Needed for Your Goal | AQVIK",
  description:
    "Enter what a goal costs today and when you need it. See its cost after inflation and the monthly SIP or one-time amount needed, using a return you assume.",
  h1: "Goal planner",
  intro:
    "Tell us what your goal costs today and how many years away it is. See what it may cost then, and how much you would need to invest each month to get there at the return you assume.",
  how: [
    "Goal cost then = Cost today × (1 + inflation ÷ 100)^years.",
    "Savings you already have grow as Savings × (1 + return ÷ 1200)^months.",
    "Monthly SIP = (Goal cost then − what your savings grow to) ÷ [((1 + i)^months − 1) ÷ i × (1 + i)], where i = return ÷ 1200 and each instalment is invested at the start of the month, as in the SIP calculator.",
    "One-time amount today = (Goal cost then − what your savings grow to) ÷ (1 + i)^months.",
    "All sums are exact; amounts are rounded to the paisa only at the end.",
  ],
  faqs: [
    {
      question: "What return should I assume?",
      answer:
        "It is your assumption, and actual returns can be higher, lower or negative, especially for market-linked investments. Try a lower rate as well to see how much more you would need.",
    },
    {
      question: "Why does inflation matter for a goal?",
      answer:
        "Because the goal will cost more when you get there. A course that costs ₹10 lakh today costs about ₹17.9 lakh in 10 years at 6% inflation, and the plan has to aim for that figure.",
    },
    {
      question: "Does this tell me where to invest?",
      answer:
        "No. It only works out the amounts from the cost, years, inflation and return you enter. It does not suggest any fund, scheme or product.",
    },
  ],
  note: "Returns are not guaranteed. The result depends entirely on the inflation and return you assume, and is before any tax.",
};
