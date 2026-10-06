"use client";

import * as React from "react";
import { CalendarPlus, Check, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { rupees } from "@/components/tools/statement/money-report";
import { statementCopy } from "@/content/statement-analyzer";
import { logEvent } from "@/lib/events";
import {
  mergeSnapshots,
  monthName,
  monthSnapshots,
  pickComparison,
  reviewQuestion,
  type ClassifiedTxn,
  type FinancialFacts,
  type Insights,
  type TxnType,
} from "@/lib/statement/engine";
import { monthlyReminderIcs } from "@/lib/statement/calendar";
import { clearSaved, loadSaved, saveSnapshots } from "@/lib/statement/review-store";

const FREQ: Record<string, string> = { weekly: "a week", monthly: "a month", quarterly: "every 3 months", yearly: "a year" };

/**
 * The 60-second Money Review: five things, in order. Every number comes from FinancialFacts.
 * 1. in · out · actual spending  2. regular commitments  3. one thing worth a look
 * 4. one question  5. what changed since last month (or how to see it next month)
 */
export function MoneyReview({
  facts: f,
  insights,
  txns,
  onAnswer,
  onSomethingElse,
  measure = true,
}: {
  /** Opens the full report's transaction list so any type and category can be chosen. */
  onSomethingElse?: () => void;
  /** False when only the made-up sample is loaded, so demos never count in product metrics. */
  measure?: boolean;
  facts: FinancialFacts;
  insights: Insights;
  txns: ClassifiedTxn[];
  onAnswer: (counterparty: string, type: TxnType, category: string) => void;
}) {
  const [saved, setSaved] = React.useState<ReturnType<typeof loadSaved>>([]);
  const [savedNow, setSavedNow] = React.useState(false);
  const [answered, setAnswered] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSaved(loadSaved());
    if (measure) logEvent("review_shown");
  }, [measure]);

  const snapshots = React.useMemo(() => monthSnapshots(f, txns), [f, txns]);
  const comparison = React.useMemo(() => pickComparison(snapshots, saved), [snapshots, saved]);
  const question = React.useMemo(() => reviewQuestion(txns), [txns]);
  const commitments = f.recurring.filter((r) => r.direction === "out").slice(0, 3);
  const rank = { review: 0, watch: 1, info: 2 } as const;
  const top = [...insights.unusual, ...insights.leaks].sort((a, b) => rank[a.level] - rank[b.level] || (b.amount ?? 0) - (a.amount ?? 0))[0];
  const notSpending = f.raw.moneyOut - f.grossSpending;

  React.useEffect(() => {
    if (measure && comparison?.source === "saved") logEvent("review_compared_saved");
  }, [comparison?.source, measure]);

  const save = () => {
    const merged = mergeSnapshots(loadSaved(), snapshots);
    if (saveSnapshots(merged)) {
      setSavedNow(true);
      if (measure) logEvent("review_saved");
    }
  };

  const reminder = () => {
    const ics = monthlyReminderIcs(new Date(), `${window.location.origin}/tools/bank-statement-analyzer`);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "aqvik-monthly-money-review.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (measure) logEvent("review_reminder_added");
  };

  return (
    <section className="glass rounded-2xl p-5 sm:p-7" aria-labelledby="review-heading">
      <h2 id="review-heading" className="text-[1.25rem] font-semibold">
        Your 60-second money review
      </h2>
      <p className="mt-1 text-sm text-muted">
        {f.period.from.split("-").reverse().join("-")} to {f.period.to.split("-").reverse().join("-")}
      </p>

      <ol className="mt-5 space-y-5">
        {/* 1 */}
        <li>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["Came in", f.raw.moneyIn],
              ["Went out", f.raw.moneyOut],
              ["Actual spending", f.actualSpending],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-white/10 p-3">
                <dt className="text-xs text-muted sm:text-sm">{label}</dt>
                <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums text-foreground sm:text-xl">{rupees(value as number)}</dd>
              </div>
            ))}
          </dl>
          {notSpending > 0 ? (
            <p className="mt-2 text-sm text-muted">
              {rupees(notSpending)} of the money that went out was not spending: transfers, investment platforms, debt payments, cash and fees.
            </p>
          ) : null}
        </li>

        {/* 2 */}
        <li>
          <h3 className="text-sm font-medium text-foreground">Your regular commitments</h3>
          {commitments.length ? (
            <>
              <ul className="mt-1.5 divide-y divide-hairline text-sm">
                {commitments.map((r) => (
                  <li key={r.counterparty} className="flex items-baseline justify-between gap-3 py-1.5">
                    <span className="min-w-0 truncate text-muted">
                      {r.counterparty} <span className="text-xs text-muted-dim">· {r.kind}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      {rupees(r.typical)} {FREQ[r.frequency]}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted-dim">All regular payments: about {rupees(f.commitments.monthly)} a month.</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">No regular payments found in this period.</p>
          )}
        </li>

        {/* 3 */}
        <li>
          <h3 className="text-sm font-medium text-foreground">One thing worth a look</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{top ? `${top.title}: ${top.detail}` : insights.story[1]?.text ?? "Nothing unusual stood out."}</p>
        </li>

        {/* 4 */}
        {question ? (
          <li className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <h3 className="text-sm font-medium text-foreground">
              {question.direction === "in"
                ? `${rupees(question.total)} came from ${question.counterparty}${question.count > 1 ? ` (${question.count} times)` : ""}. What is it?`
                : `${rupees(question.total)} went to ${question.counterparty}${question.count > 1 ? ` (${question.count} times)` : ""}. What is it?`}
            </h3>
            <p className="mt-1 text-xs text-muted-dim">Your answer is applied to every payment {question.direction === "in" ? "from" : "to"} {question.counterparty} and updates the numbers above.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {question.options.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => {
                    onAnswer(question.counterparty, o.type, o.category);
                    setAnswered(`${question.counterparty}: ${o.label}`);
                    if (measure) logEvent("review_question_answered");
                  }}
                  className="rounded-full border border-white/15 bg-background/60 px-3.5 py-1.5 text-sm text-foreground hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {o.label}
                </button>
              ))}
              {onSomethingElse ? (
                <button
                  type="button"
                  onClick={onSomethingElse}
                  className="rounded-full px-3.5 py-1.5 text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Something else…
                </button>
              ) : null}
            </div>
          </li>
        ) : null}
        {answered ? (
          <li className="flex items-center gap-2 text-sm text-primary-soft">
            <Check aria-hidden="true" className="size-4" /> Saved for this review: {answered}. You can change it in the full report.
          </li>
        ) : null}

        {/* 5 */}
        <li>
          <h3 className="text-sm font-medium text-foreground">What changed since last month</h3>
          {comparison ? (
            <>
              <p className="mt-1 text-xs text-muted-dim">
                {monthName(comparison.cur.month)} against {monthName(comparison.prev.month)}
                {comparison.source === "saved" ? " (from the month you saved on this device)" : " (both in this statement)"}
              </p>
              {comparison.changes.length ? (
                <ul className="mt-1.5 space-y-1 text-sm text-muted">
                  {comparison.changes.map((c) => (
                    <li key={c.id} className="flex gap-2">
                      <span aria-hidden="true" className="text-primary-soft">•</span>
                      {c.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">No big changes.</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">{statementCopy.reviewNoCompare}</p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="secondary" onClick={save} disabled={savedNow}>
              <Save aria-hidden="true" className="size-4" /> {savedNow ? "Saved on this device" : "Save this review on this device"}
            </Button>
            <Button type="button" variant="ghost" onClick={reminder}>
              <CalendarPlus aria-hidden="true" className="size-4" /> Monthly reminder (calendar)
            </Button>
            {saved.length ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  clearSaved();
                  setSaved([]);
                  setSavedNow(false);
                }}
              >
                <Trash2 aria-hidden="true" className="size-4" /> Delete saved months ({saved.length})
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-dim">{statementCopy.reviewSaveNote}</p>
        </li>
      </ol>
    </section>
  );
}
