import type { FinancialPeriod, Ipo, Paise } from "./model.ts";

/**
 * Plain-language explanations of an IPO, generated from its numbers by fixed templates (no AI),
 * so they are always the same and always match the figures. They describe; they never judge:
 * no "strong", "healthy", "cheap" or "risky". The tests enforce that.
 */

/** ₹ in crore for large amounts, with up to 2 decimals and Indian grouping; lakh crore when huge. */
export function rupeesWords(p: Paise): string {
  const sign = p < 0 ? "−" : "";
  const r = Math.abs(p) / 100;
  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (r >= 1e12) return `${sign}₹${fmt(r / 1e12)} lakh crore`;
  if (r >= 1e7) return `${sign}₹${fmt(r / 1e7)} crore`;
  if (r >= 1e5) return `${sign}₹${fmt(r / 1e5)} lakh`;
  return `${sign}₹${fmt(r)}`;
}

const pct = (part: number, whole: number) => Math.round((part * 1000) / whole) / 10; // one decimal
const fmt1 = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export type Explanation = { id: string; text: string };

/** Where the IPO money goes: to the company (fresh issue) or to selling shareholders (OFS). */
export function explainIssue(ipo: Ipo): Explanation[] {
  const s = ipo.issueSize;
  const out: Explanation[] = [{ id: "size", text: `The company is offering shares worth up to ${rupeesWords(s.totalAmount)} at the top of the price band.` }];
  if (s.freshAmount > 0) out.push({ id: "fresh", text: `${rupeesWords(s.freshAmount)} is a fresh issue: new shares, and this money goes to the company${ipo.objects?.length ? " for the purposes listed under \"Objects of the issue\"" : ""}.` });
  if (s.offerForSaleAmount > 0) out.push({ id: "ofs", text: `${rupeesWords(s.offerForSaleAmount)} is an offer for sale: existing shareholders are selling their shares, and this money goes to them, not to the company.` });
  const lotAmount = ipo.lotSize * ipo.priceBand.high;
  out.push({ id: "lot", text: `The smallest bid is one lot of ${ipo.lotSize} shares, which is ${rupeesWords(lotAmount)} at the top of the price band.` });
  return out;
}

export type PortionRow = {
  id: string;
  category: string;
  who: string;
  share: string;
  /** Approximate rupee size at the upper band; for reserved portions, the RHP's own figure. */
  amount: Paise;
  approx: boolean;
  maxBid: string;
  allotment: string;
};

/**
 * Who the shares are for, with approximate rupee sizes. Reserved portions use the RHP's rupee
 * figures; the net issue split is AQVIK's arithmetic at the upper band from the RHP percentages,
 * because the RHP leaves share counts as [●] until the price is fixed. Employee shares are counted
 * at the discounted price.
 */
