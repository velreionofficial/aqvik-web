/**
 * Financial ratios from figures the user types in. Exact arithmetic: every
 * amount is a BigInt in hundredths of the chosen unit, every ratio is an
 * exact fraction, and rounding happens only in the display helpers (half away
 * from zero). No imports, so Node's test runner can load it directly.
 */

export type Unit = "rupee" | "lakh" | "crore";
export const UNIT_FACTOR: Record<Unit, bigint> = { rupee: 1n, lakh: 100_000n, crore: 10_000_000n };

export const AMOUNT_FIELDS = [
  "revenue",
  "cogs",
  "opex",
  "depreciation",
  "otherIncome",
  "financeCosts",
  "tax",
  "totalAssets",
  "equity",
  "borrowings",
  "currentAssets",
  "currentLiabilities",
  "inventories",
  "receivables",
  "cash",
  "equityStart",
  "assetsStart",
] as const;
export type AmountField = (typeof AMOUNT_FIELDS)[number];
export type Field = AmountField | "shares" | "price";
export type RatioInputs = Record<Field, string>;

/** Fields that may be negative. */
export const SIGNED_FIELDS: ReadonlySet<Field> = new Set<Field>(["otherIncome", "tax", "equity", "equityStart"]);
/** Blank means zero for these; blank means "not entered" for the rest. */
const BLANK_IS_ZERO: ReadonlySet<Field> = new Set<Field>(["otherIncome"]);

export const FIELD_NAMES: Record<Field, string> = {
  revenue: "Revenue from operations",
  cogs: "Cost of goods sold",
  opex: "Operating expenses",
  depreciation: "Depreciation and amortisation",
  otherIncome: "Other income",
  financeCosts: "Finance costs",
  tax: "Tax expense",
  totalAssets: "Total assets",
  equity: "Total equity",
  borrowings: "Total borrowings",
  currentAssets: "Current assets",
  currentLiabilities: "Current liabilities",
  inventories: "Inventories",
  receivables: "Trade receivables",
  cash: "Cash and cash equivalents",
  equityStart: "Total equity at the start of the year",
  assetsStart: "Total assets at the start of the year",
  shares: "Number of shares",
  price: "Share price",
};

export const emptyInputs = (): RatioInputs =>
  Object.fromEntries([...AMOUNT_FIELDS, "shares", "price"].map((f) => [f, ""])) as RatioInputs;

/** The sample company from the brief, in ₹ crore. */
export const EXAMPLE: RatioInputs = {
  revenue: "1000",
  cogs: "600",
  opex: "200",
  depreciation: "50",
  otherIncome: "10",
  financeCosts: "20",
  tax: "35",
  totalAssets: "1200",
  equity: "700",
  borrowings: "250",
  currentAssets: "500",
  currentLiabilities: "300",
  inventories: "150",
  receivables: "120",
  cash: "80",
  equityStart: "640",
  assetsStart: "1100",
  shares: "100000000",
  price: "150",
};

/** "1,000.5" → 100050n (hundredths); "-40" allowed only when signed. */
export function parseAmount(text: string, signed: boolean): bigint | null {
  const t = text.replace(/,/g, "").trim();
  const m = /^(-)?(\d+)(?:\.(\d{0,2}))?$/.exec(t);
  if (!m || (m[1] && !signed)) return null;
  const value = BigInt((m[2] ?? "0") + (m[3] ?? "").padEnd(2, "0"));
  return m[1] ? -value : value;
}

export function parseShares(text: string): bigint | null {
  const t = text.replace(/,/g, "").trim();
  return /^\d+$/.test(t) ? BigInt(t) : null;
}

export function fieldError(field: Field, text: string): string | null {
  if (text.trim() === "") return null;
  if (field === "shares") return parseShares(text) === null ? "Enter a whole number of shares, digits only." : null;
  if (parseAmount(text, SIGNED_FIELDS.has(field)) !== null) return null;
  return SIGNED_FIELDS.has(field)
    ? "Enter a number with up to 2 decimals; use a minus sign for a negative figure."
    : "Enter a number of 0 or more, with up to 2 decimals.";
}

/** An exact fraction, or the reason there is no number to show. */
export type Result =
  | { ok: true; n: bigint; d: bigint }
  | { ok: false; reason: string };

const frac = (n: bigint, d: bigint): Result => (d < 0n ? { ok: true, n: -n, d: -d } : { ok: true, n, d });
const missing = (field: Field): Result => ({ ok: false, reason: `Not available — enter ${FIELD_NAMES[field]}` });
const NM_EQUITY: Result = { ok: false, reason: "Not meaningful — equity is zero or negative" };
const NO_FINANCE: Result = { ok: false, reason: "Not applicable — no finance costs" };
const NO_EARNINGS: Result = { ok: false, reason: "Not meaningful — no positive earnings" };

