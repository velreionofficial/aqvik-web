"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";

import { gstChanges, gstRatesSource, type GstChange } from "@/content/tax";
import { rateDirection } from "@/lib/calculators/gst-rates";
import { cn } from "@/lib/utils";

function direction(c: GstChange) {
  return rateDirection(c.before, c.after);
}

const GROUPS = ["All", ...Array.from(new Set(gstChanges.map((c) => c.group)))];

export function GstRateChanges() {
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState("All");

  const q = query.trim().toLowerCase();
  const rows = gstChanges.filter(
    (c) =>
      (group === "All" || c.group === group) &&
      (q === "" || `${c.item} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)),
  );

  return (
    <div className="glass space-y-5 rounded-2xl p-5 sm:p-7">
      <div className="space-y-3">
        <label htmlFor="gst-search" className="text-[0.9375rem] font-medium text-foreground">
          Search an item
        </label>
        <input
          id="gst-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. shampoo, AC, bike, insurance, ghee"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[0.9375rem] text-foreground placeholder:text-muted-dim focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by group">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                group === g ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted hover:text-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">GST rate before and after 22 September 2025</caption>
          <thead>
            <tr className="border-b border-white/10 text-muted">
              <th scope="col" className="py-2.5 pr-3 font-medium">Item</th>
              <th scope="col" className="py-2.5 pr-3 font-medium">Before</th>
              <th scope="col" className="py-2.5 pr-3 font-medium">From 22 Sep 2025</th>
              <th scope="col" className="py-2.5 font-medium"><span className="sr-only">Change</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const d = direction(c);
              return (
                <tr key={c.item} className="border-b border-white/5 align-top">
                  <td className="py-3 pr-3 text-foreground">
                    {c.item}
                    <span className="mt-0.5 block text-xs text-muted-dim">{c.group}</span>
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-muted">{c.before}</td>
                  <td className="py-3 pr-3 tabular-nums font-medium text-foreground">{c.after}</td>
                  <td className="py-3">
                    {d === "down" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#4ADE80]"><ArrowDown aria-hidden="true" className="size-3.5" />Lower</span>
                    ) : d === "up" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-warning"><ArrowUp aria-hidden="true" className="size-3.5" />Higher</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="py-6 text-center text-sm text-muted">No item found. Try another word, or check the official notification.</p> : null}
      </div>

      <p className="text-xs leading-relaxed text-muted-dim">
        {rows.length} of {gstChanges.length} items. Source:{" "}
        <a href={gstRatesSource.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-soft hover:underline">
          {gstRatesSource.label}
          <ExternalLink aria-hidden="true" className="size-3" />
        </a>
        , and CBIC Notification No. 9/2025-Central Tax (Rate) dated 17 September 2025.
      </p>
    </div>
  );
}
