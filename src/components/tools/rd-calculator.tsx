"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { YearBars } from "@/components/tools/charts";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { lenderRateNote } from "@/content/tools";
import { formatLimitRupees } from "@/lib/calculators/format";
import { rdMaturityPaise } from "@/lib/calculators/deposits";

export function RdCalculator() {
  const [deposit, setDeposit] = React.useState(5000);
  const [rate, setRate] = React.useState(7);
  const [months, setMonths] = React.useState(60);
  const [valid, setValid] = React.useState({ deposit: true, rate: true, months: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const ok = Object.values(valid).every(Boolean);
  const result = React.useMemo(() => {
    if (!ok) return null;
    const d = Math.round(deposit * 100);
    const maturity = rdMaturityPaise(d, rate, months);
    const rows = Array.from({ length: Math.ceil(months / 12) }, (_, i) => {
      const m = Math.min((i + 1) * 12, months);
      const value = rdMaturityPaise(d, rate, m);
      return { year: i + 1, values: [(d * m) / 100, (value - d * m) / 100] };
    });
    return { maturity, deposited: d * months, rows };
  }, [ok, deposit, rate, months]);

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="rd-deposit" label="Monthly deposit" prefix="₹" value={deposit} min={100} max={1000000} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setDeposit(v); setValidKey("deposit", k); }} />
          <NumberField id="rd-rate" label="Interest rate (per year)" suffix="%" value={rate} min={1} max={15} step={0.05} formatLimit={(v) => `${v}%`} hint={lenderRateNote} onChange={(v, k) => { setRate(v); setValidKey("rate", k); }} />
          <NumberField id="rd-months" label="Tenure (months)" value={months} min={1} max={240} formatLimit={(v) => `${v} months`} hint={months % 3 === 0 ? "Compounding is quarterly." : "Compounding is quarterly. Banks usually offer RDs in multiples of 3 months."} onChange={(v, k) => { setMonths(Math.round(v)); setValidKey("months", k && Number.isInteger(v)); }} />
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            <dl className="space-y-5">
              <ResultStat label="Maturity amount" value={result.maturity / 100} emphasis />
              <div className="grid gap-5 sm:grid-cols-2">
                <ResultStat label="Total deposited" value={result.deposited / 100} />
                <ResultStat label="Interest earned" value={(result.maturity - result.deposited) / 100} />
              </div>
            </dl>
            <YearBars
              caption="Deposits and interest at the end of each year"
              series={[{ label: "Deposited", color: "#22D3EE" }, { label: "Interest", color: "#6366F1" }]}
              rows={result.rows}
            />
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
