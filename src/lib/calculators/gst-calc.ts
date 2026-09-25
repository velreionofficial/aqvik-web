import { mulDivRound } from "../gst/money.ts";

/**
 * GST calculator. Integer paise and basis points (18% = 1800), half-up
 * rounding. When GST is included, CGST is rounded and SGST takes the rest, so
 * the parts always add up to the total exactly.
 */

export type GstCalcInput = {
  amountPaise: number;
  rateBp: number;
  mode: "exclusive" | "inclusive";
  intraState: boolean;
};

export type GstCalcResult = {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst: number;
  total: number;
};

export function calculateGst({ amountPaise, rateBp, mode, intraState }: GstCalcInput): GstCalcResult {
  if (mode === "exclusive") {
    const taxable = amountPaise;
    if (intraState) {
      const cgst = mulDivRound(taxable, rateBp, 20000);
      return { taxable, cgst, sgst: cgst, igst: 0, gst: 2 * cgst, total: taxable + 2 * cgst };
    }
    const igst = mulDivRound(taxable, rateBp, 10000);
    return { taxable, cgst: 0, sgst: 0, igst, gst: igst, total: taxable + igst };
  }

  const taxable = mulDivRound(amountPaise, 10000, 10000 + rateBp);
  const gst = amountPaise - taxable;
  if (intraState) {
    const cgst = mulDivRound(gst, 1, 2);
    return { taxable, cgst, sgst: gst - cgst, igst: 0, gst, total: amountPaise };
  }
  return { taxable, cgst: 0, sgst: 0, igst: gst, gst, total: amountPaise };
}
