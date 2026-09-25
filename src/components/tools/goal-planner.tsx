"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { LineChart } from "@/components/tools/line-chart";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { formatLimitRupees } from "@/lib/calculators/format";
import { goalPath, planGoal } from "@/lib/calculators/goal";
import { toBasisPoints } from "@/lib/calculators/inflation";

export function GoalPlanner() {
  const [cost, setCost] = React.useState(1000000);
  const [years, setYears] = React.useState(10);
  const [inflation, setInflation] = React.useState(6);
  const [ret, setRet] = React.useState(12);
  const [saved, setSaved] = React.useState(0);
  const [valid, setValid] = React.useState({ cost: true, years: true, inflation: true, ret: true, saved: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const inflationBp = toBasisPoints(inflation);
  const returnBp = toBasisPoints(ret);
  const ok = Object.values(valid).every(Boolean) && Number.isInteger(years) && inflationBp !== null && returnBp !== null;
  const result = React.useMemo(() => {
    if (!ok || inflationBp === null || returnBp === null) return null;
    const savedPaise = Math.round(saved * 100);
    const plan = planGoal({ costTodayPaise: Math.round(cost * 100), years, inflationBp, returnBp, savedPaise });
    return { ...plan, path: goalPath(plan.monthlySipPaise, savedPaise, returnBp, years) };
  }, [ok, cost, years, inflationBp, returnBp, saved]);

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="goal-cost" label="What the goal costs today" prefix="₹" value={cost} min={1000} max={1000000000} scale="log" formatLimit={formatLimitRupees} hint="For example, today's fees for a course, or the price of a home." onChange={(v, k) => { setCost(v); setValidKey("cost", k); }} />
          <NumberField id="goal-years" label="Years until you need it" value={years} min={1} max={40} formatLimit={(v) => String(v)} onChange={(v, k) => { setYears(Math.round(v)); setValidKey("years", k && Number.isInteger(v)); }} />
          <NumberField id="goal-inflation" label="Inflation for this goal (per year)" suffix="%" value={inflation} min={0} max={20} step={0.05} formatLimit={(v) => `${v}%`} hint="Your assumption. Education and healthcare often rise faster than general prices." onChange={(v, k) => { setInflation(v); setValidKey("inflation", k); }} />
          <NumberField id="goal-return" label="Expected return (per year)" suffix="%" value={ret} min={0} max={30} step={0.05} formatLimit={(v) => `${v}%`} hint="Your assumption, not a promise. Try a lower rate too." onChange={(v, k) => { setRet(v); setValidKey("ret", k); }} />
          <NumberField id="goal-saved" label="Already saved for this goal" prefix="₹" value={saved} min={0} max={100000000} step={1000} formatLimit={formatLimitRupees} hint="Optional. Assumed to grow at the same expected return." onChange={(v, k) => { setSaved(v); setValidKey("saved", k); }} />
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            <dl className="space-y-5">
              <ResultStat label={`Goal cost in ${years} year${years === 1 ? "" : "s"}`} value={result.goalPaise / 100} />
              {result.covered ? (
                <div>
                  <dt className="text-sm text-muted">Monthly SIP needed</dt>
                  <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-foreground">
                    None at these assumptions: what you have saved is expected to grow to {`₹${(result.savingsGrowPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}.
                  </dd>
                </div>
              ) : (
                <>
                  <ResultStat label="Monthly SIP needed" value={result.monthlySipPaise / 100} emphasis />
                  <ResultStat label="Or invest once, today" value={result.lumpSumTodayPaise / 100} />
                  <ResultStat label="Total you would put in by SIP" value={result.totalSipPaise / 100} />
                </>
              )}
            </dl>
            <LineChart
              caption="Projected value at the end of each year, against the goal"
              series={[
                { label: "Projected value", color: "#22D3EE", values: result.path },
                { label: "Goal cost then", color: "#6366F1", values: result.path.map(() => result.goalPaise / 100), dashed: true },
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
