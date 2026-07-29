import type * as React from "react";

import { Container } from "@/components/layout/container";

export type SectionProps = {
  /** Anchor id, also used to link the heading for assistive technology. */
  id: string;
  /** Short mono label docked to the ledger rail. */
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * Every band on the page shares one structure: a left gutter carrying the
 * ledger rail and its label, and a content column to its right. The gutter
 * border is what makes the rail read as a single continuous line down the
 * whole page rather than a decoration repeated per section.
 */
export function Section({
  id,
  label,
  title,
  description,
  children,
}: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-hairline">
      <Container>
        <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="relative pt-16 lg:border-r lg:border-hairline lg:pr-10 lg:pt-24">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">{label}</p>
            </div>
          </div>

          <div className="relative pb-20 pt-8 lg:pb-28 lg:pl-14 lg:pt-24">
            <span aria-hidden="true" className="rail-node hidden lg:block" />
            <h2 id={headingId} className="max-w-[18ch] text-display-md">
              {title}
            </h2>
            {description ? (
              <p className="mt-5 max-w-measure text-lead text-muted">{description}</p>
            ) : null}
            <div className="mt-12">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
