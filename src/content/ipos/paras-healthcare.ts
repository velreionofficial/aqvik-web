import type { Ipo } from "../../lib/ipo/model.ts";

/** ₹ million, as printed in the RHP and abridged prospectus, to paise. */
const mn = (x: number) => Math.round(x * 10_00_00_000); // ₹1 million = 10 lakh rupees = 10,00,00,000 paise

/**
 * Every figure below was checked on 19 Oct 2026 against the full text of the RED HERRING PROSPECTUS
 * dated 14 Oct 2026 (printed page numbers) and the PRICE BAND ADVERTISEMENT of the same date:
 *   - Price band ₹660–693, face value ₹1, minimum bid 21 shares, timetable: price band ad; the
 *     "on or about" timetable is also on RHP p. 530
 *   - Offer size, selling shareholders, allocation (Regulation 6(2): QIB not less than 75%, NII not
 *     more than 15%, retail not more than 10%), anchor up to 60% of QIB: RHP cover and "Offer
 *     Structure" p. 535. There is no employee reservation or discount.
 *   - Financials (₹ million): "Summary of Financial Information" pp. 81–83. Total borrowings are
 *     non-current + current borrowings on p. 81 and match the abridged prospectus (p. 6).
 *   - Objects: RHP p. 124 (₹3,209.00 + ₹541.00 million fixed; general corporate purposes [●],
 *     capped at 25% of gross proceeds)
 *   - Risk factors: the first five "Internal Risk Factors", RHP pp. 21–26 (section pp. 21–77)
 *   - Business: "Our Business" from p. 253 (eight hospitals, 2,211 beds, cities)
 * Share counts are [●] in the RHP until pricing; `totalShares` is the offer amount ÷ the upper band,
 * rounded down per part (fresh 72,15,007 + OFS 1,37,08,513). It is AQVIK's arithmetic, not an RHP figure.
 * Still to add once published by the exchanges: `anchor` (bidding on 19 Oct 2026).
 */
