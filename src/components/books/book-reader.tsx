"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ScrollText } from "lucide-react";

import { logEvent } from "@/lib/events";
import { cn } from "@/lib/utils";

export type ReaderPage = { title: string; closing: boolean; content: React.ReactNode };

const MODE_KEY = "aqvik-book-mode";

/**
 * Book mode turns one page at a time (buttons, arrow keys or a swipe) with a page-turn animation;
 * scroll mode shows every page in one column. Every page is in the HTML in both modes, so search
 * engines and screen readers get the whole text.
 */
export function BookReader({ pages, next, prev }: { pages: ReaderPage[]; next?: { href: string; label: string }; prev?: { href: string; label: string } }) {
  const [mode, setMode] = React.useState<"book" | "scroll">("book");
  const [index, setIndex] = React.useState(0);
  const [turn, setTurn] = React.useState<"next" | "prev" | null>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const touchX = React.useRef<number | null>(null);
  const last = pages.length - 1;

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODE_KEY);
      if (saved === "scroll" || saved === "book") setMode(saved);
    } catch {
      // storage can be blocked; book mode is fine
    }
    logEvent("book_part_opened");
  }, []);

  const chooseMode = (m: "book" | "scroll") => {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch {
      // ignore
    }
  };

  const go = React.useCallback(
    (to: number) => {
      if (to < 0 || to > last || to === index) return;
      setTurn(to > index ? "next" : "prev");
      setIndex(to);
      if (to === last) logEvent("book_part_finished");
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [index, last],
  );

  React.useEffect(() => {
    if (mode !== "book") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, index, go]);

  const pageNumber = (i: number, p: ReaderPage) => (p.closing ? "Seekh" : `Page ${i + 1}`);

  return (
    <div ref={top} className="scroll-mt-24">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div role="group" aria-label="Reading mode" className="glass inline-flex rounded-full p-1 text-sm">
          {(["book", "scroll"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => chooseMode(m)}
              aria-pressed={mode === m}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors", mode === m ? "bg-white/15 text-foreground" : "text-muted hover:text-foreground")}
            >
              {m === "book" ? <BookOpen aria-hidden="true" className="size-4" /> : <ScrollText aria-hidden="true" className="size-4" />}
              {m === "book" ? "Book" : "Scroll"}
            </button>
          ))}
        </div>
        {mode === "book" ? (
          <p className="font-mono text-xs text-muted-dim" aria-live="polite">
            {index + 1} / {pages.length}
          </p>
        ) : null}
      </div>

      <div
        className={cn(mode === "book" && "[perspective:1600px]")}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (mode !== "book" || touchX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
          if (Math.abs(dx) > 60) go(dx < 0 ? index + 1 : index - 1);
          touchX.current = null;
        }}
      >
        {pages.map((p, i) => (
          <section
            key={i}
            aria-label={`${pageNumber(i, p)}: ${p.title}`}
            hidden={mode === "book" && i !== index}
            className={cn(
              "book-page glass relative rounded-2xl px-5 py-8 sm:px-10 sm:py-12",
              mode === "scroll" && "mb-6",
              mode === "book" && i === index && turn === "next" && "animate-[page-in-next_.45s_ease-out]",
              mode === "book" && i === index && turn === "prev" && "animate-[page-in-prev_.45s_ease-out]",
            )}
          >
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-dim">{pageNumber(i, p)}</p>
            <h2 className="mt-2 text-display-sm">{p.title}</h2>
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-[1.8] text-[#D9D9E0]">{p.content}</div>
            {mode === "book" ? <p className="mt-10 text-center font-mono text-xs text-muted-dim">— {i + 1} —</p> : null}
          </section>
        ))}
      </div>

      <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3">
        {mode === "book" && index > 0 ? (
          <button type="button" onClick={() => go(index - 1)} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-foreground hover:bg-white/10">
            <ArrowLeft aria-hidden="true" className="size-4" /> Pichhla page
          </button>
        ) : prev ? (
          <Link href={prev.href} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-foreground hover:bg-white/10">
            <ArrowLeft aria-hidden="true" className="size-4" /> {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {mode === "book" && index < last ? (
          <button type="button" onClick={() => go(index + 1)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Agla page <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        ) : next ? (
          <Link href={next.href} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {next.label} <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
