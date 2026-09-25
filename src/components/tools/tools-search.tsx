"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Landmark, PiggyBank, Receipt, Search, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToolCard = { slug: string; name: string; cardLine: string; keywords: string; action: string };
export type ToolSection = { id: string; slug: string; title: string; description: string; cards: readonly ToolCard[] };

const ICONS: Record<string, LucideIcon> = { loans: Landmark, savings: PiggyBank, business: Briefcase, bills: Receipt };

/**
 * /tools: a search box over every tool, and one card per group that opens
 * the group's page. While searching, the group cards give way to the
 * matching tools, so a tool is one tap away either way. Everything is in the
 * server-rendered HTML; typing only toggles what is hidden.
 */
export function ToolsSearch({ sections }: { sections: readonly ToolSection[] }) {
  const [query, setQuery] = React.useState("");
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searching = words.length > 0;
  const matches = (card: ToolCard) => {
    const haystack = `${card.name} ${card.cardLine} ${card.keywords}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
  const all = sections.flatMap((s) => s.cards.map((card) => ({ card, group: s.title })));
  const shown = all.filter(({ card }) => matches(card));

  return (
    <div className="mt-10">
      <label htmlFor="tools-search" className="mb-2 block text-sm font-medium text-foreground">
        Search all tools
      </label>
      <div className="relative max-w-xl">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-dim" />
        <input
          id="tools-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try EMI, GST, bill, FD, byaj…"
          autoComplete="off"
          aria-describedby="tools-search-count"
          className="w-full rounded-full border border-white/10 bg-background/60 py-3 pl-11 pr-11 text-[0.9375rem] text-foreground placeholder:text-muted-dim focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-dim hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
      <p id="tools-search-count" aria-live="polite" className="mt-2 text-sm text-muted-dim">
        {searching ? `${shown.length} of ${all.length} tools` : `${all.length} free tools in ${sections.length} groups`}
      </p>

      <ul className={cn("mt-8 grid gap-4 md:grid-cols-2", searching && "hidden")}>
        {sections.map((section) => {
          const Icon = ICONS[section.id] ?? Briefcase;
          return (
            <li key={section.id}>
              <Link
                href={`/tools/${section.slug}`}
                className="glass group flex h-full flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-8"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-soft">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-foreground">{section.title}</h2>
                </span>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{section.description}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-dim">
                  {section.cards.map((card) => card.name).join(" · ")}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary-soft">
                  View {section.cards.length} tools
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <ul className={cn("mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3", (!searching || shown.length === 0) && "hidden")}>
        {all.map(({ card, group }) => (
          <li key={card.slug} hidden={!shown.some((s) => s.card === card)}>
            <Link
              href={`/tools/${card.slug}`}
              className="glass group flex h-full flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-7"
            >
              <span className="font-mono text-xs text-muted-dim">{group}</span>
              <h2 className="mt-1.5 text-[1.125rem] font-medium text-foreground">{card.name}</h2>
              <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{card.cardLine}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary-soft">
                {card.action}
                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {searching && shown.length === 0 ? (
        <p className="mt-6 text-[0.9375rem] text-muted">
          No tool matches &ldquo;{query}&rdquo;. Try a shorter word, like &ldquo;loan&rdquo;, &ldquo;GST&rdquo; or &ldquo;bill&rdquo;.
        </p>
      ) : null}
    </div>
  );
}
