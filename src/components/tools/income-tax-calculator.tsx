"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { Choice } from "@/components/tools/choice";
import { NumberField } from "@/components/tools/number-field";
import { formatLimitRupees, formatRupees } from "@/lib/calculators/format";
import { compareRegimes, LIMITS, type AgeBand, type RegimeResult, type TaxInput } from "@/lib/calculators/income-tax";
import { cn } from "@/lib/utils";

const AGES = [
  { value: "below60", label: "Below 60" },
  { value: "60to79", label: "60 to 79" },
  { value: "80plus", label: "80 or more" },
] as const;

type Field = Exclude<keyof TaxInput, "age">;

const rupee = (v: number) => formatRupees(v, false);

function Breakdown({ title, r, best }: { title: string; r: RegimeResult; best: boolean }) {
  const rows: [string, number][] = [
    ["Gross income", r.grossIncome],
    ["Standard deduction", -r.standardDeduction],
    ...(r.otherDeductions > 0 ? ([["Deductions", -r.otherDeductions]] as [string, number][]) : []),
    ["Taxable income", r.taxableIncome],
    ["Tax on slabs", r.slabTax],
    ...(r.rebate > 0 ? ([["Rebate", -r.rebate]] as [string, number][]) : []),
    ...(r.surcharge > 0 ? ([["Surcharge", r.surcharge]] as [string, number][]) : []),
    ["Cess (4%)", r.cess],
  ];
  return (
    <div className={cn("rounded-xl border p-4", best ? "border-primary/60 bg-primary/10" : "border-white/10")}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[0.9375rem] font-medium text-foreground">{title}</h3>
        {best ? <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">Lower tax</span> : null}
      </div>
      <p className="mt-2 text-[1.75rem] font-semibold tabular-nums tracking-tight text-foreground">{rupee(r.totalTax)}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map(([label, v]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums text-foreground">{v < 0 ? `− ${rupee(-v)}` : rupee(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function IncomeTaxCalculator() {
  const [age, setAge] = React.useState<AgeBand>("below60");
  const [values, setValues] = React.useState<Record<Field, number>>({
    salary: 1500000,
    otherIncome: 0,
    deductions80C: 150000,
    deductions80D: 25000,
    hraExempt: 0,
    homeLoanInterest: 0,
    npsExtra: 0,
    otherDeductions: 0,
  });
  const [valid, setValid] = React.useState<Record<Field, boolean>>({
    salary: true,
    otherIncome: true,
    deductions80C: true,
    deductions80D: true,
    hraExempt: true,
    homeLoanInterest: true,
    npsExtra: true,
    otherDeductions: true,
  });
  const set = (key: Field) => (v: number, ok: boolean) => {
    setValues((s) => ({ ...s, [key]: v }));
    setValid((s) => ({ ...s, [key]: ok }));
  };

  const ok = Object.values(valid).every(Boolean);
  const result = React.useMemo(() => (ok ? compareRegimes({ ...values, age }) : null), [ok, values, age]);

  const money = (id: Field, label: string, max: number, hint?: string) => (
    <NumberField
      id={`tax-${id}`}
      label={label}
      prefix="₹"
      value={values[id]}
      min={0}
      max={max}
      step={1000}
      formatLimit={formatLimitRupees}
      hint={hint}
      onChange={set(id)}
    />
  );

  return (
    <CalculatorShell
      inputs={
        <>
          <Choice name="tax-age" legend="Your age during the year" value={age} options={AGES} onChange={setAge} />
          {money("salary", "Salary or pension (gross, per year)", 100000000, "Before the standard deduction. Enter 0 if you have no salary or pension.")}
          {money("otherIncome", "Other income (per year)", 100000000, "Interest, rent after its own deductions, and other income taxed at slab rates. Leave out capital gains.")}
          <fieldset className="space-y-8 border-t border-white/10 pt-6">
            <legend className="text-[0.9375rem] font-medium text-foreground">Deductions — old regime only</legend>
            {money("deductions80C", "80C savings (PPF, EPF, ELSS, LIC, tuition fees…)", 10000000, `Capped at ${rupee(LIMITS.sec80C)}.`)}
            {money("deductions80D", "Health insurance premium (80D)", 1000000, "Up to ₹25,000 for yourself and family (₹50,000 if a senior citizen), plus the same again for parents. Enter the amount you can claim.")}
            {money("hraExempt", "HRA exemption", 10000000, "The exempt part of your house rent allowance, as worked out by your employer.")}
            {money("homeLoanInterest", "Home-loan interest, self-occupied house", 10000000, `Capped at ${rupee(LIMITS.homeLoanInterest)}.`)}
            {money("npsExtra", "Your extra NPS contribution (80CCD(1B))", 1000000, `Capped at ${rupee(LIMITS.npsExtra)}.`)}
            {money("otherDeductions", "Other deductions", 10000000, "Education-loan interest and similar. Enter only the amount you can claim.")}
          </fieldset>
        </>
      }
      results={
        result ? (
          <div className="space-y-5">
            <p className="text-[0.9375rem] leading-relaxed text-foreground">
              {result.better === "same"
                ? "Both regimes give the same tax for these numbers."
                : `The ${result.better} regime costs ${rupee(result.saving)} less for these numbers.`}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Breakdown title="New regime" r={result.newRegime} best={result.better === "new"} />
              <Breakdown title="Old regime" r={result.oldRegime} best={result.better === "old"} />
            </div>
            <p className="text-sm leading-relaxed text-muted">Tax year 2026-27, resident individual, income at slab rates only.</p>
          </div>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