export type Analysis = {
  unit: Unit;
  derived: Record<"grossProfit" | "ebitda" | "ebit" | "pbt" | "netProfit" | "capitalEmployed", Result>;
  ratios: Record<RatioId, Result>;
  dupont: { margin: Result; turnover: Result; multiplier: Result; product: Result };
};

export type RatioId =
  | "grossMargin"
  | "ebitdaMargin"
  | "ebitMargin"
  | "netMargin"
  | "roe"
  | "roeAverage"
  | "roa"
  | "roaAverage"
  | "roce"
  | "currentRatio"
  | "quickRatio"
  | "debtToEquity"
  | "interestCoverage"
  | "assetTurnover"
  | "inventoryTurnover"
  | "inventoryDays"
  | "receivableDays"
  | "eps"
  | "bookValue"
  | "pe"
  | "pb";

export function analyse(inputs: RatioInputs, unit: Unit): Analysis {
  const amount = (f: AmountField): Result => {
    const text = inputs[f];
    if (text.trim() === "") return BLANK_IS_ZERO.has(f) ? frac(0n, 1n) : missing(f);
    const v = parseAmount(text, SIGNED_FIELDS.has(f));
    return v === null ? missing(f) : frac(v, 100n);
  };
  const shares = parseShares(inputs.shares);
  const price = parseAmount(inputs.price, false);

  /** Combine exact values; the first missing input wins. */
  const lift = (parts: Result[], fn: (...v: { n: bigint; d: bigint }[]) => Result): Result => {
    for (const p of parts) if (!p.ok) return p;
    return fn(...(parts as { ok: true; n: bigint; d: bigint }[]));
  };
  const add = (a: Result, b: Result, sign: 1n | -1n = 1n) =>
    lift([a, b], (x, y) => frac(x!.n * y!.d + sign * y!.n * x!.d, x!.d * y!.d));
  const sub = (a: Result, b: Result) => add(a, b, -1n);
  /** a ÷ b × scale; a zero denominator reports the field to enter. */
  const div = (a: Result, b: Result, whenZero: Result, scale = 1n) =>
    lift([a, b], (x, y) => (y!.n === 0n ? whenZero : frac(x!.n * y!.d * scale, x!.d * y!.n)));
  const avg = (a: Result, b: Result) => lift([a, b], (x, y) => frac(x!.n * y!.d + y!.n * x!.d, 2n * x!.d * y!.d));
  const positive = (r: Result) => r.ok && r.n > 0n;

  const revenue = amount("revenue");
  const cogs = amount("cogs");
  const grossProfit = sub(revenue, cogs);
  const ebitda = sub(grossProfit, amount("opex"));
  const ebit = add(sub(ebitda, amount("depreciation")), amount("otherIncome"));
  const finance = amount("financeCosts");
  const pbt = sub(ebit, finance);
  const netProfit = sub(pbt, amount("tax"));
  const totalAssets = amount("totalAssets");
  const equity = amount("equity");
  const currentLiabilities = amount("currentLiabilities");
  const capitalEmployed = sub(totalAssets, currentLiabilities);
  const inventories = amount("inventories");

  const pct = (a: Result, b: Result, field: Field) => div(a, b, missing(field), 100n);
  const onEquity = (value: () => Result, eq: Result): Result => (!eq.ok ? eq : !positive(eq) ? NM_EQUITY : value());

  const hasStart = inputs.equityStart.trim() !== "" || inputs.assetsStart.trim() !== "";
  const avgEquity = inputs.equityStart.trim() !== "" ? avg(equity, amount("equityStart")) : missing("equityStart");
  const avgAssets = inputs.assetsStart.trim() !== "" ? avg(totalAssets, amount("assetsStart")) : missing("assetsStart");

  // Per share: amounts converted to rupees (hundredths of unit × factor ÷ 100).
  const factor = UNIT_FACTOR[unit];
  const toRupees = (r: Result): Result => (r.ok ? frac(r.n * factor, r.d) : r);
  const shareCount: Result =
    shares === null ? missing("shares") : shares === 0n ? missing("shares") : frac(shares, 1n);
  const eps = div(toRupees(netProfit), shareCount, missing("shares"));
  const bookValue = div(toRupees(equity), shareCount, missing("shares"));
  const priceValue: Result = price === null ? missing("price") : frac(price, 100n);

  const pe: Result = !eps.ok ? eps : !positive(eps) ? NO_EARNINGS : div(priceValue, eps, NO_EARNINGS);
  const pb: Result = !equity.ok ? equity : !positive(equity) ? NM_EQUITY : !bookValue.ok ? bookValue : div(priceValue, bookValue, NM_EQUITY);

  const interestCoverage: Result = !finance.ok ? finance : finance.n === 0n ? NO_FINANCE : div(ebit, finance, NO_FINANCE);

  const inventoryTurnover: Result = !inventories.ok || inventories.n === 0n ? (inventories.ok ? missing("inventories") : inventories) : div(cogs, inventories, missing("inventories"));
  const inventoryDays: Result = !inventoryTurnover.ok ? inventoryTurnover : div(frac(365n, 1n), inventoryTurnover, missing("cogs"));

  const margin = pct(netProfit, revenue, "revenue");
  const turnover = div(revenue, totalAssets, missing("totalAssets"));
  const multiplier = onEquity(() => div(totalAssets, equity, NM_EQUITY), equity);
  const product = lift([margin, turnover, multiplier], (m, t, e) => frac(m!.n * t!.n * e!.n, m!.d * t!.d * e!.d));

  return {
    unit,
    derived: { grossProfit, ebitda, ebit, pbt, netProfit, capitalEmployed },
    ratios: {
      grossMargin: pct(grossProfit, revenue, "revenue"),
      ebitdaMargin: pct(ebitda, revenue, "revenue"),
      ebitMargin: pct(ebit, revenue, "revenue"),
      netMargin: margin,
      roe: onEquity(() => pct(netProfit, equity, "equity"), equity),
      roeAverage: !hasStart
        ? missing("equityStart")
        : onEquity(() => (!avgEquity.ok ? avgEquity : !positive(avgEquity) ? NM_EQUITY : pct(netProfit, avgEquity, "equity")), equity),
      roa: pct(netProfit, totalAssets, "totalAssets"),
      roaAverage: !hasStart ? missing("assetsStart") : !avgAssets.ok ? avgAssets : pct(netProfit, avgAssets, "totalAssets"),
      roce: pct(ebit, capitalEmployed, "currentLiabilities"),
      currentRatio: div(amount("currentAssets"), currentLiabilities, missing("currentLiabilities")),
      quickRatio: div(sub(amount("currentAssets"), inventories), currentLiabilities, missing("currentLiabilities")),
      debtToEquity: onEquity(() => div(amount("borrowings"), equity, NM_EQUITY), equity),
      interestCoverage,
      assetTurnover: turnover,
      inventoryTurnover,
      inventoryDays,
      receivableDays: div(amount("receivables"), revenue, missing("revenue"), 365n),
      eps,
      bookValue,
      pe,
      pb,
    },
    dupont: {
      margin,
      turnover,
      multiplier,
      product: !equity.ok ? equity : !positive(equity) ? NM_EQUITY : product,
    },
  };
}

