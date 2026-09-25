"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { YearBars } from "@/components/tools/charts";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { lenderRateNote } from "@/content/tools";
import { formatLimitRupees } from "@/lib/calculators/format";
import { fdMaturityPaise, type Compounding } from "@/lib/calculators/deposits";

const COMPOUNDING: { value: Compounding; label: string }[] = [
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
  { value: 2, label: "Half-yearly" },
  { value: 1, label: "Yearly" },
];

export function FdCalculator() {
  const [deposit, setDeposit] = React.useState(100000);
  const [rate, setRate] = React.useState(7);
  const [years, setYears] = React.useState(5);
  const [months, setMonths] = React.useState(0);
  const [f, setF] = React.useState<Compounding>(4);
  const [valid, setValid] = React.useState({ deposit: true, rate: true, years: true, months: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const total = years * 12 + months;
  const ok = Object.values(valid).every(Boolean) && total >= 1 && total <= 240;
  const result = React.useMemo(() => {
    if (!ok) return null;
    const p = Math.round(deposit * 100);
    const maturity = fdMaturityPaise(p, rate, total, f);
    const rows = Array.from({ length: Math.ceil(total / 12) }, (_, i) => {
      const m = Math.min((i + 1) * 12, total);
      const value = fdMaturityPaise(p, rate, m, f);
      return { year: i + 1, values: [p / 100, (value - p) / 100] };
    });
    return { maturity, interest: maturity - p, rows };
  }, [ok, deposit, rate, total, f]);

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="fd-deposit" label="Deposit" prefix="₹" value={deposit} min={1000} max={100000000} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setDeposit(v); setValidKey("deposit", k); }} />
          <NumberField id="fd-rate" label="Interest rate (per year)" suffix="%" value={rate} min={1} max={15} step={0.05} formatLimit={(v) => `${v}%`} hint={lenderRateNote} onChange={(v, k) => { setRate(v); setValidKey("rate", k); }} />
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField id="fd-years" label="Years" value={years} min={0} max={20} formatLimit={(v) => String(v)} onChange={(v, k) => { setYears(Math.round(v)); setValidKey("years", k && Number.isInteger(v)); }} />
            <NumberField id="fd-months" label="Months" value={months} min={0} max={11} formatLimit={(v) => String(v)} onChange={(v, k) => { setMonths(Math.round(v)); setValidKey("months", k && Number.isInteger(v)); }} />
          </div>
          {total < 1 ? <p className="text-sm text-warning">Choose a tenure of at least 1 month.</p> : null}
          <div>
            <label htmlFor="fd-compounding" className="mb-2 block text-[0.9375rem] font-medium">Compounding</label>
            <select id="fd-compounding" value={f} onChange={(e) => setF(Number(e.target.value) as Compounding)} className="w-full rounded-xl border border-white/10 bg-background/60 px-3.5 py-2.5 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-primary">
              {COMPOUNDING.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            <dl className="space-y-5">
              <ResultStat label="Maturity amount" value={result.maturity / 100} emphasis />
              <ResultStat label="Interest earned" value={result.interest / 100} />
            </dl>
            <YearBars
              caption="Deposit and interest at the end of each year"
              series={[{ label: "Deposit", color: "#22D3EE" }, { label: "Interest", color: "#6366F1" }]}
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
