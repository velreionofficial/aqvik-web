import type { ToolFaq } from "@/content/tools";
import type { Field, RatioId, Style } from "@/lib/ratios/ratios";

/**
 * Copy for the Financial Ratio Analyzer. Every explanation is neutral: it
 * says what a ratio measures, never whether a value is good or bad, and no
 * benchmark ranges are given.
 */

export const ratioTool = {
  slug: "financial-ratio-analyzer",
  name: "Financial Ratio Analyzer",
  cardLine: "Type figures from an annual report and see ROE, ROCE, margins, P/E and more, each explained.",
  title: "Financial Ratio Calculator — ROE, ROCE, Margins, P/E | AQVIK",
  description:
    "Enter figures from an annual report to calculate ROE, ROCE, margins, liquidity, leverage, efficiency, EPS, P/E and a DuPont breakdown, each with its formula.",
  h1: "Financial ratio analyzer",
  intro:
    "Type in figures from a company's annual report, or your own business's accounts, and see the standard financial ratios with what each one measures. The tool uses only the numbers you enter.",
} as const;

export const ratioDisclaimer =
  "For education and illustration only. Results depend entirely on the figures you enter and on the definitions shown. This is not investment advice or a research recommendation, and AQVIK is not a SEBI-registered investment adviser or research analyst.";

export const ratioSoftCta = "Track your own money the same way — try AQVIK.";

export const compareLine = "Compare it with the same company's earlier years and with similar companies.";

export const UNIT_OPTIONS = [
  { value: "rupee", label: "₹" },
  { value: "lakh", label: "₹ lakh" },
  { value: "crore", label: "₹ crore" },
] as const;

type FieldCopy = { field: Field; label: string; hint: string; optional?: boolean };

export const inputSections: { title: string; note?: string; fields: FieldCopy[] }[] = [
  {
    title: "Profit and loss (for the year)",
    fields: [
      { field: "revenue", label: "Revenue from operations", hint: "The first line of the statement of profit and loss." },
      {
        field: "cogs",
        label: "Cost of goods sold",
        hint: "Cost of materials consumed + purchases of stock-in-trade + changes in inventories. Enter 0 if there is none.",
      },
      {
        field: "opex",
        label: "Operating expenses, excluding depreciation",
        hint: "Employee benefits expense + other expenses.",
      },
      { field: "depreciation", label: "Depreciation and amortisation", hint: "Its own line in the profit and loss statement." },
      {
        field: "otherIncome",
        label: "Other income",
        optional: true,
        hint: "Enter exceptional items here too. Use a minus sign for a loss.",
      },
      { field: "financeCosts", label: "Finance costs (interest)", hint: "Enter 0 if the company has no borrowings." },
      { field: "tax", label: "Tax expense", hint: "Current + deferred tax. Use a minus sign for a tax credit." },
    ],
  },
  {
    title: "Balance sheet (end of year)",
    fields: [
      { field: "totalAssets", label: "Total assets", hint: "The total at the end of the assets side." },
      {
        field: "equity",
        label: "Total equity (shareholders' funds)",
        hint: "Equity share capital + other equity. Use a minus sign if it is negative.",
      },
      {
        field: "borrowings",
        label: "Total borrowings",
        hint: "Long-term + short-term borrowings, under non-current and current liabilities. Enter 0 if none.",
      },
      { field: "currentAssets", label: "Current assets", hint: "Total current assets." },
      { field: "currentLiabilities", label: "Current liabilities", hint: "Total current liabilities." },
      { field: "inventories", label: "Inventories", hint: "Under current assets. Enter 0 if none." },
      { field: "receivables", label: "Trade receivables", hint: "Under current assets." },
      { field: "cash", label: "Cash and cash equivalents", hint: "Under current assets. Shown in the report for reference.", optional: true },
    ],
  },
  {
    title: "Start of year",
    note: "Optional. From the previous year's column in the same balance sheet. With these, ROE and ROA are also shown on average figures.",
    fields: [
      { field: "equityStart", label: "Total equity", optional: true, hint: "Use a minus sign if it was negative." },
      { field: "assetsStart", label: "Total assets", optional: true, hint: "Previous year's total assets." },
    ],
  },
  {
    title: "Per share",
    note: "Optional. The number of shares is on the equity share capital note; enter the full count, not in lakh or crore.",
    fields: [
      { field: "shares", label: "Number of shares", optional: true, hint: "Absolute count, e.g. 100000000 for 10 crore shares." },
      { field: "price", label: "Share price (₹)", optional: true, hint: "In rupees per share. Needed for P/E and P/B." },
    ],
  },
];

