import { test } from "node:test";
import assert from "node:assert/strict";

import { allIpos, publishedIpos, sortedIpos, visibleIpos } from "../../content/ipos/index.ts";
import { jioPlatforms } from "../../content/ipos/jio-platforms.ts";
import { ipoCalendarIcs } from "./calendar.ts";
import { bidAmount, bidCategory, daysUntil, ipoStatus, maxRetailLots, saleEstimate, todayIST } from "./calc.ts";
import type { Ipo } from "./model.ts";
import { validateIpo } from "./validate.ts";

/** A made-up IPO used to test rules; not a real company. */
const sample = (over: Partial<Ipo> = {}): Ipo => ({
  slug: "sample-industries",
  company: "Sample Industries Ltd.",
  about: "Makes sample products.",
  board: "mainboard",
  exchanges: ["NSE", "BSE"],
  issueType: "book-built",
  faceValue: 10_00,
  priceBand: { low: 95_00, high: 100_00 },
  lotSize: 150,
  retailLots: { min: 1, max: 13 },
  issueSize: { totalShares: 1_00_00_000, totalAmount: 100_00_00_000_00, freshAmount: 60_00_00_000_00, offerForSaleAmount: 40_00_00_000_00 },
  reservations: [{ category: "Retail", share: "Not less than 35% of the net issue" }],
  timeline: { open: "2026-11-02", close: "2026-11-04", allotment: "2026-11-05", refunds: "2026-11-06", creditToDemat: "2026-11-06", listing: "2026-11-09" },
  registrar: { name: "Sample Registrar", allotmentStatusUrl: "https://example.com/allotment" },
  leadManagers: ["Sample Capital"],
  sources: [{ label: "RHP", url: "https://example.com/rhp.pdf", kind: "official" }],
  documents: { rhp: "https://example.com/rhp.pdf" },
  financials: {
    basis: "restated consolidated",
    rhpUnit: "₹ million",
    rhpPages: "312–318",
    periods: [
      { label: "FY 2024", endsOn: "2024-03-31", months: 12, revenue: 400_00_00_000_00, profitAfterTax: 30_00_00_000_00, netWorth: 200_00_00_000_00, totalBorrowings: 80_00_00_000_00, totalAssets: 500_00_00_000_00 },
      { label: "FY 2025", endsOn: "2025-03-31", months: 12, revenue: 480_00_00_000_00, profitAfterTax: -5_00_00_000_00, netWorth: 195_00_00_000_00, totalBorrowings: 90_00_00_000_00, totalAssets: 560_00_00_000_00 },
      { label: "Q1 FY 2026", endsOn: "2025-06-30", months: 3, revenue: 130_00_00_000_00, profitAfterTax: 9_00_00_000_00, netWorth: 204_00_00_000_00, totalBorrowings: 85_00_00_000_00, totalAssets: 575_00_00_000_00 },
    ],
  },
  verifiedOn: "2026-10-18",
  published: true,
  ...over,
});

test("Bid amounts and retail limit (₹2 lakh) at the upper band", () => {
  assert.equal(bidAmount(sample(), 1, 100_00), 15_000_00);
  assert.equal(maxRetailLots(150, 100_00), 13); // 13 × ₹15,000 = ₹1,95,000
  assert.equal(maxRetailLots(12, 1119_00), 14); // Jio: 14 × ₹13,428 = ₹1,87,992; 15 lots would be ₹2,01,420
  assert.equal(bidAmount(jioPlatforms, 14, 1119_00), 1_87_992_00);
  assert.equal(maxRetailLots(0, 100_00), 0);
});

test("Sale estimate with 20% STCG and 4% cess; no tax on a loss", () => {
  const g = saleEstimate(12, 1119_00, 1300_00);
  assert.deepEqual(g, { shares: 12, invested: 13_428_00, saleValue: 15_600_00, gain: 2_172_00, tax: 451_78, netGain: 1_720_22 });
  // 20% of ₹2,172 = ₹434.40; cess 4% = ₹17.376 → ₹17.38; total ₹451.78
  const loss = saleEstimate(12, 1119_00, 1000_00);
  assert.deepEqual([loss.gain, loss.tax, loss.netGain], [-1_428_00, 0, -1_428_00]);
});

