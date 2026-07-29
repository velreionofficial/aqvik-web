import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { footerNav } from "@/content/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container>
      <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="hidden pt-24 lg:block lg:border-r lg:border-hairline lg:pr-10">
          <p className="eyebrow">404</p>
        </div>

        <div className="relative flex min-h-[62vh] flex-col justify-center pb-24 pt-20 lg:pl-14 lg:pt-24">
          <span aria-hidden="true" className="rail-node hidden lg:block" />
          <p className="font-mono text-label uppercase text-muted-dim">Error 404</p>
          <h1 className="mt-6 max-w-[16ch] text-display-lg">This page is not in the ledger</h1>
          <p className="mt-6 max-w-measure text-lead text-muted">
            The address you followed does not match anything here. It may have been moved, or it may
            never have existed. Either way, nothing is missing from your account.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Report a broken link</Link>
            </Button>
          </div>

          <nav aria-label="Useful pages" className="mt-14 border-t border-hairline pt-8">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-sm font-mono text-xs uppercase tracking-[0.14em] text-muted-dim transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Container>
  );
}
