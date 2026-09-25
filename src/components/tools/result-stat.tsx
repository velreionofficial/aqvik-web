import { formatRupees, formatShort } from "@/lib/calculators/format";
import { cn } from "@/lib/utils";

/** One headline figure: label, the amount to the paisa, and "₹11.6 lakh" beside big totals. */
export function ResultStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  const short = formatShort(value);

  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5">
        <span
          className={cn(
            "tabular-nums tracking-tight text-foreground",
            emphasis ? "text-[1.75rem] font-semibold sm:text-[2rem]" : "text-xl font-medium",
          )}
        >
          {formatRupees(value)}
        </span>
        {short ? <span className="text-sm text-primary-soft">{short}</span> : null}
      </dd>
    </div>
  );
}
