import { test } from "node:test";
import assert from "node:assert/strict";

import { analyse, display, emptyInputs, EXAMPLE, fieldError, type RatioInputs } from "./ratios.ts";

const a = analyse(EXAMPLE, "crore");
const R = a.ratios;

test("Sample company: derived figures (₹ crore)", () => {
  assert.equal(display(a.derived.grossProfit, "amount"), "400.00");
  assert.equal(display(a.derived.ebitda, "amount"), "200.00");
  assert.equal(display(a.derived.ebit, "amount"), "160.00");
  assert.equal(display(a.derived.pbt, "amount"), "140.00");
  assert.equal(display(a.derived.netProfit, "amount"), "105.00");
  assert.equal(display(a.derived.capitalEmployed, "amount"), "900.00");
});

test("Sample company: profitability", () => {
  assert.equal(display(R.grossMargin, "percent"), "40.00%");
  assert.equal(display(R.ebitdaMargin, "percent"), "20.00%");
  assert.equal(display(R.ebitMargin, "percent"), "16.00%");
  assert.equal(display(R.netMargin, "percent"), "10.50%");
  assert.equal(display(R.roe, "percent"), "15.00%");
  assert.equal(display(R.roeAverage, "percent"), "15.67%");
  assert.equal(display(R.roa, "percent"), "8.75%");
  assert.equal(display(R.roaAverage, "percent"), "9.13%");
  assert.equal(display(R.roce, "percent"), "17.78%");
});

test("Sample company: liquidity and leverage", () => {
  assert.equal(display(R.currentRatio, "times"), "1.67x");
  assert.equal(display(R.quickRatio, "times"), "1.17x");
  assert.equal(display(R.debtToEquity, "times"), "0.36x");
  assert.equal(display(R.interestCoverage, "times"), "8.00x");
});

test("Sample company: efficiency", () => {
  assert.equal(display(R.assetTurnover, "times"), "0.83x");
  assert.equal(display(R.inventoryTurnover, "times"), "4.00x");
  assert.equal(display(R.inventoryDays, "days"), "91.3");
  assert.equal(display(R.receivableDays, "days"), "43.8");
});

test("Sample company: per share and valuation", () => {
  assert.equal(display(R.eps, "rupees"), "₹10.50");
  assert.equal(display(R.bookValue, "rupees"), "₹70.00");
  assert.equal(display(R.pe, "times"), "14.29x");
  assert.equal(display(R.pb, "times"), "2.14x");
});

test("Sample company: DuPont product equals closing ROE", () => {
  const d = a.dupont;
  assert.deepEqual(
    [display(d.margin, "percent"), display(d.turnover, "times"), display(d.multiplier, "times"), display(d.product, "percent")],
    ["10.50%", "0.83x", "1.71x", "15.00%"],
  );
  assert.equal(display(d.product, "percent"), display(R.roe, "percent"));
});

test("Units: the same figures in ₹ lakh give the same ratios but EPS in rupees changes", () => {
  const lakh = analyse(EXAMPLE, "lakh");
  assert.equal(display(lakh.ratios.roe, "percent"), "15.00%");
  assert.equal(display(lakh.ratios.eps, "rupees"), "₹0.11"); // 105 lakh ÷ 10 crore shares = ₹0.105
  const rupee = analyse({ ...EXAMPLE, shares: "10" }, "rupee");
  assert.equal(display(rupee.ratios.eps, "rupees"), "₹10.50");
});

test("Edge: no borrowings and no finance costs", () => {
  const r = analyse({ ...EXAMPLE, borrowings: "0", financeCosts: "0" }, "crore").ratios;
  assert.equal(display(r.debtToEquity, "times"), "0.00x");
  assert.equal(display(r.interestCoverage, "times"), "Not applicable — no finance costs");
});

test("Edge: a loss with negative equity", () => {
  // Revenue 1,000 − COGS 700 − opex 300 − dep 20 + other 0 − finance 20 − tax 0 = −40.
  const inputs: RatioInputs = {
    ...EXAMPLE,
    cogs: "700",
    opex: "300",
    depreciation: "20",
    otherIncome: "0",
    financeCosts: "20",
    tax: "0",
    equity: "-100",
  };
  const x = analyse(inputs, "crore");
  assert.equal(display(x.derived.netProfit, "amount"), "−40.00");
  assert.equal(display(x.ratios.netMargin, "percent"), "−4.00%");
  assert.equal(display(x.ratios.roe, "percent"), "Not meaningful — equity is zero or negative");
  assert.equal(display(x.ratios.pe, "times"), "Not meaningful — no positive earnings");
  assert.equal(display(x.ratios.debtToEquity, "times"), "Not meaningful — equity is zero or negative");
  assert.equal(display(x.ratios.pb, "times"), "Not meaningful — equity is zero or negative");
  assert.equal(display(x.dupont.product, "percent"), "Not meaningful — equity is zero or negative");
});

test("Blank or zero denominators never give NaN or Infinity", () => {
  const e = analyse(emptyInputs(), "crore");
  for (const r of [...Object.values(e.ratios), ...Object.values(e.derived), ...Object.values(e.dupont)]) {
    const text = display(r, "percent");
    assert.doesNotMatch(text, /NaN|Infinity/);
  }
  assert.equal(display(e.ratios.grossMargin, "percent"), "Not available — enter Revenue from operations");
  const z = analyse({ ...EXAMPLE, revenue: "0", currentLiabilities: "0", inventories: "0", shares: "" }, "crore").ratios;
  assert.equal(display(z.netMargin, "percent"), "Not available — enter Revenue from operations");
  assert.equal(display(z.currentRatio, "times"), "Not available — enter Current liabilities");
  assert.equal(display(z.inventoryTurnover, "times"), "Not available — enter Inventories");
  assert.equal(display(z.inventoryDays, "days"), "Not available — enter Inventories");
  assert.equal(display(z.eps, "rupees"), "Not available — enter Number of shares");
  const noStart = analyse({ ...EXAMPLE, equityStart: "", assetsStart: "" }, "crore").ratios;
  assert.equal(noStart.roeAverage.ok, false);
});

test("Input checks", () => {
  assert.equal(fieldError("revenue", "-5"), "Enter a number of 0 or more, with up to 2 decimals.");
  assert.equal(fieldError("equity", "-100"), null);
  assert.equal(fieldError("revenue", "1,000.5"), null);
  assert.equal(fieldError("revenue", "10.555"), "Enter a number of 0 or more, with up to 2 decimals.");
  assert.equal(fieldError("shares", "10.5"), "Enter a whole number of shares, digits only.");
});
