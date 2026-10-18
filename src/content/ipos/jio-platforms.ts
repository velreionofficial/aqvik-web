import type { Ipo } from "../../lib/ipo/model.ts";

/** ₹ million, as printed in the RHP and abridged prospectus, to paise. */
const mn = (x: number) => x * 10_00_00_000; // ₹1 million = 10 lakh rupees = 10,00,00,000 paise

/**
 * Every figure below was checked against the RED HERRING PROSPECTUS dated 14 Oct 2026 (text of the
 * full PDF, printed page numbers) and the PRICE BAND ADVERTISEMENT dated 14 Oct 2026:
 *   - Price band ₹1,065–1,119, minimum bid 12 shares, employee discount ₹54, timetable: price band ad
 *   - Shares, reservations, dates: RHP cover; timetable "on or about" dates: RHP p. 524
 *   - Financials (₹ million): RHP p. 74 (assets) and the restated summary; EPS and NAV per share
 *     match profit and net worth ÷ 893.9 crore shares (see the test)
 *   - Objects: RHP p. 116 (₹275,000 million fixed; general corporate purposes still [●])
 *   - Risk factors: the first five "Internal Risks", RHP pp. 30–34
 *   - Bid limits: RHP pp. 10 and 14 (definitions) and p. 533 (Issue Structure)
 *   - Business: RHP pp. 33–34, 126 and "Our Business" pp. 196–234
 * Still to add once published by the exchanges: `anchor` (allocation on 19 Oct 2026).
 */
