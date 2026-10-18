import { ogSize, toolOgImage } from "@/lib/og/tool-card";

export const alt = "IPO calendar — AQVIK";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage({ name: "IPO calendar", line: "Dates, price bands, lot sizes and the RHP's numbers explained simply. Facts only, no GMP, no tips.", path: "/ipo" });
}
