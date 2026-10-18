import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BookCover } from "@/components/books/book-cover";
import { books, findBook, readingOrder } from "@/content/books";
import { toolMetadata } from "@/lib/seo";

type Params = { params: Promise<{ book: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => books.map((b) => ({ book: b.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const book = findBook((await params).book);
  if (!book) return {};
  return toolMetadata({ title: `${book.title} (${book.season}) — Free Book by ${book.author}`, description: book.description, path: `/books/${book.slug}` });
}

export default async function BookPage({ params }: Params) {
  const book = findBook((await params).book);
  if (!book) notFound();
  const first = readingOrder(book)[0];

  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-dim">
          <Link href="/books" className="rounded-sm hover:text-foreground">Free books</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-muted">{book.title}</span>
        </nav>

        <div className="mt-8 grid items-start gap-10 md:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <BookCover src={book.cover} title={book.title} priority className="w-full max-w-[16rem]" />
          <div>
            <p className="eyebrow">{book.season} · {book.language} · Free</p>
            <h1 className="mt-4 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{book.title}</h1>
            <p className="mt-4 text-lg text-foreground">{book.tagline}</p>
            <p className="mt-1 text-[0.9375rem] text-muted">{book.taglineEn}</p>
            <p className="mt-2 text-sm text-muted-dim">Written by {book.author}</p>
            {first ? (
              <Link href={first.href} className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90">
                Case 1 padhna shuru karo <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
            <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted-dim">{book.disclaimer}</p>
            <p className="mt-3 max-w-measure text-sm text-muted">
              Aapke saath online fraud ho jaye to turant <strong className="text-foreground">1930</strong> pe call karo aur{" "}
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary-soft underline-offset-4 hover:underline">cybercrime.gov.in</a> pe shikayat karo.
            </p>
          </div>
        </div>

        <section aria-labelledby="cases-heading" className="mt-16">
          <h2 id="cases-heading" className="text-display-sm">{book.season} ke cases</h2>
          <ol className="mt-6 space-y-4">
            {book.cases.map((c) => (
              <li key={c.slug} className="glass rounded-2xl p-5 sm:p-7">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#FF8A94]">Case {c.n}</p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1 text-[0.9375rem] text-muted">{c.scam}</p>
                <p className="mt-3 max-w-measure text-[0.9375rem] italic text-foreground/90">{c.hook}</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                  {c.parts.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/books/${book.slug}/${c.slug}/${p.slug}`} className="group flex h-full flex-col rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <span className="font-mono text-xs text-muted-dim">Part {p.n}</span>
                        <span className="mt-1 inline-flex items-center justify-between gap-2 font-medium text-foreground">
                          {p.title} <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-primary-soft transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {book.upcoming.map((u) => (
              <li key={u.n} className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 p-5 opacity-70 sm:px-7">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-dim">Case {u.n}</p>
                  <p className="mt-1.5 font-medium text-foreground">{u.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{u.scam}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-dim"><Lock aria-hidden="true" className="size-3.5" /> Jald aa raha hai</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Container>
  );
}
