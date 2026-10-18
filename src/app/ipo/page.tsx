import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ExternalLink, StatusPill, formatDate, money, sharePrice } from "@/components/ipo/ipo-bits";
import { ipoCalculatorTool, ipoCopy, ipoFaqs } from "@/content/ipo";
import { sortedIpos } from "@/content/ipos";
import { todayIST } from "@/lib/ipo/calc";
import type { Ipo, IpoStatus } from "@/lib/ipo/model";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata({ title: ipoCopy.listTitle, description: ipoCopy.listDescription, path: "/ipo" });

/** Statuses depend on today's date in India, so the page is rebuilt every hour. */
export const revalidate = 3600;

const GROUPS: { title: string; statuses: IpoStatus[] }[] = [
  { title: "Open now", statuses: ["open"] },
  { title: "Upcoming", statuses: ["upcoming"] },
  { title: "Recently closed and listed", statuses: ["closed", "allotment-out", "listed"] },
];

function dateLine(ipo: Ipo, status: IpoStatus): string {
  const t = ipo.timeline;
  if (status === "upcoming") return `Opens ${formatDate(t.open)} · closes ${formatDate(t.close)}`;
  if (status === "open") return `Closes ${formatDate(t.close)}`;
  if (status === "listed" && t.listing) return `Listed ${formatDate(t.listing)}`;
  if (t.allotment && status === "closed") return `Allotment ${formatDate(t.allotment)} (tentative)`;
  return t.listing ? `Listing ${formatDate(t.listing)} (tentative)` : `Closed ${formatDate(t.close)}`;
}

export default function IpoListPage() {
  const rows = sortedIpos(todayIST());
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ipoFaqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <p className="text-sm text-muted-dim">{ipoCopy.topNotice}</p>
        <h1 className="mt-4 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{ipoCopy.listH1}</h1>
        <p className="mt-5 max-w-measure text-lead text-muted">{ipoCopy.listIntro}</p>

        {rows.length === 0 ? (
          <div className="glass mt-10 rounded-2xl p-6 sm:p-8">
            <p className="text-[1.0625rem] text-foreground">No IPOs are listed here right now.</p>
            <p className="mt-2 max-w-measure text-[0.9375rem] leading-relaxed text-muted">
              We add an IPO once its red herring prospectus is filed and every figure is checked against it. For the full current list, see the exchanges:{" "}
              <ExternalLink href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo">NSE upcoming issues</ExternalLink> and{" "}
              <ExternalLink href="https://www.bseindia.com/publicissue.html">BSE public issues</ExternalLink>.
            </p>
          </div>
        ) : (
          GROUPS.map((g) => {
            const list = rows.filter((r) => g.statuses.includes(r.status));
            if (!list.length) return null;
            return (
              <section key={g.title} aria-label={g.title} className="mt-12">
                <h2 className="text-display-sm">{g.title}</h2>
                <ul className="mt-5 grid gap-4 md:grid-cols-2">
                  {list.map(({ ipo, status }) => (
                    <li key={ipo.slug}>
                      <Link href={`/ipo/${ipo.slug}`} className="glass group flex h-full flex-col rounded-2xl p-5 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6">
                        <span className="flex items-start justify-between gap-4">
                          <span className="text-[1.125rem] font-medium text-foreground">{ipo.company}</span>
                          <StatusPill status={status} />
                        </span>
                        {!ipo.published ? <span className="mt-2 text-xs font-medium text-warning">DRAFT — visible only in local development</span> : null}
                        <span className="mt-2 text-sm text-muted">{dateLine(ipo, status)}</span>
                        <span className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <span>
                            <span className="block text-muted-dim">Price band</span>
                            <span className="tabular-nums text-foreground">
                              {ipo.priceBand.low === ipo.priceBand.high ? sharePrice(ipo.priceBand.high) : `${sharePrice(ipo.priceBand.low)}–${sharePrice(ipo.priceBand.high).slice(1)}`}
                            </span>
                          </span>
                          <span>
                            <span className="block text-muted-dim">One lot</span>
                            <span className="tabular-nums text-foreground">
                              {ipo.lotSize} shares · {money(ipo.lotSize * ipo.priceBand.high)}
                            </span>
                          </span>
                        </span>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary-soft">
                          Dates, financials and how to apply
                          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}

        <div className="glass mt-12 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-xl text-[1.0625rem] text-foreground">{ipoCalculatorTool.cardLine}</p>
          <Link href={`/tools/${ipoCalculatorTool.slug}`} className="inline-flex items-center gap-1.5 text-primary-soft underline-offset-4 hover:underline">
            Open the IPO calculator <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <section aria-labelledby="apply-heading" className="mt-16">
          <h2 id="apply-heading" className="text-display-sm">How to apply for an IPO</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {ipoCopy.howToApply.map((step, i) => (
              <li key={step.title} className="glass rounded-2xl p-5">
                <p className="font-mono text-xs text-muted-dim">Step {i + 1}</p>
                <p className="mt-2 font-medium text-foreground">{step.title}</p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-measure text-[0.9375rem] leading-relaxed text-muted">{ipoCopy.phishingNote}</p>
        </section>

        <section aria-labelledby="faq-heading" className="mt-16">
          <h2 id="faq-heading" className="text-display-sm">Questions</h2>
          <div className="glass mt-6 divide-y divide-hairline rounded-2xl px-6 sm:px-8">
            {ipoFaqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-5 text-[1.0625rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <Plus aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-dim transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-measure pb-6 pr-10 text-[0.9375rem] leading-relaxed text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 max-w-measure space-y-3 text-sm leading-relaxed text-muted-dim">
          <p>{ipoCopy.noGmp}</p>
          <p>{ipoCopy.editorialPolicy}</p>
          <p>{ipoCopy.disclaimer}</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      </div>
    </Container>
  );
}
