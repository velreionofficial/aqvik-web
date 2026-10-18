import { findIpo, visibleIpos } from "@/content/ipos";
import { rupeesWords } from "@/lib/ipo/explain";
import { ogSize, toolOgImage } from "@/lib/og/tool-card";

export const alt = "IPO details — AQVIK";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return visibleIpos().map((i) => ({ slug: i.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ipo = findIpo(slug);
  const name = ipo ? `${ipo.company} IPO` : "IPO";
  const line = ipo ? `Lot of ${ipo.lotSize} shares (${rupeesWords(ipo.lotSize * ipo.priceBand.high)}), dates, allotment and the RHP's numbers explained simply.` : "IPO details from the RHP.";
  return toolOgImage({ name, line, path: `/ipo/${slug}` });
}
