"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { formatLimitRupees } from "@/lib/calculators/format";
import { flatLoan, formatRate } from "@/lib/calculators/flat-rate";

export function FlatRateCalculator() {
  const [amount, setAmount] = React.useState(100000);
  const [flat, setFlat] = React.useState(12);
  const [months, setMonths] = React.useState(12);
  const [fee, setFee] = React.useState(0);
  const [valid, setValid] = React.useState({ amount: true, flat: true, months: true, fee: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const ok = Object.values(valid).every(Boolean) && Number.isInteger(months) && fee < amount;
  const result = React.useMemo(
    () => (ok ? flatLoan({ principalPaise: Math.round(amount * 100), flatRatePct: flat, months, feePaise: Math.round(fee * 100) }) : null),
    [ok, amount, flat, months, fee],
  );

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="flat-amount" label="Loan amount" prefix="₹" value={amount} min={1000} max={100000000} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setAmount(v); setValidKey("amount", k); }} />
          <NumberField id="flat-rate" label="Flat interest rate (per year)" suffix="%" value={flat} min={0} max={40} step={0.05} formatLimit={(v) => `${v}%`} hint={'The rate as quoted by the lender or shop. Enter 0 for a "0% EMI" offer.'} onChange={(v, k) => { setFlat(v); setValidKey("flat", k); }} />
          <NumberField id="flat-months" label="Tenure (months)" value={months} min={1} max={360} formatLimit={(v) => String(v)} onChange={(v, k) => { setMonths(Math.round(v)); setValidKey("months", k && Number.isInteger(v)); }} />
          <NumberField id="flat-fee" label="Processing fee and other upfront charges" prefix="₹" value={fee} min={0} max={10000000} step={100} formatLimit={formatLimitRupees} hint="Optional. Include GST on the fee and any charge taken from the loan or paid at the start." onChange={(v, k) => { setFee(v); setValidKey("fee", k); }} />
          {fee >= amount ? <p className="text-sm text-warning">The fee must be less than the loan amount.</p> : null}
        </>
      }
      results={
        result ? (
          <div className="space-y-6">
            <dl className="space-y-5">
              <div>
                <dt className="text-sm text-muted">Equivalent reducing-balance rate (per year)</dt>
                <dd className="mt-1.5 text-[1.75rem] font-semibold tabular-nums tracking-tight text-foreground sm:text-[2rem]">
                  {formatRate(result.equivalentRatePct)}%
                </dd>
              </div>
              {result.withFeeRatePct !== null ? (
                <div>
                  <dt className="text-sm text-muted">Including the fee</dt>
                  <dd className="mt-1.5 text-xl font-medium tabular-nums text-foreground">{formatRate(result.withFeeRatePct)}%</dd>
                </div>
              ) : null}
              <ResultStat label="Monthly EMI" value={result.emiPaise / 100} />
              <ResultStat label="Total interest" value={result.interestPaise / 100} />
              <ResultStat label="Total you repay" value={result.totalPaise / 100} />
            </dl>
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              A {flat}% flat rate for {months} month{months === 1 ? "" : "s"} costs the same as a {formatRate(result.equivalentRatePct)}% reducing-balance rate
              {result.withFeeRatePct !== null ? `, or ${formatRate(result.withFeeRatePct)}% once the fee is counted` : ""}. Compare this figure with reducing-balance rates from other lenders.
            </p>
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
