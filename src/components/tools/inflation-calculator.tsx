"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { Choice } from "@/components/tools/choice";
import { LineChart } from "@/components/tools/line-chart";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { inflationModeHelp, inflationModes, type InflationMode } from "@/content/inflation";
import { formatLimitRupees } from "@/lib/calculators/format";
import { futureCostPaise, realReturnBp, toBasisPoints, todaysValuePaise, yearlyPath } from "@/lib/calculators/inflation";

const pct = (bp: number) => `${bp < 0 ? "−" : ""}${(Math.abs(bp) / 100).toFixed(2)}%`;

export function InflationCalculator() {
  const [mode, setMode] = React.useState<InflationMode>("future");
  const [amount, setAmount] = React.useState(100000);
  const [inflation, setInflation] = React.useState(6);
  const [years, setYears] = React.useState(10);
  const [ret, setRet] = React.useState(7);
  const [valid, setValid] = React.useState({ amount: true, inflation: true, years: true, ret: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const inflationBp = toBasisPoints(inflation);
  const returnBp = toBasisPoints(ret);
  const ok =
    valid.inflation &&
    inflationBp !== null &&
    (mode === "real" ? valid.ret && returnBp !== null : valid.amount && valid.years && Number.isInteger(years));

  const result = React.useMemo(() => {
    if (!ok || inflationBp === null) return null;
    if (mode === "real") return { kind: "real" as const, real: realReturnBp(returnBp ?? 0, inflationBp) };
    const p = Math.round(amount * 100);
    const value = mode === "future" ? futureCostPaise(p, inflationBp, years) : todaysValuePaise(p, inflationBp, years);
    const path = yearlyPath(p, inflationBp, years, mode).map((v) => v / 100);
    return { kind: mode, p, value, path };
  }, [ok, mode, amount, inflationBp, returnBp, years]);

  return (
    <CalculatorShell
      inputs={
        <>
          <div>
            <Choice name="inflation-mode" legend="What do you want to know?" value={mode} options={inflationModes} onChange={setMode} />
            <p className="mt-2 text-sm leading-relaxed text-muted">{inflationModeHelp[mode]}</p>
          </div>
          {mode === "real" ? (
            <NumberField id="infl-return" label="Your return (per year)" suffix="%" value={ret} min={0} max={30} step={0.05} formatLimit={(v) => `${v}%`} hint="For example, an FD rate or an expected return you want to test." onChange={(v, k) => { setRet(v); setValidKey("ret", k); }} />
          ) : (
            <NumberField
              id="infl-amount"
              label={mode === "future" ? "Cost today" : "Amount in future"}
              prefix="₹"
              value={amount}
              min={100}
              max={1000000000}
              scale="log"
              formatLimit={formatLimitRupees}
              onChange={(v, k) => { setAmount(v); setValidKey("amount", k); }}
            />
          )}
          <NumberField id="infl-rate" label="Inflation rate (per year)" suffix="%" value={inflation} min={0} max={20} step={0.05} formatLimit={(v) => `${v}%`} hint="Your assumption. Try a few rates to see the range." onChange={(v, k) => { setInflation(v); setValidKey("inflation", k); }} />
          {mode === "real" ? null : (
            <NumberField id="infl-years" label="Years" value={years} min={1} max={60} formatLimit={(v) => String(v)} onChange={(v, k) => { setYears(Math.round(v)); setValidKey("years", k && Number.isInteger(v)); }} />
          )}
        </>
      }
      results={
        !result ? (
          <InvalidNotice />
        ) : result.kind === "real" ? (
          <div className="space-y-5">
            <dl>
              <div>
                <dt className="text-sm text-muted">Real return (per year)</dt>
                <dd className="mt-1.5 text-[1.75rem] font-semibold tabular-nums tracking-tight text-foreground sm:text-[2rem]">{pct(result.real)}</dd>
              </div>
            </dl>
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              {result.real > 0
                ? `After ${inflation}% inflation, a ${ret}% return grows your buying power by ${pct(result.real)} a year.`
                : result.real < 0
                  ? `After ${inflation}% inflation, a ${ret}% return loses ${pct(-result.real)} of buying power a year.`
                  : `After ${inflation}% inflation, a ${ret}% return only keeps buying power the same.`}
            </p>
            <p className="text-sm leading-relaxed text-muted-dim">Returns shown are before any tax on them.</p>
          </div>
        ) : (
          <div className="space-y-7">
            <dl className="space-y-5">
              {result.kind === "future" ? (
                <>
                  <ResultStat label={`Cost after ${years} year${years === 1 ? "" : "s"}`} value={result.value / 100} emphasis />
                  <ResultStat label="Increase over today's cost" value={(result.value - result.p) / 100} />
                </>
              ) : (
                <>
                  <ResultStat label="Worth in today's money" value={result.value / 100} emphasis />
                  <ResultStat label="Buying power lost" value={(result.p - result.value) / 100} />
                </>
              )}
            </dl>
            <LineChart
              caption={result.kind === "future" ? "Cost at the end of each year" : "Worth in today's money, by year received"}
              series={[
                { label: result.kind === "future" ? "Cost" : "Worth today", color: "#22D3EE", values: result.path },
                { label: "Amount entered", color: "#6366F1", values: result.path.map(() => result.p / 100), dashed: true },
              ]}
            />
          </div>
        )
      }
    />
  );
}
