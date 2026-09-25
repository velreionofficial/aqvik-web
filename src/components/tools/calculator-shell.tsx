import type * as React from "react";

/**
 * Inputs on the left, results on the right (stacked on mobile). Shared by the
 * three calculators so they look and behave the same.
 */
export function CalculatorShell({
  inputs,
  results,
  extra,
}: {
  inputs: React.ReactNode;
  results: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="glass space-y-8 rounded-2xl p-5 sm:p-7">{inputs}</div>
        <div className="glass rounded-2xl p-5 sm:p-7" aria-live="polite">
          {results}
        </div>
      </div>
      {extra}
    </div>
  );
}

export function InvalidNotice() {
  return (
    <p className="text-[0.9375rem] leading-relaxed text-muted">
      Fix the highlighted field to see the result.
    </p>
  );
}
