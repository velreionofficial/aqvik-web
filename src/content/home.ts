import {
  Accessibility,
  BarChart3,
  Brain,
  Cpu,
  Lock,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Pillar = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type RoadmapStage = {
  marker: string;
  status: "Building" | "Next" | "Later";
  title: string;
  description: string;
  items: readonly string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const trustPillars: readonly Pillar[] = [
  {
    icon: Lock,
    title: "Secure",
    description:
      "Encrypted in transit and at rest. Sessions are scoped per device and can be revoked from your account.",
  },
  {
    icon: ShieldCheck,
    title: "Private",
    description:
      "Your financial records are yours. We do not sell your data, and we do not share it with advertisers.",
  },
  {
    icon: Cpu,
    title: "AI powered",
    description:
      "AI sorts, summarises and explains. Anything that changes your records asks you first.",
  },
  {
    icon: Accessibility,
    title: "Built for everyone",
    description:
      "Readable type, real contrast, full keyboard and screen-reader support — not an afterthought.",
  },
] as const;

export const features: readonly Feature[] = [
  {
    icon: Receipt,
    title: "Expense tracking",
    description:
      "Record spending in seconds. Amounts stay exact to the paisa, so your totals never drift.",
  },
  {
    icon: Wallet,
    title: "Budget management",
    description:
      "Set limits per category and see how much room is left before the month ends, not after.",
  },
  {
    icon: Target,
    title: "Financial goals",
    description:
      "Name what you are saving for, fund it on your own schedule, and track the distance left.",
  },
  {
    icon: Repeat,
    title: "Subscriptions",
    description:
      "Every recurring charge in one list, with the renewal date and the yearly cost written plainly.",
  },
  {
    icon: TrendingUp,
    title: "Investment tracking",
    description:
      "Hold your investments alongside everything else, so net worth is one number instead of six apps.",
  },
  {
    icon: PiggyBank,
    title: "Savings insights",
    description:
      "See what you actually kept each month and which habits moved that number.",
  },
  {
    icon: Brain,
    title: "AI financial assistant",
    description:
      "Ask questions in plain language. Get answers grounded in your own records, with the working shown.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Trends, categories and comparisons over time — the report you would build by hand, already built.",
  },
] as const;

export type ProductScreen = {
  src: string;
  alt: string;
  caption: string;
};

/** Real captures from the current build. Order sets the grid; the first is eager-loaded. */
export const productScreens: readonly ProductScreen[] = [
  {
    src: "/screens/workspaces.webp",
    alt: "AQVIK workspaces screen listing accounts, people, budgets, goals, investments, groups, bills and documents",
    caption: "Workspaces",
  },
  {
    src: "/screens/home-dashboard.webp",
    alt: "AQVIK home screen showing total balance across accounts, money in and out for the month, and today's activity",
    caption: "Home",
  },
  {
    src: "/screens/ai-assistant.webp",
    alt: "AQVIK AI screen with suggested questions and a field for asking about your own records",
    caption: "AI Assistant",
  },
  {
    src: "/screens/timeline.webp",
    alt: "AQVIK timeline screen listing recent transactions with a search field and category filters",
    caption: "Timeline",
  },
  {
    src: "/screens/quick-actions.webp",
    alt: "AQVIK quick actions for income, expense, transfer, khata, debtors and creditors above a recent activity list",
    caption: "Quick Actions",
  },
  {
    src: "/screens/monthly-summary.webp",
    alt: "AQVIK monthly summary for July 2026 showing money in, money out and a day-by-day breakdown",
    caption: "Monthly Summary",
  },
] as const;

export const whyPoints: readonly { title: string; description: string }[] = [
  {
    title: "A system of record, not a scrapbook",
    description:
      "Most trackers store a pile of rows. AQVIK keeps a consistent financial ledger underneath, so every screen agrees with every other screen and history stays auditable.",
  },
  {
    title: "The AI works on your data, not on averages",
    description:
      "Generic advice is easy and useless. AQVIK reasons over your own transactions, budgets and goals, and tells you where a conclusion came from.",
  },
  {
    title: "Automation that asks before it acts",
    description:
      "Capture and categorisation are automatic. Committing anything to your records is not. You stay the one who confirms.",
  },
  {
    title: "One place for a whole financial life",
    description:
      "Spending is only the entry point. Budgets, goals, subscriptions, investments and savings belong in the same system, because they all draw from the same money.",
  },
] as const;

export const roadmap: readonly RoadmapStage[] = [
  {
    marker: "Now",
    status: "Building",
    title: "Expense management",
    description:
      "The foundation: fast capture, categories, accounts and a ledger that stays correct offline and on.",
    items: ["Transaction capture", "Categories and accounts", "Offline-first sync", "Monthly breakdowns"],
  },
  {
    marker: "Next",
    status: "Next",
    title: "Budget intelligence",
    description:
      "Budgets that respond to how you actually spend, and warn you early rather than reporting the damage.",
    items: ["Adaptive category limits", "Early overspend signals", "Recurring cost detection"],
  },
  {
    marker: "Next",
    status: "Next",
    title: "Investment intelligence",
    description:
      "Holdings and contributions in the same ledger, so net worth and cash flow are one continuous picture.",
    items: ["Portfolio tracking", "Contribution history", "Net worth over time"],
  },
  {
    marker: "Later",
    status: "Later",
    title: "Financial AI",
    description:
      "An assistant that answers questions about your money and can show the records behind every answer.",
    items: ["Conversational queries", "Explained reasoning", "Scenario questions"],
  },
  {
    marker: "Later",
    status: "Later",
    title: "Finance memory",
    description:
      "Context that persists: what you decided, what you tried, and what you asked not to be reminded about again.",
    items: ["Durable preferences", "Decision history", "Personal context"],
  },
  {
    marker: "Later",
    status: "Later",
    title: "Smart planning",
    description:
      "Forward-looking planning across goals, commitments and income — with the trade-offs made visible.",
    items: ["Cash-flow forecasting", "Goal trade-offs", "Commitment planning"],
  },
] as const;

export const faqs: readonly FaqItem[] = [
  {
    question: "Is AQVIK available yet?",
    answer:
      "It is in closed testing on Google Play, which is invite-only — the listing is visible only to accounts on the tester list. There is no public release yet, and no download or user numbers to report.",
  },
  {
    question: "Does AQVIK connect to my bank account?",
    answer:
      "The first release does not link bank accounts. You add and edit your own records, which keeps you in control of what the app knows while the product matures.",
  },
  {
    question: "What does the AI actually do?",
    answer:
      "It handles the tedious parts: sorting entries, summarising a month, spotting recurring charges and answering questions about your own data. It does not move money, and it does not write to your records without your confirmation.",
  },
  {
    question: "Who can see my financial data?",
    answer:
      "You. Access is scoped to your account, data is encrypted in transit and at rest, and we do not sell it or share it with advertisers. The Privacy Policy sets out exactly what is collected and why.",
  },
  {
    question: "Will AQVIK be free?",
    answer:
      "The core of the product will be free to use. Pricing for advanced capabilities has not been finalised, and we will publish it here before anything is charged.",
  },
  {
    question: "Is AQVIK financial advice?",
    answer:
      "No. AQVIK organises information and explains what your own records show. It is not a registered investment adviser and its output is not personalised financial, tax or legal advice.",
  },
  {
    question: "Which platforms will it support?",
    answer:
      "Android, through Google Play, where the closed beta is running now. Further platforms will be announced here when they are close enough to be real commitments.",
  },
  {
    question: "How do I join the beta?",
    answer:
      "Send us the email address on your Google account — through the beta form on this page, over WhatsApp, or to support@aqvik.com. Once it is on the tester list, the Google Play link will work for you.",
  },
] as const;
