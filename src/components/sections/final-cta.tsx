import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { finalCta } from "@/content/home";
import { joinBetaHref } from "@/content/site";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="relative overflow-hidden border-t border-hairline">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-wash" />
      <Container>
        <div className="relative mx-auto max-w-2xl py-20 lg:py-28">
          <div className="glass rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 id="final-cta-heading" className="text-display-md">
            {finalCta.heading}
          </h2>
          <p className="mt-5 text-lead text-muted">{finalCta.line}</p>
          <Button asChild size="lg" className="mt-10 w-full sm:w-auto">
            <Link href={joinBetaHref}>{finalCta.button}</Link>
          </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
