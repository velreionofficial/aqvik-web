import type { CounterpartyKind, TxnType } from "./model.ts";

/**
 * Known names in Indian statements, with what a payment to (or from) them
 * usually is. Matching is by whole word in the upper-cased description.
 * Brokers and crypto exchanges are TRANSFER / Broker funding: a bank statement
 * shows money sent to the platform, not that anything was bought.
 */
export type Entity = {
  words: string[];
  kind: CounterpartyKind;
  out?: { type: TxnType; category: string };
  in?: { type: TxnType; category: string };
  confidence: number;
};

const spend = (category: string, words: string[], confidence = 0.8, kind: CounterpartyKind = "merchant"): Entity => ({
  words,
  kind,
  out: { type: "SPENDING", category },
  in: { type: "REFUND", category: "Refund" },
  confidence,
});

/** Names that are usually subscriptions or memberships. */
export const SUBSCRIPTION_WORDS = [
  "NETFLIX", "SPOTIFY", "HOTSTAR", "DISNEY", "PRIME VIDEO", "AMAZON PRIME", "YOUTUBE", "SONYLIV", "ZEE5", "JIOCINEMA", "JIOHOTSTAR",
  "APPLE.COM", "APPLE SERVICES", "APPLESERVI", "APPLE MEDIA", "ITUNES", "GOOGLE PLAY", "GOOGLEPLAY", "GOOGLE ONE", "CHATGPT", "OPENAI", "CLAUDE", "ANTHROPIC",
  "LINKEDIN", "CANVA", "MICROSOFT", "ADOBE", "NOTION", "DROPBOX", "ZOOM", "AUDIBLE", "KINDLE", "GAANA", "WYNK", "JIOSAAVN",
  "CULTFIT", "CULT.FIT", "GYM", "FITNESS", "MEMBERSHIP", "TIMES PRIME", "SWIGGY ONE", "ZOMATO GOLD",
];