test("Bid category and UPI limit for individual investors", () => {
  assert.deepEqual(bidCategory(2_00_000_00), { category: "retail", upi: true });
  assert.deepEqual(bidCategory(2_00_001_00), { category: "small-nii", upi: true });
  assert.deepEqual(bidCategory(5_00_001_00), { category: "small-nii", upi: false });
  assert.deepEqual(bidCategory(10_00_001_00), { category: "big-nii", upi: false });
});

test("Status through the IPO's life, in IST", () => {
  const ipo = sample();
  assert.deepEqual(["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05", "2026-11-09"].map((d) => ipoStatus(ipo, d)), ["upcoming", "open", "open", "allotment-out", "listed"]);
  assert.equal(ipoStatus(sample({ timeline: { open: "2026-11-02", close: "2026-11-04" } }), "2026-11-05"), "closed");
  assert.equal(todayIST(new Date("2026-10-20T20:00:00Z")), "2026-10-21"); // 1:30 am in India
  assert.equal(daysUntil("2026-10-21", "2026-10-18"), 3);
});

test("Validation catches hand-entry mistakes", () => {
  assert.deepEqual(validateIpo(sample()), []);
  const bad = validateIpo(
    sample({
      slug: "Bad Slug",
      priceBand: { low: 100_00, high: 95_00 },
      retailLots: { min: 1, max: 20 },
      issueSize: { totalShares: 1_00_00_000, totalAmount: 50_00_00_000_00, freshAmount: 10_00_00_000_00, offerForSaleAmount: 10_00_00_000_00 },
      timeline: { open: "2026-11-04", close: "2026-11-02" },
      sources: [{ label: "News", url: "http://example.com", kind: "secondary" }],
      about: "Strong buy, GMP is ₹50",
    }),
  );
  for (const want of ["slug", "price band", "retail max", "issue size: total shares", "issue size: fresh", "timeline.close", "official source", "https link", "advice wording"]) {
    assert.ok(bad.some((m) => m.includes(want)), `expected an error about ${want}: ${bad.join(" | ")}`);
  }
  assert.ok(validateIpo(sample({ retailLots: { min: 1, max: 12 } })).some((m) => m.includes("should be 13 lots")));
  assert.ok(validateIpo(sample({ issueType: "fixed-price" })).some((m) => m.includes("fixed-price")));
});

test("Financials: required to publish, in order, with a page reference, and unit slips caught", () => {
  assert.ok(validateIpo(sample({ financials: undefined })).some((m) => m.includes("financials (summary")));
  const base = sample().financials!;
  const p = base.periods;
  const errs = validateIpo(
    sample({
      financials: {
        ...base,
        rhpPages: " ",
        periods: [p[1]!, p[0]!, { ...p[2]!, months: 13, totalBorrowings: 900_00_00_000_00, revenue: 1.5 }],
      },
    }),
  );
  for (const want of ["rhpPages", "oldest first", "months must be 1 to 12", "whole paise", "check the unit conversion"]) {
    assert.ok(errs.some((m) => m.includes(want)), `expected an error about ${want}: ${errs.join(" | ")}`);
  }
  // A loss-making year is fine; a stub period alone is not.
  assert.deepEqual(validateIpo(sample()), []);
  assert.ok(validateIpo(sample({ financials: { ...base, periods: [p[2]!] } })).some((m) => m.includes("full year")));
});

test("Every entry is valid except for what publishing still needs; drafts never show", () => {
  for (const ipo of allIpos) {
    const errors = validateIpo(ipo).filter((m) => !m.includes("official source") && !m.includes("financials (summary") && !m.includes("documents.rhp"));
    assert.deepEqual(errors, [], ipo.slug);
    if (ipo.published) assert.deepEqual(validateIpo(ipo), [], `${ipo.slug} is published but invalid`);
  }
  // A draft never reaches the site, even when it is otherwise valid.
  const draft = sample({ slug: "draft-co", published: false });
  const live = sample({ slug: "live-co" });
  assert.deepEqual(publishedIpos([draft, live]).map((i) => i.slug), ["live-co"]);
  assert.deepEqual(publishedIpos([sample({ slug: "broken-co", documents: undefined })]), []); // invalid entries never show either
  assert.ok(visibleIpos(false).every((i) => i.published));
  assert.ok(publishedIpos().every((i) => i.published));
});

