"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { primaryNav } from "@/content/site";

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="rounded-md transition-opacity hover:opacity-80"
            aria-label="AQVIK — home"
          >
            <Logo priority />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm text-sm text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button asChild size="sm" variant="secondary">
              <Link href="/contact">Contact</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground md:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </Container>

      <div
        id="mobile-navigation"
        hidden={!open}
        className="border-t border-hairline bg-background md:hidden"
      >
        <Container>
          <nav aria-label="Primary mobile" className="flex flex-col py-4">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md py-3 text-[0.9375rem] text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-md py-3 text-[0.9375rem] text-muted transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
        </Container>
      </div>
    </header>
  );
}