export const ENTITIES: Entity[] = [
  // Investment platforms: money sent is funding, not a confirmed investment.
  {
    words: ["PAYTMMONEY", "ZERODHA", "GROWW", "UPSTOX", "ANGEL ONE", "ANGELONE", "ANGEL BROKING", "DHAN", "5PAISA", "MOTILAL", "ICICI DIRECT", "ICICIDIRECT", "ICICI SECURITIES", "HDFC SEC", "HDFC SECURITIES", "KOTAK SEC", "KOTAK SECURITIES", "SHAREKHAN", "SBICAP", "SBI SECURITIES", "PAYTM MONEY", "INDMONEY", "WAZIRX", "COINDCX", "COINSWITCH", "SECURITIES LTD", "SECURITIES LIMITED", "BROKING"],
    kind: "broker",
    out: { type: "TRANSFER", category: "Broker funding" },
    in: { type: "TRANSFER", category: "From investment platform" },
    confidence: 0.85,
  },
  // Direct purchases the statement itself shows.
  { words: ["MUTUAL FUND", "BSE STAR MF", "CAMS", "KFINTECH", "KFIN", "ICCL", "INDIAN CLEARING"], kind: "investment_platform", out: { type: "INVESTMENT", category: "Mutual funds" }, in: { type: "TRANSFER", category: "From investments" }, confidence: 0.75 },
  { words: ["NSE CLEARING", "NSCCL"], kind: "investment_platform", out: { type: "INVESTMENT", category: "Stocks" }, in: { type: "TRANSFER", category: "From investments" }, confidence: 0.65 },
  { words: ["PPF", "NPS", "SUKANYA", "NSC", "KVP", "SCSS"], kind: "other_institution", out: { type: "INVESTMENT", category: "Government schemes" }, in: { type: "TRANSFER", category: "From investments" }, confidence: 0.85 },
  { words: ["FD BOOKED", "TO FD", "FIXED DEPOSIT", "TD BOOKED", "RD INSTAL", "TO RD", "RECURRING DEPOSIT"], kind: "own", out: { type: "INVESTMENT", category: "FD / RD" }, in: { type: "TRANSFER", category: "FD / RD closed" }, confidence: 0.85 },
  { words: ["SAFEGOLD", "MMTC", "AUGMONT", "DIGITAL GOLD", "GOLD"], kind: "investment_platform", out: { type: "INVESTMENT", category: "Gold" }, in: { type: "TRANSFER", category: "From investments" }, confidence: 0.6 },
  // Debt
  { words: ["SIMPL", "LAZYPAY", "SNAPMINT", "KISSHT", "ZESTMONEY", "SLICE", "UNI CARDS", "AMAZON PAY LATER", "FLIPKART PAY LATER"], kind: "lender", out: { type: "DEBT_PAYMENT", category: "Buy now, pay later" }, in: { type: "TRANSFER", category: "Loan received" }, confidence: 0.8 },
  {
    words: ["EMI", "LOAN", "BAJAJ FIN", "BAJAJFIN", "BAJAJ FINANCE", "HOME CREDIT", "KREDITBEE", "MONEYVIEW", "NAVI", "TATA CAPITAL", "TATACAP", "IDFC FIRST", "HDB FIN", "MUTHOOT", "MANAPPURAM", "FULLERTON", "L&T FIN", "POONAWALLA", "CREDILA", "AXIS FINANCE", "ADITYA BIRLA FIN", "CHOLAMANDALAM", "SHRIRAM FIN"],
    kind: "lender",
    out: { type: "DEBT_PAYMENT", category: "EMI & loans" },
    in: { type: "TRANSFER", category: "Loan received" },
    confidence: 0.8,
  },
  // Wallets: topping up moves money, it is not spending yet.
  { words: ["ADD MONEY", "WALLET", "MOBIKWIK", "FREECHARGE", "AMAZON PAY BALANCE"], kind: "wallet", out: { type: "TRANSFER", category: "Wallet top-up" }, in: { type: "TRANSFER", category: "From wallet" }, confidence: 0.75 },
  // Spending
spend("Subscriptions", SUBSCRIPTION_WORDS),
  spend("Insurance", ["INSURANCE", "LIC", "LIFE INS", "POLICYBAZAAR", "STAR HEALTH", "ACKO", "DIGIT INS", "HDFC LIFE", "ICICI PRU", "SBI LIFE", "TATA AIA", "MAX LIFE", "PREMIUM"], 0.8, "insurance"),
  spend("Food & dining", ["SWIGGY", "ZOMATO", "DOMINO", "PIZZA", "MCDONALD", "KFC", "BURGER", "STARBUCKS", "CAFE", "RESTAURANT", "DHABA", "BIRYANI", "EATCLUB", "BEHROUZ", "FAASOS", "CHAAYOS", "HALDIRAM"]),
  spend("Groceries", ["BLINKIT", "ZEPTO", "BIGBASKET", "BIG BASKET", "INSTAMART", "DMART", "D MART", "AVENUE SUPER", "JIOMART", "RELIANCE FRESH", "SMART BAZAAR", "MORE RETAIL", "SPENCER", "GROFERS", "KIRANA", "GROCERY", "DUNZO", "MILKBASKET", "COUNTRY DELIGHT"]),
  spend("Shopping", ["AMAZON", "FLIPKART", "MYNTRA", "AJIO", "MEESHO", "NYKAA", "TATACLIQ", "CROMA", "RELIANCE DIGITAL", "DECATHLON", "IKEA", "LENSKART", "FIRSTCRY", "SNAPDEAL", "SHOPSY", "PUMA", "NIKE", "ZARA", "WESTSIDE", "PANTALOONS", "TRENDS"]),
  spend("Travel & transport", ["UBER", "OLA", "RAPIDO", "IRCTC", "MAKEMYTRIP", "MAKE MY TRIP", "GOIBIBO", "CLEARTRIP", "IXIGO", "REDBUS", "YATRA", "INDIGO", "AIR INDIA", "AKASA", "SPICEJET", "VISTARA", "METRO", "FASTAG", "PETROL", "DIESEL", "FUEL", "HPCL", "BPCL", "IOCL", "INDIAN OIL", "HP PAY", "SHELL", "NAYARA", "PARKING"]),
  spend("Bills & utilities", ["AIRTEL", "JIO", "VODAFONE", "VI PREPAID", "BSNL", "RECHARGE", "ELECTRICITY", "BESCOM", "MSEDCL", "TATA POWER", "ADANI ELEC", "TORRENT POWER", "BSES", "CESC", "TNEB", "UPPCL", "NBPDCL", "SBPDCL", "INDANE", "HP GAS", "BHARATGAS", "BROADBAND", "ACT FIBER", "HATHWAY", "DTH", "TATA PLAY", "DISH TV", "BBPS"], 0.8, "utility"),
  spend("Education", ["SCHOOL", "COLLEGE", "UNIVERSITY", "TUITION", "COACHING", "BYJU", "UNACADEMY", "PHYSICSWALLAH", "UDEMY", "COURSERA"], 0.8, "education"),
  spend("Healthcare", ["HOSPITAL", "CLINIC", "PHARMACY", "MEDICAL", "MEDPLUS", "APOLLO", "1MG", "PHARMEASY", "NETMEDS", "PRACTO", "DIAGNOSTIC"], 0.8, "healthcare"),
  spend("Rent", ["RENT", "NOBROKER", "HOUSING.COM"], 0.6, "unknown"),
];
