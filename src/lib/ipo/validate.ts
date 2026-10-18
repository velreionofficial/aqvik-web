import { bidAmount, maxRetailLots } from "./calc.ts";
import { OPINION_WORDS } from "./explain.ts";
import type { Ipo } from "./model.ts";
import { RULES } from "./rules.ts";

/**
 * Checks an IPO entry before it can be published. Typos in hand-entered numbers are the main
 * risk, so every figure that can be cross-checked against another is.
 */
export function validateIpo(ipo: Ipo): string[] {
  const e: string[] = [];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ipo.slug)) e.push("slug must be lowercase words joined by hyphens");
  if (!ipo.company.trim()) e.push("company is required");
  if (!ipo.exchanges.length) e.push("at least one exchange is required");
  for (const k of ["faceValue", "lotSize"] as const) if (!(ipo[k] > 0) || !Number.isInteger(ipo[k])) e.push(`${k} must be a positive whole number`);
  const { low, high } = ipo.priceBand;
  if (!(low > 0 && high >= low) || !Number.isInteger(low) || !Number.isInteger(high)) e.push("price band must be low ≤ high, in whole paise");
  if (ipo.issueType === "fixed-price" && low !== high) e.push("a fixed-price issue has one price: low must equal high");
  if (low < ipo.faceValue) e.push("price is below face value");

  // Retail lots must match the lot size, price and the retail limit.
  const { min, max } = ipo.retailLots;
  if (!(min >= 1 && max >= min)) e.push("retail lots must be 1 ≤ min ≤ max");
  if (ipo.board === "mainboard") {
    if (bidAmount(ipo, max, high) > RULES.retailMaxBid) e.push(`retail max ${max} lots exceeds the retail limit at the upper band`);
    const allowed = maxRetailLots(ipo.lotSize, high);
    if (max !== allowed) e.push(`retail max should be ${allowed} lots at the upper band (got ${max}); check lot size and price`);
  }

  // Issue size: shares × upper band = total; fresh + OFS = total (within ₹1 crore of rounding in the RHP).
  const s = ipo.issueSize;
  const crore = 1_00_00_000_00;
  if (Math.abs(s.totalShares * high - s.totalAmount) > crore) e.push("issue size: total shares × upper band does not match the total amount");
  if (Math.abs(s.freshAmount + s.offerForSaleAmount - s.totalAmount) > crore) e.push("issue size: fresh issue + offer for sale does not match the total");

  // Dates in order.
  const t = ipo.timeline;
  const order: [string, string | undefined][] = [["open", t.open], ["close", t.close], ["allotment", t.allotment], ["refunds", t.refunds], ["creditToDemat", t.creditToDemat], ["listing", t.listing]];
  let prev: [string, string] | null = null;
  for (const [name, d] of order) {
    if (d === undefined) continue;
    if (!iso.test(d) || Number.isNaN(Date.parse(d))) {
      e.push(`timeline.${name} must be a date like 2026-10-21`);
      continue;
    }
    if (prev && d < prev[1]) e.push(`timeline.${name} (${d}) is before ${prev[0]} (${prev[1]})`);
    prev = [name, d];
  }

  if (!/^https:\/\//.test(ipo.registrar.allotmentStatusUrl)) e.push("registrar allotment status link must be an https link");
  if (!ipo.sources.length) e.push("at least one source is required");
  for (const src of ipo.sources) if (!/^https:\/\//.test(src.url)) e.push(`source "${src.label}" must be an https link`);
  if (!ipo.sources.some((x) => x.kind === "official")) e.push("at least one official source (RHP, exchange or registrar) is required to publish");
  if (!iso.test(ipo.verifiedOn)) e.push("verifiedOn must be a date");

  // Financials: required to publish; periods in order, sensible values, a page reference.
  const f = ipo.financials;
  if (!f) e.push("financials (summary of restated financial information from the RHP) are required to publish");
  else {
    if (!f.rhpPages.trim()) e.push("financials.rhpPages must say where in the RHP the figures are");
    if (f.periods.length < 1) e.push("financials need at least one period");
    if (f.periods.filter((p) => p.months === 12).length < 1) e.push("financials need at least one full year");
    let prevEnd = "";
    for (const p of f.periods) {
      const where = `financials "${p.label || "?"}"`;
      if (!p.label.trim()) e.push("every financial period needs a label");
      if (!iso.test(p.endsOn)) e.push(`${where}: endsOn must be a date`);
      else if (prevEnd && p.endsOn <= prevEnd) e.push(`${where}: periods must be oldest first, with no repeats`);
      prevEnd = p.endsOn;
      if (!(p.months >= 1 && p.months <= 12) || !Number.isInteger(p.months)) e.push(`${where}: months must be 1 to 12`);
      for (const k of ["revenue", "profitAfterTax", "netWorth", "totalBorrowings", "totalAssets"] as const) {
        const v = p[k];
        if (v !== undefined && !Number.isInteger(v)) e.push(`${where}: ${k} must be whole paise`);
      }
      if (p.revenue < 0 || p.totalBorrowings < 0 || (p.totalAssets !== undefined && p.totalAssets <= 0)) e.push(`${where}: revenue and borrowings cannot be negative, and total assets must be positive`);
      // A loss can exceed revenue, but net worth or borrowings above total assets means a unit slip.
      if (p.totalAssets !== undefined && (p.totalBorrowings > p.totalAssets || p.netWorth > p.totalAssets)) e.push(`${where}: borrowings or net worth exceed total assets — check the unit conversion`);
      if (Math.abs(p.profitAfterTax) > Math.max(p.revenue, p.totalAssets ?? 0, Math.abs(p.netWorth)) * 2) e.push(`${where}: profit looks out of scale with revenue and assets — check the unit conversion`);
    }
  }

  if (ipo.business && (!ipo.business.points.length || !ipo.business.rhpPages.trim())) e.push("business needs at least one point and the RHP pages it comes from");
  const reservedTotal = (ipo.reservedPortions ?? []).reduce((n, r) => n + r.amount, 0);
  for (const r of ipo.reservedPortions ?? []) if (!(r.amount > 0 && r.maxBid > 0) || !r.who.trim()) e.push("every reserved portion needs who, a positive amount and a maximum bid");
  if (reservedTotal >= s.totalAmount) e.push("reserved portions cannot be the whole issue");
  const sp = ipo.netIssueSplit;
  if (sp && (sp.qibMaxPct + sp.niiMinPct + sp.retailMinPct !== 100 || sp.anchorMaxPctOfQib > 60)) e.push("netIssueSplit: QIB + NII + retail must be 100% of the net issue, and anchors at most 60% of QIB");
  const rf = ipo.riskFactors;
  if (rf) {
    const { fromPage, toPage } = rf.section;
    if (!(Number.isInteger(fromPage) && fromPage > 0 && toPage >= fromPage)) e.push("riskFactors.section must be the RHP page range of the whole Risk Factors section");
    if (!rf.items.length || rf.items.length > RULES.maxRiskFactors) e.push(`riskFactors: show 1 to ${RULES.maxRiskFactors} items`);
    let prevPage = 0;
    for (const r of rf.items) {
      if (!r.text.trim()) e.push("every risk factor needs text");
      if (r.rhpPage === undefined) {
        if (!rf.listedIn?.trim()) e.push("a risk factor without an RHP page needs riskFactors.listedIn (the document whose order is used)");
        continue;
      }
      if (!(r.rhpPage >= fromPage && r.rhpPage <= toPage)) e.push(`risk factor on page ${r.rhpPage} is outside the Risk Factors section (${fromPage}–${toPage})`);
      if (r.rhpPage < prevPage) e.push("risk factors must be in the order the RHP lists them (the first ones), not picked");
      prevPage = r.rhpPage;
    }
  }

  const d = ipo.documents;
  if (!d?.rhp) e.push("documents.rhp (link to the full RHP) is required to publish");
  for (const [k, url] of Object.entries(d ?? {})) if (url !== undefined && !/^https:\/\//.test(url)) e.push(`documents.${k} must be an https link`);
  if (ipo.anchor) {
    if (!iso.test(ipo.anchor.allocatedOn) || ipo.anchor.allocatedOn >= ipo.timeline.open) e.push("anchor.allocatedOn must be a date before the issue opens");
    if (!(ipo.anchor.amount > 0) || !Number.isInteger(ipo.anchor.amount) || ipo.anchor.amount > s.totalAmount) e.push("anchor.amount must be whole paise, positive and within the issue size");
  }
  let prevFix = "";
  for (const c of ipo.corrections ?? []) {
    if (!iso.test(c.on) || c.on < prevFix || !c.note.trim()) e.push("every correction needs a date (oldest first) and a note");
    prevFix = c.on;
  }
  if (ipo.corrections?.length && ipo.verifiedOn < ipo.corrections[ipo.corrections.length - 1]!.on) e.push("verifiedOn must be on or after the latest correction");

  // Keep advice, opinion and grey-market talk out of the free text.
  const opinion = [ipo.about, ...(ipo.business?.points ?? [])].join(" ");
  if (OPINION_WORDS.test(opinion)) e.push(`description contains opinion wording ("${opinion.match(OPINION_WORDS)?.[0]}"); describe facts only`);
  const text = [ipo.about, ...(ipo.objects ?? []), ...(ipo.specialQuotas ?? []), ...(ipo.business?.points ?? []), ...(ipo.riskFactors?.items ?? []).map((r) => r.text)].join(" ");
  if (/\b(gmp|grey market|gray market|kostak|subject to sauda|must apply|should apply|avoid this|buy rating|target price|multibagger|guaranteed|listing gain of|expected listing)\b/i.test(text)) e.push("free text contains grey-market or advice wording");
  return e;
}
