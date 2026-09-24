import type * as React from "react";

import { Container } from "@/components/layout/container";

export type SectionProps = {
  /** Anchor id, also used to link the heading for assistive technology. */
  id: string;
  /** Optional short mono label docked to the ledger rail. */
  label?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

/**
 * Every band on the page shares one structure: a left gutter carrying the
 * ledger rail (and its label, when the section has one), and a content column
 * to its right. The gutter border is what makes the rail read as a single
 * continuous line down the whole page.
 *
 * Spacing follows the homepage brief: roughly 72–96 px between sections on
 * mobile and 120–160 px on desktop.
 */
export function Section({ id, label, title, description, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-hairline">
      <Container>
        <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="relative lg:border-r lg:border-hairline lg:pr-10 lg:pt-20">
            {label ? (
              <div className="pt-[4.5rem] lg:sticky lg:top-28 lg:pt-0">
                <p className="eyebrow">{label}</p>
              </div>
            ) : null}
          </div>

          <div
            className={
              label
                ? "relative pb-[4.5rem] pt-5 lg:pb-20 lg:pl-14 lg:pt-20"
                : "relative pb-[4.5rem] pt-[4.5rem] lg:pb-20 lg:pl-14 lg:pt-20"
            }
          >
            <span aria-hidden="true" className="rail-node hidden lg:block" />
            <h2 id={headingId} className="max-w-[20ch] text-display-md">
              {title}
            </h2>
            {description ? (
              <p className="mt-5 max-w-measure text-lead text-muted">{description}</p>
            ) : null}
            {children ? <div className="mt-12">{children}</div> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
