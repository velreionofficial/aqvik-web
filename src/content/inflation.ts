import type { ToolCopyWithNote } from "@/content/tools";

/** Copy for the inflation calculator. The rate is always the user's assumption. */
export const inflationTool: ToolCopyWithNote = {
  slug: "inflation-calculator",
  name: "Inflation Calculator",
  cardLine: "What things may cost in future, what money later is worth today, and your return after inflation.",
  title: "Inflation Calculator India — Future Cost & Real Return | AQVIK",
  description:
    "See what something may cost after years of inflation, what a future amount is worth in today's money, and your real return after inflation. Free, in your browser.",
  h1: "Inflation calculator",
  intro:
    "Prices rise a little every year, so the same rupee buys less later. Pick a question below and see the effect of an inflation rate you choose.",
  how: [
    "Future cost = Today's cost × (1 + inflation rate ÷ 100)^years.",
    "Worth in today's money = Future amount ÷ (1 + inflation rate ÷ 100)^years.",
    "Real return = ((1 + return ÷ 100) ÷ (1 + inflation ÷ 100) − 1) × 100. Simply subtracting inflation from the return gives a close but slightly higher figure.",
    "Inflation is applied once a year at the same rate every year. All sums are exact; amounts are rounded to the paisa only at the end.",
  ],
  faqs: [
    {
      question: "What inflation rate should I use?",
      answer:
        "It is your assumption. You can look at recent consumer price inflation published by the government, and use a higher rate for costs that usually rise faster, such as education or healthcare. Try a few rates to see the range.",
    },
    {
      question: "What is real return?",
      answer:
        "It is how much your money grows in buying power after inflation. If an investment earns 7% a year and prices rise 6% a year, your buying power grows by about 0.94% a year, not 7%.",
    },
    {
      question: "Why does ₹1 lakh in 10 years matter less than ₹1 lakh today?",
      answer:
        "Because prices rise in between. At 6% a year, what costs ₹1 lakh today would cost about ₹1.79 lakh in 10 years, so ₹1 lakh then buys only what about ₹55,839 buys today.",
    },
  ],
  note: "Inflation is not the same every year or for every item. The result depends entirely on the rate you enter.",
};

export const inflationModes = [
  { value: "future", label: "Future cost" },
  { value: "today", label: "Worth today" },
  { value: "real", label: "Real return" },
] as const;
export type InflationMode = (typeof inflationModes)[number]["value"];

export const inflationModeHelp: Record<InflationMode, string> = {
  future: "What will something that costs this much today cost after some years?",
  today: "What will an amount you get in future be worth in today's money?",
  real: "How much does a return beat inflation by, in buying power?",
};
