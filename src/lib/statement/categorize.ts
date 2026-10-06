/**
 * Best-guess categories and payees from a transaction's narration. Every
 * guess can be changed by the user; nothing here is final.
 */

export const DEBIT_CATEGORIES = [
  "Food & dining",
  "Groceries",
  "Shopping",
  "Travel & fuel",
  "Bills & recharges",
  "Subscriptions",
  "EMI & loans",
  "Investments",
  "Insurance",
  "Rent",
  "Education",
  "Health",
  "Cash withdrawal",
  "Bank charges",
  "Credit card bill",
  "Sent to people",
  "Other transfers",
  "Self transfer",
  "Other spending",
] as const;

export const CREDIT_CATEGORIES = [
  "Salary",
  "Interest",
  "Refunds & cashback",
  "Received from people",
  "Investments redeemed",
  "Self transfer",
  "Other income",
] as const;

export type Category = (typeof DEBIT_CATEGORIES)[number] | (typeof CREDIT_CATEGORIES)[number];

/** Money moved between the user's own accounts: shown separately, not counted as spending or income. */
export const SELF: Category = "Self transfer";
const SELF_WORDS = ["TRANSFERRED TO SELF", "TRANSFER TO SELF", "SELF TRANSFER", "RECEIVED FROM SELF", "TO SELF", "FROM SELF", "OWN ACCOUNT", "SELF A/C"];

type Rule = { category: Category; words: string[] };

