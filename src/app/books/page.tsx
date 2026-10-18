import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BookCover } from "@/components/books/book-cover";
import { books } from "@/content/books";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata({
  title: "Free Books — Money Stories in Hinglish | AQVIK",
  description: "Free story books on money and online safety, in Hinglish. Read online, page by page. Start with Digital Thug Life: real-life online scams and how to stay safe.",
  path: "/books",
});

export default function BooksPage() {
  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <p className="eyebrow">Free · Read online</p>
        <h1 className="mt-4 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">Free books</h1>
        <p className="mt-5 max-w-measure text-lead text-muted">
          Paise aur online suraksha ki kahaniyan, jo padhne mein mazedaar hain aur kaam ki seekh deti hain. Bilkul free, sign-up nahi.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <li key={b.slug}>
              <Link href={`/books/${b.slug}`} className="group block focus-visible:outline-none">
                <BookCover src={b.cover} title={b.title} priority className="w-full max-w-[16rem] transition-transform group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-primary" />
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-dim">{b.season} · {b.language} · by {b.author}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{b.title}</p>
                <p className="mt-1.5 max-w-sm text-[0.9375rem] leading-relaxed text-muted">{b.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-soft">
                  Padhna shuru karo <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
