/**
 * One printable shape shared by the Bill of Supply, Delivery Challan and
 * Credit/Debit Note, so the on-screen preview and the PDF always agree.
 * Strings only. No imports, so the tests can run it directly with Node.
 */

export type DocColumn = { label: string; align?: "left" | "right" };

export type DocView = {
  title: string;
  /** Printed above everything else, e.g. the composition declaration (Rule 5(1)(f)). */
  topNote?: string;
  copyLabel?: string;
  issuer: { tradeName?: string; heading: string; lines: string[] };
  details: [string, string][];
  parties: { heading: string; lines: string[] }[];
  columns: DocColumn[];
  rows: string[][];
  totals: [string, string][];
  grand: [string, string];
  words?: string;
  extras: { label: string; text: string }[];
  signatoryFor: string;
};

/** "Gujarat (24)"-style lines without empty entries. */
export function lines(...values: (string | false | null | undefined)[]): string[] {
  return values.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim());
}
