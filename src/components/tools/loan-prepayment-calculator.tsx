"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { Choice } from "@/components/tools/choice";
import { LineChart } from "@/components/tools/line-chart";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { lenderRateNote } from "@/content/tools";
import { formatLimitRupees, formatRupees } from "@/lib/calculators/format";
import { loanSchedule, type Prepayment } from "@/lib/calculators/prepayment";

type Kind = "once" | "monthly" | "yearly";

/** "2026-10" + 156 months → "September 2039" (the month of the last EMI). */
function endMonth(start: string, months: number): string | null {
  const [y, m] = start.split("-").map(Number);
  if (!y || !m) return null;
  const date = new Date(Date.UTC(y, m - 1 + months - 1, 1));
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function LoanPrepaymentCalculator() {
  const [principal, setPrincipal] = React.useState(1000000);
  const [rate, setRate] = React.useState(8.5);
  const [unit, setUnit] = React.useState<"years" | "months">("years");
  const [tenure, setTenure] = React.useState(20);
  const [kind, setKind] = React.useState<Kind>("once");
  const [extra, setExtra] = React.useState(200000);
  const [afterEmi, setAfterEmi] = React.useState(12);
  const [after, setAfter] = React.useState<"reduce-tenure" | "reduce-emi">("reduce-tenure");
  const [start, setStart] = React.useState("");
  const [valid, setValid] = React.useState({ principal: true, rate: true, tenure: true, extra: true, afterEmi: true });

  const months = unit === "years" ? tenure * 12 : tenure;
  const ok = Object.values(valid).every(Boolean) && (kind !== "once" || afterEmi < months);
  const mode = kind === "once" ? after : "reduce-tenure";

  const result = React.useMemo(() => {
    if (!ok) return null;
    const base = { principalPaise: Math.round(principal * 100), rateBp: Math.round(rate * 100), months };
    const prepayment: Prepayment =
      kind === "once"
        ? { type: "once", amountPaise: Math.round(extra * 100), afterEmi }
        : { type: kind, amountPaise: Math.round(extra * 100) };
    return {
      before: loanSchedule({ ...base, prepayment: { type: "none" }, after: "reduce-tenure" }),
      after: loanSchedule({ ...base, prepayment, after: mode }),
    };
  }, [ok, principal, rate, months, kind, extra, afterEmi, mode]);

  const setValidKey = (key: keyof typeof valid, isValid: boolean) => setValid((s) => ({ ...s, [key]: isValid }));
  const years = result ? Math.ceil(result.before.months / 12) : 0;
  const balances = (rows: { balance: number }[]) =>
    Array.from({ length: years }, (_, i) => (rows[i]?.balance ?? 0) / 100);

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="pp-principal" label="Loan amount" prefix="₹" value={principal} min={10000} max={100000000} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setPrincipal(v); setValidKey("principal", k); }} />
          <NumberField id="pp-rate" label="Interest rate (per year)" suffix="%" value={rate} min={1} max={30} step={0.05} formatLimit={(v) => `${v}%`} hint={lenderRateNote} onChange={(v, k) => { setRate(v); setValidKey("rate", k); }} />
          <div className="space-y-4">
            <Choice name="pp-unit" legend="Tenure in" value={unit} onChange={(u) => { setUnit(u); setTenure(u === "months" ? Math.min(360, tenure * 12) : Math.max(1, Math.round(tenure / 12))); setValidKey("tenure", true); }} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
            <NumberField key={unit} id="pp-tenure" label={unit === "years" ? "Tenure (years)" : "Tenure (months)"} value={tenure} min={unit === "years" ? 1 : 12} max={unit === "years" ? 30 : 360} formatLimit={(v) => `${v} ${unit}`} onChange={(v, k) => { setTenure(Math.round(v)); setValidKey("tenure", k && Number.isInteger(v)); }} />
          </div>
          <Choice name="pp-kind" legend="Prepayment" value={kind} onChange={setKind} options={[{ value: "once", label: "One-time" }, { value: "monthly", label: "Every month" }, { value: "yearly", label: "Every year" }]} />
          <NumberField id="pp-extra" label={kind === "once" ? "Prepayment amount" : kind === "monthly" ? "Extra every month" : "Extra every year"} prefix="₹" value={extra} min={100} max={100000000} scale="log" formatLimit={formatLimitRupees} hint={kind === "monthly" ? "Paid with every EMI from the first one." : kind === "yearly" ? "Paid after every 12th EMI." : undefined} onChange={(v, k) => { setExtra(v); setValidKey("extra", k); }} />
          {kind === "once" ? (
            <>
              <NumberField id="pp-after" label="After EMI number" value={afterEmi} min={1} max={Math.max(1, months - 1)} formatLimit={(v) => String(v)} onChange={(v, k) => { setAfterEmi(Math.round(v)); setValidKey("afterEmi", k && Number.isInteger(v)); }} />
              <Choice name="pp-after-mode" legend="After the prepayment" value={after} onChange={setAfter} options={[{ value: "reduce-tenure", label: "Reduce tenure (keep EMI)" }, { value: "reduce-emi", label: "Reduce EMI (keep tenure)" }]} />
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted-dim">Regular prepayments reduce the tenure; the EMI stays the same.</p>
          )}
          <div>
            <label htmlFor="pp-start" className="mb-2 block text-[0.9375rem] font-medium text-foreground">
              Loan start month <span className="ml-1 font-normal text-muted-dim">Optional</span>
            </label>
            <input id="pp-start" type="month" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-xl border border-white/10 bg-background/60 px-3.5 py-2.5 text-[0.9375rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="mt-2 text-xs text-muted-dim">The month of your first EMI. Used only to show the end date.</p>
          </div>
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            <dl className="space-y-5">
              <ResultStat label="Interest saved" value={(result.before.totalInterest - result.after.totalInterest) / 100} emphasis />
              <div className="grid gap-5 sm:grid-cols-2">
                <ResultStat label="Total interest without prepayment" value={result.before.totalInterest / 100} />
                <ResultStat label="Total interest with prepayment" value={result.after.totalInterest / 100} />
              </div>
              {mode === "reduce-emi" && result.after.newEmi !== null ? (
                <div>
                  <dt className="text-sm text-muted">EMI</dt>
                  <dd className="mt-1.5 text-xl font-medium tabular-nums">
                    {formatRupees(result.before.emi / 100)} → {formatRupees(result.after.newEmi / 100)}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-sm text-muted">Tenure</dt>
                  <dd className="mt-1.5 text-xl font-medium tabular-nums">
                    {result.before.months} → {result.after.months} months
                    <span className="ml-2 text-sm text-primary-soft">{result.before.months - result.after.months} months saved</span>
                  </dd>
                </div>
              )}
              {start && endMonth(start, result.after.months) ? (
                <div>
                  <dt className="text-sm text-muted">Last EMI</dt>
                  <dd className="mt-1.5 text-xl font-medium">
                    {endMonth(start, result.after.months)}
                    <span className="ml-2 text-sm text-muted-dim">instead of {endMonth(start, result.before.months)}</span>
                  </dd>
                </div>
              ) : null}
            </dl>
            <LineChart
              caption="Outstanding balance at the end of each year, without and with prepayment"
              series={[
                { label: "Without prepayment", color: "#6366F1", values: balances(result.before.yearly), dashed: true },
                { label: "With prepayment", color: "#22D3EE", values: balances(result.after.yearly) },
              ]}
            />
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
