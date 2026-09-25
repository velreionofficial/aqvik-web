import { formatRupees } from "@/lib/calculators/format";

/** Two-part donut, e.g. principal vs interest. Pure SVG, no chart library. */
export function DonutChart({
  parts,
  label,
}: {
  parts: readonly { label: string; value: number; color: string }[];
  label: string;
}) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 100 100" role="img" aria-label={label} className="size-40 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        {total > 0
          ? parts.map((part) => {
              const length = (Math.max(0, part.value) / total) * circumference;
              const circle = (
                <circle
                  key={part.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={part.color}
                  strokeWidth="12"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return circle;
            })
          : null}
      </svg>
      <figcaption className="w-full space-y-3">
        {parts.map((part) => (
          <div key={part.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: part.color }} />
              {part.label}
            </span>
            <span className="tabular-nums text-foreground">
              {total > 0 ? `${Math.round((Math.max(0, part.value) / total) * 100)}%` : "—"}
            </span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

export type BarSeries = { label: string; color: string };

/**
 * Yearly bars. With two series the bars are stacked (e.g. invested + returns).
 * A visually hidden table carries the same numbers for screen readers.
 */
export function YearBars({
  rows,
  series,
  caption,
}: {
  rows: readonly { year: number; values: readonly number[] }[];
  series: readonly BarSeries[];
  caption: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.values.reduce((a, b) => a + Math.max(0, b), 0)));
  const labelEvery = rows.length > 20 ? 5 : rows.length > 10 ? 2 : 1;

  return (
    <figure>
      <div aria-hidden="true" className="flex h-44 items-end gap-[3px]">
        {rows.map((row) => (
          <div key={row.year} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            {[...row.values].reverse().map((value, index) => {
              const s = series[row.values.length - 1 - index];
              return (
                <div
                  key={index}
                  className="w-full first:rounded-t-[3px]"
                  style={{ height: `${(Math.max(0, value) / max) * 100}%`, background: s?.color }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-[3px] font-mono text-[0.625rem] text-muted-dim">
        {rows.map((row) => (
          <span key={row.year} className="min-w-0 flex-1 text-center">
            {row.year % labelEvery === 0 || row.year === 1 ? row.year : ""}
          </span>
        ))}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="text-muted-dim">By year</span>
      </figcaption>
      <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            {series.map((s) => (
              <th key={s.label} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year}>
              <th scope="row">{row.year}</th>
              {row.values.map((value, index) => (
                <td key={index}>{formatRupees(value, false)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