/** Round an exact fraction to `dp` decimals, half away from zero, as a scaled integer. */
function roundScaled(r: { n: bigint; d: bigint }, dp: number): bigint {
  const scale = 10n ** BigInt(dp);
  const num = r.n * scale;
  const negative = num < 0n;
  const abs = negative ? -num : num;
  const q = (2n * abs + r.d) / (2n * r.d);
  return negative ? -q : q;
}

/** Indian digit grouping: 12345678.9 → "1,23,45,678.9". */
function formatDecimal(scaled: bigint, dp: number): string {
  const negative = scaled < 0n;
  const digits = (negative ? -scaled : scaled).toString().padStart(dp + 1, "0");
  const whole = digits.slice(0, digits.length - dp) || "0";
  const fraction = dp ? `.${digits.slice(-dp)}` : "";
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${negative && scaled !== 0n ? "−" : ""}${grouped}${fraction}`;
}

export type Style = "percent" | "times" | "days" | "rupees" | "amount";

/** Display text: "15.00%", "1.67x", "91.3", "₹10.50", "400.00"; or the reason. */
export function display(r: Result, style: Style): string {
  if (!r.ok) return r.reason;
  switch (style) {
    case "percent":
      return `${formatDecimal(roundScaled(r, 2), 2)}%`;
    case "times":
      return `${formatDecimal(roundScaled(r, 2), 2)}x`;
    case "days":
      return formatDecimal(roundScaled(r, 1), 1);
    case "rupees":
      return `₹${formatDecimal(roundScaled(r, 2), 2)}`;
    case "amount":
      return formatDecimal(roundScaled(r, 2), 2);
  }
}

/** A plain number for spreadsheets (rounded as displayed), or null. */
export function toNumber(r: Result, dp: number): number | null {
  return r.ok ? Number(roundScaled(r, dp)) / 10 ** dp : null;
}