export const jioPlatforms: Ipo = {
  slug: "jio-platforms",
  company: "Jio Platforms Ltd.",
  about: "Technology company of the Reliance group. Its subsidiary Reliance Jio Infocomm Ltd. (RJIL) runs the Jio mobile and home broadband services across India.",
  board: "mainboard",
  exchanges: ["NSE", "BSE"],
  issueType: "book-built",
  faceValue: 10_00,
  priceBand: { low: 1065_00, high: 1119_00 },
  lotSize: 12,
  retailLots: { min: 1, max: 14 },
  issueSize: {
    totalShares: 27_00_00_000,
    totalAmount: 30_213_00_00_000_00,
    freshAmount: 30_213_00_00_000_00,
    offerForSaleAmount: 0,
  },
  reservations: [
    { category: "Qualified institutional buyers (QIB)", share: "Not more than 50% of the net issue" },
    { category: "Retail individual investors", share: "Not less than 35% of the net issue" },
    { category: "Non-institutional investors (NII / HNI)", share: "Not less than 15% of the net issue" },
  ],
  employeeDiscount: 54_00,
  reservedPortions: [
    {
      kind: "employee",
      who: "Eligible employees, as defined in the RHP; they get a ₹54 discount per share",
      amount: 500_00_00_000_00,
      maxBid: 5_00_000_00,
      allotment: "Proportionate; first allotment up to ₹2 lakh each (net of discount)",
    },
    {
      kind: "shareholder",
      who: "Individuals and HUFs holding Reliance Industries shares on 14 Oct 2026 (the RHP date); they can also bid as retail or NII",
      amount: 2_500_00_00_000_00,
      maxBid: 2_00_000_00,
      allotment: "Proportionate, subject to the minimum bid lot",
    },
  ],
  netIssueSplit: { qibMaxPct: 50, anchorMaxPctOfQib: 60, niiMinPct: 15, retailMinPct: 35 },
  specialQuotas: [
    "Eligible employees: shares worth up to ₹500 crore are reserved, with a discount of ₹54 per share",
    "Eligible shareholders of Reliance Industries Ltd.: shares worth up to ₹2,500 crore are reserved",
    "An eligible employee can bid up to ₹5 lakh (net of the discount); the first allotment to each is up to ₹2 lakh (RHP p. 10)",
    "An eligible RIL shareholder can bid up to ₹2 lakh in that portion, and can also bid in the retail or non-institutional portion without it counting as a multiple bid (RHP pp. 14, 533)",
  ],
  timeline: {
    open: "2026-10-21",
    close: "2026-10-23",
    allotment: "2026-10-26",
    refunds: "2026-10-27",
    creditToDemat: "2026-10-27",
    listing: "2026-10-28",
  },
  registrar: { name: "KFin Technologies Ltd.", allotmentStatusUrl: "https://ipostatus.kfintech.com/" },
  leadManagers: [
    "Kotak Mahindra Capital Co. Ltd.",
    "Morgan Stanley India",
    "BofA Securities India",
    "Axis Capital",
    "BNP Paribas",
    "Citigroup Global Markets India",
    "CLSA India",
    "DAM Capital Advisors",
    "Goldman Sachs (India) Securities",
    "HDFC Bank",
    "HSBC Securities & Capital Markets (India)",
    "ICICI Securities",
    "IIFL Capital Services",
    "Jefferies India",
    "JM Financial",
    "JP Morgan India",
    "SBI Capital Markets",
    "UBS Securities India",
    "360 ONE WAM",
  ],
  objects: [
    "Up to ₹27,500 crore (₹275,000 million) to prepay, in full or in part, certain borrowings of the subsidiary RJIL, in FY 2027 (RHP p. 116)",
    "General corporate purposes: the amount will be fixed after the issue price is set, and cannot be more than 25% of the gross proceeds (RHP p. 116)",
  ],
  financials: {
    basis: "restated consolidated",
    rhpUnit: "₹ million",
    rhpPages: "74",
    periods: [
      { label: "FY 2024", endsOn: "2024-03-31", months: 12, revenue: mn(1_095_581), profitAfterTax: mn(214_232), netWorth: mn(2_778_661), totalBorrowings: mn(543_489), totalAssets: mn(5_395_804) },
      { label: "FY 2025", endsOn: "2025-03-31", months: 12, revenue: mn(1_282_184), profitAfterTax: mn(261_090), netWorth: mn(3_040_224), totalBorrowings: mn(730_603), totalAssets: mn(5_812_338) },
      { label: "FY 2026", endsOn: "2026-03-31", months: 12, revenue: mn(1_468_853), profitAfterTax: mn(300_491), netWorth: mn(3_340_134), totalBorrowings: mn(707_810), totalAssets: mn(6_155_940) },
      { label: "Q1 FY 2027", endsOn: "2026-06-30", months: 3, revenue: mn(391_729), profitAfterTax: mn(77_641), netWorth: mn(3_417_785), totalBorrowings: mn(613_722), totalAssets: mn(6_229_053) },
    ],
  },
  business: {
    points: [
      "Through RJIL, sells mobile (4G and 5G) and home broadband (JioFiber, JioAirFiber) connections across India; it had 533.3 million customers on 30 June 2026, including 284.9 million 5G customers.",
      "Also offers entertainment, cloud, smart-home and AI products to consumers, and connectivity, cloud, security and managed services to businesses.",
      "RJIL brought in 87.74% of consolidated revenue from operations in FY 2026, and the group reports a single operating segment.",
      "Its network has 360,537 towers, more than 1 million route km of optical fibre and 26,800.8 MHz of spectrum.",
      "Reliance Retail Ltd. is the only distributor of its prepaid mobile plans, which were 77.08% of consolidated revenue in FY 2026.",
      "Promoter: Reliance Industries Ltd., which held 66.43% of the shares before the IPO.",
    ],
    rhpPages: "33–34, 126 and 196–234",
  },
  riskFactors: {
    section: { fromPage: 30, toPage: 71 },
    items: [
      { rhpPage: 30, text: "Licence and spectrum: RJIL needs its telecom licences and spectrum to operate; if it cannot keep or renew them, or does not win spectrum it needs, the business could be materially affected." },
      { rhpPage: 31, text: "Related parties: the business relies on agreements with the promoter, Reliance Retail Ltd. and other Reliance Group companies; a disruption in these services could affect it." },
      { rhpPage: 33, text: "Single distributor: Reliance Retail Ltd. is the only distributor of prepaid connectivity, which was 77.08% of consolidated revenue in FY 2026; a disruption in this arrangement would affect results." },
      { rhpPage: 34, text: "Dependence on RJIL: in FY 2026 RJIL contributed 87.74% of revenue from operations, 94.88% of EBITDA and 93.76% of profit; any decline at RJIL would affect consolidated results." },
      { rhpPage: 34, text: "Network: a disruption to its network, tower and fibre infrastructure or technology could interrupt service, materially affect the business and lead to more customers leaving." },
    ],
  },
  documents: {
    rhp: "https://myjiostatic.cdn.jio.com/cms/assets/iv3/Red%20Herring%20Prospectus.pdf",
    abridgedProspectus: "https://www.sebi.gov.in/sebi_data/commondocs/oct-2026/Jio%20Platforms%20Limited%20-%20Red%20Herring%20Prospectus%20and%20Abridged%20Prospectus_p.pdf",
  },
  sources: [
    { label: "Red herring prospectus dated 14 Oct 2026 (Jio Platforms website)", url: "https://myjiostatic.cdn.jio.com/cms/assets/iv3/Red%20Herring%20Prospectus.pdf", kind: "official" },
    { label: "Abridged prospectus (SEBI website)", url: "https://www.sebi.gov.in/sebi_data/commondocs/oct-2026/Jio%20Platforms%20Limited%20-%20Red%20Herring%20Prospectus%20and%20Abridged%20Prospectus_p.pdf", kind: "official" },
    { label: "Price band advertisement dated 14 Oct 2026 (JM Financial, a lead manager)", url: "https://www.jmfl.com/Common/getFile/6109", kind: "official" },
  ],
  verifiedOn: "2026-10-19",
  published: true,
};
