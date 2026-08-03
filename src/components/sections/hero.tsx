import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/content/site";

/**
 * Three claims that are true about how the product is built. They sit on the
 * hairline, read like ledger rows, and do the work that a fabricated stat
 * strip would otherwise do badly.
 */
const principles = [
  {
    term: "Exact to the paisa",
    detail: "Every amount is stored as a whole number of paise, so totals never drift.",
  },
  {
    term: "Offline first",
    detail: "Entries are written on your device and reconcile when you reconnect.",
  },
  {
    term: "You confirm the writes",
    detail: "AI reads, sorts and suggests. Nothing enters your records unasked.",
  },
] as const;

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-wash" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-fade" />

      <Container>
        <div className="relative grid lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="relative hidden pt-28 lg:block lg:pr-10">
            <div className="sticky top-28">
              <p className="eyebrow">{siteConfig.status}</p>
              <p className="mt-3 max-w-[9rem] text-xs leading-relaxed text-muted-dim">
                Live on Google Play closed testing.
              </p>
            </div>
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 h-full w-px origin-top bg-hairline animate-rail-draw"
            />
          </div>

          <div className="relative pb-20 pt-16 lg:pb-28 lg:pl-14 lg:pt-28">
            <Logo
              size={36}
              priority
              className="gap-3"
              wordmarkClassName="text-sm tracking-[0.34em]"
            />

            <h1 id="hero-heading" className="mt-9 max-w-[14ch] text-display-xl">
              Your AI Personal <span className="text-primary">Finance OS</span>
            </h1>

            <p className="mt-8 max-w-measure text-lead text-muted">
              AQVIK keeps one clear record of your money — what you spent, what is committed, what
              you are saving toward — and uses AI to explain what is actually happening to it. Not a
              tracker you fight with. A system that keeps up.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <a href={siteConfig.android.playStoreUrl} target="_blank" rel="noopener noreferrer">
                  <Download aria-hidden="true" className="size-4" />
                  Download Beta on Google Play
                </a>
              </Button>

              <Badge variant="accent">Beta</Badge>

              <Button asChild variant="secondary" size="lg">
                <Link href="#why">
                  Learn more
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-5 font-mono text-xs text-muted-dim">
              Closed testing — invite only.{" "}
              <Link href="#beta" className="rounded-sm text-muted underline underline-offset-4 hover:text-foreground">
                How to join
              </Link>
              .
            </p>

            <dl className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
              {principles.map((principle) => (
                <div key={principle.term} className="bg-surface p-6">
                  <dt className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                    {principle.term}
                  </dt>
                  <dd className="mt-3 text-sm leading-relaxed text-muted-dim">{principle.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
