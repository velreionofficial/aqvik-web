import { books, findBook } from "@/content/books";
import { ogSize, toolOgImage } from "@/lib/og/tool-card";

export const alt = "Free book — AQVIK";
export const size = ogSize;
export const contentType = "image/png";
export const generateStaticParams = () => books.map((b) => ({ book: b.slug }));

export default async function Image({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = findBook(slug);
  return toolOgImage({ name: book ? `${book.title} · ${book.season}` : "Free book", line: book?.tagline ?? "", path: `/books/${slug}` });
}