export type RatioCopy = { id: RatioId; label: string; style: Style; means: string; formula: string };

export const resultGroups: { title: string; items: RatioCopy[] }[] = [
  {
    title: "Profitability",
    items: [
      { id: "grossMargin", label: "Gross margin", style: "percent", means: "Out of each ₹100 of revenue, how much is left after the direct cost of the goods sold.", formula: "Gross profit ÷ Revenue × 100" },
      { id: "ebitdaMargin", label: "EBITDA margin", style: "percent", means: "Out of each ₹100 of revenue, how much is left after running costs, before depreciation, interest and tax.", formula: "EBITDA ÷ Revenue × 100" },
      { id: "ebitMargin", label: "EBIT margin", style: "percent", means: "Out of each ₹100 of revenue, the profit before interest and tax, after depreciation and including other income.", formula: "EBIT ÷ Revenue × 100" },
      { id: "netMargin", label: "Net profit margin", style: "percent", means: "Out of each ₹100 of revenue, how much ends up as net profit.", formula: "Net profit ÷ Revenue × 100" },
      { id: "roe", label: "Return on equity (ROE)", style: "percent", means: "How much net profit the company made for each ₹100 of shareholders' money.", formula: "Net profit ÷ Total equity (end of year) × 100" },
      { id: "roeAverage", label: "ROE on average equity", style: "percent", means: "The same, using the average of equity at the start and end of the year.", formula: "Net profit ÷ ((Equity at start + Equity at end) ÷ 2) × 100" },
      { id: "roa", label: "Return on assets (ROA)", style: "percent", means: "How much net profit the company made for each ₹100 of assets it holds.", formula: "Net profit ÷ Total assets (end of year) × 100" },
      { id: "roaAverage", label: "ROA on average assets", style: "percent", means: "The same, using the average of total assets at the start and end of the year.", formula: "Net profit ÷ ((Assets at start + Assets at end) ÷ 2) × 100" },
      { id: "roce", label: "Return on capital employed (ROCE)", style: "percent", means: "How much profit before interest and tax the company made for each ₹100 of capital employed.", formula: "EBIT ÷ Capital employed × 100, where Capital employed = Total assets − Current liabilities" },
    ],
  },
  {
    title: "Liquidity",
    items: [
      { id: "currentRatio", label: "Current ratio", style: "times", means: "How many rupees of current assets there are for each rupee of current liabilities.", formula: "Current assets ÷ Current liabilities" },
      { id: "quickRatio", label: "Quick ratio", style: "times", means: "The same, leaving out inventories, which can take longer to turn into cash.", formula: "(Current assets − Inventories) ÷ Current liabilities" },
    ],
  },
  {
    title: "Leverage",
    items: [
      { id: "debtToEquity", label: "Debt-to-equity", style: "times", means: "How many rupees the company has borrowed for each rupee of shareholders' money.", formula: "Total borrowings ÷ Total equity" },
      { id: "interestCoverage", label: "Interest coverage", style: "times", means: "How many times the year's profit before interest and tax covers the year's interest.", formula: "EBIT ÷ Finance costs" },
    ],
  },
  {
    title: "Efficiency",
    items: [
      { id: "assetTurnover", label: "Asset turnover", style: "times", means: "How many rupees of revenue each rupee of assets brought in during the year.", formula: "Revenue ÷ Total assets" },
      { id: "inventoryTurnover", label: "Inventory turnover", style: "times", means: "How many times the year-end inventory would be used up by a year's cost of goods sold.", formula: "Cost of goods sold ÷ Inventories" },
      { id: "inventoryDays", label: "Inventory days", style: "days", means: "Roughly how many days of cost of goods sold the year-end inventory represents.", formula: "365 ÷ Inventory turnover" },
      { id: "receivableDays", label: "Receivable days", style: "days", means: "Roughly how many days of revenue were still to be collected from customers at year end.", formula: "Trade receivables ÷ Revenue × 365" },
    ],
  },
  {
    title: "Per share & valuation",
    items: [
      { id: "eps", label: "Earnings per share (EPS)", style: "rupees", means: "The year's net profit for each share.", formula: "Net profit in ₹ ÷ Number of shares" },
      { id: "bookValue", label: "Book value per share", style: "rupees", means: "Shareholders' money on the balance sheet for each share.", formula: "Total equity in ₹ ÷ Number of shares" },
      { id: "pe", label: "Price to earnings (P/E)", style: "times", means: "How many rupees of share price there are for each rupee of yearly earnings per share.", formula: "Share price ÷ EPS" },
      { id: "pb", label: "Price to book (P/B)", style: "times", means: "How many rupees of share price there are for each rupee of book value per share.", formula: "Share price ÷ Book value per share" },
    ],
  },
];

