import type * as React from "react";
import { ExternalLink as ExternalIcon } from "lucide-react";

import { statusText } from "@/content/ipo";
import { rupeesWords } from "@/lib/ipo/explain";
import type { IpoStatus, Paise } from "@/lib/ipo/model";
import { cn } from "@/lib/utils";

/** "21 Oct 2026" from an IST date string, the same on server and browser. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** ₹1,119 or ₹1,119.50 for a per-share price. */
export const sharePrice = (p: Paise) => `₹${(p / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const money = rupeesWords;

/** Links to SEBI, exchanges and registrars open on their own site, in a new tab, never framed. */
export function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-1.5 rounded-sm text-primary-soft underline-offset-4 hover:underline", className)}>
      {children}
      <ExternalIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Dot colour per status: green while bidding is open, yellow before, red once bidding has ended. */
const DOT: Record<IpoStatus, string> = {
  open: "bg-[#22C55E]",
  upcoming: "bg-warning",
  closed: "bg-[#EF4444]",
  "allotment-out": "bg-[#EF4444]",
  listed: "bg-[#EF4444]",
};

/** Status label with a blinking dot. The words carry the meaning; the colour only repeats it. */
export function StatusPill({ status }: { status: IpoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "open" ? "border-[#22C55E]/50 text-[#4ADE80]" : "border-white/10 text-muted",
      )}
    >
      <span aria-hidden="true" className="relative flex size-2">
        <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none", DOT[status])} />
        <span className={cn("relative inline-flex size-2 rounded-full", DOT[status])} />
      </span>
      {statusText[status]}
    </span>
  );
}

export function IpoSection({ id, title, children, note }: { id: string; title: string; children: React.ReactNode; note?: string }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-14">
      <h2 id={`${id}-heading`} className="text-display-sm">
        {title}
      </h2>
      {note ? <p className="mt-3 max-w-measure text-sm leading-relaxed text-muted-dim">{note}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A two-column list of facts. */
export function FactList({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="glass grid gap-x-8 gap-y-5 rounded-2xl p-5 sm:grid-cols-2 sm:p-7">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-1 text-[1.0625rem] tabular-nums text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
