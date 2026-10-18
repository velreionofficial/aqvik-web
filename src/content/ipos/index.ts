import { ipoStatus } from "../../lib/ipo/calc.ts";
import type { Ipo, IpoStatus } from "../../lib/ipo/model.ts";
import { validateIpo } from "../../lib/ipo/validate.ts";
import { jioPlatforms } from "./jio-platforms.ts";

/**
 * Every IPO entry. To add one: copy jio-platforms.ts, fill it from the RHP, add it here.
 * The test suite fails if a published entry does not pass validateIpo().
 */
export const allIpos: Ipo[] = [jioPlatforms];

/** What the website shows: published and valid only. */
export const publishedIpos = (list: Ipo[] = allIpos): Ipo[] => list.filter((i) => i.published && validateIpo(i).length === 0);

/**
 * What the pages render. Drafts appear only while running `next dev`, marked as drafts, so an
 * entry can be checked on screen before publishing; a production build never includes them.
 */
export const visibleIpos = (drafts: boolean = process.env.NODE_ENV === "development"): Ipo[] => (drafts ? allIpos : publishedIpos());

export const findIpo = (slug: string, drafts?: boolean): Ipo | undefined => visibleIpos(drafts).find((i) => i.slug === slug);

const ORDER: Record<IpoStatus, number> = { open: 0, upcoming: 1, closed: 2, "allotment-out": 3, listed: 4 };

/** Open first, then upcoming (soonest first), then the rest (most recent first). */
export function sortedIpos(today: string, list: Ipo[] = visibleIpos()): { ipo: Ipo; status: IpoStatus }[] {
  return list
    .map((ipo) => ({ ipo, status: ipoStatus(ipo, today) }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.status === "upcoming" ? a.ipo.timeline.open.localeCompare(b.ipo.timeline.open) : b.ipo.timeline.open.localeCompare(a.ipo.timeline.open)));
}
