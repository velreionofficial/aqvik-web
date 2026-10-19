"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { Choice } from "@/components/tools/choice";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { formatLimitRupees, formatRupees } from "@/lib/calculators/format";
import { flatLoan, formatRate, shortLoan } from "@/lib/calculators/flat-rate";

const MODES = [
  { value: "emi", label: "EMI loan (months)" },
  { value: "short", label: "Short loan app (days)" },
] as const;

export function FlatRateCalculator() {
  const [mode, setMode] = React.useState<"emi" | "short">("emi");
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 sm:p-7">
        <Choice name="flat-mode" legend="What kind of loan?" value={mode} options={MODES} onChange={setMode} />
      </div>
      {mode === "emi" ? <EmiLoanForm /> : <ShortLoanForm />}
    </div>
  );
}

function ShortLoanForm() {
  const [received, setReceived] = React.useState(3780);
  const [repay, setRepay] = React.useState(6000);
  const [days, setDays] = React.useState(7);
  const [valid, setValid] = React.useState({ received: true, repay: true, days: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));
  const ok = Object.values(valid).every(Boolean) && Number.isInteger(days) && repay >= received;
  const result = ok ? shortLoan({ receivedPaise: Math.round(received * 100), repayPaise: Math.round(repay * 100), days }) : null;

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="short-received" label="Money that actually reached your account" prefix="₹" value={received} min={100} max={10000000} formatLimit={formatLimitRupees} hint="After the app's processing fee, GST and any other deduction — not the 'loan amount' it shows." onChange={(v, k) => { setReceived(v); setValidKey("received", k); }} />
          <NumberField id="short-repay" label="Total you must repay" prefix="₹" value={repay} min={100} max={10000000} formatLimit={formatLimitRupees} hint="Everything the app asks for, including interest and fees, if you repay on time." onChange={(v, k) => { setRepay(v); setValidKey("repay", k); }} />
          <NumberField id="short-days" label="Days until repayment" value={days} min={1} max={365} formatLimit={(v) => String(v)} onChange={(v, k) => { setDays(Math.round(v)); setValidKey("days", k && Number.isInteger(v)); }} />
          {repay < received ? <p className="text-sm text-warning">The repayment cannot be less than the money you received.</p> : null}
        </>
      }
      results={
        result ? (
          <div className="space-y-6">
            <dl className="space-y-5">
              <div>
                <dt className="text-sm text-muted">Cost as a yearly rate (simple)</dt>
                <dd className="mt-1.5 text-[1.75rem] font-semibold tabular-nums tracking-tight text-foreground sm:text-[2rem]">{formatRate(result.yearlyPct)}%</dd>
              </div>
              <ResultStat label="What this loan costs you" value={result.costPaise / 100} />
              <div>
                <dt className="text-sm text-muted">Cost for {days} day{days === 1 ? "" : "s"}</dt>
                <dd className="mt-1.5 text-xl font-medium tabular-nums text-foreground">{formatRate(result.periodPct)}% of the money received</dd>
              </div>
            </dl>
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              You get {formatRupees(received, false)} and repay {formatRupees(repay, false)} after {days} day{days === 1 ? "" : "s"}. As a simple yearly rate that is about {formatRate(result.yearlyPct)}%. Bank and NBFC loans quote a yearly rate too, so compare like with like, and check that the app is linked to an RBI-regulated lender before borrowing.
            </p>
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}

function EmiLoanForm() {
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
