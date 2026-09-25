"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { YearBars } from "@/components/tools/charts";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { calculateSwp } from "@/lib/calculators/finance";
import { formatLimitRupees } from "@/lib/calculators/format";

export function SwpCalculator() {
  const [corpus, setCorpus] = React.useState(1000000);
  const [withdrawal, setWithdrawal] = React.useState(10000);
  const [rate, setRate] = React.useState(8);
  const [years, setYears] = React.useState(10);
  const [valid, setValid] = React.useState({ corpus: true, withdrawal: true, rate: true, years: true });

  const allValid = Object.values(valid).every(Boolean);
  const result = React.useMemo(
    () =>
      allValid
        ? calculateSwp({ corpus, monthlyWithdrawal: withdrawal, annualReturnPct: rate, years })
        : null,
    [allValid, corpus, withdrawal, rate, years],
  );

  const runsOut = result?.runsOutMonth ?? null;

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField
            id="swp-corpus"
            label="Starting corpus"
            prefix="₹"
            value={corpus}
            min={100000}
            max={500000000}
            scale="log"
            formatLimit={formatLimitRupees}
            onChange={(v, ok) => {
              setCorpus(v);
              setValid((s) => ({ ...s, corpus: ok }));
            }}
          />
          <NumberField
            id="swp-withdrawal"
            label="Monthly withdrawal"
            prefix="₹"
            value={withdrawal}
            min={500}
            max={5000000}
            scale="log"
            formatLimit={formatLimitRupees}
            onChange={(v, ok) => {
              setWithdrawal(v);
              setValid((s) => ({ ...s, withdrawal: ok }));
            }}
          />
          <NumberField
            id="swp-rate"
            label="Expected return (per year)"
            suffix="%"
            value={rate}
            min={1}
            max={30}
            step={0.1}
            formatLimit={(v) => `${v}%`}
            onChange={(v, ok) => {
              setRate(v);
              setValid((s) => ({ ...s, rate: ok }));
            }}
          />
          <NumberField
            id="swp-years"
            label="Time period (years)"
            value={years}
            min={1}
            max={40}
            formatLimit={(v) => `${v} years`}
            onChange={(v, ok) => {
              setYears(Math.round(v));
              setValid((s) => ({ ...s, years: ok && Number.isInteger(v) }));
            }}
          />
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            {runsOut !== null ? (
              <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem] text-foreground">
                Your corpus runs out in month {runsOut} (year {Math.ceil(runsOut / 12)}).
              </p>
            ) : null}
            <dl className="space-y-5">
              <ResultStat label="Final value" value={result.finalValue} emphasis />
              <ResultStat label="Total withdrawn" value={result.totalWithdrawn} />
            </dl>
            <YearBars
              caption="Balance at the end of each year"
              series={[{ label: "Balance at year end", color: "#22D3EE" }]}
              rows={result.yearly.map((row) => ({ year: row.year, values: [row.balance] }))}
            />
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
