import type * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { toolCta, toolDisclaimer, type ToolFaq } from "@/content/tools";
import { joinBetaHref } from "@/content/site";

/**
 * Shared page body for every free tool: breadcrumb, H1, the tool, how it is
 * calculated, the disclaimer, the call to action and a short FAQ whose answers
 * are in the HTML (native <details>), plus FAQ structured data.
 */
export function ToolPage({
  h1,
  intro,
  how,
  faqs,
  children,
  disclaimer = toolDisclaimer,
  cta = toolCta,
}: {
  h1: string;
  intro: string;
  how?: readonly string[];
  faqs: readonly ToolFaq[];
  children: React.ReactNode;
  disclaimer?: string;
  cta?: { line: string; button: string };
}) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-dim">
          <Link href="/tools" className="rounded-sm hover:text-foreground">
            Tools
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-muted">{h1}</span>
        </nav>

        <h1 className="mt-5 max-w-[20ch] text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {h1}
        </h1>
        <p className="mt-5 max-w-measure text-lead text-muted">{intro}</p>

        <div className="mt-10">{children}</div>

        <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted-dim">{disclaimer}</p>

        <div className="glass mt-10 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-xl text-[1.0625rem] text-foreground">{cta.line}</p>
          <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
            <Link href={joinBetaHref}>{cta.button}</Link>
          </Button>
        </div>

        {how && how.length > 0 ? (
          <section aria-labelledby="how-heading" className="mt-16">
            <h2 id="how-heading" className="text-display-sm">
              How it&apos;s calculated
            </h2>
            <div className="mt-5 max-w-measure space-y-4 text-[0.9375rem] leading-relaxed text-muted">
              {how.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="faq-heading" className="mt-16">
          <h2 id="faq-heading" className="text-display-sm">
            Questions
          </h2>
          <div className="glass mt-6 divide-y divide-hairline rounded-2xl px-6 sm:px-8">
            {faqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-5 text-[1.0625rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <Plus aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-dim transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-measure pb-6 pr-10 text-[0.9375rem] leading-relaxed text-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      </div>
    </Container>
  );
}
