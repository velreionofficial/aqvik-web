import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { imageIds, parseBook, type BookPage } from "./parse";

const IMAGE_EXT = ["webp", "jpg", "png"] as const;

/**
 * Reads and parses one part at build time. Pages are statically generated, so this runs during
 * `next build`, never per request. Illustrations are looked up in public/books/<book>/; an id with
 * no file maps to null and is simply not shown.
 */
export function loadPart(file: string, bookSlug: string): { pages: BookPage[]; images: Record<string, string | null> } {
  const src = readFileSync(join(process.cwd(), "src", "content", "books", file), "utf8");
  const pages = parseBook(src);
  const images: Record<string, string | null> = {};
  for (const id of imageIds(pages)) {
    const ext = IMAGE_EXT.find((e) => existsSync(join(process.cwd(), "public", "books", bookSlug, `${id}.${e}`)));
    images[id] = ext ? `/books/${bookSlug}/${id}.${ext}` : null;
  }
  return { pages, images };
}