export const parasHealthcare: Ipo = {
  slug: "paras-healthcare",
  company: "Paras Healthcare Ltd.",
  about: "Hospital company. As of 30 June 2026 it runs eight hospitals with 2,211 beds in Gurugram, Panchkula, Patna, Darbhanga, Kanpur, Udaipur, Ranchi and Srinagar.",
  board: "mainboard",
  exchanges: ["NSE", "BSE"],
  issueType: "book-built",
  faceValue: 1_00,
  priceBand: { low: 660_00, high: 693_00 },
  lotSize: 21,
  retailLots: { min: 1, max: 13 },
  issueSize: {
    totalShares: 2_09_23_520,
    totalAmount: mn(14_500),
    freshAmount: mn(5_000),
    offerForSaleAmount: mn(9_500),
  },
  reservations: [
    { category: "Qualified institutional buyers (QIB)", share: "Not less than 75% of the offer" },
    { category: "Non-institutional investors (NII / HNI)", share: "Not more than 15% of the offer" },
    { category: "Retail individual investors", share: "Not more than 10% of the offer" },
  ],
  specialQuotas: [
    "Offer for sale of up to ₹950 crore: up to ₹300 crore by the promoter Dr. Dharminder Kumar Nagar and up to ₹650 crore by the investor Commelina Ltd (RHP cover)",
    "Up to 60% of the QIB portion can go to anchor investors, who bid on 19 Oct 2026; 5% of the rest of the QIB portion is for mutual funds (RHP p. 535)",
    "No employee reservation or employee discount in this offer (RHP p. 535)",
  ],
  timeline: {
    open: "2026-10-21",
    close: "2026-10-23",
    allotment: "2026-10-26",
    refunds: "2026-10-27",
    creditToDemat: "2026-10-27",
    listing: "2026-10-28",
  },
  registrar: { name: "MUFG Intime India Pvt. Ltd. (formerly Link Intime)", allotmentStatusUrl: "https://www.bseindia.com/investors/appli_check.aspx" },
  leadManagers: ["JM Financial Ltd.", "BofA Securities India Ltd.", "Nuvama Wealth Management Ltd."],
  objects: [
    "₹320.90 crore (₹3,209.00 million) to prepay or repay, in full or part, certain borrowings of the company (RHP p. 124)",
    "₹54.10 crore (₹541.00 million) to invest in its wholly owned subsidiary PMHPL, which runs the Srinagar hospital, to repay or prepay that subsidiary's borrowings",
    "General corporate purposes: the amount will be fixed after the issue price is set, and cannot be more than 25% of the gross proceeds (RHP p. 124)",
    "The ₹950 crore offer for sale goes to the selling shareholders, not to the company",
  ],
  business: {
    points: [
      "Runs eight hospitals under the \"Paras Health\" brand, with 2,211 beds as of 30 June 2026.",
      "The hospitals are in Gurugram and Panchkula (Haryana), Patna and Darbhanga (Bihar), Kanpur (Uttar Pradesh), Udaipur (Rajasthan), Ranchi (Jharkhand) and Srinagar (Jammu and Kashmir).",
      "Promoter: Dr. Dharminder Kumar Nagar, who sells up to ₹300 crore of shares in this offer.",
    ],
    rhpPages: "253 onwards",
  },
  financials: {
    basis: "restated consolidated",
    rhpUnit: "₹ million",
    rhpPages: "81–83",
    periods: [
      { label: "FY 2024", endsOn: "2024-03-31", months: 12, revenue: mn(11_290.39), profitAfterTax: mn(-153.31), netWorth: mn(3_385.08), totalBorrowings: mn(5_475.33), totalAssets: mn(14_776.58) },
      { label: "FY 2025", endsOn: "2025-03-31", months: 12, revenue: mn(12_940.63), profitAfterTax: mn(-579.83), netWorth: mn(2_804.92), totalBorrowings: mn(7_279.31), totalAssets: mn(18_104.51) },
      { label: "FY 2026", endsOn: "2026-03-31", months: 12, revenue: mn(16_059.52), profitAfterTax: mn(438.34), netWorth: mn(3_949.41), totalBorrowings: mn(8_541.01), totalAssets: mn(20_711.41) },
      { label: "Q1 FY 2027", endsOn: "2026-06-30", months: 3, revenue: mn(4_702.78), profitAfterTax: mn(496.82), netWorth: mn(4_449.60), totalBorrowings: mn(8_888.93), totalAssets: mn(22_028.78) },
    ],
  },
  riskFactors: {
    section: { fromPage: 21, toPage: 77 },
    items: [
      { rhpPage: 21, text: "Past losses: the company made losses in FY 2024, FY 2025 and the three months to 30 June 2025, and cannot assure it will stay profitable." },
      { rhpPage: 22, text: "Loss-making subsidiaries: two subsidiaries, Paras Healthcare (Ranchi) and Plus Medicare Hospitals, have together made losses, and may not become profitable." },
      { rhpPage: 22, text: "People: the business depends on doctors, nurses and other healthcare staff, and attrition among them is high." },
      { rhpPage: 25, text: "Concentration: five of its eight hospitals are in North India; they brought in 66.07% of revenue from operations in FY 2026." },
      { rhpPage: 26, text: "A member of the promoter group appears in the CIBIL wilful defaulter database." },
    ],
  },
  documents: {
    rhp: "https://parashospitals-web.s3.ap-south-1.amazonaws.com/investor-data/October2026/LotlRQkorWo9iWLUuGcN.pdf",
    abridgedProspectus: "https://www.sebi.gov.in/sebi_data/commondocs/oct-2026/Paras%20Healthcare%20Limited_p.pdf",
  },
  sources: [
    { label: "Red herring prospectus dated 14 Oct 2026 (Paras Healthcare website)", url: "https://parashospitals-web.s3.ap-south-1.amazonaws.com/investor-data/October2026/LotlRQkorWo9iWLUuGcN.pdf", kind: "official" },
    { label: "Abridged prospectus (SEBI website)", url: "https://www.sebi.gov.in/sebi_data/commondocs/oct-2026/Paras%20Healthcare%20Limited_p.pdf", kind: "official" },
    { label: "Price band advertisement dated 14 Oct 2026 (JM Financial, a lead manager)", url: "https://live.jmfl.com/od/UploadedFiles/3B29A307-AA00-40C5-97C1-9C280A35F1AC.pdf", kind: "official" },
  ],
  verifiedOn: "2026-10-19",
  published: true,
};
