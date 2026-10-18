import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { AddToCalendar } from "@/components/ipo/add-to-calendar";
import { IpoCalculator } from "@/components/ipo/ipo-calculator";
import { ExternalLink, FactList, IpoSection, StatusPill, formatDate, money, sharePrice } from "@/components/ipo/ipo-bits";
import { ipoCopy } from "@/content/ipo";
import { findIpo, visibleIpos } from "@/content/ipos";
import { siteConfig } from "@/content/site";
import { ipoStatus, todayIST } from "@/lib/ipo/calc";
import { GLOSSARY, explainFinancials, explainIssue, issueBreakdown } from "@/lib/ipo/explain";
import type { Ipo } from "@/lib/ipo/model";
import { toolMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return visibleIpos().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const ipo = findIpo((await params).slug);
  if (!ipo) return {};
  return toolMetadata({
    title: `${ipo.company} IPO — Dates, Price Band, Lot Size & Financials | AQVIK`,
    description: `${ipo.company} IPO: price band ${priceBand(ipo)}, lot of ${ipo.lotSize} shares (${money(ipo.lotSize * ipo.priceBand.high)}), dates, allotment and listing, and the RHP's financials explained simply. Facts from official documents; not a recommendation.`,
    path: `/ipo/${ipo.slug}`,
  });
}

const priceBand = (ipo: Ipo) => (ipo.priceBand.low === ipo.priceBand.high ? sharePrice(ipo.priceBand.high) : `${sharePrice(ipo.priceBand.low)} to ${sharePrice(ipo.priceBand.high)}`);

