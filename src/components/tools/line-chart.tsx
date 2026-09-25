import { formatRupees, formatShort } from "@/lib/calculators/format";

export type LineSeries = { label: string; color: string; values: readonly number[]; dashed?: boolean };

/**
 * Simple multi-line chart (pure SVG) for "before vs after" comparisons.
 * Values are in rupees; x is the year (1-based). A visually hidden table
 * carries the same numbers for screen readers.
 */
export function LineChart({ series, caption, xLabel = "Year" }: { series: readonly LineSeries[]; caption: string; xLabel?: string }) {
  const length = Math.max(1, ...series.map((s) => s.values.length));
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const W = 600;
  const H = 220;
  const pad = { l: 8, r: 8, t: 10, b: 24 };
  const x = (i: number) => pad.l + (length === 1 ? 0 : (i / (length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - Math.max(0, v) / max) * (H - pad.t - pad.b);
  const every = length > 20 ? 5 : length > 10 ? 2 : 1;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="rgba(255,255,255,0.12)" />
        {series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeDasharray={s.dashed ? "6 5" : undefined}
            strokeLinejoin="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        {Array.from({ length }, (_, i) =>
          (i + 1) % every === 0 || i === 0 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.45)">
              {i + 1}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-4 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="text-muted-dim">By {xLabel.toLowerCase()} · peak {formatShort(max) ?? formatRupees(max, false)}</span>
      </figcaption>
      <div className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{xLabel}</th>
              {series.map((s) => (
                <th key={s.label} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length }, (_, i) => (
              <tr key={i}>
                <th scope="row">{i + 1}</th>
                {series.map((s) => (
                  <td key={s.label}>{s.values[i] === undefined ? "—" : formatRupees(s.values[i]!, false)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
