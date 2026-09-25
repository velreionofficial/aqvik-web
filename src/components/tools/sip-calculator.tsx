"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { YearBars } from "@/components/tools/charts";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { calculateSip } from "@/lib/calculators/finance";
import { formatLimitRupees } from "@/lib/calculators/format";

export function SipCalculator() {
  const [monthly, setMonthly] = React.useState(5000);
  const [rate, setRate] = React.useState(12);
  const [years, setYears] = React.useState(10);
  const [stepUp, setStepUp] = React.useState(0);
  const [valid, setValid] = React.useState({ monthly: true, rate: true, years: true, stepUp: true });

  const allValid = Object.values(valid).every(Boolean);
  const result = React.useMemo(
    () =>
      allValid
        ? calculateSip({ monthlyInvestment: monthly, annualReturnPct: rate, years, stepUpPct: stepUp })
        : null,
    [allValid, monthly, rate, years, stepUp],
  );

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField
            id="sip-monthly"
            label="Monthly investment"
            prefix="₹"
            value={monthly}
            min={500}
            max={1000000}
            scale="log"
            formatLimit={formatLimitRupees}
            onChange={(v, ok) => {
              setMonthly(v);
              setValid((s) => ({ ...s, monthly: ok }));
            }}
          />
          <NumberField
            id="sip-rate"
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
            id="sip-years"
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
          <NumberField
            id="sip-stepup"
            label="Yearly step-up (optional)"
            suffix="%"
            value={stepUp}
            min={0}
            max={50}
            formatLimit={(v) => `${v}%`}
            hint="Raises the monthly amount by this percentage every 12 months. Leave at 0 for a flat SIP."
            onChange={(v, ok) => {
              setStepUp(v);
              setValid((s) => ({ ...s, stepUp: ok }));
            }}
          />
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            <dl className="space-y-5">
              <ResultStat label="Estimated total value" value={result.value} emphasis />
              <div className="grid gap-5 sm:grid-cols-2">
                <ResultStat label="Total invested" value={result.invested} />
                <ResultStat label="Estimated returns" value={result.returns} />
              </div>
            </dl>
            <YearBars
              caption="Invested amount and estimated returns at the end of each year"
              series={[
                { label: "Invested", color: "#22D3EE" },
                { label: "Estimated returns", color: "#6366F1" },
              ]}
              rows={result.yearly.map((row) => ({
                year: row.year,
                values: [row.invested, Math.max(0, row.value - row.invested)],
              }))}
            />
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
