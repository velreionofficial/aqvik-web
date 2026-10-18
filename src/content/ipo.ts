/**
 * Copy for the IPO section. Facts only: how the process works, where official information is,
 * and what the numbers mean. No ratings, no grey-market figures, no "apply / avoid".
 */
export const ipoCopy = {
  listTitle: "IPO calendar India — Upcoming, Open and Recent IPOs | AQVIK",
  listDescription:
    "Upcoming and open IPOs in India with price band, lot size, dates, minimum investment and how to apply, taken from each company's red herring prospectus. Free IPO calculator for bid amount and tax on a sale.",
  listH1: "IPO calendar",
  listIntro:
    "Dates, price bands, lot sizes and minimum investment for IPOs on NSE and BSE, taken from each company's red herring prospectus (RHP), with a calculator for the amount blocked and what a sale at a price you enter would leave after tax.",
  /** Short line shown at the top of every IPO page, above any numbers. */
  topNotice: "Facts from the company's RHP, explained simply. Not advice and not a recommendation to apply.",
  disclaimer:
    "This page is for information and education only. AQVIK is not registered with SEBI as an investment adviser or research analyst, and is not connected to, or paid by, the company, its lead managers, the registrar or any broker. Facts on this page come from public documents such as the RHP and exchange notices; AQVIK does not say whether to apply, buy, hold or sell. Dates after the issue closes are tentative until the exchanges confirm them. The RHP is the authoritative document: read it, and check details in your broker app, before you bid. Investing in shares carries risk, including the loss of money.",
  calculatorNote:
    "An illustration only, using the numbers you enter. It is not a forecast of any price and not tax advice. STT, stamp duty, brokerage, exchange charges, surcharge and your own tax situation are not included, so your actual result will differ.",
  riskFactorsNote: (shown: number, from: number, to: number, listedIn?: string) =>
    `These are the first ${shown} risk factors in the order ${listedIn ?? "the RHP"} lists them, summarised. They are not all the risks and not AQVIK's assessment. The full "Risk Factors" section is on pages ${from}–${to} of the RHP; read it before deciding.`,
  staleNote: (verifiedOn: string) =>
    `Last checked against official sources on ${verifiedOn}. Details can change through an addendum or a revised price band; if anything here differs from the RHP or exchange notices, those are correct.`,
  linksNote: "Links to SEBI, the exchanges and the registrar open their own websites in a new tab. AQVIK does not control those sites and is not responsible for their content.",
  editorialPolicy:
    "AQVIK takes no payment from companies, lead managers, registrars or brokers for IPO pages, and IPO pages carry no broker referral links or IPO advertising.",
  phishingNote:
    "Apply only through your own broker app or your bank's net banking (ASBA). Nobody can get you a \"guaranteed\" or \"pre-IPO quota\" allotment; links or WhatsApp messages offering one are fraud. AQVIK never asks for your UPI PIN, OTP or payment.",
  noGmp:
    "We do not show grey market premium (GMP). It comes from an unofficial, unregulated market, SEBI has cautioned investors about it, and it often differs from the listing price.",
  sourcesNote: "Every figure on this page comes from the sources listed below. If you spot a mismatch with the RHP, the RHP is correct; please tell us at support@aqvik.com.",
  howToApply: [
    { title: "Have a demat account and UPI", text: "You need a demat and trading account with a broker, and a UPI ID linked to a bank account in your own name." },
    { title: "Open the IPO in your broker app", text: "Look for the IPO section while the issue is open. You can also apply through your bank's net banking (ASBA)." },
    { title: "Choose lots and price", text: "Bid in whole lots. Retail investors can tick \"cut-off\" to bid at the final price; the amount blocked is at the top of the price band." },
    { title: "Approve the UPI mandate", text: "Your UPI app will ask you to approve a mandate that blocks the money. The money stays in your account, blocked, until allotment. Approve it before the cut-off time on the closing day." },
    { title: "Check allotment", text: "After the allotment date, check your status on the registrar's website with your PAN or application number. If you get no shares, the blocked amount is released." },
    { title: "Listing", text: "Allotted shares reach your demat account before listing day and can be sold once the shares list on the exchange." },
  ],
  allotmentNote:
    "When the retail portion is oversubscribed, SEBI rules give one lot each to as many retail applicants as possible, chosen by a computerised lottery. Your chance depends on how many retail lots there are compared with how many valid retail applications were made, not on the subscription figure alone, and applying for more lots does not raise your chance of getting the first lot. The registrar publishes the exact basis of allotment after the issue closes.",
  categories: [
    { name: "Retail individual investor", limit: "Up to ₹2 lakh", allotment: "Lottery for one lot each when oversubscribed", pay: "UPI or ASBA" },
    { name: "Small non-institutional (sNII)", limit: "Above ₹2 lakh up to ₹10 lakh", allotment: "Lottery for the minimum NII application when oversubscribed", pay: "UPI up to ₹5 lakh, ASBA above" },
    { name: "Big non-institutional (bNII)", limit: "Above ₹10 lakh", allotment: "As per the basis of allotment, subject to the minimum NII application", pay: "ASBA" },
  ],
  taxNote: (rate: string, year: string) =>
    `Listed shares sold within 12 months, with STT paid, are short-term capital gains, taxed at ${rate} plus 4% cess for ${year}. This tax is not cut when you sell: the full sale amount (minus brokerage, STT and other charges) reaches your account, and you pay the tax yourself as advance tax or when you file your income tax return. Your actual tax can be lower or higher depending on your total income, losses you can set off and surcharge. This is a simple estimate, not tax advice.`,
  breakdownNote:
    "Reserved portions are the rupee amounts in the RHP. The other amounts are AQVIK's arithmetic at the top of the price band from the RHP's percentages, because the RHP gives exact share counts only after the price is fixed. Unsubscribed shares in one category can move to another as the RHP describes.",
} as const;

