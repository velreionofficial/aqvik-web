import {
  BarChart3,
  Brain,
  CalendarClock,
  FileSpreadsheet,
  Gauge,
  PiggyBank,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Homepage copy. Everything here is final copy from the homepage brief
 * (24 September 2026, claims checked against app commit b7dd852). Do not add
 * features, numbers or promises that are not in the brief.
 */

export type TitledText = { title: string; description: string };

export const hero = {
  eyebrow: "Personal finance · Built in India",
  headline: "Money between friends, finally on one page.",
  subheadline:
    "Lend to a friend, borrow from a roommate, split a trip - AQVIK keeps one shared record that both of you see and both of you confirm. Your own spending, budgets and bills live right beside it.",
  primaryCta: "Join the beta",
  secondaryPrefix: "Already a tester?",
  secondaryLink: "Open in Google Play",
  microline: "Free during beta · Android · Closed testing, invite only",
  screen: {
    src: "/screens/loan-agreement.webp",
    alt: "AQVIK loan agreement screen showing an active loan with its amount, the date it was given, the return date, the interest rate and the late-interest rate",
  },
} as const;

export const proofPoints: readonly TitledText[] = [
  {
    title: "You confirm everything",
    description: "The AI reads and explains. Nothing enters your records unless you tap confirm.",
  },
  {
    title: "Exact to the paisa",
    description: "No rounding, ever. Totals always add up.",
  },
  {
    title: "Works offline",
    description: "Add entries without a signal; they sync when you are back online.",
  },
] as const;

export const sharedMoney = {
  eyebrow: "Shared money",
  heading: "No more “I’m sure I paid you back.”",
  intro:
    "Most apps track only your side. AQVIK gives the two of you one record: every entry either person adds is visible to both, and it counts once the other person confirms it.",
  steps: [
    {
      title: "Record it",
      description:
        "Add what you lent or borrowed - the person, the amount, and any terms you agreed.",
    },
    {
      title: "They confirm",
      description:
        "Your friend gets a notification and confirms the entry, or disputes it if something is off.",
    },
    {
      title: "Both stay in sync",
      description:
        "Repayments, balances and history stay identical on both phones. No screenshots, no arguments.",
    },
  ] as readonly TitledText[],
  cards: [
    {
      title: "Loan agreements",
      description:
        "Propose a loan with an amount and terms. The other person can accept, or come back with a counter-offer. Interest, if you agree any, is calculated for you.",
    },
    {
      title: "Group expenses",
      description:
        "Create a group for a trip, a flat or an office lunch, add what each person paid, and see who owes whom.",
    },
    {
      title: "Khata for people you deal with",
      description:
        "Keep a running record of what customers or friends owe you, and what you owe others, in one list.",
    },
  ] as readonly TitledText[],
  smallPrint:
    "Both people need an AQVIK account. AQVIK only keeps the record - it never holds, sends or collects money.",
} as const;

export type Feature = TitledText & { icon: LucideIcon };

export const everythingElse = {
  heading: "The rest of your money, on the same record.",
  intro:
    "Every screen reads from one ledger, so the numbers on your budget, your home screen and your statement always agree.",
  features: [
    {
      icon: Wallet,
      title: "Expenses and income",
      description: "Add an entry in seconds, across cash, bank and card accounts.",
    },
    {
      icon: CalendarClock,
      title: "Bills that remind you",
      description:
        "Rent, electricity, insurance, EMIs, vehicle tax and more - reminded before they are due, not after.",
    },
    {
      icon: Gauge,
      title: "Safe to spend",
      description:
        "What you can spend each day for the rest of the month, after bills and commitments are set aside.",
    },
    {
      icon: PiggyBank,
      title: "Budgets",
      description: "Set limits by category and see the room left while the month is still running.",
    },
    {
      icon: Target,
      title: "Goals",
      description: "Name what you are saving for and track the distance left.",
    },
    {
      icon: BarChart3,
      title: "Net worth and investments",
      description: "Hold investments alongside everything else, so your net worth is one number.",
    },
    {
      icon: FileSpreadsheet,
      title: "Monthly statements",
      description:
        "Export any month as Excel or PDF, laid out like a bank statement - made on your phone.",
    },
    {
      icon: Brain,
      title: "An AI assistant for your own money",
      description:
        "Ask in plain words - English or Hinglish - and get answers from your own records.",
    },
  ] as readonly Feature[],
} as const;

export type ProductScreen = {
  src: string;
  alt: string;
  caption: string;
};

export const screensCopy = {
  heading: "The app as it is today.",
  line: "Real screens from the current beta, not mock-ups. The design will keep improving before public launch.",
} as const;

/**
 * Real captures from the beta, in phone frames. The loan agreement screen is
 * used in the hero. Order sets the carousel.
 */
export const productScreens: readonly ProductScreen[] = [
  {
    src: "/screens/cashflow.webp",
    alt: "AQVIK cash flow screen showing how much is safe to spend per day for the rest of the month, and a projection of opening balance, expected inflows, committed outflows and projected closing balance",
    caption: "Cash flow",
  },
  {
    src: "/screens/home.webp",
    alt: "AQVIK home screen showing total balance across accounts, safe to spend per day, and money in and out this month",
    caption: "Home",
  },
  {
    src: "/screens/ai-assistant.webp",
    alt: "AQVIK AI screen with suggested questions and a field for asking about your own records",
    caption: "AI Assistant",
  },
  {
    src: "/screens/monthly-summary.webp",
    alt: "AQVIK monthly summary for July 2026 showing money in, money out and a day-by-day breakdown",
    caption: "Monthly Summary",
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
] as const;

export const trust = {
  heading: "Built to be trusted with money.",
  intro: "These are how the app works, not badges. Each one is enforced in the code and tested.",
  points: [
    {
      title: "You stay in control",
      description:
        "The AI assistant reads and explains your records. During the beta it cannot add, change or delete anything; every entry is made or confirmed by you.",
    },
    {
      title: "Your data is not for sale",
      description:
        "No ads, no selling data, no sharing with advertisers. Your records are not used to train AI models.",
    },
    {
      title: "Your account, your devices",
      description:
        "Every signed-in device is listed in your account. Removing one signs it out immediately, and changing your password signs out every device.",
    },
    {
      title: "Protected in transit",
      description:
        "All traffic is encrypted. Server data is protected by our hosting provider’s encryption and access controls.",
    },
    {
      title: "Leave any time",
      description:
        "Export your records whenever you like. Delete your account from the app, and it happens straight away.",
    },
  ] as readonly TitledText[],
  link: "Read the full Privacy Policy →",
} as const;

export const roadmap = {
  heading: "What is built, and what comes next.",
  intro: "No dates until they are commitments. Here is where things actually stand.",
  built: {
    title: "Built",
    note: "Available in the beta",
    items: [
      "Shared ledger, loan agreements and group expenses",
      "Expenses, income, transfers and multiple accounts",
      "Bills and subscriptions with reminders",
      "Budgets and goals",
      "Safe-to-spend and cash-flow view",
      "Net worth and investment tracking",
      "AI assistant that reads and explains your records",
      "Monthly statements as Excel or PDF",
      "Offline-first sync and notifications",
    ],
  },
  next: {
    title: "Next",
    items: [
      "Attach receipts and documents to entries and bills",
      "Let the assistant record entries for you - still only after you confirm",
      "What-if planning: see how a decision changes your month",
      "iPhone app",
    ],
  },
} as const;

export const joinBeta = {
  heading: "Join the closed beta.",
  intro:
    "AQVIK is being tested by a small group on Android. Testers get every new build first, and a direct line to the person building it.",
  steps: [
    {
      title: "Ask to join",
      description:
        "Send us the Google account you use on your phone, using the form below or WhatsApp.",
    },
    {
      title: "Accept the invite",
      description:
        "Once you are added, open the Google Play link and accept the testing invitation.",
    },
    {
      title: "Install",
      description: "Install AQVIK from Google Play. New builds arrive as normal updates.",
    },
  ] as readonly TitledText[],
  consentBefore:
    "We use these details only to add you to the AQVIK closed test and to contact you about it. See our ",
  consentLink: "Privacy Policy",
  consentAfter: ".",
  requestAccess: "Request access",
  whatsapp: "Message us on WhatsApp",
  playStore: "Already added? Open Google Play",
} as const;

/** Founder-approved text (24 September 2026). No photo, no other biography. */
export const founder = {
  heading: "Built by a person you can reach.",
  why: "I built AQVIK because keeping track of money — your own, and the money between you and the people around you — shouldn't depend on memory, screenshots or guesswork.",
  reachBefore:
    "AQVIK is built in India by Prakash Raj. If something is wrong, confusing or missing, write to ",
  reachAfter: " — it comes to me.",
} as const;

export type FaqItem = { question: string; answer: string };

export const faqHeading = "Straight answers.";

export const faqs: readonly FaqItem[] = [
  {
    question: "Is AQVIK available now?",
    answer:
      "Yes, as a closed beta on Android. Request access in the section above; once your Google account is added, you install it from Google Play.",
  },
  {
    question: "Does AQVIK connect to my bank account?",
    answer:
      "No. You add entries yourself, or with help from the assistant. AQVIK never asks for your bank login, card PIN, UPI PIN or OTP.",
  },
  {
    question: "Does the other person need AQVIK for shared records?",
    answer:
      "Yes. A shared ledger or group needs both people on AQVIK. You can send them the app from Settings, under Share AQVIK.",
  },
  {
    question: "Does AQVIK move or hold money?",
    answer:
      "No. AQVIK is a record-keeping app. It never holds, sends or collects money, and it is not a lender or payment service.",
  },
  {
    question: "What does the AI assistant do?",
    answer:
      "It answers questions about your own records - what you spent, what is due, how the month is going - and explains how it got there. During the beta it cannot change your records.",
  },
  {
    question: "Who can see my data?",
    answer:
      "You. When you share a ledger or a group, the people in it see that shared record. Service providers that run AQVIK for us process data only to do that; they are listed in the Privacy Policy. We do not sell data or show ads.",
  },
  {
    question: "Will AQVIK stay free?",
    answer:
      "It is free during the beta. If we add paid features later, the price will be published first and you will choose whether to pay.",
  },
  {
    question: "Is this financial advice?",
    answer:
      "No. AQVIK helps you see your money clearly. For advice about your specific situation, talk to a qualified professional.",
  },
  {
    question: "Can I delete my data?",
    answer:
      "Yes. Export your records any time from Settings, and delete your account from the app. The Delete Account page explains exactly what is removed.",
  },
] as const;

export const finalCta = {
  heading: "Keep the money between friends friendly.",
  line: "Join the beta and try it with the person you split things with most.",
  button: "Join the beta",
} as const;
