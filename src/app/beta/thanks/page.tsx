import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "You're on the list",
  robots: { index: false, follow: false },
  alternates: { canonical: "/beta/thanks" },
};

/** Shown after the beta form is submitted. Its page views are the conversion count. */
export default function BetaThanksPage() {
  return (
    <Container>
      <div className="mx-auto max-w-xl py-24 text-center lg:py-32">
        <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          You&apos;re on the list.
        </h1>
        <p className="mt-6 text-lead text-muted">
          We&apos;ll email you when your invite is ready. Questions?{" "}
          <a
            href={`mailto:${siteConfig.emails.support}`}
            className="rounded-sm text-primary-soft underline-offset-4 hover:underline"
          >
            {siteConfig.emails.support}
          </a>
        </p>
      </div>
    </Container>
  );
}