export function issueBreakdown(ipo: Ipo): { rows: PortionRow[]; netIssue: Paise; retailLots: number } | null {
  const split = ipo.netIssueSplit;
  if (!split) return null;
  const high = ipo.priceBand.high;
  const rows: PortionRow[] = [];
  let reservedShares = 0;
  for (const r of ipo.reservedPortions ?? []) {
    const price = r.kind === "employee" ? high - (ipo.employeeDiscount ?? 0) : high;
    reservedShares += Math.floor(r.amount / price);
    rows.push({
      id: r.kind,
      category: r.kind === "employee" ? "Eligible employees" : "Shareholder reservation",
      who: r.who,
      share: "Reserved, outside the net issue",
      amount: r.amount,
      approx: false,
      maxBid: rupeesWords(r.maxBid),
      allotment: r.allotment,
    });
  }
  const netShares = ipo.issueSize.totalShares - reservedShares;
  const part = (pct: number) => Math.floor((netShares * pct) / 100);
  const qib = part(split.qibMaxPct);
  const nii = part(split.niiMinPct);
  const retail = part(split.retailMinPct);
  rows.push(
    {
      id: "qib",
      category: "QIB (institutions)",
      who: "Mutual funds, banks, insurers, foreign portfolio investors and other qualified institutions",
      share: `Not more than ${split.qibMaxPct}% of the net issue; up to ${split.anchorMaxPctOfQib}% of this can go to anchor investors a day before opening`,
      amount: qib * high,
      approx: true,
      maxBid: "No limit",
      allotment: "Proportionate",
    },
    {
      id: "snii",
      category: "Small NII (sNII)",
      who: "Individuals and others bidding above ₹2 lakh up to ₹10 lakh",
      share: `One-third of the NII portion (NII is not less than ${split.niiMinPct}% of the net issue)`,
      amount: Math.floor(nii / 3) * high,
      approx: true,
      maxBid: "₹10 lakh",
      allotment: "Lottery for the minimum NII application when oversubscribed",
    },
    {
      id: "bnii",
      category: "Big NII (bNII)",
      who: "Individuals and others bidding above ₹10 lakh",
      share: "Two-thirds of the NII portion",
      amount: (nii - Math.floor(nii / 3)) * high,
      approx: true,
      maxBid: "No limit (up to the NII portion)",
      allotment: "As per the basis of allotment, subject to the minimum NII application",
    },
    {
      id: "retail",
      category: "Retail individual investors",
      who: "Individuals bidding up to ₹2 lakh",
      share: `Not less than ${split.retailMinPct}% of the net issue`,
      amount: retail * high,
      approx: true,
      maxBid: "₹2 lakh",
      allotment: "Lottery for one lot each when oversubscribed",
    },
  );
  return { rows, netIssue: netShares * high, retailLots: Math.floor(retail / ipo.lotSize) };
}

const fullYears = (periods: FinancialPeriod[]) => periods.filter((p) => p.months === 12);

/** What the financial summary means, line by line, for someone who has never read a balance sheet. */
export function explainFinancials(ipo: Ipo): Explanation[] {
  const f = ipo.financials;
  if (!f || !f.periods.length) return [];
  const out: Explanation[] = [];
  const years = fullYears(f.periods);
  const last = years[years.length - 1];
  const prev = years[years.length - 2];
  if (last) {
    out.push({ id: "revenue", text: `In ${last.label}, the company earned ${rupeesWords(last.revenue)} from what it sells. This is its revenue.` });
    if (last.profitAfterTax >= 0) {
      out.push({ id: "profit", text: `After paying all its costs and taxes, ${rupeesWords(last.profitAfterTax)} was left. This is its profit.` });
      if (last.revenue > 0) out.push({ id: "margin", text: `So for every ₹100 of revenue, about ₹${fmt1(pct(last.profitAfterTax, last.revenue))} was left as profit.` });
    } else {
      out.push({ id: "profit", text: `Its costs and taxes were more than its revenue, so it made a loss of ${rupeesWords(-last.profitAfterTax)}.` });
    }
    if (prev && prev.revenue > 0) {
      const change = last.revenue - prev.revenue;
      out.push({
        id: "revenue-change",
        text:
          change === 0
            ? `Revenue was the same as in ${prev.label}.`
            : `Revenue went ${change > 0 ? "up" : "down"} from ${rupeesWords(prev.revenue)} in ${prev.label} to ${rupeesWords(last.revenue)}, a change of ${change > 0 ? "+" : "−"}${fmt1(Math.abs(pct(change, prev.revenue)))}%.`,
      });
      if (prev.profitAfterTax !== last.profitAfterTax) {
        const word = (x: number) => (x >= 0 ? `a profit of ${rupeesWords(x)}` : `a loss of ${rupeesWords(-x)}`);
        out.push({ id: "profit-change", text: `In ${prev.label} it had ${word(prev.profitAfterTax)}; in ${last.label}, ${word(last.profitAfterTax)}.` });
      }
    }
    if (last.netWorth > 0) {
      out.push({ id: "networth", text: `What belongs to the owners after all debts are subtracted (net worth) was ${rupeesWords(last.netWorth)} at the end of ${last.label}.` });
      out.push({
        id: "borrowings",
        text:
          last.totalBorrowings > 0
            ? `It owed ${rupeesWords(last.totalBorrowings)} to lenders, which is ₹${fmt1(Math.round((last.totalBorrowings * 100) / last.netWorth) / 100)} of borrowing for every ₹1 of the owners' money.`
            : `It had no borrowings at the end of ${last.label}.`,
      });
    } else {
      out.push({ id: "networth", text: `At the end of ${last.label}, what it owed was more than what it owned, so its net worth was negative (${rupeesWords(last.netWorth)}).` });
      if (last.totalBorrowings > 0) out.push({ id: "borrowings", text: `It owed ${rupeesWords(last.totalBorrowings)} to lenders.` });
    }
  }
  const stub = f.periods[f.periods.length - 1];
  if (stub && stub.months < 12) {
    out.push({
      id: "stub",
      text: `In the latest part-year (${stub.label}, ${stub.months} months), revenue was ${rupeesWords(stub.revenue)} and ${stub.profitAfterTax >= 0 ? `profit ${rupeesWords(stub.profitAfterTax)}` : `the loss ${rupeesWords(-stub.profitAfterTax)}`}. A part-year cannot be compared directly with a full year.`,
    });
  }
  out.push({ id: "source", text: `Figures are ${f.basis} numbers from the RHP (pages ${f.rhpPages}). The RHP explains them in full.` });
  return out;
}

