import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { footerNav, siteConfig } from "@/content/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:gap-20">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted">{siteConfig.tagline}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-dim">
              {siteConfig.shortDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-20">
            <div>
              <h2 className="eyebrow">Company</h2>
              <ul className="mt-5 space-y-3">
                {footerNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-sm text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="eyebrow">Reach us</h2>
              <ul className="mt-5 space-y-3">
                <li>
                  <a
                    href={`mailto:${siteConfig.emails.support}`}
                    className="rounded-sm text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {siteConfig.emails.support}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-hairline py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-dim">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-dim">
            {siteConfig.status} — not yet released on Google Play.
          </p>
        </div>
      </Container>
    </footer>
  );
}
