import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Blocks } from "@/components/books/book-blocks";
import { BookReader } from "@/components/books/book-reader";
import { books, findPart, readingOrder } from "@/content/books";
import { loadPart } from "@/lib/books/load";
import { pageText } from "@/lib/books/parse";
import { toolMetadata } from "@/lib/seo";

type Params = { params: Promise<{ book: string; caseSlug: string; part: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  books.flatMap((b) => b.cases.flatMap((c) => c.parts.map((p) => ({ book: b.slug, caseSlug: c.slug, part: p.slug }))));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await params;
  const found = findPart(p.book, p.caseSlug, p.part);
  if (!found) return {};
  const { book, bookCase, part } = found;
  const { pages } = loadPart(part.file, book.slug);
  const opening = pages[0] ? pageText(pages[0]).replace(/\s+/g, " ").trim().slice(0, 150) : "";
  return toolMetadata({
    title: `${bookCase.title} — Part ${part.n}: ${part.title} | ${book.title}`,
    description: `Case ${bookCase.n}: ${bookCase.scam}. ${opening}…`,
    path: `/books/${book.slug}/${bookCase.slug}/${part.slug}`,
  });
}

export default async function PartPage({ params }: Params) {
  const p = await params;
  const found = findPart(p.book, p.caseSlug, p.part);
  if (!found) notFound();
  const { book, bookCase, part } = found;
  const { pages, images } = loadPart(part.file, book.slug);
  const order = readingOrder(book);
  const at = order.findIndex((o) => o.bookCase.slug === bookCase.slug && o.part.slug === part.slug);
  const prevItem = order[at - 1];
  const nextItem = order[at + 1];
  const anyImage = Object.values(images).some(Boolean);

  return (
    <Container>
      <article className="mx-auto max-w-3xl pb-20 pt-10 lg:pb-28 lg:pt-14">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-dim">
          <Link href="/books" className="rounded-sm hover:text-foreground">Free books</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/books/${book.slug}`} className="rounded-sm hover:text-foreground">{book.title}</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-muted">Case {bookCase.n}</span>
        </nav>

        <header className="mt-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#FF8A94]">
            Case {bookCase.n}: {bookCase.title} · Part {part.n} of {bookCase.parts.length}
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.75rem]">{part.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-dim">{book.disclaimer}</p>
        </header>

        <div className="mt-8">
          <BookReader
            pages={pages.map((pg) => ({ title: pg.title, closing: pg.closing, content: <Blocks blocks={pg.blocks} images={images} /> }))}
            prev={prevItem ? { href: prevItem.href, label: `Part ${prevItem.part.n}: ${prevItem.part.title}` } : undefined}
            next={nextItem ? { href: nextItem.href, label: `Part ${nextItem.part.n}: ${nextItem.part.title}` } : { href: `/books/${book.slug}`, label: "Saare cases dekho" }}
          />
        </div>

        <p className="mt-10 text-center text-xs text-muted-dim">
          {book.title} · {book.season} · Written by {book.author}
          {anyImage ? ` · ${book.imageNote}` : ""}
        </p>
      </article>
    </Container>
  );
}
