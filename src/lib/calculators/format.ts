/**
 * Indian number formatting for the calculators. Pure, no imports.
 */

const rupees0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const rupees2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** Rounds half away from zero to the given number of decimals. */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.sign(value) * Math.round(Math.abs(value) * factor + Number.EPSILON) / factor;
}

/** "₹11,61,695.38" (paise) or "₹11,61,695" (whole rupees). Never NaN on screen. */
export function formatRupees(value: number, withPaise = true): string {
  if (!Number.isFinite(value)) return "—";
  return withPaise ? rupees2.format(roundTo(value, 2)) : rupees0.format(roundTo(value, 0));
}

/** "12,00,000" without the symbol, for inputs and tables. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  return plain.format(value);
}

/**
 * Short form for large amounts: "₹11.6 lakh", "₹1.2 crore". Returns null below
 * one lakh, where the full figure is already short.
 */
export function formatShort(value: number): string | null {
  if (!Number.isFinite(value) || Math.abs(value) < 100000) return null;
  const crore = value / 10000000;
  if (Math.abs(roundTo(crore, 1)) >= 1) return `₹${trim(roundTo(crore, 1))} crore`;
  const lakh = value / 100000;
  if (Math.abs(roundTo(lakh, 1)) >= 100) return "₹1 crore";
  return `₹${trim(roundTo(lakh, 1))} lakh`;
}

function trim(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

/** Readable limits for error messages: "₹10,000", "₹1 lakh", "₹10 crore". */
export function formatLimitRupees(value: number): string {
  if (value >= 10000000) return `₹${trim(value / 10000000)} crore`;
  if (value >= 100000) return `₹${trim(value / 100000)} lakh`;
  return formatRupees(value, false);
}
