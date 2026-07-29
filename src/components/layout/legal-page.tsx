import type * as React from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";

import { Container } from "@/components/layout/container";
import type { LegalBlock, LegalDocument } from "@/content/legal/types";
import { cn, formatLegalDate } from "@/lib/utils";

/** Minimal inline emphasis: `**bold**`. No other markup is supported. */
function withEmphasis(text: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-medium text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function LegalTable({
  columns,
  rows,
  label,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  label: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-w-prose overflow-x-auto rounded-2xl border border-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="bg-surface">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-hairline px-5 py-4 font-mono text-label uppercase text-muted-dim"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row, rowIndex) => (
            <tr key={row.join("|")} className="align-top">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className={cn(
                    "px-5 py-4 text-[0.9375rem] leading-relaxed",
                    cellIndex === 0 ? "text-foreground" : "text-muted",
                  )}
                >
                  {withEmphasis(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ block, label }: { block: LegalBlock; label: string }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="max-w-prose text-[0.9375rem] leading-relaxed text-muted">
          {withEmphasis(block.text)}
        </p>
      );

    case "note":
      return (
        <p className="max-w-prose text-[0.9375rem] italic leading-relaxed text-muted-dim">
          {withEmphasis(block.text)}
        </p>
      );

    case "list":
      return (
        <ul className="max-w-prose space-y-3 border-l border-hairline pl-6">
          {block.items.map((item) => (
            <li key={item} className="text-[0.9375rem] leading-relaxed text-muted">
              {withEmphasis(item)}
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="max-w-prose space-y-4">
          {block.items.map((item, index) => (
            <li key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
              <span className="font-mono text-xs leading-6 text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.9375rem] leading-relaxed text-muted">
                {withEmphasis(item)}
              </span>
            </li>
          ))}
        </ol>
      );

    case "callout":
      return (
        <div className="flex max-w-prose gap-4 rounded-2xl border border-warning/25 bg-warning/[0.06] p-5 sm:p-6">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            {withEmphasis(block.text)}
          </p>
        </div>
      );

    case "link":
      return (
        <Link
          href={block.href}
          className="inline-flex items-center gap-2 rounded-sm text-[0.9375rem] text-primary-soft underline-offset-4 hover:underline"
        >
          {block.label}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      );

    case "table":
      return <LegalTable columns={block.columns} rows={block.rows} label={label} />;
  }
}

export type LegalPageProps = {
  document: LegalDocument;
};

/**
 * Legal documents use the same rail as the homepage: the gutter carries the
 * contents index instead of a section label, so the structure of the site
 * stays consistent from marketing to fine print.
 */
export function LegalPage({ document: doc }: LegalPageProps) {
  return (
    <>
      <section className="border-b border-hairline">
        <Container>
          <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="hidden pt-24 lg:block lg:border-r lg:border-hairline lg:pr-10">
              <p className="eyebrow">Legal</p>
            </div>
            <div className="relative pb-16 pt-16 lg:pb-20 lg:pl-14 lg:pt-24">
              <span aria-hidden="true" className="rail-node hidden lg:block" />
              <h1 className="text-display-lg">{doc.title}</h1>
              {doc.subtitle ? (
                <p className="mt-5 font-mono text-sm text-muted-dim">{doc.subtitle}</p>
              ) : null}
              {doc.summary ? (
                <p className="mt-6 max-w-measure text-lead text-muted">{doc.summary}</p>
              ) : null}
              <p className="mt-8 font-mono text-xs uppercase tracking-[0.14em] text-muted-dim">
                Last updated {formatLegalDate(doc.updated)}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav
            aria-label="Contents"
            className="hidden pt-16 lg:block lg:border-r lg:border-hairline lg:pr-10"
          >
            <div className="sticky top-28 pb-16">
              <p className="eyebrow">Contents</p>
              <ul className="mt-5 space-y-2.5">
                {doc.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-sm text-xs leading-relaxed text-muted-dim transition-colors hover:text-foreground"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="pb-24 pt-12 lg:pl-14 lg:pt-16">
            {doc.intro ? (
              <div className="mb-14 space-y-5">
                {doc.intro.map((block, index) => (
                  <Block key={`intro-${index}`} block={block} label={doc.title} />
                ))}
              </div>
            ) : null}

            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 pb-12">
                <h2 className="text-display-sm">{section.heading}</h2>
                <div className="mt-5 space-y-5">
                  {section.blocks.map((block, index) => (
                    <Block
                      key={`${section.id}-${index}`}
                      block={block}
                      label={section.heading}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
