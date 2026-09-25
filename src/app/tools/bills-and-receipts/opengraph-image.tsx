import { findGroup } from "@/content/tool-groups";
import { ogSize, toolOgImage } from "@/lib/og/tool-card";

const group = findGroup("bills");

export const alt = `${group.title} tools — AQVIK`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage({ name: group.title, line: group.description, path: `/tools/${group.slug}` });
}
