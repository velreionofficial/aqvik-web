import { quotationTool as tool } from "@/content/bill-tools";
import { ogSize, toolOgImage } from "@/lib/og/tool-card";

export const alt = `${tool.name} — AQVIK`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage({ name: tool.name, line: tool.cardLine, path: `/tools/${tool.slug}` });
}