export const derivedCopy = [
  { key: "grossProfit", label: "Gross profit", formula: "Revenue − Cost of goods sold" },
  { key: "ebitda", label: "EBITDA", formula: "Revenue − Cost of goods sold − Operating expenses" },
  { key: "ebit", label: "EBIT", formula: "EBITDA − Depreciation + Other income" },
  { key: "pbt", label: "Profit before tax", formula: "EBIT − Finance costs" },
  { key: "netProfit", label: "Net profit", formula: "Profit before tax − Tax" },
  { key: "capitalEmployed", label: "Capital employed", formula: "Total assets − Current liabilities" },
] as const;

export const dupontCopy = {
  title: "DuPont breakdown",
  means:
    "Splits ROE into three parts: how much net profit each ₹100 of revenue leaves (net margin), how much revenue each rupee of assets brings in (asset turnover), and how many rupees of assets there are for each rupee of equity (equity multiplier).",
  formula: "ROE = Net profit margin × Asset turnover × Equity multiplier, where Equity multiplier = Total assets ÷ Total equity",
  roundingNote: "The product is worked out from the exact values, so it can differ slightly from multiplying the rounded parts shown.",
};

export const ratioHow: readonly string[] = [
  ...derivedCopy.map((d) => `${d.label} = ${d.formula}.`),
  ...resultGroups.flatMap((g) => g.items.filter((i) => !i.id.endsWith("Average")).map((i) => `${i.label} = ${i.formula}.`)),
  "ROE and ROA on average figures use (start of year + end of year) ÷ 2 in place of the year-end figure.",
  `DuPont: ${dupontCopy.formula}.`,
  "EPS and book value per share convert amounts to rupees using the unit you choose: 1 lakh = 1,00,000 and 1 crore = 1,00,00,000.",
  "All sums are exact; results are rounded only for display: percentages and ratios to 2 decimals, days to 1 decimal.",
];

export const ratioFaqs: readonly ToolFaq[] = [
  {
    question: "What is ROE and how is it calculated?",
    answer:
      "Return on equity (ROE) is the net profit for the year divided by total equity (shareholders' funds), times 100. It shows how much net profit the company made for each ₹100 of shareholders' money. This tool shows it on year-end equity and, if you enter the start-of-year figure, on average equity.",
  },
  {
    question: "What is the difference between ROE and ROCE?",
    answer:
      "ROE uses net profit, after interest and tax, and divides it by shareholders' equity only. ROCE uses EBIT, profit before interest and tax, and divides it by capital employed (here total assets minus current liabilities), which includes borrowed money as well as equity. A company with large borrowings can show quite different ROE and ROCE.",
  },
  {
    question: "Where do I find these numbers in an annual report?",
    answer:
      "Revenue, expenses, depreciation, other income, finance costs and tax are in the statement of profit and loss. Total assets, equity, borrowings, current assets and liabilities, inventories, receivables and cash are in the balance sheet, which also shows the previous year's figures for the start of the year. The number of shares is in the note on equity share capital. Use the same basis throughout, either standalone or consolidated.",
  },
  {
    question: "Does this tool tell me which stock to buy?",
    answer:
      "No. It only calculates ratios from the figures you type in and explains what each one measures. It does not look up any company, does not judge whether a result is good or bad, and does not recommend buying, selling or holding anything.",
  },
];
