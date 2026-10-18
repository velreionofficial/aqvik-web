import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PartView, partMetadata } from "@/components/books/part-view";
import { books, findPart } from "@/content/books";

type Params = { params: Promise<{ book: string; caseSlug: string; part: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  books.flatMap((b) => b.cases.flatMap((c) => c.parts.map((p) => ({ book: b.slug, caseSlug: c.slug, part: p.slug }))));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await params;
  const found = findPart(p.book, p.caseSlug, p.part);
  return found ? partMetadata(found, "hinglish") : {};
}

export default async function PartPage({ params }: Params) {
  const p = await params;
  const found = findPart(p.book, p.caseSlug, p.part);
  if (!found) notFound();
  return PartView(found, "hinglish");
}
