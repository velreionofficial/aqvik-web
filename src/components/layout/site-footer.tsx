import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { footerNav, siteConfig } from "@/content/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-[minmax(0,1fr)_auto] md:gap-20">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted">{siteConfig.footerLine}</p>
          </div>

          <div className="space-y-6">
            <nav aria-label="Footer">
              <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-7">
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
            </nav>
            <a
              href={`mailto:${siteConfig.emails.support}`}
              className="inline-block rounded-sm text-sm text-primary-soft underline-offset-4 hover:underline"
            >
              {siteConfig.emails.support}
            </a>
          </div>
        </div>

        <div className="border-t border-hairline py-8">
          <p className="font-mono text-xs text-muted-dim">
            © {year} {siteConfig.name}. Built in India. Closed beta on Google Play.
          </p>
        </div>
      </Container>
    </footer>
  );
}