test("Ordering: open, then upcoming soonest first, then past", () => {
  const at = (slug: string, open: string, close: string, listing: string) => sample({ slug, timeline: { open, close, allotment: listing, listing } });
  const list = [
    at("listed-old", "2026-09-01", "2026-09-03", "2026-09-08"),
    at("upcoming-late", "2026-12-01", "2026-12-03", "2026-12-08"),
    at("open-now", "2026-10-17", "2026-10-20", "2026-10-23"),
    at("upcoming-soon", "2026-10-25", "2026-10-27", "2026-10-30"),
    at("listed-recent", "2026-10-01", "2026-10-03", "2026-10-08"),
  ];
  assert.deepEqual(sortedIpos("2026-10-18", list).map((x) => `${x.ipo.slug}:${x.status}`), [
    "open-now:open",
    "upcoming-soon:upcoming",
    "upcoming-late:upcoming",
    "listed-recent:listed",
    "listed-old:listed",
  ]);
});

test("Calendar file has the four key dates as all-day events", () => {
  const ics = ipoCalendarIcs(sample(), "https://aqvik.com/ipo/sample-industries", new Date("2026-10-18T10:00:00Z"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 4);
  assert.match(ics, /DTSTART;VALUE=DATE:20261102\r\nDTEND;VALUE=DATE:20261103/);
  assert.match(ics, /SUMMARY:Sample Industries Ltd\. IPO closes \(last day to bid\)/);
});

import { GLOSSARY, OPINION_WORDS, explainFinancials, explainIssue, issueBreakdown, rupeesWords } from "./explain.ts";

test("Amounts in words people use", () => {
  assert.equal(rupeesWords(30_213_00_00_000_00), "₹30,213 crore");
  assert.equal(rupeesWords(2_50_000_00_00_000_00), "₹2.5 lakh crore");
  assert.equal(rupeesWords(13_428_00), "₹13,428");
  assert.equal(rupeesWords(12_50_000_00), "₹12.5 lakh");
  assert.equal(rupeesWords(-5_00_00_000_00), "−₹5 crore");
});

test("Plain explanation of the financials matches the numbers exactly", () => {
  const lines = explainFinancials(sample()).map((x) => x.text);
  assert.deepEqual(lines, [
    "In FY 2025, the company earned ₹480 crore from what it sells. This is its revenue.",
    "Its costs and taxes were more than its revenue, so it made a loss of ₹5 crore.",
    "Revenue went up from ₹400 crore in FY 2024 to ₹480 crore, a change of +20%.",
    "In FY 2024 it had a profit of ₹30 crore; in FY 2025, a loss of ₹5 crore.",
    "What belongs to the owners after all debts are subtracted (net worth) was ₹195 crore at the end of FY 2025.",
    "It owed ₹90 crore to lenders, which is ₹0.46 of borrowing for every ₹1 of the owners' money.",
    "In the latest part-year (Q1 FY 2026, 3 months), revenue was ₹130 crore and profit ₹9 crore. A part-year cannot be compared directly with a full year.",
    "Figures are restated consolidated numbers from the RHP (pages 312–318). The RHP explains them in full.",
  ]);
  const profitable = sample({ financials: { ...sample().financials!, periods: [sample().financials!.periods[0]!] } });
  assert.ok(explainFinancials(profitable).some((x) => x.text === "So for every ₹100 of revenue, about ₹7.5 was left as profit."));
});

test("Where the IPO money goes, in plain words", () => {
  assert.deepEqual(explainIssue(sample()).map((x) => x.id), ["size", "fresh", "ofs", "lot"]);
  assert.match(explainIssue(sample()).find((x) => x.id === "ofs")!.text, /goes to them, not to the company/);
  assert.equal(explainIssue(jioPlatforms).find((x) => x.id === "lot")!.text, "The smallest bid is one lot of 12 shares, which is ₹13,428 at the top of the price band.");
  assert.equal(explainIssue(jioPlatforms).some((x) => x.id === "ofs"), false);
});

test("Explanations and glossary never contain opinion words; opinionated descriptions are rejected", () => {
  const all = [...explainFinancials(sample()), ...explainIssue(sample()), ...explainIssue(jioPlatforms)].map((x) => x.text).concat(GLOSSARY.map((g) => `${g.term} ${g.meaning}`));
  for (const t of all) assert.doesNotMatch(t, OPINION_WORDS, t);
  assert.ok(validateIpo(sample({ business: { points: ["A strong market leader in batteries"], rhpPages: "120" } })).some((m) => m.includes("opinion wording")));
  assert.deepEqual(validateIpo(sample({ business: { points: ["Makes lithium batteries for two-wheelers", "Sells mainly in India through 400 dealers"], rhpPages: "118–131" } })), []);
});

test("Risk factors: first ones in RHP order, inside the section, at most 5", () => {
  const section = { fromPage: 30, toPage: 75 };
  const item = (rhpPage: number) => ({ text: "Depends on a few suppliers for key parts", rhpPage });
  assert.deepEqual(validateIpo(sample({ riskFactors: { section, items: [item(30), item(31), item(31)] } })), []);
  const errs = (items: { text: string; rhpPage: number }[]) => validateIpo(sample({ riskFactors: { section, items } })).join(" | ");
  assert.match(errs([item(40), item(32)]), /order the RHP lists/);
  assert.match(errs([item(80)]), /outside the Risk Factors section/);
  assert.match(errs([30, 31, 32, 33, 34, 35].map(item)), /1 to 5 items/);
});

test("Publishing needs the RHP link; anchors and corrections are checked", () => {
  assert.ok(validateIpo(sample({ documents: undefined })).some((m) => m.includes("documents.rhp")));
  assert.ok(validateIpo(sample({ documents: { rhp: "http://x.in/r.pdf" } })).some((m) => m.includes("https")));
  assert.deepEqual(validateIpo(sample({ anchor: { allocatedOn: "2026-10-30", amount: 30_00_00_000_00 } })), []);
  assert.ok(validateIpo(sample({ anchor: { allocatedOn: "2026-11-02", amount: 30_00_00_000_00 } })).some((m) => m.includes("before the issue opens")));
  assert.deepEqual(validateIpo(sample({ corrections: [{ on: "2026-10-17", note: "Lot size corrected from 140 to 150 (RHP p. 12)" }] })), []);
  assert.ok(validateIpo(sample({ corrections: [{ on: "2026-10-20", note: "Fixed" }] })).some((m) => m.includes("verifiedOn")));
  assert.ok(validateIpo(sample({ objects: ["Expected listing gains are high"] })).some((m) => m.includes("advice wording")));
});

test("Jio financials match the abridged prospectus: EPS and NAV per share cross-check the unit conversion", () => {
  const f = jioPlatforms.financials!;
  const shares = 893_90_00_000; // equity share capital ₹89,390 million ÷ ₹10 face value
  const printed = { "FY 2024": [23.96, 310.85], "FY 2025": [29.21, 340.11], "FY 2026": [33.63, 373.66], "Q1 FY 2027": [8.69, 382.34] } as Record<string, [number, number]>;
  for (const p of f.periods) {
    const [eps, nav] = printed[p.label]!;
    assert.ok(Math.abs(p.profitAfterTax / 100 / shares - eps) < 0.02, `${p.label} EPS`);
    assert.ok(Math.abs(p.netWorth / 100 / shares - nav) < 0.02, `${p.label} NAV`);
  }
  assert.equal(rupeesWords(f.periods[2]!.profitAfterTax), "₹30,049.1 crore");
  assert.equal(rupeesWords(f.periods[2]!.revenue), "₹1.47 lakh crore");
});

test("Jio issue breakdown: reserved portions from the RHP, net issue split at the upper band", () => {
  const b = issueBreakdown(jioPlatforms)!;
  const by = Object.fromEntries(b.rows.map((r) => [r.id, r]));
  assert.equal(rupeesWords(by.employee!.amount), "₹500 crore");
  assert.equal(rupeesWords(by.shareholder!.amount), "₹2,500 crore");
  // 27 crore shares − 46,94,835 employee shares (₹500 cr ÷ ₹1,065) − 2,23,41,376 RIL shares (₹2,500 cr ÷ ₹1,119)
  assert.equal(b.netIssue, 24_29_63_789 * 1119_00);
  assert.equal(rupeesWords(by.retail!.amount), "₹9,515.68 crore");
  assert.equal(rupeesWords(by.qib!.amount), "₹13,593.82 crore"); // 12,14,81,894 shares (50% of the net issue) × ₹1,119
  assert.equal(by.snii!.amount + by.bnii!.amount, Math.floor((24_29_63_789 * 15) / 100) * 1119_00);
  assert.equal(b.retailLots, 70_86_443); // 8,50,37,326 retail shares ÷ 12
  assert.equal(issueBreakdown(sample()), null);
  assert.ok(validateIpo(sample({ netIssueSplit: { qibMaxPct: 50, anchorMaxPctOfQib: 60, niiMinPct: 15, retailMinPct: 30 } })).some((m) => m.includes("netIssueSplit")));
});
