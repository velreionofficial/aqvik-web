import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { hero } from "@/content/home";
import { joinBetaHref, siteConfig } from "@/content/site";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-wash" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-fade" />

      <Container>
        <div className="relative grid items-center gap-14 pb-[4.5rem] pt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20 lg:pb-24 lg:pt-24">
          <div>
            <Link
              href={hero.toolsLink.href}
              className="glass group mb-8 inline-flex max-w-full items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm text-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                {hero.toolsLink.tag}
              </span>
              <span className="min-w-0">{hero.toolsLink.label}</span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-primary-soft transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="eyebrow">{hero.eyebrow}</p>

            <h1
              id="hero-heading"
              className="mt-6 max-w-[15ch] text-[2.375rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.875rem]"
            >
              {hero.headline}
            </h1>

            <p className="mt-7 max-w-measure text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
              {hero.subheadline}
            </p>

            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={joinBetaHref}>{hero.primaryCta}</Link>
              </Button>

              <p className="text-[0.9375rem] text-muted">
                {hero.secondaryPrefix}{" "}
                <a
                  href={siteConfig.android.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm text-primary-soft underline-offset-4 hover:underline"
                >
                  {hero.secondaryLink}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </p>
            </div>

            <p className="mt-6 font-mono text-xs text-muted-dim">{hero.microline}</p>
          </div>

          <PhoneFrame
            src={hero.screen.src}
            alt={hero.screen.alt}
            priority
            sizes="(max-width: 1024px) 72vw, 22rem"
            className="max-w-[17rem] sm:max-w-[19rem] lg:max-w-none"
          />
        </div>
      </Container>
    </section>
  );
}
