import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Blocks } from "@/components/books/book-blocks";
import { BookReader } from "@/components/books/book-reader";
import { BOOK_LANGS, BOOK_UI, partHref, readingOrder, type Book, type BookCase, type BookLang, type BookPart } from "@/content/books";
import { loadPart } from "@/lib/books/load";
import { pageText } from "@/lib/books/parse";
import { toolMetadata } from "@/lib/seo";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";

type Found = { book: Book; bookCase: BookCase; part: BookPart };

const titleOf = (p: BookPart, lang: BookLang) => (lang === "hindi" ? p.titleHi : p.title);
const caseTitleOf = (c: BookCase, lang: BookLang) => (lang === "hindi" ? c.titleHi : c.title);

/** Metadata for one part in one language, with the other languages as alternates. */
export function partMetadata({ book, bookCase, part }: Found, lang: BookLang): Metadata {
  const { pages } = loadPart(part.files[lang]!, book.slug);
  const opening = pages[0] ? pageText(pages[0]).replace(/\s+/g, " ").trim().slice(0, 150) : "";
  const ui = BOOK_UI[lang];
  const meta = toolMetadata({
    title: `${caseTitleOf(bookCase, lang)} — ${ui.partOf(part.n, bookCase.parts.length)}: ${titleOf(part, lang)} | ${book.title}`,
    description: `${ui.caseLabel} ${bookCase.n}: ${opening}…`,
    path: partHref(book, bookCase, part, lang),
  });
  const languages: Record<string, string> = {};
  for (const l of BOOK_LANGS) if (part.files[l.lang]) languages[l.htmlLang] = new URL(partHref(book, bookCase, part, l.lang), siteConfig.url).toString();
  return { ...meta, alternates: { ...meta.alternates, languages } };
}

/** The reading page for one part in one language. */
export function PartView({ book, bookCase, part }: Found, lang: BookLang) {
  const { pages, images } = loadPart(part.files[lang]!, book.slug);
  const ui = BOOK_UI[lang];
  const order = readingOrder(book, lang);
  const at = order.findIndex((o) => o.bookCase.slug === bookCase.slug && o.part.slug === part.slug);
  const prevItem = order[at - 1];
  const nextItem = order[at + 1];
  const anyImage = Object.values(images).some(Boolean);
  const htmlLang = BOOK_LANGS.find((l) => l.lang === lang)!.htmlLang;
  const label = (o: (typeof order)[number]) => `${lang === "hindi" ? "भाग" : "Part"} ${o.part.n}: ${titleOf(o.part, lang)}`;

  return (
    <Container>
      <article lang={htmlLang} className="mx-auto max-w-3xl pb-20 pt-10 lg:pb-28 lg:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-dim">
            <Link href="/books" className="rounded-sm hover:text-foreground">Free books</Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/books/${book.slug}`} className="rounded-sm hover:text-foreground">{book.title}</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-muted">{ui.caseLabel} {bookCase.n}</span>
          </nav>
          <div role="group" aria-label="Language / भाषा" className="glass inline-flex rounded-full p-1 text-sm">
            {BOOK_LANGS.filter((l) => part.files[l.lang]).map((l) => (
              <Link
                key={l.lang}
                href={partHref(book, bookCase, part, l.lang)}
                hrefLang={l.htmlLang}
                aria-current={l.lang === lang ? "page" : undefined}
                className={cn("rounded-full px-3.5 py-1.5 transition-colors", l.lang === lang ? "bg-white/15 text-foreground" : "text-muted hover:text-foreground")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <header className="mt-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#FF8A94]">
            {ui.caseLabel} {bookCase.n}: {caseTitleOf(bookCase, lang)} · {ui.partOf(part.n, bookCase.parts.length)}
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[2.75rem]">{titleOf(part, lang)}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-dim">{lang === "hindi" ? book.disclaimerHi : book.disclaimer}</p>
        </header>

        <div className="mt-8">
          <BookReader
            labels={{ page: ui.page, lesson: ui.lesson, next: ui.next, prev: ui.prev, bookMode: ui.bookMode, scrollMode: ui.scrollMode }}
            pages={pages.map((pg) => ({ title: pg.title, closing: pg.closing, content: <Blocks blocks={pg.blocks} images={images} /> }))}
            prev={prevItem ? { href: prevItem.href, label: label(prevItem) } : undefined}
            next={nextItem ? { href: nextItem.href, label: label(nextItem) } : { href: `/books/${book.slug}`, label: ui.allCases }}
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
