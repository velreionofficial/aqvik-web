"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { LineChart } from "@/components/tools/line-chart";
import { NumberField } from "@/components/tools/number-field";
import { lenderRateNote } from "@/content/tools";
import { formatLimitRupees, formatRupees, formatShort } from "@/lib/calculators/format";
import { payOffCard, type CardResult } from "@/lib/calculators/credit-card";

function duration(months: number) {
  const years = months / 12;
  return `${months} months${months >= 12 ? ` (about ${years.toFixed(1)} years)` : ""}`;
}

function Column({ title, result }: { title: string; result: CardResult }) {
  const rows: [string, number][] = [
    ["Interest", result.totalInterest],
    ["GST on interest", result.totalGst],
    ["Total paid", result.totalPaid],
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-background/40 p-4">
      <h3 className="text-[0.9375rem] font-medium">{title}</h3>
      <p className="mt-2 text-lg font-semibold tabular-nums">
        {result.cleared ? duration(result.months) : "Not cleared in 100 years"}
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([label, paise]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right tabular-nums">
              {formatRupees(paise / 100)}
              {formatShort(paise / 100) ? <span className="block text-xs text-primary-soft">{formatShort(paise / 100)}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CreditCardCalculator() {
  const [balance, setBalance] = React.useState(50000);
  const [rate, setRate] = React.useState(3.5);
  const [minPct, setMinPct] = React.useState(5);
  const [floor, setFloor] = React.useState(200);
  const [gst, setGst] = React.useState(true);
  const [fixed, setFixed] = React.useState(5000);
  const [valid, setValid] = React.useState({ balance: true, rate: true, minPct: true, floor: true, fixed: true });
  const setValidKey = (key: keyof typeof valid, ok: boolean) => setValid((s) => ({ ...s, [key]: ok }));

  const ok = Object.values(valid).every(Boolean);
  const result = React.useMemo(() => {
    if (!ok) return null;
    const input = {
      balancePaise: Math.round(balance * 100),
      monthlyRateBp: Math.round(rate * 100),
      minimumBp: Math.round(minPct * 100),
      floorPaise: Math.round(floor * 100),
      gstOnInterest: gst,
    };
    return { minimum: payOffCard(input), fixed: payOffCard({ ...input, fixedPaise: Math.round(fixed * 100) }) };
  }, [ok, balance, rate, minPct, floor, gst, fixed]);

  const yearly = (balances: number[], years: number) =>
    Array.from({ length: years }, (_, i) => (balances[(i + 1) * 12 - 1] ?? 0) / 100);
  const years = result ? Math.min(100, Math.ceil(Math.max(result.minimum.months, result.fixed.months) / 12)) : 0;

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField id="cc-balance" label="Outstanding balance" prefix="₹" value={balance} min={1000} max={10000000} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setBalance(v); setValidKey("balance", k); }} />
          <NumberField id="cc-rate" label="Interest rate (per month)" suffix="%" value={rate} min={0.5} max={5} step={0.05} formatLimit={(v) => `${v}%`} hint={lenderRateNote} onChange={(v, k) => { setRate(v); setValidKey("rate", k); }} />
          <NumberField id="cc-min" label="Minimum due (% of statement)" suffix="%" value={minPct} min={1} max={100} formatLimit={(v) => `${v}%`} onChange={(v, k) => { setMinPct(v); setValidKey("minPct", k); }} />
          <NumberField id="cc-floor" label="Minimum due floor" prefix="₹" value={floor} min={0} max={10000} step={50} formatLimit={formatLimitRupees} hint="The smallest minimum due your card asks for." onChange={(v, k) => { setFloor(v); setValidKey("floor", k); }} />
          <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
            <input type="checkbox" checked={gst} onChange={(e) => setGst(e.target.checked)} className="size-4 accent-[#22D3EE]" />
            Add 18% GST on interest
          </label>
          <NumberField id="cc-fixed" label="Compare: pay a fixed amount every month" prefix="₹" value={fixed} min={100} max={10000000} scale="log" formatLimit={formatLimitRupees} onChange={(v, k) => { setFixed(v); setValidKey("fixed", k); }} />
          <p className="text-xs leading-relaxed text-muted-dim">Assumes no new purchases, no late fees, and every payment made on time.</p>
        </>
      }
      results={
        result ? (
          <div className="space-y-7">
            {!result.minimum.cleared || !result.fixed.cleared ? (
              <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem]">
                At this rate, a payment that does not cover the monthly interest and GST never clears the balance. The calculation stops at 100 years.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Column title="Minimum due only" result={result.minimum} />
              <Column title={`Fixed ${formatRupees(fixed, false)} a month`} result={result.fixed} />
            </div>
            <LineChart
              caption="Balance at the end of each year"
              series={[
                { label: "Minimum due only", color: "#6366F1", values: yearly(result.minimum.balances, years), dashed: true },
                { label: "Fixed amount", color: "#22D3EE", values: yearly(result.fixed.balances, years) },
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
