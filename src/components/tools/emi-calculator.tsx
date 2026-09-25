"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { DonutChart } from "@/components/tools/charts";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { calculateEmi } from "@/lib/calculators/finance";
import { formatLimitRupees, formatRupees } from "@/lib/calculators/format";
import { cn } from "@/lib/utils";

type Unit = "years" | "months";

export function EmiCalculator() {
  const [principal, setPrincipal] = React.useState(1000000);
  const [rate, setRate] = React.useState(8.5);
  const [unit, setUnit] = React.useState<Unit>("years");
  const [tenure, setTenure] = React.useState(20);
  const [valid, setValid] = React.useState({ principal: true, rate: true, tenure: true });

  const months = unit === "years" ? tenure * 12 : tenure;
  const allValid = valid.principal && valid.rate && valid.tenure;
  const result = React.useMemo(
    () => (allValid ? calculateEmi({ principal, annualRatePct: rate, months }) : null),
    [allValid, principal, rate, months],
  );

  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    setUnit(next);
    setTenure(next === "months" ? Math.min(360, Math.max(12, tenure * 12)) : Math.min(30, Math.max(1, Math.round(tenure / 12))));
    setValid((v) => ({ ...v, tenure: true }));
  };

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField
            id="emi-principal"
            label="Loan amount"
            prefix="₹"
            value={principal}
            min={10000}
            max={100000000}
            scale="log"
            formatLimit={formatLimitRupees}
            onChange={(v, ok) => {
              setPrincipal(v);
              setValid((s) => ({ ...s, principal: ok }));
            }}
          />
          <NumberField
            id="emi-rate"
            label="Interest rate (per year)"
            suffix="%"
            value={rate}
            min={1}
            max={30}
            step={0.05}
            formatLimit={(v) => `${v}%`}
            onChange={(v, ok) => {
              setRate(v);
              setValid((s) => ({ ...s, rate: ok }));
            }}
          />
          <div>
            <fieldset className="mb-3 flex items-center justify-between gap-4">
              <legend className="sr-only">Tenure unit</legend>
              <span aria-hidden="true" className="text-[0.9375rem] font-medium">
                Tenure in
              </span>
              <div className="inline-flex rounded-full border border-white/10 p-0.5">
                {(["years", "months"] as const).map((u) => (
                  <label
                    key={u}
                    className={cn(
                      "cursor-pointer rounded-full px-3.5 py-1.5 text-sm capitalize focus-within:ring-2 focus-within:ring-primary",
                      unit === u ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
                    )}
                  >
                    <input
                      type="radio"
                      name="emi-unit"
                      value={u}
                      checked={unit === u}
                      onChange={() => switchUnit(u)}
                      className="sr-only"
                    />
                    {u}
                  </label>
                ))}
              </div>
            </fieldset>
            <NumberField
              key={unit}
              id="emi-tenure"
              label={unit === "years" ? "Tenure (years)" : "Tenure (months)"}
              value={tenure}
              min={unit === "years" ? 1 : 12}
              max={unit === "years" ? 30 : 360}
              formatLimit={(v) => `${v} ${unit}`}
              onChange={(v, ok) => {
                setTenure(Math.round(v));
                setValid((s) => ({ ...s, tenure: ok && Number.isInteger(v) }));
              }}
            />
          </div>
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            <dl className="space-y-5">
              <ResultStat label="Monthly EMI" value={result.emi} emphasis />
              <div className="grid gap-5 sm:grid-cols-2">
                <ResultStat label="Total interest" value={result.totalInterest} />
                <ResultStat label="Total amount payable" value={result.totalPayable} />
              </div>
            </dl>
            <DonutChart
              label={`Principal ${formatRupees(principal)} and interest ${formatRupees(result.totalInterest)}`}
              parts={[
                { label: "Principal", value: principal, color: "#22D3EE" },
                { label: "Interest", value: result.totalInterest, color: "#6366F1" },
              ]}
            />
          </div>
        ) : (
          <InvalidNotice />
        )
      }
      extra={
        result ? (
          <details className="glass group rounded-2xl">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-[0.9375rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-7 [&::-webkit-details-marker]:hidden">
              Year-by-year repayment schedule
              <span aria-hidden="true" className="text-muted-dim transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="overflow-x-auto px-5 pb-6 sm:px-7">
              <table className="w-full min-w-[30rem] text-left text-sm tabular-nums">
                <thead className="text-muted-dim">
                  <tr className="border-b border-hairline">
                    <th scope="col" className="py-2.5 pr-4 font-normal">Year</th>
                    <th scope="col" className="py-2.5 pr-4 text-right font-normal">Principal paid</th>
                    <th scope="col" className="py-2.5 pr-4 text-right font-normal">Interest paid</th>
                    <th scope="col" className="py-2.5 text-right font-normal">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row) => (
                    <tr key={row.year} className="border-b border-hairline/60 text-muted">
                      <th scope="row" className="py-2.5 pr-4 font-normal text-foreground">{row.year}</th>
                      <td className="py-2.5 pr-4 text-right">{formatRupees(row.principalPaid, false)}</td>
                      <td className="py-2.5 pr-4 text-right">{formatRupees(row.interestPaid, false)}</td>
                      <td className="py-2.5 text-right">{formatRupees(row.balance, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null
      }
    />
  );
}