/** Ordered: the first rule whose word appears in the narration wins. */
const DEBIT_RULES: Rule[] = [
  { category: "Bank charges", words: ["CHARGES", "CHRG", "CHGS", "SCHG", "SMS ALERT", "MIN BAL", "NON MAINT", "ANNUAL FEE", "AMC", "GST ON", "PENAL", "ECS RETURN", "DEBIT CARD FEE"] },
  { category: "Credit card bill", words: ["CREDIT CARD", "CC PAYMENT", "CARD PAYMENT", "CRED CLUB", "CREDCLUB", "BILLDESK CC"] },
  { category: "Cash withdrawal", words: ["ATM", "ATW", "NWD", "CASH WDL", "CASH WITHDRAWAL", "CWDR", "SELF WITHDRAWAL"] },
  { category: "EMI & loans", words: ["EMI", "LOAN", "BAJAJ FIN", "BAJAJFIN", "HOME CREDIT", "KREDITBEE", "MONEYVIEW", "NAVI", "LAZYPAY", "SIMPL", "TATA CAPITAL", "TATACAP", "SNAPMINT", "IDFC FIRST", "HDB FIN", "MUTHOOT", "MANAPPURAM", "FULLERTON", "L&T FIN", "POONAWALLA", "CREDILA", "SLICE", "KISSHT", "ZESTMONEY"] },
  { category: "Investments", words: ["ZERODHA", "GROWW", "UPSTOX", "ANGEL ONE", "ANGELONE", "KUVERA", "COIN", "MUTUAL FUND", "MF ", "SIP", "NSE CLEARING", "ICCL", "INDIAN CLEARING", "BSE LTD", "PPF", "NPS", "SUKANYA", "RD INSTAL", "FD BOOKED", "TO FD", "TO RD", "SBICAP", "SECURITIES", "FOR TRADING", "PAYTM MONEY", "DHAN", "5PAISA", "MOTILAL", "ICICI DIRECT", "HDFC SEC", "KOTAK SEC", "SHAREKHAN"] },
  { category: "Insurance", words: ["INSURANCE", "LIC", "LIFE INS", "POLICYBAZAAR", "STAR HEALTH", "ACKO", "DIGIT INS", "HDFC LIFE", "ICICI PRU", "SBI LIFE", "TATA AIA", "MAX LIFE", "PREMIUM"] },
  { category: "Subscriptions", words: ["NETFLIX", "SPOTIFY", "HOTSTAR", "DISNEY", "PRIME VIDEO", "AMAZON PRIME", "YOUTUBE", "SONYLIV", "ZEE5", "JIOCINEMA", "APPLE.COM", "APPLE SERVICES", "GOOGLE PLAY", "GOOGLEPLAY", "CHATGPT", "OPENAI", "LINKEDIN", "CANVA", "MICROSOFT"] },
  { category: "Food & dining", words: ["SWIGGY", "ZOMATO", "DOMINO", "PIZZA", "MCDONALD", "KFC", "BURGER", "STARBUCKS", "CAFE", "RESTAURANT", "HOTEL", "DHABA", "BIRYANI", "EATCLUB", "BEHROUZ", "FAASOS", "CHAAYOS", "HALDIRAM"] },
  { category: "Groceries", words: ["BLINKIT", "ZEPTO", "BIGBASKET", "BIG BASKET", "INSTAMART", "DMART", "D MART", "AVENUE SUPER", "JIOMART", "RELIANCE FRESH", "SMART BAZAAR", "MORE RETAIL", "SPENCER", "GROFERS", "KIRANA", "GROCERY", "DUNZO", "MILKBASKET", "COUNTRY DELIGHT"] },
  { category: "Shopping", words: ["AMAZON", "FLIPKART", "MYNTRA", "AJIO", "MEESHO", "NYKAA", "TATACLIQ", "CROMA", "RELIANCE DIGITAL", "DECATHLON", "IKEA", "LENSKART", "FIRSTCRY", "SNAPDEAL", "SHOPSY", "PUMA", "NIKE", "ZARA", "H&M", "WESTSIDE", "PANTALOONS", "TRENDS"] },
  { category: "Travel & fuel", words: ["UBER", "OLA", "RAPIDO", "IRCTC", "MAKEMYTRIP", "MAKE MY TRIP", "GOIBIBO", "CLEARTRIP", "IXIGO", "REDBUS", "YATRA", "INDIGO", "AIR INDIA", "AKASA", "SPICEJET", "VISTARA", "METRO", "FASTAG", "PETROL", "DIESEL", "FUEL", "HPCL", "BPCL", "IOCL", "INDIAN OIL", "HP PAY", "SHELL", "NAYARA", "PARKING"] },
  { category: "Bills & recharges", words: ["AIRTEL", "JIO", "VODAFONE", "VI PREPAID", "BSNL", "RECHARGE", "ELECTRICITY", "POWER", "BESCOM", "MSEDCL", "TATA POWER", "ADANI ELEC", "TORRENT", "BSES", "CESC", "TNEB", "UPPCL", "WATER", "GAS", "INDANE", "HP GAS", "BHARATGAS", "BROADBAND", "ACT FIBER", "HATHWAY", "DTH", "TATA PLAY", "DISH TV", "BILLDESK", "BBPS", "PAYTM BILL"] },
  { category: "Rent", words: ["RENT", "NOBROKER", "HOUSING.COM", "MAGICBRICKS", "PG ", "HOSTEL"] },
  { category: "Education", words: ["SCHOOL", "COLLEGE", "UNIVERSITY", "TUITION", "COACHING", "FEES", "BYJU", "UNACADEMY", "PHYSICSWALLAH", "UDEMY", "COURSERA", "EXAM"] },
  { category: "Health", words: ["HOSPITAL", "CLINIC", "PHARMA", "PHARMACY", "MEDICAL", "MEDPLUS", "APOLLO", "1MG", "TATA 1MG", "PHARMEASY", "NETMEDS", "PRACTO", "DIAGNOSTIC", "LAB", "DOCTOR"] },
];

const CREDIT_RULES: Rule[] = [
  { category: "Salary", words: ["SALARY", "SAL CREDIT", "SAL FOR", "PAYROLL", "SAL "] },
  { category: "Interest", words: ["INT.PD", "INT PD", "INTEREST", "INT CREDIT", "INT.CR", "SB INT", "CREDIT INTEREST"] },
  { category: "Refunds & cashback", words: ["REFUND", "REVERSAL", "REVERSED", "CASHBACK", "CASH BACK", "RETURN", "CHARGEBACK", "RFND"] },
  { category: "Investments redeemed", words: ["ZERODHA", "GROWW", "UPSTOX", "REDEMPTION", "DIVIDEND", "DIV ", "MATURITY", "FD CLOSURE", "NSE CLEARING", "ICCL"] },
];

const WORD_RE = new Map<string, RegExp>();

