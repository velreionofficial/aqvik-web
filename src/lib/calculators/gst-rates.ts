/** Helpers for the GST rate changes list. No imports, so Node tests run it. */

/** First rate in a label ("12% / 18%" → 12, "Nil (exempt)" → 0); NaN if none. */
export function rateValue(label: string): number {
  if (/^nil/i.test(label.trim())) return 0;
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(label);
  return m ? Number(m[1]) : Number.NaN;
}

export function rateDirection(before: string, after: string): "down" | "up" | "same" {
  const a = rateValue(before);
  const b = rateValue(after);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return "same";
  return b < a ? "down" : "up";
}
