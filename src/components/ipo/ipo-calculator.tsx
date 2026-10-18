"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { ipoCopy } from "@/content/ipo";
import { formatLimitRupees, formatNumber } from "@/lib/calculators/format";
import { bidAmount, bidCategory, maxRetailLots, saleEstimate, type BidCategory } from "@/lib/ipo/calc";
import { RULES } from "@/lib/ipo/rules";

const CATEGORY: Record<BidCategory, string> = {
  retail: "Retail individual investor (up to ₹2 lakh)",
  "small-nii": "Small non-institutional, sNII (above ₹2 lakh up to ₹10 lakh)",
  "big-nii": "Big non-institutional, bNII (above ₹10 lakh)",
};

const rate = `${RULES.stcgRateBp / 100}%`;

/**
 * Lot amount, investor category and a sale illustration. With `preset` (an IPO page) the lot
 * size and price come from the RHP and only the lots and the sale price are entered. The sale
 * price starts at the issue price: AQVIK never suggests one.
 */
export function IpoCalculator({ preset }: { preset?: { lotSize: number; priceHigh: number; retailMaxLots: number } }) {
  const [lotSize, setLotSize] = React.useState(preset?.lotSize ?? 50);
  const [price, setPrice] = React.useState(preset ? preset.priceHigh / 100 : 300);
  const [lots, setLots] = React.useState(1);
  const [salePrice, setSalePrice] = React.useState(preset ? preset.priceHigh / 100 : 300);
  const [valid, setValid] = React.useState({ lotSize: true, price: true, lots: true, sale: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const ok = Object.values(valid).every(Boolean);
  const r = React.useMemo(() => {
    if (!ok) return null;
    const pricePaise = Math.round(price * 100);
    const amount = bidAmount({ lotSize }, lots, pricePaise);
    const shares = lots * lotSize;
    return {
      shares,
      amount,
      category: bidCategory(amount),
      retailMax: maxRetailLots(lotSize, pricePaise),
      sale: saleEstimate(shares, pricePaise, Math.round(salePrice * 100)),
    };
  }, [ok, lotSize, price, lots, salePrice]);

  return (
    <div className="space-y-4">
      <CalculatorShell
        inputs={
          <>
            {preset ? (
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                One lot is {formatNumber(preset.lotSize)} shares. Amounts are at the top of the price band, ₹{formatNumber(preset.priceHigh / 100)} per share, which is what bidding at cut-off blocks.
              </p>
            ) : (
              <>
                <NumberField id="ipo-lot" label="Shares in one lot" value={lotSize} min={1} max={100000} scale="log" formatLimit={(v) => formatNumber(v)} hint="From the RHP or the price band advertisement." onChange={(v, k) => { setLotSize(Math.round(v)); setValidKey("lotSize", k && Number.isInteger(v)); }} />
                <NumberField id="ipo-price" label="Upper price band (per share)" prefix="₹" value={price} min={1} max={100000} step={1} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setPrice(v); setValidKey("price", k); }} />
              </>
            )}
            <NumberField id="ipo-lots" label="Lots you bid for" value={lots} min={1} max={preset ? Math.max(preset.retailMaxLots * 10, 50) : 1000} formatLimit={(v) => formatNumber(v)} onChange={(v, k) => { setLots(Math.round(v)); setValidKey("lots", k && Number.isInteger(v)); }} />
          </>
        }
        results={
          r ? (
            <div className="space-y-6">
              <dl className="space-y-5">
                <ResultStat label="Amount blocked" value={r.amount / 100} emphasis />
                <div>
                  <dt className="text-sm text-muted">Shares</dt>
                  <dd className="mt-1.5 text-xl font-medium tabular-nums">{formatNumber(r.shares)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Your category</dt>
                  <dd className="mt-1.5 text-[0.9375rem] text-foreground">{CATEGORY[r.category.category]}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">How to pay</dt>
                  <dd className="mt-1.5 text-[0.9375rem] text-foreground">{r.category.upi ? "UPI or ASBA net banking" : "ASBA net banking (UPI bids are allowed only up to ₹5 lakh)"}</dd>
                </div>
              </dl>
              <p className="text-sm leading-relaxed text-muted">
                Retail investors can bid for up to {formatNumber(r.retailMax)} {r.retailMax === 1 ? "lot" : "lots"} at this price ({`₹${formatNumber((r.retailMax * lotSize * Math.round(price * 100)) / 100)}`}), within the ₹2 lakh limit.
              </p>
            </div>
          ) : (
            <InvalidNotice />
          )
        }
      />

      <CalculatorShell
        inputs={
          <>
            <div>
              <h3 className="text-[1.0625rem] font-medium">If you sell (an illustration)</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">Type any sale price to see what it would mean for {r ? formatNumber(r.shares) : "your"} shares sold within 12 months. This is not a forecast.</p>
            </div>
            <NumberField id="ipo-sale" label="Sale price you want to try (per share)" prefix="₹" value={salePrice} min={0.05} max={1000000} step={0.05} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setSalePrice(v); setValidKey("sale", k); }} />
          </>
        }
        results={
          r ? (
            <div className="space-y-5">
              <dl className="space-y-5">
                <ResultStat label="Paid for the shares" value={r.sale.invested / 100} />
                <ResultStat label="Sale value" value={r.sale.saleValue / 100} />
                <ResultStat label={r.sale.gain >= 0 ? "Gain before tax" : "Loss"} value={r.sale.gain / 100} />
                <ResultStat label={`Estimated tax you pay later (${rate} + 4% cess)`} value={r.sale.tax / 100} />
                <ResultStat label="Gain left after that tax" value={r.sale.netGain / 100} emphasis />
              </dl>
              <p className="text-sm leading-relaxed text-muted">The tax is not deducted at sale; you pay it when you file your return.</p>
              <p className="text-xs leading-relaxed text-muted-dim">{ipoCopy.taxNote(rate, `tax year ${RULES.taxYearLabel.replace("FY ", "")}`)}</p>
            </div>
          ) : (
            <InvalidNotice />
          )
        }
      />
      <p className="max-w-measure text-sm leading-relaxed text-muted-dim">{ipoCopy.calculatorNote}</p>
    </div>
  );
}
