import { Container } from "@/components/layout/container";
import type { LegalDocument } from "@/content/legal/types";
import { formatLegalDate } from "@/lib/utils";

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
              <p className="mt-6 max-w-measure text-lead text-muted">{doc.summary}</p>
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
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 pb-12">
                <h2 className="text-display-sm">{section.heading}</h2>
                <div className="mt-5 space-y-5">
                  {section.blocks.map((block, index) =>
                    block.type === "paragraph" ? (
                      <p
                        key={`${section.id}-${index}`}
                        className="max-w-prose text-[0.9375rem] leading-relaxed text-muted"
                      >
                        {block.text}
                      </p>
                    ) : (
                      <ul
                        key={`${section.id}-${index}`}
                        className="max-w-prose space-y-3 border-l border-hairline pl-6"
                      >
                        {block.items.map((item) => (
                          <li key={item} className="text-[0.9375rem] leading-relaxed text-muted">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