/** Whole-word match for short or symbolic words, substring for longer plain words. Regexes are cached. */
export function hasWord(text: string, word: string): boolean {
  const w = word.trim();
  if (w.length <= 4 || !/^[A-Z0-9]+$/.test(w)) {
    let re = WORD_RE.get(w);
    if (!re) {
      re = new RegExp(`(^|[^A-Z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Z0-9]|$)`);
      WORD_RE.set(w, re);
    }
    return re.test(text);
  }
  return text.includes(w);
}

const isUpi = (t: string) => /(^|[^A-Z])UPI([^A-Z]|$)/.test(t) || /@[A-Z]/.test(t) || /PAID TO|RECEIVED FROM|SENT TO/.test(t);
const isBankTransfer = (t: string) => /(^|[^A-Z])(NEFT|IMPS|RTGS|MMT|FT|TRF|TRANSFER|BY TRANSFER|TO TRANSFER)([^A-Z]|$)/.test(t);

/** Tags that UPI apps print with an entry ("Tag: # Groceries"), mapped to our categories. */
const APP_TAGS: [RegExp, Category][] = [
  [/^GROCER/, "Groceries"],
  [/^(FOOD|DINING|RESTAURANT)/, "Food & dining"],
  [/^SHOPPING/, "Shopping"],
  [/^(TRAVEL|FUEL|TRANSPORT|CAB)/, "Travel & fuel"],
  [/^(BILL|RECHARGE|UTILIT)/, "Bills & recharges"],
  [/^(ENTERTAINMENT|SUBSCRIPTION)/, "Subscriptions"],
  [/^(HEALTH|MEDICAL|MEDICINE)/, "Health"],
  [/^EDUCATION/, "Education"],
  [/^RENT/, "Rent"],
  [/^(INVEST|SIP|MUTUAL)/, "Investments"],
  [/^(EMI|LOAN)/, "EMI & loans"],
  [/^INSURANCE/, "Insurance"],
];

export function categorize(narration: string, direction: "debit" | "credit"): Category {
  const t = ` ${narration.toUpperCase()} `;
  if (SELF_WORDS.some((w) => t.includes(w))) return SELF;
  if (direction === "debit") {
    const tag = /#\s*([A-Z][A-Z &]+)/.exec(t)?.[1]?.trim();
    const hit = tag ? APP_TAGS.find(([re]) => re.test(tag)) : undefined;
    if (hit) return hit[1];
  }
  const rules = direction === "debit" ? DEBIT_RULES : CREDIT_RULES;
  for (const rule of rules) if (rule.words.some((w) => hasWord(t, w))) return rule.category;
  if (direction === "credit") return isUpi(t) || isBankTransfer(t) ? "Received from people" : "Other income";
  if (isUpi(t)) return "Sent to people";
  if (isBankTransfer(t)) return "Other transfers";
  return "Other spending";
}

const STOP = new Set([
  "UPI", "DR", "CR", "P2A", "P2M", "P2P", "PAYMENT", "PAY", "PAID", "TO", "FROM", "BY", "TRANSFER", "TRF", "SENT", "RECEIVED",
  "COLLECT", "REQUEST", "NA", "IMPS", "NEFT", "RTGS", "MMT", "MOB", "INB", "UPIINTENT", "INTENT", "OTHERS", "OTHER", "NO",
  "REMARKS", "TXN", "REF", "VIA", "ONLINE", "POS", "ECOM", "DEBIT", "CREDIT", "CARD", "BANK", "LTD", "PVT", "THE", "AND",
  "FOR", "PAYMENTS", "UPI LITE", "TPT", "BIL", "BILL", "ONL", "NETBANK", "SELF", "ACH", "NACH", "ECS",
  // SBI and other bank transaction codes
  "WDL", "TFR", "DEP", "CMP", "MANDATE", "ACHDR", "ACHCR", "INB", "CLG", "CSH", "CHQ", "BRN", "TRF", "OUTWARD", "INWARD",
]);
const BANK_CODE = /^[A-Z]{4}$/; // IFSC-style bank codes such as SBIN, HDFC, YESB, UTIB

const MONTH_WORDS = /\b(JAN|JANUARY|FEB|FEBRUARY|MAR|MARCH|APR|APRIL|MAY|JUN|JUNE|JUL|JULY|AUG|AUGUST|SEP|SEPT|SEPTEMBER|OCT|OCTOBER|NOV|NOVEMBER|DEC|DECEMBER)\b/g;

