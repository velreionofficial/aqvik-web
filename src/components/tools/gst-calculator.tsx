"use client";

import * as React from "react";

import { CalculatorShell, InvalidNotice } from "@/components/tools/calculator-shell";
import { Choice } from "@/components/tools/choice";
import { NumberField } from "@/components/tools/number-field";
import { ResultStat } from "@/components/tools/result-stat";
import { gstCalcTool } from "@/content/tools";
import { formatLimitRupees } from "@/lib/calculators/format";
import { calculateGst } from "@/lib/calculators/gst-calc";
import { GST_RATE_OPTIONS } from "@/lib/gst/invoice";

export function GstCalculator() {
  const [amount, setAmount] = React.useState(1000);
  const [rateChoice, setRateChoice] = React.useState<string>("18");
  const [customRate, setCustomRate] = React.useState(12);
  const [mode, setMode] = React.useState<"exclusive" | "inclusive">("exclusive");
  const [supply, setSupply] = React.useState<"intra" | "inter">("intra");
  const [valid, setValid] = React.useState({ amount: true, custom: true });

  const rate = rateChoice === "other" ? customRate : Number(rateChoice);
  const ok = valid.amount && (rateChoice !== "other" || valid.custom);
  const result = React.useMemo(
    () =>
      ok
        ? calculateGst({
            amountPaise: Math.round(amount * 100),
            rateBp: Math.round(rate * 100),
            mode,
            intraState: supply === "intra",
          })
        : null,
    [ok, amount, rate, mode, supply],
  );

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField
            id="gst-amount"
            label="Amount"
            prefix="₹"
            value={amount}
            min={1}
            max={1000000000}
            scale="log"
            formatLimit={formatLimitRupees}
            onChange={(v, isValid) => {
              setAmount(v);
              setValid((s) => ({ ...s, amount: isValid }));
            }}
          />
          <div>
            <label htmlFor="gst-rate" className="mb-2 block text-[0.9375rem] font-medium text-foreground">
              GST rate
            </label>
            <select
              id="gst-rate"
              value={rateChoice}
              onChange={(e) => setRateChoice(e.target.value)}
              aria-describedby="gst-rate-note"
              className="w-full rounded-xl border border-white/10 bg-background/60 px-3.5 py-2.5 text-[0.9375rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {GST_RATE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
              <option value="other">Other</option>
            </select>
            <p id="gst-rate-note" className="mt-2 text-xs leading-relaxed text-muted-dim">
              {gstCalcTool.note}
            </p>
          </div>
          {rateChoice === "other" ? (
            <NumberField
              id="gst-custom-rate"
              label="Custom GST rate"
              suffix="%"
              value={customRate}
              min={0}
              max={100}
              step={0.01}
              formatLimit={(v) => `${v}%`}
              onChange={(v, isValid) => {
                setCustomRate(v);
                setValid((s) => ({ ...s, custom: isValid && Math.round(v * 100) === v * 100 }));
              }}
            />
          ) : null}
          <Choice
            name="gst-mode"
            legend="The amount"
            value={mode}
            onChange={setMode}
            options={[
              { value: "exclusive", label: "Excludes GST" },
              { value: "inclusive", label: "Includes GST" },
            ]}
          />
          <Choice
            name="gst-supply"
            legend="Supply"
            value={supply}
            onChange={setSupply}
            options={[
              { value: "intra", label: "Within state" },
              { value: "inter", label: "Between states" },
            ]}
          />
        </>
      }
      results={
        result ? (
          <dl className="space-y-5">
            <ResultStat label="Total amount" value={result.total / 100} emphasis />
            <div className="grid gap-5 sm:grid-cols-2">
              <ResultStat label="Taxable value" value={result.taxable / 100} />
              <ResultStat label="Total GST" value={result.gst / 100} />
              {supply === "intra" ? (
                <>
                  <ResultStat label="CGST" value={result.cgst / 100} />
                  <ResultStat label="SGST / UTGST" value={result.sgst / 100} />
                </>
              ) : (
                <ResultStat label="IGST" value={result.igst / 100} />
              )}
            </div>
          </dl>
        ) : (
          <InvalidNotice />
        )
      }
    />
  );
}
