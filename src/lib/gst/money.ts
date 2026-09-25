/**
 * Exact decimal handling for invoices. Amounts are parsed from what the user
 * typed straight into integers (paise, thousandths of a unit, basis points),
 * never through floating point, and every rounding is half-up.
 */

/**
 * Parses a non-negative decimal string into an integer scaled by 10^decimals.
 * Returns null when the text is not a plain number or has too many decimals.
 */
export function parseScaled(text: string, decimals: number): number | null {
  const trimmed = text.replace(/,/g, "").trim();
  const match = /^(\d+)(?:\.(\d*))?$/.exec(trimmed);
  if (!match) return null;
  const whole = match[1] ?? "0";
  const fraction = match[2] ?? "";
  if (fraction.length > decimals) return null;
  const scaled = Number(whole + fraction.padEnd(decimals, "0"));
  return Number.isSafeInteger(scaled) ? scaled : null;
}

/** a × b ÷ d, rounded half-up, for non-negative integers (BigInt, no overflow). */
export function mulDivRound(a: number, b: number, d: number): number {
  const n = BigInt(a) * BigInt(b);
  const den = BigInt(d);
  return Number((2n * n + den) / (2n * den));
}

/** Formats paise as "11,800.00" with Indian grouping. */
export function formatPaise(paise: number, withSymbol = false): string {
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  const grouped = new Intl.NumberFormat("en-IN").format(rupees);
  return `${negative ? "−" : ""}${withSymbol ? "₹" : ""}${grouped}.${fraction}`;
}

/** Formats a value scaled by 10^decimals, trimming trailing zeros: 2500 (3dp) → "2.5". */
export function formatScaled(value: number, decimals: number): string {
  const factor = Math.pow(10, decimals);
  const whole = Math.floor(value / factor);
  const fraction = String(value % factor).padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}
