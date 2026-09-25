"use client";

import * as React from "react";
import { Download, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Choice } from "@/components/tools/choice";
import { FormSection, TextField } from "@/components/tools/gst/fields";
import { byajCopy, byajTypeOptions, compoundOptions, countingOptions, rateKinds } from "@/content/byaj";
import { annualPercentText, calculateByaj, validateByaj, type ByajInput, type Compounding, type Counting, type RateKind } from "@/lib/calculators/byaj";
import { formatPaise, parseScaled } from "@/lib/gst/money";

type Repayment = { id: string; date: string; amount: string };
const rupees = (paise: number) => `₹${formatPaise(paise)}`;
const displayDate = (iso: string) => iso.split("-").reverse().join("-");

export function ByajCalculator({
  initial,
}: {
  /** Pre-filled dates and repayments (examples and screenshots). */
  initial?: { start: string; end: string; repayments?: Repayment[] };
} = {}) {
  const [amount, setAmount] = React.useState("50000");
  const [rateKind, setRateKind] = React.useState<RateKind>("sainkda");
  const [rate, setRate] = React.useState("2");
  const [start, setStart] = React.useState(initial?.start ?? "");
  const [end, setEnd] = React.useState(initial?.end ?? "");
  const [counting, setCounting] = React.useState<Counting>("months");
  const [byajType, setByajType] = React.useState<"simple" | "compound">("simple");
  const [every, setEvery] = React.useState<Exclude<Compounding, "simple">>("yearly");
  const [repayments, setRepayments] = React.useState<Repayment[]>(initial?.repayments ?? []);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA");
    const [y, m, d] = today.split("-");
    setEnd((e) => e || today);
    setStart((s) => s || `${Number(y) - 1}-${m}-${d}`);
  }, []);

  const principal = parseScaled(amount, 2);
  const rateH = parseScaled(rate, 2);
  const input = React.useMemo<ByajInput | null>(
    () =>
      principal === null || rateH === null
        ? null
        : {
            principalPaise: principal,
            rateKind,
            rateHundredths: rateH,
            start,
            end,
            counting,
            compounding: byajType === "simple" ? "simple" : every,
            payments: repayments.map((r) => ({ date: r.date, amountPaise: parseScaled(r.amount, 2) ?? 0 })),
          },
    [principal, rateH, rateKind, start, end, counting, byajType, every, repayments],
  );
  const errors = React.useMemo(
    () => (input ? validateByaj(input) : ["Enter the amount and the rate as numbers, up to 2 decimals."]),
    [input],
  );
  const result = React.useMemo(() => (input && errors.length === 0 ? calculateByaj(input) : null), [input, errors]);

  const rateHelp = rateKinds.find((k) => k.value === rateKind)?.help ?? "";
  const countingHelp = countingOptions.find((c) => c.value === counting)?.help ?? "";

  const ledgerHead = ["Date", "Period", "Interest", "Repaid", "To interest", "To principal", "Principal", "Interest due"];
  const ledgerRows = (result?.rows ?? []).map((row) => [
    `${displayDate(row.date)}${row.kind === "added" ? " (interest added)" : row.kind === "end" ? " (end)" : ""}`,
    row.period,
    rupees(row.interestPaise),
    row.paidPaise ? rupees(row.paidPaise) : "—",
    row.paidPaise ? rupees(row.toInterestPaise) : "—",
    row.paidPaise ? rupees(row.toPrincipalPaise) : "—",
    rupees(row.principalPaise),
    rupees(row.interestDuePaise),
  ]);

  const download = async () => {
    if (!result || !input || result.overflow) return;
    setBusy(true);
    try {
      const { createByajPdf } = await import("@/lib/calculators/byaj-pdf");
      const blob = await createByajPdf({
        summary: [
          ["Amount lent", rupees(input.principalPaise)],
          ["Rate", `${rate} ${rateKinds.find((k) => k.value === rateKind)?.label} = ${annualPercentText(rateKind, input.rateHundredths)}% a year`],
          ["From – to", `${displayDate(start)} to ${displayDate(end)} (${result.duration})`],
          ["Counting", countingOptions.find((c) => c.value === counting)?.label ?? ""],
          ["Interest", byajType === "simple" ? "Simple" : `Byaj par byaj, ${compoundOptions.find((c) => c.value === every)?.label.toLowerCase()}`],
          ["Total interest", rupees(result.totalInterestPaise)],
          ["Total repaid", rupees(result.totalPaidPaise)],
          ["Still due", rupees(result.totalDuePaise)],
        ],
        ledgerHead,
        ledger: ledgerRows,
        notes: [byajCopy.repaymentsHint, byajCopy.legalNote, byajCopy.disclaimer],
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `byaj-hisaab_${start}_to_${end}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Udhaar details">
        <FormSection title="Udhaar">
          <TextField id="byaj-amount" label="Amount lent or borrowed (₹)" inputMode="decimal" value={amount} onChange={setAmount} />
          <Choice name="rate-kind" legend="How was the rate agreed?" value={rateKind} options={rateKinds} onChange={setRateKind} />
          <TextField
            id="byaj-rate"
            label={rateKind === "annual" ? "Rate (% per year)" : rateKind === "sainkda" ? "Rupaye sainkda (per month)" : "₹ per ₹1,000 per month"}
            inputMode="decimal"
            value={rate}
            onChange={setRate}
            hint={`${rateHelp}${rateH !== null ? ` This is ${annualPercentText(rateKind, rateH)}% a year.` : ""}`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="byaj-start" label="Date given" type="date" value={start} onChange={setStart} />
            <TextField id="byaj-end" label="Hisaab up to" type="date" value={end} onChange={setEnd} />
          </div>
        </FormSection>

        <FormSection title="How to count">
          <div>
            <Choice name="counting" legend="Time" value={counting} options={countingOptions} onChange={setCounting} />
            <p className="mt-2 text-xs leading-relaxed text-muted-dim">{countingHelp}</p>
          </div>
          <Choice name="byaj-type" legend="Interest" value={byajType} options={byajTypeOptions} onChange={setByajType} />
          {byajType === "compound" ? (
            <div>
              <Choice name="compound-every" legend="Add interest to the amount" value={every} options={compoundOptions} onChange={setEvery} />
              <p className="mt-2 text-xs leading-relaxed text-muted-dim">{byajCopy.compoundHint}</p>
            </div>
          ) : null}
        </FormSection>

        <FormSection title="Repayments in between">
          <p className="-mt-2 text-sm leading-relaxed text-muted">{byajCopy.repaymentsHint}</p>
          {repayments.map((r, i) => (
            <div key={r.id} className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <TextField id={`rep-${r.id}-date`} label={`Repayment ${i + 1} date`} type="date" value={r.date} onChange={(v) => setRepayments((list) => list.map((x) => (x.id === r.id ? { ...x, date: v } : x)))} />
              <TextField id={`rep-${r.id}-amount`} label="Amount (₹)" inputMode="decimal" value={r.amount} onChange={(v) => setRepayments((list) => list.map((x) => (x.id === r.id ? { ...x, amount: v } : x)))} />
              <button
                type="button"
                onClick={() => setRepayments((list) => list.filter((x) => x.id !== r.id))}
                aria-label={`Remove repayment ${i + 1}`}
                className="mt-7 inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRepayments((list) => [...list, { id: Math.random().toString(36).slice(2, 10), date: "", amount: "" }])}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add a repayment
          </button>
        </FormSection>
      </form>

      <div className="min-w-0 space-y-4" aria-live="polite">
        <div className="glass rounded-2xl p-5 sm:p-7">
          {result?.overflow ? (
            <p className="text-[0.9375rem] text-muted">The amounts grow too large to show. Use a shorter period or a lower rate.</p>
          ) : result ? (
            <div className="space-y-5">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-muted">Still due on {displayDate(end)}</dt>
                  <dd className="mt-1.5 text-[1.75rem] font-semibold tabular-nums tracking-tight text-foreground sm:text-[2rem]">{rupees(result.totalDuePaise)}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted">Total interest</dt>
                    <dd className="mt-1 text-lg font-medium tabular-nums text-foreground">{rupees(result.totalInterestPaise)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Time</dt>
                    <dd className="mt-1 text-lg font-medium text-foreground">{result.duration}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Amount left</dt>
                    <dd className="mt-1 text-lg font-medium tabular-nums text-foreground">{rupees(result.principalLeftPaise)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Interest left</dt>
                    <dd className="mt-1 text-lg font-medium tabular-nums text-foreground">{rupees(result.interestLeftPaise)}</dd>
                  </div>
                </div>
              </dl>
              {result.totalPaidPaise ? <p className="text-sm text-muted">Repaid so far: {rupees(result.totalPaidPaise)}</p> : null}
              {result.excessPaise ? (
                <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                  Repayments were {rupees(result.excessPaise)} more than what was owed at the time.
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-muted-dim">
                Rate: {rate} {rateKinds.find((k) => k.value === rateKind)?.label.toLowerCase()} = {annualPercentText(rateKind, rateH ?? 0)}% a year.
              </p>
              <Button type="button" size="lg" onClick={download} disabled={busy} className="w-full sm:w-auto">
                <Download aria-hidden="true" className="size-4" />
                {busy ? "Preparing PDF…" : "Download hisaab (PDF)"}
              </Button>
            </div>
          ) : (
            <ul className="space-y-1 text-[0.9375rem] text-muted">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        {result && !result.overflow ? (
          <div className="glass rounded-2xl p-5 sm:p-7">
            <h2 className="text-[1.0625rem] font-semibold">Hisaab, step by step</h2>
            <div className="mt-4 overflow-x-auto" role="region" aria-label="Ledger" tabIndex={0}>
              <table className="w-full min-w-[720px] text-left text-sm tabular-nums">
                <thead className="text-xs text-muted-dim">
                  <tr>
                    {ledgerHead.map((h, i) => (
                      <th key={h} scope="col" className={`py-2 pr-3 font-medium ${i >= 2 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {ledgerRows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, i) => (
                        <td key={i} className={`py-2 pr-3 ${i >= 2 ? "text-right" : ""} whitespace-nowrap`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-muted-dim">{byajCopy.legalNote}</p>
      </div>
    </div>
  );
}