/** Drop months and numbers so "SALARY JUL 2026 ACME" and "SALARY AUG 2026 ACME" group together. */
const tidy = (name: string) =>
  name.replace(MONTH_WORDS, " ").replace(/\b\d+\b/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) || name.trim().slice(0, 40);

/** Banks app statements print as the user's own account ("State Bank Of India - 12"). */
const ACCOUNT_BANKS = [
  "STATE BANK OF INDIA", "HDFC BANK", "ICICI BANK", "AXIS BANK", "KOTAK MAHINDRA BANK", "PUNJAB NATIONAL BANK", "BANK OF BARODA",
  "BANK OF INDIA", "CANARA BANK", "UNION BANK OF INDIA", "INDIAN BANK", "YES BANK", "IDFC FIRST BANK", "INDUSIND BANK",
  "PAYTM PAYMENTS BANK", "AIRTEL PAYMENTS BANK", "FEDERAL BANK", "CENTRAL BANK OF INDIA", "INDIAN OVERSEAS BANK", "UCO BANK",
  "BANK OF MAHARASHTRA", "PUNJAB & SIND BANK", "IDBI BANK", "AU SMALL FINANCE BANK", "RBL BANK", "BANDHAN BANK", "PAYTM WALLET",
].join("|").replace(/&/g, "&");

/**
 * "Paid to X" / "Received from X" in app statements. The name stops at what follows it: the
 * user's own account ("State Bank Of India - 12"), a tag, notes, a reference or a time, so it
 * never absorbs the bank's name.
 */
const PHRASE = new RegExp(
  `(?:PAID TO|RECEIVED FROM|SENT TO|TRANSFER TO|TRANSFER FROM)\\s+([A-Z0-9 .&'-]+?)(?:\\s+(?:TRANSACTION|TXN|UTR|UPI|REF|ON|TAG|NOTES)\\b|\\s*#|\\s+(?:${ACCOUNT_BANKS})\\s*-\\s*\\d|\\s+\\d{1,2}:\\d{2}|$)`,
);

/** A short, stable name for who the money went to or came from. */
const OWN_ACCOUNT_TRAILER = new RegExp(`\\s(?:${ACCOUNT_BANKS})\\s*-\\s*\\d+`, "g");

export function payeeOf(narration: string): string {
  // The user's own account as printed by app statements is never the counterparty.
  const t = ` ${narration.toUpperCase().replace(/\s+/g, " ")} `.replace(OWN_ACCOUNT_TRAILER, " ").replace(/\s+/g, " ").trim();
  const phrase = PHRASE.exec(t);
  if (phrase) return tidy(phrase[1]!);

  const parts = t.split(/[/|:*\\-]+|\s{2,}/).map((p) => p.trim()).filter(Boolean);
  const vpaIndex = parts.findIndex((p) => /^[A-Z0-9._-]+@[A-Z]+$/.test(p.replace(/\s/g, "")));
  const vpa = vpaIndex >= 0 ? parts[vpaIndex] : undefined;
  // In UPI narrations the payee's name comes before their UPI ID; text after it is a note.
  const candidates = vpaIndex >= 0 ? parts.slice(0, vpaIndex) : parts;
  const name = candidates.find((p) => {
    if (p.includes("@") || STOP.has(p) || /(^|\s)BANK$/.test(p)) return false;
    if (BANK_CODE.test(p) && p !== parts[0]) return false;
    // Ignore words like "ACH D", "UPI DR" that are only codes.
    const meaningful = p.split(" ").filter((w) => w.length > 1 && !STOP.has(w)).join("");
    const letters = meaningful.replace(/[^A-Z]/g, "").length;
    return letters >= 3 && letters >= p.replace(/\s/g, "").length * 0.5 && !/^(UPI|NEFT|IMPS|RTGS)/.test(p);
  });
  if (name) return tidy(name);
  if (vpa) return vpa.replace(/\s/g, "").split("@")[0]!;
  return t.replace(/[0-9]{3,}/g, "").replace(/\s+/g, " ").trim().slice(0, 40) || "Unknown";
}