const joinAnd = (parts: string[]) => (parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`);

/** 70,86,443 → "70.86 lakh"; small counts as they are. */
const lakh = (n: number) => (n >= 1_00_000 ? `${(n / 1_00_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh` : n.toLocaleString("en-IN"));

const crore = (p: number) => (p / 1_00_00_000_00).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default async function IpoPage({ params }: Params) {
  const ipo = findIpo((await params).slug);
  if (!ipo) notFound();

  const status = ipoStatus(ipo, todayIST());
  const t = ipo.timeline;
  const pageUrl = new URL(`/ipo/${ipo.slug}`, siteConfig.url).toString();
  const retailMaxAmount = ipo.retailLots.max * ipo.lotSize * ipo.priceBand.high;
  const f = ipo.financials;
  const rf = ipo.riskFactors;
  const split = issueBreakdown(ipo);
  const dates: [string, string | undefined, boolean][] = [
    ["Bidding opens", t.open, false],
    ["Bidding closes (last day)", t.close, false],
    ["Allotment", t.allotment, true],
    ["Refunds / money unblocked", t.refunds, true],
    ["Shares credited to demat", t.creditToDemat, true],
    ["Listing on the exchange", t.listing, true],
  ];

  return (
    <Container>
      <article className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-dim">
          <Link href="/ipo" className="rounded-sm hover:text-foreground">IPO calendar</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-muted">{ipo.company}</span>
        </nav>

        {!ipo.published ? (
          <p role="note" className="mt-5 rounded-xl border border-warning/50 p-4 text-sm text-warning">
            DRAFT — this page is visible only in local development. It is not published until every figure is checked against the RHP and the entry passes validation.
          </p>
        ) : null}

        <p className="mt-5 text-sm text-muted-dim">{ipoCopy.topNotice}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{ipo.company} IPO</h1>
          <StatusPill status={status} />
        </div>
        <p className="mt-5 max-w-measure text-lead text-muted">{ipo.about}</p>
        <p className="mt-3 max-w-measure text-sm leading-relaxed text-muted-dim">{ipoCopy.staleNote(formatDate(ipo.verifiedOn))}</p>

        <IpoSection id="issue" title="The issue at a glance">
          <FactList
            rows={[
              ["Price band (per share)", priceBand(ipo)],
              ["Face value (per share)", sharePrice(ipo.faceValue)],
              ["One lot", `${ipo.lotSize} shares · ${money(ipo.lotSize * ipo.priceBand.high)}`],
              ["Retail bid", `${ipo.retailLots.min} to ${ipo.retailLots.max} lots · up to ${money(retailMaxAmount)}`],
              ["Issue size", money(ipo.issueSize.totalAmount)],
              ["Fresh issue / offer for sale", `${money(ipo.issueSize.freshAmount)} / ${money(ipo.issueSize.offerForSaleAmount)}`],
              ["Issue type", ipo.issueType === "book-built" ? "Book-built issue" : "Fixed-price issue"],
              ["Listing on", ipo.exchanges.join(", ")],
              ...(ipo.employeeDiscount ? ([["Employee discount", `${sharePrice(ipo.employeeDiscount)} per share`]] as [string, string][]) : []),
            ]}
          />
          {ipo.specialQuotas?.length ? (
            <ul className="mt-4 max-w-measure list-disc space-y-1.5 pl-5 text-[0.9375rem] text-muted">
              {ipo.specialQuotas.map((q) => <li key={q}>{q}</li>)}
            </ul>
          ) : null}
        </IpoSection>

        <IpoSection id="dates" title="Important dates" note="Dates after bidding closes are tentative until the exchanges confirm them.">
          <div className="glass overflow-hidden rounded-2xl">
            <table className="w-full text-left text-[0.9375rem]">
              <tbody className="divide-y divide-hairline">
                {dates.filter(([, d]) => d).map(([label, d, tentative]) => (
                  <tr key={label}>
                    <th scope="row" className="px-5 py-3.5 font-normal text-muted sm:px-7">{label}</th>
                    <td className="px-5 py-3.5 text-right tabular-nums text-foreground sm:px-7">
                      {formatDate(d!)}
                      {tentative ? <span className="ml-2 text-xs text-muted-dim">tentative</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <AddToCalendar ipo={ipo} pageUrl={pageUrl} />
          </div>
        </IpoSection>

        <IpoSection id="money" title="Where the money goes">
          <div className="max-w-measure space-y-3 text-[1.0625rem] leading-relaxed text-foreground">
            {explainIssue(ipo).map((x) => <p key={x.id}>{x.text}</p>)}
          </div>
          {ipo.objects?.length ? (
            <>
              <h3 className="mt-6 font-medium">Objects of the issue (from the RHP)</h3>
              <ul className="mt-3 max-w-measure list-disc space-y-1.5 pl-5 text-[0.9375rem] text-muted">
                {ipo.objects.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </>
          ) : null}
        </IpoSection>

        <IpoSection id="reservations" title="Who the shares are for" note={split ? ipoCopy.breakdownNote : undefined}>
          {split ? (
            <>
              <div className="glass overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[46rem] text-left text-[0.9375rem]">
                  <thead className="text-sm text-muted-dim">
                    <tr>{["Category", "Who can apply", "Share of the issue", "About", "Most one person can bid", "How shares are given"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-normal first:pl-5 sm:first:pl-7">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-hairline align-top">
                    {split.rows.map((r) => (
                      <tr key={r.id}>
                        <th scope="row" className="px-4 py-3.5 pl-5 text-left font-medium text-foreground sm:pl-7">{r.category}</th>
                        <td className="px-4 py-3.5 text-muted">{r.who}</td>
                        <td className="px-4 py-3.5 text-muted">{r.share}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-foreground">{r.approx ? "≈ " : "up to "}{money(r.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted">{r.maxBid}</td>
                        <td className="px-4 py-3.5 text-muted">{r.allotment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 max-w-measure text-[0.9375rem] leading-relaxed text-muted">
                {split.rows.some((r) => !r.approx) ? (
                  <>
                    First, {joinAnd(split.rows.filter((r) => !r.approx).map((r) => `${money(r.amount)} is set aside for ${r.id === "employee" ? "eligible employees" : "eligible shareholders"}`))}. Only they can bid in those portions.{" "}
                  </>
                ) : null}
                The rest, about {money(split.netIssue)}, is called the net issue, and it is shared between institutions (QIB), NII and retail investors as shown above. The retail share has room for about {lakh(split.retailLots)} lots of {ipo.lotSize} shares, so if more retail investors than that apply, not everyone gets a lot.
              </p>
            </>
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-[0.9375rem]">
                <thead className="text-sm text-muted-dim">
                  <tr><th scope="col" className="px-5 py-3 font-normal sm:px-7">Category</th><th scope="col" className="px-5 py-3 font-normal sm:px-7">Share of the issue (as in the RHP)</th></tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {ipo.reservations.map((r) => (
                    <tr key={r.category}><td className="px-5 py-3.5 text-foreground sm:px-7">{r.category}</td><td className="px-5 py-3.5 text-muted sm:px-7">{r.share}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {ipo.anchor ? (
            <p className="mt-4 max-w-measure text-[0.9375rem] text-muted">
              Anchor investors were allotted shares worth {money(ipo.anchor.amount)} on {formatDate(ipo.anchor.allocatedOn)}, as per the exchange notice. Their lock-in period is stated in the RHP.
            </p>
          ) : null}
        </IpoSection>

        <IpoSection id="business" title="What the company does">
          {ipo.business ? (
            <>
              <ul className="max-w-measure list-disc space-y-2 pl-5 text-[1.0625rem] leading-relaxed text-foreground">
                {ipo.business.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <p className="mt-3 text-sm text-muted-dim">Summarised from &quot;Our Business&quot; in the RHP, pages {ipo.business.rhpPages}.</p>
            </>
          ) : (
            <p className="max-w-measure text-[0.9375rem] text-muted">Not added yet. Read the &quot;Our Business&quot; section of the RHP.</p>
          )}
        </IpoSection>

        <IpoSection id="financials" title="The company's numbers, explained" note={f ? `₹ crore, ${f.basis}, from the RHP (pages ${f.rhpPages}; the RHP reports in ${f.rhpUnit}).` : undefined}>
          {f ? (
            <>
              <div className="glass overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[32rem] text-left text-[0.9375rem]">
                  <thead className="text-sm text-muted-dim">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-normal sm:px-7">₹ crore</th>
                      {f.periods.map((p) => <th key={p.label} scope="col" className="px-4 py-3 text-right font-normal">{p.label}{p.months < 12 ? ` (${p.months} months)` : ""}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {([["Revenue", "revenue"], ["Profit after tax", "profitAfterTax"], ["Net worth", "netWorth"], ["Total borrowings", "totalBorrowings"], ["Total assets", "totalAssets"]] as const).filter(([, k]) => f.periods.some((p) => p[k] !== undefined)).map(([label, k]) => (
                      <tr key={k}>
                        <th scope="row" className="px-5 py-3 font-normal text-muted sm:px-7">{label}</th>
                        {f.periods.map((p) => { const v = p[k]; return <td key={p.label} className="px-4 py-3 text-right tabular-nums text-foreground">{v === undefined ? "—" : crore(v)}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 max-w-measure space-y-3 text-[1.0625rem] leading-relaxed text-foreground">
                {explainFinancials(ipo).map((x) => <p key={x.id}>{x.text}</p>)}
              </div>
            </>
          ) : (
            <p className="max-w-measure text-[0.9375rem] text-muted">Not added yet. See &quot;Restated Financial Information&quot; in the RHP.</p>
          )}
        </IpoSection>

        {rf ? (
          <IpoSection id="risks" title="Risks the company lists" note={ipoCopy.riskFactorsNote(rf.items.length, rf.section.fromPage, rf.section.toPage, rf.listedIn)}>
            <ol className="max-w-measure list-decimal space-y-2 pl-5 text-[1.0625rem] leading-relaxed text-foreground">
              {rf.items.map((r) => (
                <li key={`${r.rhpPage}-${r.text}`}>
                  {r.text}
                  {r.rhpPage !== undefined ? <span className="text-sm text-muted-dim"> (RHP p. {r.rhpPage})</span> : null}
                </li>
              ))}
            </ol>
          </IpoSection>
        ) : null}

        <IpoSection id="calculator" title="How much to bid">
          <IpoCalculator preset={{ lotSize: ipo.lotSize, priceHigh: ipo.priceBand.high, retailMaxLots: ipo.retailLots.max }} />
        </IpoSection>

        <IpoSection id="categories" title="Investor categories and allotment" note={ipoCopy.allotmentNote}>
          <div className="glass overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[36rem] text-left text-[0.9375rem]">
              <thead className="text-sm text-muted-dim">
                <tr>{["Category", "Bid amount", "When oversubscribed", "Pay with"].map((h) => <th key={h} scope="col" className="px-5 py-3 font-normal">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {ipoCopy.categories.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-3.5 text-foreground">{c.name}</td>
                    <td className="px-5 py-3.5 text-muted">{c.limit}</td>
                    <td className="px-5 py-3.5 text-muted">{c.allotment}</td>
                    <td className="px-5 py-3.5 text-muted">{c.pay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </IpoSection>

        <IpoSection id="apply" title="How to apply">
          <ol className="grid gap-4 md:grid-cols-2">
            {ipoCopy.howToApply.map((step, i) => (
              <li key={step.title} className="glass rounded-2xl p-5">
                <p className="font-mono text-xs text-muted-dim">Step {i + 1}</p>
                <p className="mt-2 font-medium text-foreground">{step.title}</p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-measure text-[0.9375rem] leading-relaxed text-muted">{ipoCopy.phishingNote}</p>
        </IpoSection>

        <IpoSection id="allotment" title="Check allotment">
          <p className="max-w-measure text-[0.9375rem] leading-relaxed text-muted">
            The registrar is {ipo.registrar.name}. After the allotment date, check your status on its website with your PAN or application number:
          </p>
          <p className="mt-3"><ExternalLink href={ipo.registrar.allotmentStatusUrl}>{ipo.registrar.name} allotment status</ExternalLink></p>
          {ipo.documents?.basisOfAllotment ? <p className="mt-2"><ExternalLink href={ipo.documents.basisOfAllotment}>Basis of allotment</ExternalLink></p> : null}
        </IpoSection>

        <IpoSection id="documents" title="Official documents and sources" note={ipoCopy.sourcesNote}>
          <ul className="space-y-2 text-[0.9375rem]">
            {ipo.documents?.rhp ? <li><ExternalLink href={ipo.documents.rhp}>Red herring prospectus (RHP)</ExternalLink></li> : null}
            {ipo.documents?.abridgedProspectus ? <li><ExternalLink href={ipo.documents.abridgedProspectus}>Abridged prospectus</ExternalLink></li> : null}
            {ipo.sources.map((s) => (
              <li key={s.url}>
                <ExternalLink href={s.url}>{s.label}</ExternalLink>
                <span className="ml-2 text-xs text-muted-dim">{s.kind === "official" ? "official" : "used for cross-checking"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-measure text-sm text-muted">
            Book-running lead managers: {ipo.leadManagers.join(", ")}.
          </p>
          <p className="mt-3 max-w-measure text-sm leading-relaxed text-muted-dim">{ipoCopy.linksNote}</p>
        </IpoSection>

        {ipo.corrections?.length ? (
          <IpoSection id="corrections" title="Corrections">
            <ul className="max-w-measure space-y-2 text-[0.9375rem] text-muted">
              {ipo.corrections.map((c) => <li key={`${c.on}-${c.note}`}><span className="tabular-nums text-foreground">{formatDate(c.on)}:</span> {c.note}</li>)}
            </ul>
          </IpoSection>
        ) : null}

        <IpoSection id="glossary" title="Words on this page">
          <div className="glass divide-y divide-hairline rounded-2xl px-6 sm:px-8">
            {GLOSSARY.map((g) => (
              <details key={g.term} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                  {g.term}
                  <Plus aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-dim transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-measure pb-5 pr-10 text-[0.9375rem] leading-relaxed text-muted">{g.meaning}</p>
              </details>
            ))}
          </div>
        </IpoSection>

        <div className="mt-14 max-w-measure space-y-3 text-sm leading-relaxed text-muted-dim">
          <p>{ipoCopy.noGmp}</p>
          <p>{ipoCopy.editorialPolicy}</p>
          <p>{ipoCopy.disclaimer}</p>
        </div>
      </article>
    </Container>
  );
}