/** Questions on /ipo. Answers describe the process only. */
export const ipoFaqs = [
  {
    question: "Where do these IPO details come from?",
    answer:
      "From official documents: the red herring prospectus (RHP) filed with SEBI, the price band advertisement, NSE and BSE notices and the registrar's website. Each IPO page lists its sources and the date it was last checked. If anything differs, the RHP and exchange notices are correct.",
  },
  {
    question: "Why don't you show GMP or say whether to apply?",
    answer:
      "Grey market premium comes from an unofficial, unregulated market and is not reliable. Saying whether to apply would be investment advice, and AQVIK is not registered with SEBI to give it. We show the facts and explain them in plain words so you can read the RHP and decide for yourself.",
  },
  {
    question: "How is the minimum investment worked out?",
    answer:
      "One lot multiplied by the top of the price band. That is the amount blocked in your account when you bid for one lot at cut-off. If the final price is lower, the difference is released.",
  },
  {
    question: "Does applying for more lots improve my chance of allotment?",
    answer:
      "Not for retail investors in an oversubscribed issue. SEBI rules give one lot each to as many retail applicants as possible by lottery, so more lots do not raise the chance of getting the first lot.",
  },
  {
    question: "How do I check if I got shares?",
    answer:
      "After the allotment date, open the registrar's allotment page (linked on each IPO page) and search with your PAN or application number. You can also check on the NSE or BSE website or in your broker app.",
  },
] as const;

export const ipoCalculatorTool = {
  slug: "ipo-calculator",
  name: "IPO Calculator",
  cardLine: "Amount blocked for the lots you bid, your investor category, and what a sale at a price you enter would leave after tax.",
  title: "IPO Calculator — Lot Amount, Retail Limit & Tax on Sale | AQVIK",
  description:
    "Free IPO calculator: amount blocked for any number of lots, maximum retail lots within ₹2 lakh, retail or HNI category, UPI limit, and short-term capital gains tax if you sell at a price you enter.",
  h1: "IPO calculator",
  intro:
    "Enter the lot size and the top of the price band from the IPO's RHP to see how much will be blocked, how many lots fit within the ₹2 lakh retail limit, which investor category your bid falls in, and what selling at a price you choose would leave after tax.",
  how: [
    "Amount blocked = lots × shares per lot × the upper end of the price band. Bidding at cut-off blocks this amount; if the final price is lower, the difference is released.",
    "Maximum retail lots = the largest whole number of lots whose amount stays within ₹2 lakh. Bids above ₹2 lakh up to ₹10 lakh are small NII; above ₹10 lakh, big NII. UPI can be used for bids up to ₹5 lakh.",
    "Sale illustration: gain = shares × (your sale price − issue price). Short-term capital gains tax on listed shares sold within 12 months is 20%, plus 4% cess on that tax, applied only to a gain. STT, stamp duty, brokerage, surcharge and your own tax situation are not included.",
  ],
  faqs: [
    {
      question: "What price should I enter for the sale?",
      answer:
        "Any price you want to try. The calculator does not predict or suggest a listing or sale price; it only shows what a sale at the price you type would mean.",
    },
    {
      question: "Why is my bid category not retail?",
      answer: "Retail individual investors can bid up to ₹2 lakh in a mainboard IPO. Above that, an individual's bid is in the non-institutional (NII) category, which has its own allotment rules.",
    },
    {
      question: "Is the tax figure exact?",
      answer:
        "No. It is a simple estimate at the short-term capital gains rate plus cess. Surcharge, losses you can set off, STT and other charges change the real figure. Check with a tax professional for your own case.",
    },
  ],
} as const;

/** One line per IPO status, for cards and the page header. */
export const statusText = {
  upcoming: "Upcoming",
  open: "Live · Open for bidding",
  closed: "Bidding closed",
  "allotment-out": "Allotment done",
  listed: "Listed",
} as const;