/** Terms shown next to the explanations, in the same plain words. */
export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "Revenue", meaning: "Money the company earned from selling its products or services, before costs." },
  { term: "Profit after tax", meaning: "What is left from revenue after every cost and tax is paid. A negative number is a loss." },
  { term: "Net worth", meaning: "What the company owns minus what it owes: the owners' share." },
  { term: "Borrowings", meaning: "Loans and debt the company has to repay to banks and other lenders." },
  { term: "Fresh issue", meaning: "New shares created in the IPO. The money goes to the company." },
  { term: "Offer for sale (OFS)", meaning: "Existing shareholders selling some of their shares. The money goes to them, not the company." },
  { term: "Price band", meaning: "The lowest and highest price per share you can bid. The final price is set after bidding closes." },
  { term: "Lot", meaning: "The fixed bundle of shares bids are made in. You can bid for one or more whole lots." },
  { term: "RHP (red herring prospectus)", meaning: "The company's official offer document, filed with SEBI. It has the full details of the company, the issue, its financials and its risks." },
  { term: "QIB (qualified institutional buyer)", meaning: "Large institutions such as mutual funds, banks, insurers and foreign portfolio investors, who bid in their own portion of the issue." },
  { term: "NII (non-institutional investor)", meaning: "Individuals and others who bid for more than ₹2 lakh. Split into small NII (up to ₹10 lakh) and big NII (above ₹10 lakh)." },
  { term: "Retail individual investor", meaning: "An individual who bids for up to ₹2 lakh in the issue." },
  { term: "Anchor investors", meaning: "Institutions given shares a day before the issue opens, at a price not below the issue price. Their shares cannot be sold for a lock-in period stated in the RHP." },
  { term: "ASBA", meaning: "Application Supported by Blocked Amount: your bank blocks the bid amount in your account instead of taking it, and releases whatever is not used for shares." },
  { term: "UPI mandate", meaning: "A request in your UPI app to block the bid amount. Approving it is what completes a UPI bid." },
  { term: "Basis of allotment", meaning: "The registrar's document, published after the issue closes, showing how shares were given out in each category." },
];

/** Words that turn a description into an opinion. Explanations must never contain them. */
export const OPINION_WORDS = /\b(strong|weak|healthy|unhealthy|good|bad|great|poor|cheap|expensive|undervalued|overvalued|attractive|risky|safe|solid|impressive|worrying|should|must|recommend|avoid|buy|sell|gmp)\b/i;
